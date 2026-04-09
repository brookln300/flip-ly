export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'
import { sendTelegramAlert } from '../../../lib/telegram'
import { sendEmail } from '../../../lib/email/send'
import { getUnsubscribeUrl } from '../../../lib/unsubscribe'
import { isPremiumUser } from '../../../lib/user-tier'

function addUtm(url: string, source: string, medium: string, campaign: string, content?: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', source)
    u.searchParams.set('utm_medium', medium)
    u.searchParams.set('utm_campaign', campaign)
    if (content) u.searchParams.set('utm_content', content)
    return u.toString()
  } catch {
    return url
  }
}

const SUBJECTS_PRO = [
  "{count} deals near {city} this weekend — early access",
  "Weekend preview: {count} scored deals in {city}",
  "{count} deals near {city}, ranked by AI — you're seeing this first",
]

const SUBJECTS_FREE = [
  "{count} deals near {city} this weekend",
  "{count} garage sales near you — AI scored and sorted",
  "This weekend near {city}: {count} deals, best ones first",
]

/** Get upcoming Saturday and Sunday dates */
function getWeekendDates(): { saturday: string; sunday: string } {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 4=Thu
  // From Thursday: Sat is +2, Sun is +3
  // From any day: find next Saturday
  const daysUntilSat = (6 - day + 7) % 7 || 7
  const sat = new Date(now)
  sat.setUTCDate(sat.getUTCDate() + daysUntilSat)
  const sun = new Date(sat)
  sun.setUTCDate(sun.getUTCDate() + 1)
  return {
    saturday: sat.toISOString().split('T')[0],
    sunday: sun.toISOString().split('T')[0],
  }
}

/** Find clusters of nearby listings using simple distance grouping */
function findRouteClusters(listings: any[]): { count: number; city: string; radius_miles: number }[] {
  const withCoords = listings.filter(l => l.latitude && l.longitude)
  if (withCoords.length < 3) return []

  const clusters: { count: number; city: string; radius_miles: number }[] = []
  const used = new Set<number>()

  for (let i = 0; i < withCoords.length; i++) {
    if (used.has(i)) continue
    const group = [i]
    for (let j = i + 1; j < withCoords.length; j++) {
      if (used.has(j)) continue
      const dist = haversine(
        Number(withCoords[i].latitude), Number(withCoords[i].longitude),
        Number(withCoords[j].latitude), Number(withCoords[j].longitude)
      )
      if (dist <= 5) group.push(j)
    }
    if (group.length >= 3) {
      group.forEach(idx => used.add(idx))
      clusters.push({
        count: group.length,
        city: withCoords[group[0]].city || 'your area',
        radius_miles: 5,
      })
    }
  }
  return clusters.slice(0, 3)
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const EVENT_TYPE_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  garage_sale: { emoji: '🏠', label: 'Garage Sale', color: '#16a34a' },
  estate_sale: { emoji: '🏛️', label: 'Estate Sale', color: '#7c3aed' },
  moving_sale: { emoji: '📦', label: 'Moving Sale', color: '#ea580c' },
  flea_market: { emoji: '🛍️', label: 'Flea Market', color: '#0891b2' },
  auction: { emoji: '🔨', label: 'Auction', color: '#dc2626' },
  community_sale: { emoji: '🏘️', label: 'Community Sale', color: '#2563eb' },
  event: { emoji: '📅', label: 'Event', color: '#64748b' },
  listing: { emoji: '📋', label: 'Listing', color: '#64748b' },
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const { searchParams } = new URL(req.url)
  const isTest = searchParams.get('test') === 'true'
  const testEmail = searchParams.get('email')

  // Allow test mode without auth (but require email param)
  if (!isTest && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const tier = searchParams.get('tier') as 'pro' | 'free' | null

  try {
    // Get upcoming weekend dates
    const { saturday, sunday } = getWeekendDates()

    // Fetch users
    let users: any[]
    if (isTest && testEmail) {
      // Test mode: send to specific email
      const { data } = await supabase
        .from('fliply_users')
        .select('id, email, city, state, market_id, is_premium, subscription_tier')
        .eq('email', testEmail.toLowerCase())
        .limit(1)
      users = data || []
      if (!users.length) {
        return NextResponse.json({ error: `No user found with email: ${testEmail}` }, { status: 404 })
      }
    } else {
      let userQuery = supabase
        .from('fliply_users')
        .select('id, email, city, state, market_id, is_premium, subscription_tier')
        .or('unsubscribed.is.null,unsubscribed.eq.false')

      if (tier === 'pro') userQuery = userQuery.eq('is_premium', true)
      else if (tier === 'free') userQuery = userQuery.eq('is_premium', false)

      const { data, error } = await userQuery
      if (error || !data?.length) {
        return NextResponse.json({ message: `No ${tier || 'any'} users to send to`, error: error?.message })
      }
      users = data
    }

    // Group users by market_id
    const marketIds = Array.from(new Set(users.map(u => u.market_id).filter(Boolean)))
    const listingsByMarket: Record<string, any[]> = {}
    const statsByMarket: Record<string, { total_weekend: number; hot_deals: number; top_score: number }> = {}

    for (const mId of marketIds) {
      // Fetch weekend listings sorted by score
      const { data: weekendListings } = await supabase
        .from('fliply_listings')
        .select('*')
        .eq('market_id', mId)
        .or(`event_date.eq.${saturday},event_date.eq.${sunday},event_end_date.gte.${saturday}`)
        .not('enriched_at', 'is', null)
        .order('deal_score', { ascending: false, nullsFirst: false })
        .limit(20)

      // If no weekend-specific listings, fall back to recent high-score listings
      let listings = weekendListings || []
      if (listings.length === 0) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: recentListings } = await supabase
          .from('fliply_listings')
          .select('*')
          .eq('market_id', mId)
          .gte('scraped_at', weekAgo)
          .not('enriched_at', 'is', null)
          .order('deal_score', { ascending: false, nullsFirst: false })
          .limit(15)
        listings = recentListings || []
      }

      const { count: hotCount } = await supabase
        .from('fliply_listings')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', mId)
        .gte('deal_score', 7)
        .or(`event_date.eq.${saturday},event_date.eq.${sunday},event_end_date.gte.${saturday}`)

      listingsByMarket[mId] = listings
      statsByMarket[mId] = {
        total_weekend: listings.length,
        hot_deals: hotCount || 0,
        top_score: listings[0]?.deal_score || 0,
      }
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const user of users) {
      const listings = user.market_id ? (listingsByMarket[user.market_id] || []) : []
      const stats = user.market_id
        ? (statsByMarket[user.market_id] || { total_weekend: 0, hot_deals: 0, top_score: 0 })
        : { total_weekend: 0, hot_deals: 0, top_score: 0 }

      if (listings.length === 0) {
        results.push({ email: user.email, status: 'skipped', reason: 'no_listings' })
        continue
      }

      try {
        const isPro = isPremiumUser(user)
        const subjectPool = isPro ? SUBJECTS_PRO : SUBJECTS_FREE
        const subjectTemplate = subjectPool[Math.floor(Math.random() * subjectPool.length)]
        const subject = subjectTemplate
          .replace('{count}', String(listings.length))
          .replace('{city}', user.city || 'your area')
        const html = buildDigestEmail(user, listings, stats, isPro, user.email, { saturday, sunday })

        const { id: resendMessageId, error: sendError } = await sendEmail({
          to: user.email,
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'digest' },
            { name: 'tier', value: isPro ? 'pro' : 'free' },
          ],
        })

        if (sendError) throw new Error(sendError)
        sent++

        // Log to email_sends
        await supabase.from('email_sends').insert({
          user_id: user.id,
          to_email: user.email.toLowerCase(),
          subject,
          template_key: isPro ? 'digest_pro' : 'digest_free',
          resend_message_id: resendMessageId || null,
          status: 'sent',
        }).then(null, (err: any) =>
          console.error(`[DIGEST] email_sends log failed for ${user.email}:`, err.message)
        )

        await supabase.from('fliply_digest_log').insert({
          user_id: user.id,
          listing_count: listings.length,
          status: 'sent',
        })

        results.push({ email: user.email, status: 'sent', tier: isPro ? 'pro' : 'free', listings: listings.length })
      } catch (err: any) {
        failed++
        console.error(`[DIGEST] Failed for ${user.email}:`, err.message)
        results.push({ email: user.email, status: 'failed', error: err.message })

        await supabase.from('fliply_digest_log').insert({
          user_id: user.id,
          listing_count: listings.length,
          status: 'failed',
        })
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const skipped = results.filter(r => r.status === 'skipped').length

    if (!isTest) {
      await sendTelegramAlert([
        `<b>Weekly Digest — ${tier || 'all'} tier</b> (${elapsed}s)`,
        `Weekend: ${saturday} / ${sunday}`,
        `Users: ${users.length} | Markets: ${marketIds.length}`,
        `Sent: ${sent} | Failed: ${failed} | Skipped: ${skipped}`,
      ].join('\n'))

      trackEvent('digest_sent', {
        users_count: users.length,
        sent_count: sent,
        failed_count: failed,
        markets_count: marketIds.length,
        tier: tier || 'all',
      })
    }

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      weekend: { saturday, sunday },
      users_processed: users.length,
      sent, failed, skipped,
      markets_served: marketIds.length,
      tier: tier || 'all',
      is_test: isTest || false,
      results,
    })
  } catch (err: any) {
    console.error('Digest cron error:', err)
    await sendTelegramAlert(`Weekly Digest (${tier || 'all'}) FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── Email Builder ───────────────────────────────────────────────

function buildDigestEmail(
  user: { email: string; city?: string; state?: string; is_premium?: boolean },
  listings: any[],
  stats: { total_weekend: number; hot_deals: number; top_score: number },
  isPro: boolean,
  userEmail: string,
  weekend: { saturday: string; sunday: string },
): string {
  const city = user.city || 'your area'
  const campaign = isPro ? 'digest_pro' : 'digest_free'
  const utm = (url: string, content?: string) => addUtm(url, 'email', 'digest', campaign, content)
  const unsubUrl = getUnsubscribeUrl(userEmail)

  // Group listings by event day
  const satListings = listings.filter(l => l.event_date === weekend.saturday)
  const sunListings = listings.filter(l => l.event_date === weekend.sunday)
  const otherListings = listings.filter(l =>
    l.event_date !== weekend.saturday && l.event_date !== weekend.sunday
  )

  // Find route clusters for Pro users
  const clusters = isPro ? findRouteClusters(listings) : []

  // Format weekend date labels
  const satLabel = formatDateLabel(weekend.saturday)
  const sunLabel = formatDateLabel(weekend.sunday)

  // Build day sections
  let listingSectionsHtml = ''

  if (satListings.length > 0) {
    listingSectionsHtml += buildDaySection(satLabel, satListings, isPro, utm, isPro ? 10 : 6)
  }
  if (sunListings.length > 0) {
    listingSectionsHtml += buildDaySection(sunLabel, sunListings, isPro, utm, isPro ? 10 : 6)
  }
  if (otherListings.length > 0 && (satListings.length + sunListings.length) < 5) {
    listingSectionsHtml += buildDaySection('More This Week', otherListings, isPro, utm, isPro ? 5 : 4)
  }

  // If no day-specific grouping worked, show all as one list
  if (!listingSectionsHtml) {
    listingSectionsHtml = buildDaySection('Top Deals', listings, isPro, utm, isPro ? 15 : 10)
  }

  // Route cluster callout (Pro only)
  const clusterHtml = clusters.length > 0 ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:12px 24px 20px;">
      <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 8px;">🗺️ Route Clusters</p>
      ${clusters.map(c => `
        <p style="color:#166534;font-size:12px;margin:0 0 4px;">
          ${c.count} sales within ${c.radius_miles} miles near ${esc(c.city)}
        </p>
      `).join('')}
      <p style="color:#15803d;font-size:11px;margin:8px 0 0;">
        <a href="${utm('https://flip-ly.net/dashboard', 'route-cluster')}" style="color:#16a34a;font-weight:600;">Plan your route →</a>
      </p>
    </div>` : ''

  const proBanner = isPro
    ? `<div style="background:#f0fdf4;color:#166534;padding:10px 24px;font-size:13px;text-align:center;font-weight:600;">
        ⚡ Early access — you're seeing this before free users
      </div>`
    : ''

  const proUpsell = isPro ? '' : `
    <div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin:20px 24px;text-align:center;">
      <p style="color:#000;font-size:15px;font-weight:600;margin:0 0 4px;">
        Unlock full scores, directions, and early access
      </p>
      <p style="color:#888;font-size:12px;margin:0 0 16px;">
        Pro members see AI scores, get Google Maps links, route clusters, and this email 6 hours earlier.
      </p>
      <a href="${utm('https://flip-ly.net/pro', 'upsell-cta')}" style="display:inline-block;padding:10px 28px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;">
        Go Pro — $5/mo
      </a>
    </div>`

  const previewText = isPro
    ? `${listings.length} deals this weekend — early access for Pro`
    : `${listings.length} deals near you this weekend`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${previewText}
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<div style="max-width:560px;margin:0 auto;background:#ffffff;">

<!-- Header -->
<div style="background:#0a0a0a;padding:24px 32px;">
  <span style="font-size:20px;color:#22C55E;font-weight:700;letter-spacing:-0.01em;">flip-ly.net</span>
  <span style="float:right;color:#666;font-size:12px;line-height:20px;">Weekend Digest</span>
</div>

${proBanner}

<!-- Intro -->
<div style="padding:24px 32px 16px;">
  <p style="color:#000;font-size:16px;font-weight:600;margin:0 0 4px;">
    This weekend near ${esc(city)}
  </p>
  <p style="color:#888;font-size:13px;margin:0;">
    ${stats.total_weekend} deals &middot; ${stats.hot_deals} scored 7+ &middot; Top: ${isPro ? stats.top_score + '/10' : '🔒 Pro'}
  </p>
</div>

<!-- Listings by Day -->
${listingSectionsHtml}

${clusterHtml}

${proUpsell}

<!-- CTA -->
<div style="padding:24px 32px;text-align:center;">
  <a href="${utm('https://flip-ly.net/dashboard', 'main-cta')}" style="display:inline-block;padding:12px 32px;background:#22C55E;color:#000;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">
    Search All Deals
  </a>
</div>

<!-- Footer -->
<div style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee;">
  <p style="color:#999;font-size:12px;margin:0 0 4px;">flip-ly.net — Garage sale intelligence, delivered weekly.</p>
  <p style="color:#bbb;font-size:11px;margin:0;">
    <a href="${utm('https://flip-ly.net', 'footer')}" style="color:#999;">Visit</a> &middot;
    <a href="https://flip-ly.net/privacy" style="color:#999;">Privacy</a> &middot;
    <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
  </p>
</div>

</div>
</body>
</html>`
}

function buildDaySection(
  dayLabel: string,
  listings: any[],
  isPro: boolean,
  utm: (url: string, content?: string) => string,
  maxItems: number,
): string {
  const rows = listings.slice(0, maxItems).map(l => buildListingRow(l, isPro, utm)).join('')

  return `
  <div style="padding:0 16px;">
    <div style="padding:12px 16px 6px;border-bottom:2px solid #f0f0f0;">
      <span style="font-size:14px;font-weight:700;color:#000;">${esc(dayLabel)}</span>
      <span style="font-size:12px;color:#999;margin-left:8px;">${listings.length} deal${listings.length !== 1 ? 's' : ''}</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  </div>`
}

function buildListingRow(l: any, isPro: boolean, utm: (url: string, content?: string) => string): string {
  const typeInfo = EVENT_TYPE_LABELS[l.event_type] || EVENT_TYPE_LABELS.listing
  const scoreColor = l.deal_score >= 8 ? '#22C55E' : l.deal_score >= 6 ? '#EAB308' : '#999'

  // Event type badge
  const typeBadge = `<span style="display:inline-block;background:${typeInfo.color}15;color:${typeInfo.color};padding:1px 6px;font-size:10px;font-weight:600;border-radius:3px;margin-right:4px;">${typeInfo.emoji} ${typeInfo.label}</span>`

  // Score display
  const scoreDisplay = isPro
    ? (l.deal_score ? `<span style="display:inline-block;background:${l.deal_score >= 8 ? '#f0fdf4' : '#f8f8f8'};color:${scoreColor};padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">${l.deal_score}/10</span>` : '')
    : (l.deal_score ? `<span style="display:inline-block;background:#f8f8f8;color:#ccc;padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">🔒</span>` : '')

  // Time pill
  const timePill = l.event_time_text
    ? `<span style="display:inline-block;background:#f0f0f0;color:#666;padding:1px 6px;font-size:10px;border-radius:3px;margin-left:4px;">${esc(l.event_time_text)}</span>`
    : ''

  // AI description
  const aiDesc = isPro
    ? (l.ai_description ? `<br/><span style="color:#888;font-size:12px;">${esc(l.ai_description.substring(0, 120))}</span>` : '')
    : (l.ai_description ? `<br/><span style="color:#bbb;font-size:12px;">${esc(l.ai_description.substring(0, 50))}... <a href="${utm('https://flip-ly.net/pro', 'ai-desc')}" style="color:#22C55E;font-size:11px;">See full</a></span>` : '')

  // Google Maps link (Pro only)
  const mapsLink = isPro && l.address
    ? `<br/><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.address + (l.city ? ', ' + l.city : '') + (l.state ? ', ' + l.state : ''))}" style="color:#16a34a;font-size:11px;text-decoration:none;">📍 Get Directions</a>`
    : ''

  // Source link
  const linkUrl = isPro ? (l.source_url || utm('https://flip-ly.net/dashboard', 'listing')) : utm('https://flip-ly.net/dashboard', 'listing')

  const hotBadge = l.is_hot ? '<span style="display:inline-block;background:#fef2f2;color:#dc2626;padding:1px 6px;font-size:10px;font-weight:700;border-radius:4px;margin-right:4px;">🔥 HOT</span>' : ''

  return `
  <tr style="border-bottom:1px solid #f0f0f0;">
    <td style="padding:12px 16px;vertical-align:top;">
      <div style="margin-bottom:4px;">
        ${typeBadge}${hotBadge}${timePill}
      </div>
      <a href="${linkUrl}" style="color:#000;text-decoration:none;font-size:14px;font-weight:600;line-height:1.3;">
        ${esc(l.title)}
      </a>
      ${aiDesc}
      ${mapsLink}
    </td>
    <td style="padding:12px 16px;text-align:right;vertical-align:top;white-space:nowrap;min-width:70px;">
      ${scoreDisplay}
      <br/><span style="font-weight:700;font-size:13px;color:${l.price_text === 'FREE' ? '#22C55E' : '#000'};">
        ${l.price_text === 'FREE' ? 'FREE' : esc(l.price_text || '')}
      </span>
      <br/><span style="font-size:11px;color:#999;">${esc(l.city || '')}</span>
    </td>
  </tr>`
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}`
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
