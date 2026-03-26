import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow manual triggers without auth for testing
  }

  try {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const alerts: string[] = []

    // Alert 1: Zero signups in 24h
    const { count: signupCount } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())

    if (signupCount === 0) {
      alerts.push('Zero signups in the last 24 hours')
    }

    // Alert 2: Digest failure rate >5%
    const { data: digestLogs } = await supabase
      .from('fliply_digest_log')
      .select('status')
      .gte('sent_at', yesterday.toISOString())

    if (digestLogs && digestLogs.length > 0) {
      const failures = digestLogs.filter((d) => d.status === 'failed').length
      const failRate = (failures / digestLogs.length) * 100
      if (failRate > 5) {
        alerts.push(`Digest failure rate: ${failRate.toFixed(1)}% (${failures}/${digestLogs.length})`)
      }
    }

    // Alert 3: Total user count (for daily tracking)
    const { count: totalUsers } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })

    // Alert 4: Low engagement — flag if <20% of users triggered a digest in last 7 days
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: activeDigestUsers } = await supabase
      .from('fliply_digest_log')
      .select('user_id')
      .gte('sent_at', weekAgo.toISOString())

    const uniqueActive = new Set(activeDigestUsers?.map((d) => d.user_id) || []).size
    if (totalUsers && totalUsers > 5 && uniqueActive / totalUsers < 0.2) {
      alerts.push(`Low engagement: only ${uniqueActive}/${totalUsers} users active in digest last 7 days`)
    }

    // Build daily summary
    const summary = [
      `<b>flip-ly.net Daily Report</b>`,
      `Date: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      ``,
      `Total users: ${totalUsers || 0}`,
      `Signups (24h): ${signupCount || 0}`,
      `Digest runs (24h): ${digestLogs?.length || 0}`,
      `Active users (7d): ${uniqueActive}`,
    ]

    if (alerts.length > 0) {
      summary.push(``, `<b>ALERTS:</b>`)
      alerts.forEach((a) => summary.push(`- ${a}`))
    } else {
      summary.push(``, `No alerts. All systems nominal.`)
    }

    await sendTelegramAlert(summary.join('\n'))

    return NextResponse.json({
      success: true,
      alerts,
      stats: {
        total_users: totalUsers,
        signups_24h: signupCount,
        digest_runs_24h: digestLogs?.length || 0,
        active_users_7d: uniqueActive,
      },
    })
  } catch (err) {
    console.error('Alerts cron error:', err)
    return NextResponse.json({ error: 'Alerts cron failed' }, { status: 500 })
  }
}
