import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Total unique agent names
    const { data: agentData, error: agentError } = await supabase
      .from('fliply_shell_attempts')
      .select('agent_name')

    if (agentError) {
      console.error('[SHELL] Stats agent query error:', agentError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const uniqueAgents = new Set((agentData ?? []).map(r => r.agent_name))
    const totalAgents = uniqueAgents.size

    // Total attempts
    const { count: totalAttempts } = await supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true })

    // Clears per level
    const { data: clearsData, error: clearsError } = await supabase
      .from('fliply_shell_attempts')
      .select('level_attempted')
      .eq('result', 'cleared')

    if (clearsError) {
      console.error('[SHELL] Stats clears query error:', clearsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const clearsByLevel: Record<number, number> = {}
    for (const row of clearsData ?? []) {
      const lvl = row.level_attempted
      clearsByLevel[lvl] = (clearsByLevel[lvl] || 0) + 1
    }

    // 5 most recent clears
    const { data: recentClearsData, error: recentError } = await supabase
      .from('fliply_shell_attempts')
      .select('agent_name, level_attempted, created_at')
      .eq('result', 'cleared')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('[SHELL] Stats recent clears query error:', recentError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const recentClears = (recentClearsData ?? []).map(r => ({
      agent_name: r.agent_name,
      level: r.level_attempted,
      timestamp: r.created_at,
    }))

    return NextResponse.json({
      total_agents: totalAgents,
      total_attempts: totalAttempts ?? 0,
      clears_by_level: clearsByLevel,
      recent_clears: recentClears,
    })
  } catch (err) {
    console.error('[SHELL] Stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
