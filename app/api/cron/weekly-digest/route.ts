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
  "🦞 FIRST DIBS: {count} deals before anyone else",
  "🥇 Pro early access: {count} deals — 6hrs before the peasants",
  "⚡ Your First Dibs digest: {count} deals, 0 competition (for now)",
]

const SUBJECTS_FREE = [
  "🎩 Your butler found {count} deals this week",
  "🔥 {count} garage sales near you — the butler insists",
  "📢 {count} new deals in DFW — from your favorite chaos engine",
  "🦞 flip-ly weekly: {count} deals, 0 regrets (probably)",
  "⚡ The butler's weekly report: {count} bargains detected",
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
    // Fetch users based on tier — now includes market_id
    let userQuery = supabase
      .from('fliply_users')
      .select('id, email, city, state, market_id, is_premium')
      .or('unsubscribed.is.null,unsubscribed.eq.false')  // Skip unsubscribed users

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
        const subject = subjectTemplate.replace('{count}', String(listings.length))
        const html = buildDigestEmail(user, listings, stats, isPro, user.email)

        const { error: sendError } = await sendEmail({
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
    const scoreDisplay = isPro
      ? (l.deal_score ? `<span style="background:${l.deal_score >= 8 ? '#006600' : '#666'};color:${l.deal_score >= 8 ? '#0f0' : '#fff'};padding:1px 6px;font-size:10px;font-weight:bold;font-family:monospace;">${l.deal_score}/10</span> ` : '')
      : (l.deal_score ? `<span style="background:#333;color:#888;padding:1px 6px;font-size:10px;font-weight:bold;font-family:monospace;">&#x2588;&#x2588;/10</span> ` : '')

    const aiDesc = isPro
      ? (l.ai_description ? `<br/><span style="color:#555;font-size:11px;font-family:Tahoma,sans-serif;font-style:italic;">&#x1F916; ${escapeHtml(l.ai_description.substring(0, 120))}</span>` : '')
      : (l.ai_description ? `<br/><span style="color:#999;font-size:11px;font-family:Tahoma,sans-serif;font-style:italic;">&#x1F916; ${escapeHtml(l.ai_description.substring(0, 40))}... <a href="${utm('https://flip-ly.net/pro', 'ai-analysis')}" style="color:#FF10F0;font-size:10px;">[PRO: see full AI analysis]</a></span>` : '')

    const linkUrl = isPro ? (l.source_url || utm('https://flip-ly.net', 'listing')) : utm('https://flip-ly.net', 'listing')
    const linkNote = isPro ? '' : `<br/><span style="font-size:9px;color:#FF10F0;">&#x1F512; <a href="${utm('https://flip-ly.net/pro', 'listing-lock')}" style="color:#FF10F0;">Upgrade to Pro for direct links</a></span>`

    return `
    <tr style="background:${l.is_hot ? '#FFF5F0' : i % 2 === 0 ? '#FFFFF8' : '#FFF'}; border-bottom:1px solid #ddd;">
      <td style="padding:10px 12px; vertical-align:top;">
        ${l.is_hot ? '<span style="background:#CC3300;color:#fff;padding:1px 6px;font-size:10px;font-weight:bold;font-family:Comic Sans MS,cursive;">&#x1F525; HOT</span> ' : ''}
        ${scoreDisplay}
        <br/>
        <a href="${linkUrl}" style="color:#0000CC;text-decoration:underline;font-size:14px;font-family:Times New Roman,serif;font-weight:${l.is_hot ? 'bold' : 'normal'};">
          ${l.is_hot ? '&#x2B50; ' : ''}${escapeHtml(l.title)}
        </a>
        ${aiDesc}
        ${linkNote}
        ${l.ai_tags?.length ? `<br/><span style="font-size:9px;color:#888;">${(isPro ? l.ai_tags.slice(0, 4) : l.ai_tags.slice(0, 2)).map((t: string) => `#${t}`).join(' ')}</span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-family:Comic Sans MS,cursive;font-weight:bold;font-size:13px;color:${l.price_text === 'FREE' ? '#009900' : '#CC3300'};">
          ${l.price_text === 'FREE' ? '&#x1F195; FREE' : escapeHtml(l.price_text || 'Ask')}
        </span>
        <br/><span style="font-size:10px;color:#888;">&#x1F4CD; ${escapeHtml(l.city || 'DFW')}</span>
        ${l.event_date ? `<br/><span style="font-size:10px;color:#aaa;">&#x1F4C5; ${l.event_date}</span>` : ''}
      </td>
    </tr>`
  }).join('')

  const proBanner = isPro
    ? `<div style="background:linear-gradient(90deg,#FFD700,#FF8C00);color:#000;padding:8px 16px;font-family:Comic Sans MS,cursive;font-size:12px;text-align:center;font-weight:bold;">
        &#x1F451; FIRST DIBS — You're seeing this 6 hours before everyone else &#x1F451;
      </div>`
    : `<div style="background:#1a1a1a;color:#888;padding:8px 16px;font-family:monospace;font-size:11px;text-align:center;">
        &#x2728; FREELOADER EDITION &#x2728; &mdash;
        <a href="${utm('https://flip-ly.net/pro', 'banner-upsell')}" style="color:#FF10F0;font-weight:bold;">Get this 6hrs early for $5/mo</a>
      </div>`

  const proUpsell = isPro
    ? ''
    : `<div style="background:#111;border:2px solid #FF10F0;padding:16px;margin:16px;text-align:center;">
        <p style="font-family:Comic Sans MS,cursive;color:#FF10F0;font-size:14px;margin:0 0 8px;">
          &#x1F512; ${stats.hot_deals} deals had their scores hidden from you
        </p>
        <p style="font-family:monospace;color:#888;font-size:11px;margin:0 0 12px;">
          Pro members see: full AI scores &bull; direct source links &bull; address &amp; map data &bull; deal reasons
        </p>
        <a href="${utm('https://flip-ly.net/pro', 'upsell-cta')}" style="display:inline-block;padding:10px 28px;background:#FF10F0;color:#fff;text-decoration:none;font-family:Comic Sans MS,cursive;font-weight:bold;font-size:14px;border:2px solid #FFD700;">
          &#x1F451; UPGRADE — $5/mo — FIRST DIBS
        </a>
        <p style="font-family:monospace;color:#555;font-size:9px;margin:8px 0 0;">
          We genuinely don't know what this is worth. But $5 seems right for you n00bz.
        </p>
      </div>`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Tahoma,sans-serif;">

${proBanner}

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
      <div style="font-size:24px;font-weight:bold;color:#FFD700;font-family:monospace;">${isPro ? stats.top_score + '/10' : '&#x2588;&#x2588;/10'}</div>
      <div style="font-size:10px;color:#888;">TOP AI SCORE${isPro ? '' : ' &#x1F512;'}</div>
    </td>
  </tr></table>
</div>

<!-- Butler intro -->
<div style="background:#FFFFF0;padding:16px 24px;border-bottom:3px ridge #996633;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:top;padding-right:12px;font-size:36px;">&#x1F3A9;</td>
    <td style="font-family:Comic Sans MS,cursive;font-size:13px;color:#333;font-style:italic;">
      &ldquo;Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${isPro ? 'esteemed Pro member' : 'sir'}. I have curated the finest deals from across the ${escapeHtml(city)} metropolitan area. ${isPro ? `As a First Dibs member, you're seeing this before the commoners wake up.` : `I found ${listings.length} offerings for your consideration.`}&rdquo;
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

${proUpsell}

<!-- CTA -->
<div style="background:#000;padding:24px;text-align:center;border-top:4px solid #FF10F0;">
  <a href="${utm('https://flip-ly.net', 'main-cta')}" style="display:inline-block;padding:12px 32px;background:linear-gradient(180deg,#ff6633,#cc3300);color:#fff;text-decoration:none;font-family:Comic Sans MS,cursive;font-weight:bold;font-size:16px;border:3px outset #ff9966;text-shadow:2px 2px 0 rgba(0,0,0,0.3);">
    &#x1F3A9; Search All Deals on flip-ly.net
  </a>
  <p style="color:#666;font-size:10px;margin-top:12px;font-family:Tahoma,sans-serif;">
    You're receiving this because you signed up on flip-ly.net. The butler does not send spam. He's British.
    <br/>
    <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a> (the butler will be disappointed)
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
