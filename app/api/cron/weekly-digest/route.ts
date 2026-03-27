export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'
import { sendTelegramAlert } from '../../../lib/telegram'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const SUBJECTS = [
  "🎩 Your butler found {count} deals this week",
  "🔥 {count} garage sales near you — the butler insists",
  "📢 {count} new deals in DFW — from your favorite chaos engine",
  "🦞 flip-ly weekly: {count} deals, 0 regrets (probably)",
  "⚡ The butler's weekly report: {count} bargains detected",
]

export async function GET(req: NextRequest) {
  const start = Date.now()

  try {
    // Fetch users
    const { data: users, error: userError } = await supabase
      .from('fliply_users')
      .select('id, email, city, state, zip_code')

    if (userError || !users?.length) {
      return NextResponse.json({ message: 'No users to send to', error: userError?.message })
    }

    // Fetch this week's hottest listings (enriched, scored)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: hotListings } = await supabase
      .from('fliply_listings')
      .select('*')
      .gte('scraped_at', weekAgo)
      .not('enriched_at', 'is', null)
      .order('deal_score', { ascending: false, nullsFirst: false })
      .limit(15)

    // Also get total counts for stats
    const { count: totalNew } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', weekAgo)

    const { count: hotCount } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', weekAgo)
      .eq('is_hot', true)

    const listings = hotListings || []
    const stats = {
      total_new: totalNew || 0,
      hot_deals: hotCount || 0,
      top_score: listings[0]?.deal_score || 0,
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const user of users) {
      try {
        const subjectTemplate = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
        const subject = subjectTemplate.replace('{count}', String(listings.length))
        const html = buildDigestEmail(user, listings, stats)

        if (resend) {
          await resend.emails.send({
            from: 'flip-ly.net <noreply@dronepools.com>',
            to: user.email.toLowerCase(),
            subject,
            html,
          })
          sent++
        }

        // Log to digest_log
        await supabase.from('fliply_digest_log').insert({
          user_id: user.id,
          listing_count: listings.length,
          status: resend ? 'sent' : 'skipped',
        })

        results.push({ email: user.email, status: resend ? 'sent' : 'no-resend-key' })
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

    // Telegram summary
    await sendTelegramAlert([
      `<b>Weekly Digest Sent</b> (${elapsed}s)`,
      `Users: ${users.length}`,
      `Sent: ${sent} | Failed: ${failed}`,
      `Listings featured: ${listings.length}`,
      `This week: ${stats.total_new} new, ${stats.hot_deals} hot deals`,
    ].join('\n'))

    trackEvent('digest_sent', {
      users_count: users.length,
      sent_count: sent,
      failed_count: failed,
      listings_featured: listings.length,
    })

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      users_processed: users.length,
      sent, failed,
      listings_featured: listings.length,
      stats,
      results,
    })
  } catch (err: any) {
    console.error('Digest cron error:', err)
    await sendTelegramAlert(`Weekly Digest FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildDigestEmail(
  user: { email: string; city?: string; state?: string },
  listings: any[],
  stats: { total_new: number; hot_deals: number; top_score: number }
): string {
  const city = user.city || 'DFW'
  const hotDeals = listings.filter(l => l.is_hot)
  const regularDeals = listings.filter(l => !l.is_hot)

  const listingRows = listings.slice(0, 10).map((l, i) => `
    <tr style="background:${l.is_hot ? '#FFF5F0' : i % 2 === 0 ? '#FFFFF8' : '#FFF'}; border-bottom:1px solid #ddd;">
      <td style="padding:10px 12px; vertical-align:top;">
        ${l.is_hot ? '<span style="background:#CC3300;color:#fff;padding:1px 6px;font-size:10px;font-weight:bold;font-family:Comic Sans MS,cursive;">&#x1F525; HOT</span> ' : ''}
        ${l.deal_score ? `<span style="background:${l.deal_score >= 8 ? '#006600' : '#666'};color:${l.deal_score >= 8 ? '#0f0' : '#fff'};padding:1px 6px;font-size:10px;font-weight:bold;font-family:monospace;">${l.deal_score}/10</span> ` : ''}
        <br/>
        <a href="${l.source_url || 'https://flip-ly.net'}" style="color:#0000CC;text-decoration:underline;font-size:14px;font-family:Times New Roman,serif;font-weight:${l.is_hot ? 'bold' : 'normal'};">
          ${l.is_hot ? '&#x2B50; ' : ''}${escapeHtml(l.title)}
        </a>
        ${l.ai_description ? `<br/><span style="color:#555;font-size:11px;font-family:Tahoma,sans-serif;font-style:italic;">&#x1F916; ${escapeHtml(l.ai_description.substring(0, 120))}</span>` : ''}
        ${l.ai_tags?.length ? `<br/><span style="font-size:9px;color:#888;">${l.ai_tags.slice(0, 4).map((t: string) => `#${t}`).join(' ')}</span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-family:Comic Sans MS,cursive;font-weight:bold;font-size:13px;color:${l.price_text === 'FREE' ? '#009900' : '#CC3300'};">
          ${l.price_text === 'FREE' ? '&#x1F195; FREE' : escapeHtml(l.price_text || 'Ask')}
        </span>
        <br/><span style="font-size:10px;color:#888;">&#x1F4CD; ${escapeHtml(l.city || 'DFW')}</span>
        ${l.event_date ? `<br/><span style="font-size:10px;color:#aaa;">&#x1F4C5; ${l.event_date}</span>` : ''}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Tahoma,sans-serif;">

<!-- Marquee banner -->
<div style="background:#000080;color:#ffff00;padding:6px 12px;font-family:Comic Sans MS,cursive;font-size:11px;text-align:center;">
  &#x1F3C6; YOUR WEEKLY DEAL INTELLIGENCE BRIEFING &#x1F3C6; FROM THE DESK OF JEEVES &#x1F3C6;
</div>

<!-- Header -->
<div style="background:linear-gradient(135deg,#1a0a2e,#0a0a1a);padding:24px;text-align:center;border-bottom:4px solid #0FFF50;">
  <div style="font-size:48px;">&#x1F3A9;</div>
  <h1 style="font-family:Comic Sans MS,cursive;font-size:28px;color:#0FFF50;margin:8px 0;text-shadow:2px 2px 0 #FF10F0;">
    flip-ly<span style="color:#FF10F0;">.net</span>
  </h1>
  <p style="color:#ccc;font-size:13px;font-style:italic;font-family:Georgia,serif;">
    Your weekly garage sale intelligence report for <strong style="color:#FFD700;">${escapeHtml(city)}</strong>
  </p>
</div>

<!-- Stats bar -->
<div style="background:#111;padding:12px 24px;display:flex;border-bottom:2px solid #333;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align:center;padding:8px;">
      <div style="font-size:24px;font-weight:bold;color:#0FFF50;font-family:monospace;">${stats.total_new}</div>
      <div style="font-size:10px;color:#888;">NEW THIS WEEK</div>
    </td>
    <td style="text-align:center;padding:8px;border-left:1px solid #333;border-right:1px solid #333;">
      <div style="font-size:24px;font-weight:bold;color:#FF10F0;font-family:monospace;">${stats.hot_deals}</div>
      <div style="font-size:10px;color:#888;">&#x1F525; HOT DEALS</div>
    </td>
    <td style="text-align:center;padding:8px;">
      <div style="font-size:24px;font-weight:bold;color:#FFD700;font-family:monospace;">${stats.top_score}/10</div>
      <div style="font-size:10px;color:#888;">TOP AI SCORE</div>
    </td>
  </tr></table>
</div>

<!-- Butler intro -->
<div style="background:#FFFFF0;padding:16px 24px;border-bottom:3px ridge #996633;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:top;padding-right:12px;font-size:36px;">&#x1F3A9;</td>
    <td style="font-family:Comic Sans MS,cursive;font-size:13px;color:#333;font-style:italic;">
      &ldquo;Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, sir. I have curated the finest deals from across the ${escapeHtml(city)} metropolitan area. ${hotDeals.length > 0 ? `I found ${hotDeals.length} particularly compelling offerings.` : 'Slim pickings this week, but the butler perseveres.'} Do peruse at your leisure.&rdquo;
      <br/><span style="font-size:10px;color:#999;font-style:normal;">&mdash; Jeeves, your AI-powered garage sale butler (est. 1998)</span>
    </td>
  </tr></table>
</div>

<!-- Listings table -->
<div style="background:#FFFEF0;padding:16px;">
  <div style="background:#000080;color:#fff;padding:6px 12px;font-family:Tahoma,sans-serif;font-size:11px;margin-bottom:8px;">
    &#x1F4C2; This Week's Top ${listings.length} Deals &mdash; Sorted by AI Intelligence
    <span style="float:right;color:#ff0;">&#x1F525; = Score 8+</span>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="border:2px ridge #996633;border-collapse:collapse;">
    ${listingRows}
  </table>
</div>

<!-- CTA -->
<div style="background:#000;padding:24px;text-align:center;border-top:4px solid #FF10F0;">
  <a href="https://flip-ly.net" style="display:inline-block;padding:12px 32px;background:linear-gradient(180deg,#ff6633,#cc3300);color:#fff;text-decoration:none;font-family:Comic Sans MS,cursive;font-weight:bold;font-size:16px;border:3px outset #ff9966;text-shadow:2px 2px 0 rgba(0,0,0,0.3);">
    &#x1F3A9; Search All Deals on flip-ly.net
  </a>
  <p style="color:#666;font-size:10px;margin-top:12px;font-family:Tahoma,sans-serif;">
    You're receiving this because you signed up on flip-ly.net. The butler does not send spam. He's British.
    <br/>
    <a href="https://flip-ly.net" style="color:#888;">Unsubscribe</a> (the butler will be disappointed)
  </p>
</div>

<!-- Footer -->
<div style="background:#0a0a1a;padding:12px;text-align:center;">
  <p style="color:#444;font-size:9px;font-family:monospace;">
    &#x1F6A7; flip-ly.net v0.69 beta &#x1F6A7; Best viewed in Netscape 4.0 &#x1F6A7; Y2K Compliant (probably) &#x1F6A7;
  </p>
</div>

</body>
</html>
`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
