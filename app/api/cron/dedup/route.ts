export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { normalizeQuery } from '../../../lib/ai/comps'

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'

/**
 * Cross-source dedup. external_id dedups WITHIN a source; this collapses the
 * same item across sources (the DeWalt set on CL + OfferUp + FB). Groups active
 * DFW listings by normalized-title + price bucket, keeps one canonical (prefers
 * a real source_url, then highest deal_score, then newest), points the rest at
 * it via duplicate_of. Feeds filter `duplicate_of IS NULL`.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows } = await supabase
    .from('fliply_listings')
    .select('id, title, price_low_cents, deal_score, source_url, scraped_at, duplicate_of')
    .eq('market_id', DFW_MARKET_ID)
    .gte('scraped_at', maxAge)
    .limit(5000)

  if (!rows || rows.length === 0) return NextResponse.json({ groups: 0, marked: 0 })

  const groups = new Map<string, typeof rows>()
  for (const r of rows) {
    const nq = normalizeQuery(r.title)
    if (!nq || nq.length < 4) continue
    const bucket = r.price_low_cents ? Math.round(r.price_low_cents / 1000) : 'np'
    const key = `${nq}|${bucket}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const toMark: { id: string; canonical: string }[] = []
  const toClear: string[] = []
  let dupeGroups = 0

  for (const [, members] of Array.from(groups.entries())) {
    if (members.length < 2) {
      // singleton — if it was previously marked a dupe, clear it
      if (members[0].duplicate_of) toClear.push(members[0].id)
      continue
    }
    dupeGroups++
    const canonical = [...members].sort((a, b) => {
      if (!!a.source_url !== !!b.source_url) return a.source_url ? -1 : 1
      if ((b.deal_score || 0) !== (a.deal_score || 0)) return (b.deal_score || 0) - (a.deal_score || 0)
      return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
    })[0]
    for (const m of members) {
      if (m.id === canonical.id) {
        if (m.duplicate_of) toClear.push(m.id)
      } else if (m.duplicate_of !== canonical.id) {
        toMark.push({ id: m.id, canonical: canonical.id })
      }
    }
  }

  // Apply (batched by canonical to minimize round-trips)
  const byCanon = new Map<string, string[]>()
  for (const { id, canonical } of toMark) {
    if (!byCanon.has(canonical)) byCanon.set(canonical, [])
    byCanon.get(canonical)!.push(id)
  }
  for (const [canonical, ids] of Array.from(byCanon.entries())) {
    await supabase.from('fliply_listings').update({ duplicate_of: canonical }).in('id', ids)
  }
  if (toClear.length) {
    await supabase.from('fliply_listings').update({ duplicate_of: null }).in('id', toClear)
  }

  return NextResponse.json({ groups: dupeGroups, marked: toMark.length, cleared: toClear.length })
}
