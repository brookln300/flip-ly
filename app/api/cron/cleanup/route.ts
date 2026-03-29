export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

/**
 * Cleanup cron — runs weekly to keep the database lean.
 *
 * 1. Deletes search_log entries older than 7 days (only need today's for rate limiting)
 * 2. Deletes contest attempts older than 90 days (keep recent for leaderboard)
 * 3. Reports cleanup stats to Telegram
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const results: string[] = []

    // Count before deleting (Supabase delete doesn't return count easily)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: searchCount } = await supabase
      .from('fliply_search_log')
      .select('*', { count: 'exact', head: true })
      .lt('searched_at', sevenDaysAgo)

    await supabase
      .from('fliply_search_log')
      .delete()
      .lt('searched_at', sevenDaysAgo)

    results.push(`Search logs: ${searchCount || 0} old rows deleted`)

    // Clean denied contest attempts older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count: deniedCount } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'denied')
      .lt('attempted_at', ninetyDaysAgo)

    await supabase
      .from('fliply_contest_attempts')
      .delete()
      .eq('result', 'denied')
      .lt('attempted_at', ninetyDaysAgo)

    results.push(`Denied contest attempts: ${deniedCount || 0} old rows deleted`)

    await sendTelegramAlert([
      `🧹 <b>Weekly Cleanup</b>`,
      ...results,
    ].join('\n'))

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    console.error('Cleanup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
