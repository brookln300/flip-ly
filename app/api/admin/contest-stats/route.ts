export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * Contest analytics — how's the Lobster Hunt performing?
 *
 * GET /api/admin/contest-stats
 */
export async function GET() {
  try {
    // Total attempts
    const { count: totalAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })

    // By result type
    const { data: allAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('result, decoy_tier, attempted_at')

    const attempts = allAttempts || []
    const byResult: Record<string, number> = {}
    const byTier: Record<number, number> = {}
    const byDay: Record<string, number> = {}

    for (const a of attempts) {
      byResult[a.result] = (byResult[a.result] || 0) + 1
      if (a.decoy_tier) {
        byTier[a.decoy_tier] = (byTier[a.decoy_tier] || 0) + 1
      }
      const day = a.attempted_at?.substring(0, 10) || 'unknown'
      byDay[day] = (byDay[day] || 0) + 1
    }

    // Most popular decoy
    const tierNames: Record<number, string> = {
      1: 'admin (Router Default)',
      2: '12345 (Spaceballs)',
      3: 'lobster (The Obvious)',
      4: 'l0bst3r_k1ng (Hex Warrior)',
      5: 'flipth3l0bst3r (Footer Hunter)',
      6: 'lobster_hunter (ASCII Archaeologist)',
      7: 'notalamp (NATO Savant)',
    }

    const popularTiers = Object.entries(byTier)
      .sort(([, a], [, b]) => b - a)
      .map(([tier, count]) => ({
        tier: parseInt(tier),
        name: tierNames[parseInt(tier)] || 'Unknown',
        count,
      }))

    // Email captures from contest
    const { count: contestCaptures } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .like('acquisition_source', 'contest_%')

    // Winner check
    const { data: winners } = await supabase
      .from('fliply_contest_winners')
      .select('agent_name, won_at')
      .limit(1)

    // Unique agents
    const { data: uniqueAgents } = await supabase
      .from('fliply_contest_attempts')
      .select('agent_name')

    const uniqueNames = new Set((uniqueAgents || []).map(a => a.agent_name)).size

    return NextResponse.json({
      total_attempts: totalAttempts || 0,
      unique_agents: uniqueNames,
      by_result: byResult,
      decoy_breakdown: popularTiers,
      attempts_by_day: byDay,
      email_captures: contestCaptures || 0,
      winner: winners?.length ? winners[0] : null,
      conversion_rate: totalAttempts
        ? `${(((contestCaptures || 0) / totalAttempts) * 100).toFixed(1)}%`
        : '0%',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
