export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Morning briefing — fires at 09:30 AM CDT weekdays.
 * Adapted from CrisisMaps "ruthless morning briefing" pattern.
 * Delivers: launch countdown, yesterday's metrics, today's target, blockers.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const launch = new Date('2026-04-18T12:00:00-05:00')
  const daysLeft = Math.max(0, Math.ceil((launch.getTime() - now.getTime()) / 86400000))
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    // Yesterday's numbers
    // Fetch pro users with their subscription tier for accurate MRR
    const [
      { count: newSignups },
      { count: totalUsers },
      { count: proUsers },
      { count: searches },
      { count: emailsSent },
      { count: unsubs },
      { data: premiumUsers },
    ] = await Promise.all([
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('fliply_search_log').select('*', { count: 'exact', head: true }).gte('searched_at', since),
      supabase.from('email_sends').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('unsubscribed_at', since).eq('unsubscribed', true),
      supabase.from('fliply_users').select('subscription_tier').eq('is_premium', true),
    ])

    // Calculate MRR: Pro=$5, Power=$19 (exclude admin — not paying customers)
    const mrr = (premiumUsers || []).reduce((sum, u) => {
      if (u.subscription_tier === 'admin') return sum
      return sum + (u.subscription_tier === 'power' ? 19 : 5)
    }, 0)

    // Scraper health — check if we got listings in last 12h
    const twelvHrsAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    const { count: recentListings } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', twelvHrsAgo)

    const scraperStatus = (recentListings ?? 0) > 0 ? 'OK' : 'NO NEW LISTINGS IN 12H'

    // Sprint day calculation
    const sprintStart = new Date('2026-04-05T00:00:00-05:00')
    const sprintDay = Math.max(1, Math.ceil((now.getTime() - sprintStart.getTime()) / 86400000))

    // Daily targets mapped to sprint day
    const targets: Record<number, string> = {
      1: 'Landing page skeleton + design tokens',
      2: 'Visual upgrades, hero video, score bars',
      3: 'Product-first rewrite, OG image, polish',
      4: 'Kill fake scores, compress pricing, color fix',
      5: 'Sprint process, morning briefing, blog infra',
      6: 'Stripe checkout wiring (real payments)',
      7: 'Stripe portal + subscription management',
      8: 'Blog: first 2 SEO articles live',
      9: 'Saved searches + alert preferences UI',
      10: 'Email alerts for saved searches',
      11: 'Source integrations (EstateSales API)',
      12: 'More markets + scraper hardening',
      13: 'Mobile QA, edge cases, load testing',
      14: 'Buffer zone — catch up + polish',
    }
    const todayTarget = targets[sprintDay] || 'Launch prep'

    const urgency = daysLeft <= 3 ? 'FINAL STRETCH' : daysLeft <= 7 ? 'CRUNCH TIME' : 'BUILD MODE'

    await sendTelegramAlert([
      `<b>FLIP-LY MORNING BRIEFING</b>`,
      `Sprint Day ${sprintDay} · ${daysLeft} days to launch · ${urgency}`,
      ``,
      `<b>Yesterday:</b>`,
      `  +${newSignups ?? 0} signups · ${searches ?? 0} searches · ${proUsers ?? 0} pro`,
      `  ${emailsSent ?? 0} emails sent · ${unsubs ?? 0} unsubs`,
      `  Scraper: ${scraperStatus}`,
      ``,
      `<b>Totals:</b> ${totalUsers ?? 0} users · ${proUsers ?? 0} pro · $${mrr}/mo MRR`,
      ``,
      `<b>TODAY'S TARGET:</b>`,
      `  ${todayTarget}`,
      ``,
      `<b>Decision tree:</b>`,
      `  Blocking launch? Fix now (60m max)`,
      `  Trust issue? Fix now`,
      `  Cosmetic? Log it, keep shipping`,
      `  Nice-to-have? After April 18`,
      ``,
      `Ship > Perfect. Go.`,
    ].join('\n'))

    return NextResponse.json({ success: true, sprint_day: sprintDay, days_left: daysLeft })
  } catch (err: any) {
    console.error('Morning briefing error:', err)
    await sendTelegramAlert(`Morning Briefing FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
