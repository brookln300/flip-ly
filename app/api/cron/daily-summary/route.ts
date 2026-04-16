export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Daily report — fires once per day at 9 AM CDT via Vercel cron.
 * Consolidates the old daily-summary + alerts into one comprehensive report.
 * Sends a Telegram digest of everything that happened in the last 24 hours,
 * plus proactive alerts for any anomalies.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // ── Parallel fetch all stats ──
    const [
      { count: totalUsers },
      { count: newSignups },
      { count: proUsers },
      { count: unsubCount },
      { count: searches },
      { count: emailsSent },
      { count: listingCount },
      { count: hotCount },
      { count: activeMarkets },
      { count: contestAttempts },
      { count: contestCaptures },
      { data: digestLogs },
      { data: activeDigestUsers },
      { data: premiumUsers },
    ] = await Promise.all([
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).gte('unsubscribed_at', since).eq('unsubscribed', true),
      supabase.from('fliply_search_log').select('*', { count: 'exact', head: true }).gte('searched_at', since),
      supabase.from('email_sends').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('fliply_listings').select('*', { count: 'exact', head: true }),
      supabase.from('fliply_listings').select('*', { count: 'exact', head: true }).eq('is_hot', true),
      supabase.from('fliply_markets').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fliply_contest_attempts').select('*', { count: 'exact', head: true }).gte('attempted_at', since),
      supabase.from('fliply_users').select('*', { count: 'exact', head: true }).like('acquisition_source', 'contest_%').gte('created_at', since),
      supabase.from('fliply_digest_log').select('status').gte('sent_at', since),
      supabase.from('fliply_digest_log').select('user_id').gte('sent_at', weekAgo),
      supabase.from('fliply_users').select('subscription_tier').eq('is_premium', true),
    ])

    // Derived metrics
    const digestTotal = digestLogs?.length || 0
    const digestFailed = digestLogs?.filter(d => d.status === 'failed').length || 0
    const uniqueActive = new Set(activeDigestUsers?.map(d => d.user_id) || []).size
    const mrr = (premiumUsers || []).reduce((sum, u) => {
      if (u.subscription_tier === 'admin') return sum
      return sum + (u.subscription_tier === 'power' ? 19 : 5)
    }, 0)

    // ── Alerts ──
    const alerts: string[] = []

    if (newSignups === 0) {
      alerts.push('Zero signups in the last 24 hours')
    }

    if (digestTotal > 0 && (digestFailed / digestTotal) * 100 > 5) {
      const failRate = ((digestFailed / digestTotal) * 100).toFixed(1)
      alerts.push(`Digest failure rate: ${failRate}% (${digestFailed}/${digestTotal})`)
    }

    if (totalUsers && totalUsers > 5 && uniqueActive / totalUsers < 0.2) {
      alerts.push(`Low engagement: only ${uniqueActive}/${totalUsers} users active in last 7 days`)
    }

    // ── Build report ──
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const summary = [
      `<b>flip-ly.net Daily Report</b>`,
      `${dateStr}`,
      ``,
      `<b>Users</b>`,
      `  Total: ${totalUsers || 0} | Pro: ${proUsers || 0} | $${mrr}/mo MRR`,
      `  Signups (24h): ${newSignups || 0} | Unsubs: ${unsubCount || 0}`,
      ``,
      `<b>Engagement</b>`,
      `  Searches (24h): ${searches || 0}`,
      `  Emails sent: ${emailsSent || 0}`,
      `  Digests: ${digestTotal}${digestFailed > 0 ? ` (${digestFailed} failed)` : ''}`,
      `  Active users (7d): ${uniqueActive}`,
      `  Contest: ${contestAttempts || 0} plays, ${contestCaptures || 0} captures`,
      ``,
      `<b>Content</b>`,
      `  Listings: ${listingCount || 0} | Hot (8+): ${hotCount || 0}`,
      `  Markets: ${activeMarkets || 0}`,
    ]

    if (alerts.length > 0) {
      summary.push(``, `<b>ALERTS</b>`)
      alerts.forEach(a => summary.push(`  ⚠️ ${a}`))
    } else {
      summary.push(``, `All systems nominal.`)
    }

    await sendTelegramAlert(summary.join('\n'))

    return NextResponse.json({
      success: true,
      alerts,
      stats: {
        total_users: totalUsers,
        new_signups: newSignups,
        pro_subscribers: proUsers,
        mrr,
        unsubscribes: unsubCount,
        searches_24h: searches,
        emails_sent: emailsSent,
        digest_runs_24h: digestTotal,
        digest_failed_24h: digestFailed,
        active_users_7d: uniqueActive,
        contest_attempts: contestAttempts,
        contest_captures: contestCaptures,
        active_listings: listingCount,
        hot_deals: hotCount,
        active_markets: activeMarkets,
      },
    })
  } catch (err: any) {
    console.error('Daily report error:', err)
    await sendTelegramAlert(`Daily Report FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
