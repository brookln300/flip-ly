export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'
import { sendTelegramAlert } from '../../../lib/telegram'
import { sendEmail } from '../../../lib/email/send'
import { getUnsubscribeUrl } from '../../../lib/unsubscribe'

function addUtm(url: string, source: string, medium: string, campaign: string, content?: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', source)
  u.searchParams.set('utm_medium', medium)
  u.searchParams.set('utm_campaign', campaign)
  if (content) u.searchParams.set('utm_content', content)
  return u.toString()
}

const SUBJECTS_PRO = [
  "{count} deals near {city} — you're seeing this 6 hours early",
  "Early access: {count} scored deals in {city}",
  "{count} deals near {city}, ranked by AI — Pro early access",
]

const SUBJECTS_FREE = [
  "{count} deals near {city} this week",
  "{count} garage sales near you — AI scored and sorted",
  "This week near {city}: {count} deals, best ones first",
  "{count} new deals near {city} — your weekly digest",
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const { searchParams } = new URL(req.url)

  // tier=pro sends only to pro users (called 6hrs earlier by separate cron)
  // tier=free sends only to free users (called at normal time)
  // no tier param = legacy behavior, sends to all
  const tier = searchParams.get('tier') as 'pro' | 'free' | null

  try {
    // Fetch users based on tier
    let userQuery = supabase
      .from('fliply_users')
      .select('id, email, city, state, market_id, is_premium')
      .or('unsubscribed.is.null,unsubscribed.eq.false')

    if (tier === 'pro') {
      userQuery = userQuery.eq('is_premium', true)
    } else if (tier === 'free') {
      userQuery = userQuery.eq('is_premium', false)
    }

    const { data: users, error: userError } = await userQuery

    if (userError || !users?.length) {
      return NextResponse.json({ message: `No ${tier || 'any'} users to send to`, error: userError?.message })
    }

    // Group users by market_id so we fetch listings once per market
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const marketIds = Array.from(new Set(users.map(u => u.market_id).filter(Boolean)))
    const listingsByMarket: Record<string, any[]> = {}
    const statsByMarket: Record<string, { total_new: number; hot_deals: number; top_score: number }> = {}

    for (const mId of marketIds) {
      const { data: hotListings } = await supabase
        .from('fliply_listings')
        .select('*')
        .eq('market_id', mId)
        .gte('scraped_at', weekAgo)
        .not('enriched_at', 'is', null)
        .order('deal_score', { ascending: false, nullsFirst: false })
        .limit(15)

      const { count: totalNew } = await supabase
        .from('fliply_listings')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', mId)
        .gte('scraped_at', weekAgo)

      const { count: hotCount } = await supabase
        .from('fliply_listings')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', mId)
        .gte('scraped_at', weekAgo)
        .eq('is_hot', true)

      const listings = hotListings || []
      listingsByMarket[mId] = listings
      statsByMarket[mId] = {
        total_new: totalNew || 0,
        hot_deals: hotCount || 0,
        top_score: listings[0]?.deal_score || 0,
      }
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const user of users) {
      const listings = user.market_id ? (listingsByMarket[user.market_id] || []) : []
      const stats = user.market_id ? (statsByMarket[user.market_id] || { total_new: 0, hot_deals: 0, top_score: 0 }) : { total_new: 0, hot_deals: 0, top_score: 0 }

      if (listings.length === 0) {
        results.push({ email: user.email, status: 'skipped', reason: 'no_listings' })
        continue
      }

      try {
        const isPro = user.is_premium
        const subjectPool = isPro ? SUBJECTS_PRO : SUBJECTS_FREE
        const subjectTemplate = subjectPool[Math.floor(Math.random() * subjectPool.length)]
        const subject = subjectTemplate
          .replace('{count}', String(listings.length))
          .replace('{city}', user.city || 'your area')
        const html = buildDigestEmail(user, listings, stats, isPro, user.email)

        const { id: resendMessageId, error: sendError } = await sendEmail({
          to: user.email,
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'digest' },
            { name: 'tier', value: isPro ? 'pro' : 'free' },
          ],
        })

        if (!sendError) {
          sent++
        } else {
          throw new Error(sendError)
        }

        // Log to email_sends so webhook can track bounces/opens/complaints
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

        results.push({ email: user.email, status: 'sent', tier: isPro ? 'pro' : 'free' })
      } catch (err: any) {
        failed++
        results.push({ email: user.email, status: 'failed', error: err.message })

        await supabase.from('fliply_digest_log').insert({
          user_id: user.id,
          listing_count: listings.length,
          status: 'failed',
        })
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const totalListings = Object.values(listingsByMarket).reduce((sum, l) => sum + l.length, 0)
    const skipped = results.filter(r => r.status === 'skipped').length

    await sendTelegramAlert([
      `<b>Weekly Digest — ${tier || 'all'} tier</b> (${elapsed}s)`,
      `Users: ${users.length} | Markets: ${marketIds.length}`,
      `Sent: ${sent} | Failed: ${failed} | Skipped (no listings): ${skipped}`,
      `Total listings across markets: ${totalListings}`,
    ].join('\n'))

    trackEvent('digest_sent', {
      users_count: users.length,
      sent_count: sent,
      failed_count: failed,
      markets_count: marketIds.length,
      tier: tier || 'all',
    })

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      users_processed: users.length,
      sent, failed, skipped,
      markets_served: marketIds.length,
      tier: tier || 'all',
      results,
    })
  } catch (err: any) {
    console.error('Digest cron error:', err)
    await sendTelegramAlert(`Weekly Digest (${tier || 'all'}) FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildDigestEmail(
  user: { email: string; city?: string; state?: string; is_premium?: boolean },
  listings: any[],
  stats: { total_new: number; hot_deals: number; top_score: number },
  isPro: boolean,
  userEmail: string
): string {
  const city = user.city || 'DFW'
  const campaign = isPro ? 'digest_pro' : 'digest_free'
  const utm = (url: string, content?: string) => addUtm(url, 'email', 'digest', campaign, content)
  const unsubUrl = getUnsubscribeUrl(userEmail)

  const listingRows = listings.slice(0, isPro ? 15 : 10).map((l, i) => {
    const scoreColor = l.deal_score >= 8 ? '#22C55E' : l.deal_score >= 6 ? '#EAB308' : '#999'
    const scoreDisplay = isPro
      ? (l.deal_score ? `<span style="display:inline-block;background:${l.deal_score >= 8 ? '#f0fdf4' : '#f8f8f8'};color:${scoreColor};padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">${l.deal_score}/10</span> ` : '')
      : (l.deal_score ? `<span style="display:inline-block;background:#f8f8f8;color:#ccc;padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">--/10</span> ` : '')

    const aiDesc = isPro
      ? (l.ai_description ? `<br/><span style="color:#888;font-size:12px;">${escapeHtml(l.ai_description.substring(0, 120))}</span>` : '')
      : (l.ai_description ? `<br/><span style="color:#bbb;font-size:12px;">${escapeHtml(l.ai_description.substring(0, 40))}... <a href="${utm('https://flip-ly.net/pro', 'ai-analysis')}" style="color:#22C55E;font-size:11px;">See full analysis</a></span>` : '')

    const linkUrl = isPro ? (l.source_url || utm('https://flip-ly.net', 'listing')) : utm('https://flip-ly.net', 'listing')
    const linkNote = isPro ? '' : `<br/><span style="font-size:10px;color:#bbb;"><a href="${utm('https://flip-ly.net/pro', 'listing-lock')}" style="color:#22C55E;">Upgrade for direct links</a></span>`

    const hotBadge = l.is_hot ? '<span style="display:inline-block;background:#fef2f2;color:#dc2626;padding:1px 6px;font-size:10px;font-weight:700;border-radius:4px;margin-right:4px;">HOT</span>' : ''

    return `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:14px 16px;vertical-align:top;">
        ${hotBadge}${scoreDisplay}
        <br/>
        <a href="${linkUrl}" style="color:#000;text-decoration:none;font-size:15px;font-weight:${l.is_hot ? '700' : '600'};">
          ${escapeHtml(l.title)}
        </a>
        ${aiDesc}
        ${linkNote}
        ${l.ai_tags?.length ? `<br/><span style="font-size:10px;color:#bbb;">${(isPro ? l.ai_tags.slice(0, 4) : l.ai_tags.slice(0, 2)).map((t: string) => `#${t}`).join(' ')}</span>` : ''}
      </td>
      <td style="padding:14px 16px;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-weight:700;font-size:14px;color:${l.price_text === 'FREE' ? '#22C55E' : '#000'};">
          ${l.price_text === 'FREE' ? 'FREE' : escapeHtml(l.price_text || 'Ask')}
        </span>
        <br/><span style="font-size:11px;color:#999;">${escapeHtml(l.city || 'DFW')}</span>
        ${l.event_date ? `<br/><span style="font-size:11px;color:#bbb;">${l.event_date}</span>` : ''}
      </td>
    </tr>`
  }).join('')

  const proBanner = isPro
    ? `<div style="background:#f0fdf4;color:#166534;padding:10px 24px;font-size:13px;text-align:center;font-weight:600;">
        Early access — you're seeing this 6 hours before free users
      </div>`
    : ''

  const proUpsell = isPro
    ? ''
    : `<div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin:20px 24px;text-align:center;">
        <p style="color:#000;font-size:15px;font-weight:600;margin:0 0 4px;">
          ${stats.hot_deals} deals had their scores hidden
        </p>
        <p style="color:#888;font-size:12px;margin:0 0 16px;">
          Pro members see full AI scores, direct source links, and get this email 6 hours earlier.
        </p>
        <a href="${utm('https://flip-ly.net/pro', 'upsell-cta')}" style="display:inline-block;padding:10px 28px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;">
          Go Pro — from $5/mo
        </a>
        <p style="color:#999;font-size:11px;margin:8px 0 0;">
          Founding price. Locked in for life.
        </p>
      </div>`

  const previewText = isPro
    ? `${listings.length} deals — you're seeing this 6 hours early`
    : `${listings.length} deals near you this week`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${previewText}
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<div style="max-width:560px;margin:0 auto;background:#ffffff;">

<!-- Header -->
<div style="background:#0a0a0a;padding:24px 32px;">
  <span style="font-size:20px;color:#22C55E;font-weight:700;letter-spacing:-0.01em;">flip-ly.net</span>
  <span style="float:right;color:#666;font-size:12px;line-height:20px;">Weekly Digest</span>
</div>

${proBanner}

<!-- Intro -->
<div style="padding:24px 32px 16px;">
  <p style="color:#000;font-size:16px;font-weight:600;margin:0 0 4px;">
    This week's deals near ${escapeHtml(city)}
  </p>
  <p style="color:#888;font-size:13px;margin:0;">
    ${stats.total_new} new listings &middot; ${stats.hot_deals} hot deals &middot; Top score: ${isPro ? stats.top_score + '/10' : 'Pro only'}
  </p>
</div>

<!-- Listings -->
<div style="padding:0 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${listingRows}
  </table>
</div>

${proUpsell}

<!-- CTA -->
<div style="padding:24px 32px;text-align:center;">
  <a href="${utm('https://flip-ly.net', 'main-cta')}" style="display:inline-block;padding:12px 32px;background:#22C55E;color:#000;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
