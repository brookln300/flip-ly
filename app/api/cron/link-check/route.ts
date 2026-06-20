export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Link Health Checker — runs daily at 10 AM UTC.
 *
 * Checks source_url for every listing via HEAD request.
 * - 404 / 410 → deletes the listing (dead link)
 * - Network error / timeout → marks as suspect (3 strikes = delete)
 * - 200 → listing stays, resets fail counter
 *
 * Batched in groups of 25 with concurrency to stay within Vercel's
 * 120s function timeout. Prioritizes oldest-checked listings first.
 */

const BATCH_SIZE = 50
const MAX_BATCHES = 12          // 50 * 12 = 600 listings per run max
const FETCH_TIMEOUT_MS = 4000
const MAX_CONSECUTIVE_FAILS = 4 // hide only after 4 failed checks — avoid nuking on transient errors

async function checkUrl(url: string): Promise<{ status: number | null; alive: boolean }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlipLyBot/1.0; +https://flip-ly.net)',
      },
    })
    clearTimeout(timeout)

    // 401/403/405/429 mean the server is up but blocking/limiting our HEAD probe
    // (Craigslist does this constantly). The listing is almost certainly still live —
    // treat as alive so a transient block never deletes a real deal.
    const blocked = res.status === 401 || res.status === 403 || res.status === 405 || res.status === 429
    return {
      status: res.status,
      alive: (res.status >= 200 && res.status < 400) || blocked,
    }
  } catch {
    return { status: null, alive: false }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  // Fail closed: if CRON_SECRET is unset, "Bearer undefined" would authorize anyone.
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  let totalChecked = 0
  let totalDead = 0
  let totalAlive = 0
  let totalSuspect = 0

  try {
    // Pre-purge: delete any CL listings older than 7 days without even checking
    // (Craigslist deletes sale posts shortly after they end)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: prePurged } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'craigslist_rss')
      .lt('scraped_at', sevenDaysAgo)

    if (prePurged && prePurged > 0) {
      // Soft-delete (hide via expires_at) rather than hard DELETE — the cleanup
      // cron GCs by age. Keeps link-check from ever destroying recoverable rows.
      await supabase
        .from('fliply_listings')
        .update({ expires_at: new Date().toISOString() })
        .eq('source_type', 'craigslist_rss')
        .lt('scraped_at', sevenDaysAgo)
      totalDead += prePurged
    }

    // Phase 1: Check HOT items first (is_hot or deal_score >= 7) — these are what users see
    const { data: hotListings } = await supabase
      .from('fliply_listings')
      .select('id, source_url, link_check_fails')
      .not('source_url', 'is', null)
      .gte('deal_score', 7)
      .or('link_checked_at.is.null,link_checked_at.lt.' + new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false })
      .order('link_checked_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE * 3) // Up to 150 hot items

    if (hotListings && hotListings.length > 0) {
      const hotResults = await Promise.all(
        hotListings.map(async (listing) => {
          const check = await checkUrl(listing.source_url)
          return { ...listing, ...check }
        })
      )

      const deadIds: string[] = []
      const aliveIds: string[] = []
      const suspectUpdates: { id: string; fails: number }[] = []

      for (const r of hotResults) {
        totalChecked++
        if (r.alive) {
          totalAlive++
          aliveIds.push(r.id)
        } else if (r.status === 404 || r.status === 410) {
          totalDead++
          deadIds.push(r.id)
        } else {
          const fails = (r.link_check_fails || 0) + 1
          if (fails >= MAX_CONSECUTIVE_FAILS) {
            totalDead++
            deadIds.push(r.id)
          } else {
            totalSuspect++
            suspectUpdates.push({ id: r.id, fails })
          }
        }
      }

      if (aliveIds.length > 0) {
        await supabase.from('fliply_listings')
          .update({ link_checked_at: new Date().toISOString(), link_check_fails: 0 })
          .in('id', aliveIds)
      }
      if (deadIds.length > 0) {
        await supabase.from('fliply_listings').update({ expires_at: new Date().toISOString() }).in('id', deadIds)
      }
      for (const s of suspectUpdates) {
        await supabase.from('fliply_listings')
          .update({ link_checked_at: new Date().toISOString(), link_check_fails: s.fails })
          .eq('id', s.id)
      }
    }

    const hotChecked = hotListings?.length || 0

    // Phase 2: Check remaining listings — oldest-checked first
    const remainingBatches = Math.max(1, MAX_BATCHES - Math.ceil(hotChecked / BATCH_SIZE))
    for (let batch = 0; batch < remainingBatches; batch++) {
      const { data: listings, error } = await supabase
        .from('fliply_listings')
        .select('id, source_url, link_check_fails')
        .not('source_url', 'is', null)
        .order('link_checked_at', { ascending: true, nullsFirst: true })
        .limit(BATCH_SIZE)

      if (error || !listings || listings.length === 0) break

      // Check all URLs in this batch concurrently
      const results = await Promise.all(
        listings.map(async (listing) => {
          const check = await checkUrl(listing.source_url)
          return { ...listing, ...check }
        })
      )

      const deadIds: string[] = []
      const aliveIds: string[] = []
      const suspectUpdates: { id: string; fails: number }[] = []

      for (const r of results) {
        totalChecked++

        if (r.alive) {
          totalAlive++
          aliveIds.push(r.id)
        } else if (r.status === 404 || r.status === 410) {
          // Definitively dead — delete immediately
          totalDead++
          deadIds.push(r.id)
        } else {
          // Timeout / network error / 5xx — increment fail counter
          const fails = (r.link_check_fails || 0) + 1
          if (fails >= MAX_CONSECUTIVE_FAILS) {
            totalDead++
            deadIds.push(r.id)
          } else {
            totalSuspect++
            suspectUpdates.push({ id: r.id, fails })
          }
        }
      }

      // Batch updates: mark alive listings as checked
      if (aliveIds.length > 0) {
        await supabase
          .from('fliply_listings')
          .update({ link_checked_at: new Date().toISOString(), link_check_fails: 0 })
          .in('id', aliveIds)
      }

      // Hide dead listings (soft-delete via expires_at; cleanup cron GCs by age)
      if (deadIds.length > 0) {
        await supabase
          .from('fliply_listings')
          .update({ expires_at: new Date().toISOString() })
          .in('id', deadIds)
      }

      // Update suspect fail counters
      for (const s of suspectUpdates) {
        await supabase
          .from('fliply_listings')
          .update({ link_checked_at: new Date().toISOString(), link_check_fails: s.fails })
          .eq('id', s.id)
      }

      // If we got fewer than BATCH_SIZE, we've checked everything
      if (listings.length < BATCH_SIZE) break
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    await sendTelegramAlert([
      `🔗 <b>Link Health Check</b> (${elapsed}s)`,
      prePurged ? `Pre-purged: ${prePurged} stale CL listings 🗑️` : '',
      `Hot items checked first: ${hotChecked}`,
      `Total checked: ${totalChecked}`,
      `Alive: ${totalAlive} ✅`,
      `Dead (removed): ${totalDead} 🗑️`,
      `Suspect (will retry): ${totalSuspect} ⚠️`,
    ].filter(Boolean).join('\n'))

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      checked: totalChecked,
      alive: totalAlive,
      dead_removed: totalDead,
      suspect: totalSuspect,
    })
  } catch (err: any) {
    console.error('Link check error:', err)
    await sendTelegramAlert(`🔗 Link check FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
