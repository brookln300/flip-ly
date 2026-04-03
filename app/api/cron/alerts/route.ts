export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const alerts: string[] = []

    // Total users
    const { count: totalUsers } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })

    // Signups (24h)
    const { count: signupCount } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())

    // Pro subscribers
    const { count: proCount } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true)

    // Unsubscribed users
    const { count: unsubCount } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', true)

    // Digest logs (24h)
    const { data: digestLogs } = await supabase
      .from('fliply_digest_log')
      .select('status')
      .gte('sent_at', yesterday.toISOString())

    const digestTotal = digestLogs?.length || 0
    const digestFailed = digestLogs?.filter((d) => d.status === 'failed').length || 0

    // Active users (7d) — users who received a digest
    const { data: activeDigestUsers } = await supabase
      .from('fliply_digest_log')
      .select('user_id')
      .gte('sent_at', weekAgo.toISOString())

    const uniqueActive = new Set(activeDigestUsers?.map((d) => d.user_id) || []).size

    // Searches (24h)
    const { count: searchCount } = await supabase
      .from('fliply_search_log')
      .select('*', { count: 'exact', head: true })
      .gte('searched_at', yesterday.toISOString())

    // Active listings
    const { count: listingCount } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })

    // Hot deals (score 8+)
    const { count: hotCount } = await supabase
      .from('fliply_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_hot', true)

    // Active markets
    const { count: activeMarkets } = await supabase
      .from('fliply_markets')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // ── ALERTS ──
    if (signupCount === 0) {
      alerts.push('Zero signups in the last 24 hours')
    }

    if (digestTotal > 0 && (digestFailed / digestTotal) * 100 > 5) {
      const failRate = ((digestFailed / digestTotal) * 100).toFixed(1)
      alerts.push(`Digest failure rate: ${failRate}% (${digestFailed}/${digestTotal})`)
    }

    if (totalUsers && totalUsers > 5 && uniqueActive / totalUsers < 0.2) {
      alerts.push(`Low engagement: only ${uniqueActive}/${totalUsers} users active in digest last 7 days`)
    }

    // ── BUILD SUMMARY ──
    const summary = [
      `<b>flip-ly.net Daily Report</b>`,
      `${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      ``,
      `<b>Users</b>`,
      `  Total: ${totalUsers || 0}`,
      `  Signups (24h): ${signupCount || 0}`,
      `  Pro subscribers: ${proCount || 0}`,
      `  Unsubscribed: ${unsubCount || 0}`,
      ``,
      `<b>Engagement</b>`,
      `  Searches (24h): ${searchCount || 0}`,
      `  Digests sent (24h): ${digestTotal}${digestFailed > 0 ? ` (${digestFailed} failed)` : ''}`,
      `  Active users (7d): ${uniqueActive}`,
      ``,
      `<b>Content</b>`,
      `  Active listings: ${listingCount || 0}`,
      `  Hot deals (8+): ${hotCount || 0}`,
      `  Active markets: ${activeMarkets || 0}`,
    ]

    if (alerts.length > 0) {
      summary.push(``, `<b>ALERTS</b>`)
      alerts.forEach((a) => summary.push(`  - ${a}`))
    } else {
      summary.push(``, `All systems nominal.`)
    }

    await sendTelegramAlert(summary.join('\n'))

    return NextResponse.json({
      success: true,
      alerts,
      stats: {
        total_users: totalUsers,
        pro_subscribers: proCount,
        unsubscribed: unsubCount,
        signups_24h: signupCount,
        searches_24h: searchCount,
        digest_runs_24h: digestTotal,
        digest_failed_24h: digestFailed,
        active_users_7d: uniqueActive,
        active_listings: listingCount,
        hot_deals: hotCount,
        active_markets: activeMarkets,
      },
    })
  } catch (err) {
    console.error('Alerts cron error:', err)
    return NextResponse.json({ error: 'Alerts cron failed' }, { status: 500 })
  }
}
