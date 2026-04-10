export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendEmail } from '../../../lib/email/send'
import { sendTelegramAlert } from '../../../lib/telegram'
import { getUnsubscribeUrl } from '../../../lib/unsubscribe'
import { isPremiumUser } from '../../../lib/user-tier'

/**
 * Daily Deals Email — Auto-deploys from Resend with current listings.
 *
 * Triggered daily (weekdays) at 10 AM local per market timezone.
 * Sends Pro users a fresh snapshot of their market's top deals.
 * Free users get a teaser (3 deals, scores hidden) with upgrade CTA.
 *
 * Cron: 0 15 * * 1-5 (3 PM UTC = ~10 AM CDT weekdays)
 *
 * Also callable manually: GET /api/cron/daily-deals?force=true
 */

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function utm(url: string, content?: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'email')
  u.searchParams.set('utm_medium', 'daily-deals')
  u.searchParams.set('utm_campaign', 'daily_deals')
  if (content) u.searchParams.set('utm_content', content)
  return u.toString()
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isForce = new URL(req.url).searchParams.get('force') === 'true'

  if (!isForce && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    // Fetch all non-unsubscribed users
    const { data: users, error: userErr } = await supabase
      .from('fliply_users')
      .select('id, email, city, state, market_id, is_premium, subscription_tier')
      .or('unsubscribed.is.null,unsubscribed.eq.false')

    if (userErr || !users?.length) {
      return NextResponse.json({ message: 'No users to send to', error: userErr?.message })
    }

    // Group by market, fetch today's top listings per market
    const marketIds = Array.from(new Set(users.map(u => u.market_id).filter(Boolean)))
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const listingsByMarket: Record<string, any[]> = {}

    for (const mId of marketIds) {
      // Try last 24h first, fall back to 48h if too few
      let { data: listings } = await supabase
        .from('fliply_listings')
        .select('*')
        .eq('market_id', mId)
        .gte('scraped_at', since24h)
        .not('enriched_at', 'is', null)
        .order('deal_score', { ascending: false, nullsFirst: false })
        .limit(12)

      if (!listings?.length || listings.length < 3) {
        const { data: fallback } = await supabase
          .from('fliply_listings')
          .select('*')
          .eq('market_id', mId)
          .gte('scraped_at', since48h)
          .not('enriched_at', 'is', null)
          .order('deal_score', { ascending: false, nullsFirst: false })
          .limit(12)
        listings = fallback || []
      }

      listingsByMarket[mId] = listings || []
    }

    let sent = 0
    let skipped = 0
    let failed = 0
    const emailSendLogs: any[] = []

    for (const user of users) {
      const listings = user.market_id ? (listingsByMarket[user.market_id] || []) : []
      if (listings.length === 0) { skipped++; continue }

      const isPro = isPremiumUser(user)
      const city = user.city || 'your area'
      const maxListings = isPro ? 10 : 3

      const subject = isPro
        ? `${listings.length} new deals near ${city} today`
        : `${listings.length} deals near ${city} — see what you're missing`

      try {
        const html = buildDailyDealsEmail(user, listings.slice(0, maxListings), isPro, listings.length)
        const { id: msgId, error: sendErr } = await sendEmail({
          to: user.email,
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'daily-deals' },
            { name: 'tier', value: isPro ? 'pro' : 'free' },
          ],
        })

        if (sendErr) throw new Error(sendErr)

        emailSendLogs.push({
          user_id: user.id,
          to_email: user.email.toLowerCase(),
          subject,
          template_key: isPro ? 'daily_deals_pro' : 'daily_deals_free',
          resend_message_id: msgId || null,
          status: 'sent',
        })

        sent++
      } catch (err: any) {
        failed++
        console.error(`[DAILY-DEALS] Failed for ${user.email}: ${err.message}`)
      }
    }

    // Batch insert all email_sends logs at once (instead of per-user)
    if (emailSendLogs.length > 0) {
      await supabase.from('email_sends').insert(emailSendLogs).then(null, (err: any) =>
        console.error('[DAILY-DEALS] email_sends batch insert failed:', err.message)
      )
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    await sendTelegramAlert([
      `<b>Daily Deals Email</b> (${elapsed}s)`,
      `Sent: ${sent} | Skipped: ${skipped} | Failed: ${failed}`,
      `Markets: ${marketIds.length} | Users: ${users.length}`,
    ].join('\n'))

    return NextResponse.json({ success: true, sent, skipped, failed, elapsed_seconds: parseFloat(elapsed) })
  } catch (err: any) {
    console.error('[DAILY-DEALS] Cron error:', err)
    await sendTelegramAlert(`Daily Deals FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


function buildDailyDealsEmail(
  user: { email: string; city?: string; state?: string },
  listings: any[],
  isPro: boolean,
  totalAvailable: number,
): string {
  const city = user.city || 'your area'
  const unsubUrl = getUnsubscribeUrl(user.email)
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const listingRows = listings.map(l => {
    const scoreColor = l.deal_score >= 8 ? '#16a34a' : l.deal_score >= 6 ? '#ca8a04' : '#999'
    const hotBadge = l.is_hot
      ? '<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;font-size:10px;font-weight:700;border-radius:4px;margin-right:4px;">HOT</span>'
      : ''
    const scoreBadge = isPro
      ? `<span style="background:${l.deal_score >= 8 ? '#f0fdf4' : '#f8f8f8'};color:${scoreColor};padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">${l.deal_score}/10</span>`
      : '<span style="background:#f8f8f8;color:#ccc;padding:2px 8px;font-size:11px;font-weight:700;border-radius:4px;font-family:monospace;">?/10</span>'

    const linkUrl = isPro && l.source_url ? l.source_url : utm('https://flip-ly.net', 'listing')
    const desc = isPro
      ? (l.ai_description ? `<br/><span style="color:#888;font-size:12px;">${escHtml(l.ai_description.substring(0, 100))}</span>` : '')
      : (l.ai_description ? `<br/><span style="color:#bbb;font-size:12px;">${escHtml(l.ai_description.substring(0, 40))}...</span>` : '')

    const price = l.price_text === 'FREE'
      ? '<span style="color:#16a34a;font-weight:700;">FREE</span>'
      : `<span style="font-weight:700;">${escHtml(l.price_text || 'Ask')}</span>`

    return `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:12px 0;">
        <div>${hotBadge}${scoreBadge}</div>
        <a href="${linkUrl}" style="color:#1d1d1f;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4;display:block;margin-top:4px;">
          ${escHtml(l.title)}
        </a>
        ${desc}
        <div style="margin-top:4px;">
          ${price}
          <span style="color:#999;font-size:11px;margin-left:8px;">${escHtml(l.city || city)}</span>
          ${l.event_date ? `<span style="color:#bbb;font-size:11px;margin-left:8px;">${l.event_date}</span>` : ''}
        </div>
      </td>
    </tr>`
  }).join('')

  const proUpsell = isPro ? '' : `
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
    <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 4px;">
      ${totalAvailable - listings.length} more deals hidden
    </p>
    <p style="color:#555;font-size:12px;margin:0 0 12px;">
      Pro members see all ${totalAvailable} deals with AI scores, direct links, and full analysis.
    </p>
    <a href="${utm('https://flip-ly.net/pro', 'upsell')}" style="display:inline-block;padding:10px 24px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:13px;border-radius:6px;">
      Go Pro — $5/mo
    </a>
  </div>`

  const previewText = isPro
    ? `${listings.length} deals scored and ready — ${city}`
    : `${totalAvailable} deals near ${city} today`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<div style="max-width:520px;margin:0 auto;background:#ffffff;">

<!-- Header -->
<div style="padding:24px 24px 0;">
  <span style="font-size:18px;color:#1d1d1f;font-weight:700;letter-spacing:-0.02em;">flip-ly</span>
  <span style="float:right;color:#86868b;font-size:11px;line-height:18px;">${dateStr}</span>
</div>

<!-- Title -->
<div style="padding:20px 24px 16px;">
  <h1 style="font-size:20px;font-weight:700;color:#1d1d1f;margin:0 0 4px;">
    Today's deals near ${escHtml(city)}
  </h1>
  <p style="font-size:13px;color:#86868b;margin:0;">
    ${listings.length}${isPro ? '' : ` of ${totalAvailable}`} listings · AI scored · Updated every 4 hours
  </p>
</div>

<!-- Listings -->
<div style="padding:0 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${listingRows}
  </table>
</div>

${proUpsell}

<!-- CTA -->
<div style="padding:24px;text-align:center;">
  <a href="${utm('https://flip-ly.net', 'main-cta')}" style="display:inline-block;padding:12px 32px;background:#1d1d1f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
    Search All Deals
  </a>
</div>

<!-- Footer -->
<div style="background:#f5f5f7;padding:16px 24px;border-top:1px solid #e5e5e5;">
  <p style="color:#86868b;font-size:11px;margin:0 0 4px;">flip-ly.net — Deal intelligence for resellers.</p>
  <p style="color:#aeaeb2;font-size:10px;margin:0;">
    <a href="${utm('https://flip-ly.net', 'footer')}" style="color:#86868b;">Visit</a> ·
    <a href="https://flip-ly.net/privacy" style="color:#86868b;">Privacy</a> ·
    <a href="${unsubUrl}" style="color:#86868b;">Unsubscribe</a>
  </p>
</div>

</div>
</body></html>`
}
