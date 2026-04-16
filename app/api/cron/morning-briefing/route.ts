export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Morning briefing — fires at 09:30 AM CDT weekdays.
 * Delivers: launch progress, yesterday's metrics, today's priority, blockers.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    // ── Parallel fetch metrics ──
    const [
      { count: newSignups },
      { count: totalUsers },
      { count: proUsers },
      { count: searches },
      { count: emailsSent },
      { count: unsubs },
      { data: premiumUsers },
      { count: recentListings },
      { count: enrichBacklog },
      { count: hotDeals },
    ] = await Promise.all([
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('fliply_search_log').select('*', { count: 'exact', head: true }).gte('searched_at', since),
      supabase.from('email_sends').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('unsubscribed_at', since).eq('unsubscribed', true),
      supabase.from('fliply_users').select('subscription_tier').eq('is_premium', true),
      supabase.from('fliply_listings').select('*', { count: 'exact', head: true }).gte('scraped_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()),
      supabase.from('fliply_listings').select('*', { count: 'exact', head: true }).is('enriched_at', null),
      supabase.from('fliply_listings').select('*', { count: 'exact', head: true }).eq('is_hot', true),
    ])

    // MRR calculation
    const mrr = (premiumUsers || []).reduce((sum, u) => {
      if (u.subscription_tier === 'admin') return sum
      return sum + (u.subscription_tier === 'power' ? 19 : 5)
    }, 0)

    // Launch progress: 50 paid users by May 15
    const target = 50
    const paid = proUsers ?? 0
    const pct = Math.round((paid / target) * 100)
    const deadline = new Date('2026-05-15T00:00:00-05:00')
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000))

    // Scraper health
    const scraperStatus = (recentListings ?? 0) > 0 ? 'OK' : 'NO NEW LISTINGS IN 12H'

    // Blockers detection
    const blockers: string[] = []
    if (scraperStatus !== 'OK') blockers.push('Scraper may be down — no new listings in 12h')
    if ((enrichBacklog ?? 0) > 5000) blockers.push(`Enrich backlog: ${enrichBacklog} (investigate API errors)`)
    if ((newSignups ?? 0) === 0 && (totalUsers ?? 0) > 0) blockers.push('Zero signups yesterday — distribution gap')

    // ── Weekly featured deal suggestions (Mondays only) ──
    let featuredSuggestions = ''
    if (now.getDay() === 1) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: topDeals } = await supabase
        .from('fliply_listings')
        .select('id, title, deal_score, deal_score_reason, ai_tags, price_text, city, state, event_type')
        .gte('deal_score', 8)
        .not('deal_score_reason', 'is', null)
        .gte('scraped_at', sevenDaysAgo)
        .eq('resale_flag', true)
        .order('deal_score', { ascending: false })
        .limit(5)

      if (topDeals && topDeals.length > 0) {
        const suggestions = topDeals.map((d, i) => {
          const tags = (d.ai_tags || []).slice(0, 3).join(', ')
          const type = (d.event_type || '').replace(/_/g, ' ')
          return `  ${i + 1}. [${d.deal_score}] ${d.title}\n     ${type} · ${d.city}, ${d.state} · ${d.price_text}\n     ${tags}\n     "${d.deal_score_reason}"`
        }).join('\n\n')

        featuredSuggestions = [
          ``,
          `<b>FEATURED DEAL CANDIDATES</b> (for landing page)`,
          suggestions,
        ].join('\n')
      }
    }

    const progressBar = '█'.repeat(Math.min(10, Math.round(pct / 10))) + '░'.repeat(Math.max(0, 10 - Math.round(pct / 10)))

    await sendTelegramAlert([
      `<b>MORNING BRIEFING</b>`,
      `${daysLeft} days to May 15 target`,
      ``,
      `<b>Launch Progress:</b> ${paid}/${target} paid [${progressBar}] ${pct}%`,
      `MRR: $${mrr}/mo`,
      ``,
      `<b>Yesterday:</b>`,
      `  +${newSignups ?? 0} signups · ${searches ?? 0} searches · ${proUsers ?? 0} pro`,
      `  ${emailsSent ?? 0} emails · ${unsubs ?? 0} unsubs`,
      `  Scraper: ${scraperStatus} · Backlog: ${enrichBacklog ?? 0}`,
      `  Hot deals: ${hotDeals ?? 0}`,
      ``,
      blockers.length > 0
        ? `<b>BLOCKERS:</b>\n${blockers.map(b => `  ⚠️ ${b}`).join('\n')}`
        : `No blockers.`,
      featuredSuggestions,
      ``,
      `Ship > Perfect. Go.`,
    ].filter(Boolean).join('\n'))

    return NextResponse.json({
      success: true,
      days_left: daysLeft,
      paid_users: paid,
      target,
      mrr,
    })
  } catch (err: any) {
    console.error('Morning briefing error:', err)
    await sendTelegramAlert(`Morning Briefing FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
