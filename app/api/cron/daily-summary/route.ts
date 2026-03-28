export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Daily summary — fires once per day via Vercel cron.
 * Sends a Telegram digest of everything that happened in the last 24 hours.
 */
export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    // New signups
    const { count: newSignups } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    // Total users
    const { count: totalUsers } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })

    // Pro users
    const { count: proUsers } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true)

    // Searches today
    const { count: searches } = await supabase
      .from('fliply_search_log')
      .select('*', { count: 'exact', head: true })
      .gte('searched_at', since)

    // Contest attempts
    const { count: contestAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('attempted_at', since)

    // Contest email captures
    const { count: contestCaptures } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .like('acquisition_source', 'contest_%')
      .gte('created_at', since)

    // Emails sent today
    const { count: emailsSent } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    // Unsubscribes
    const { count: unsubs } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .gte('unsubscribed_at', since)
      .eq('unsubscribed', true)

    await sendTelegramAlert([
      `📊 <b>Daily Summary — ${new Date().toLocaleDateString()}</b>`,
      '',
      `👥 <b>Users:</b> ${totalUsers} total (${newSignups} new today)`,
      `👑 <b>Pro:</b> ${proUsers} subscribers`,
      `🔍 <b>Searches:</b> ${searches} today`,
      `🦞 <b>Contest:</b> ${contestAttempts} attempts, ${contestCaptures} emails captured`,
      `📧 <b>Emails:</b> ${emailsSent} sent`,
      `🚪 <b>Unsubs:</b> ${unsubs}`,
      '',
      `<i>The lobster watches. The lobster reports.</i>`,
    ].join('\n'))

    return NextResponse.json({
      success: true,
      stats: {
        new_signups: newSignups,
        total_users: totalUsers,
        pro_users: proUsers,
        searches,
        contest_attempts: contestAttempts,
        contest_captures: contestCaptures,
        emails_sent: emailsSent,
        unsubscribes: unsubs,
      },
    })
  } catch (err: any) {
    console.error('Daily summary error:', err)
    await sendTelegramAlert(`Daily Summary FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
