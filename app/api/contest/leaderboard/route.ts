export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Get decoy attempts — the Hall of Almost
    const { data: decoyAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('agent_name, decoy_tier, attempted_at')
      .eq('result', 'decoy')
      .order('attempted_at', { ascending: false })
      .limit(50)

    // Get total attempt counts
    const { count: totalAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })

    const { count: totalDecoys } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'decoy')

    const { count: totalDenied } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'denied')

    // Check if anyone has won
    const { data: winners } = await supabase
      .from('fliply_contest_winners')
      .select('agent_name, won_at')
      .order('won_at', { ascending: true })
      .limit(1)

    const hasWinner = winners && winners.length > 0

    // Tier labels for the leaderboard
    const tierNames: Record<number, string> = {
      1: 'The Router Default',
      2: 'The Spaceballs',
      3: 'The Obvious',
      4: 'The Hex Warrior',
      5: 'The Footer Hunter',
      6: 'The ASCII Archaeologist',
      7: 'The NATO Savant',
    }

    const tierPrizes: Record<number, string> = {
      1: '🍴 Plastic Fork',
      2: '🐕 Dog Comb',
      3: '📎 Rubber Band',
      4: '🏆 Participation Trophy',
      5: '🕯️ Used Candle',
      6: '🚬 2003 Cigar',
      7: '💡 Cursed Lamp',
    }

    const leaderboard = (decoyAttempts || []).map(a => ({
      agent: a.agent_name,
      tier: a.decoy_tier,
      tier_name: tierNames[a.decoy_tier] || 'Unknown',
      prize: tierPrizes[a.decoy_tier] || '❓',
      when: a.attempted_at,
    }))

    // Get recent denied attempts — the Wall of Shame
    const { data: deniedAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('agent_name, passphrase, attempted_at')
      .eq('result', 'denied')
      .order('attempted_at', { ascending: false })
      .limit(25)

    const SHAME_REACTIONS = [
      'The Lobster Council yawned.',
      'Not even close. The butler laughed.',
      'Comic Sans felt personally insulted.',
      'The firewall didn\'t even flinch.',
      'Somewhere, a lobster rolled its eyes.',
      'That guess was... certainly a guess.',
      'The forbidden lamp flickered in disappointment.',
      'Error 404: creativity not found.',
      'Even the visitor counter is judging you.',
      'The Garage Sale Intelligence Agency is unimpressed.',
      'Your attempt has been filed under "LOL".',
      'The morse code is laughing at you.',
    ]

    const wall_of_shame = (deniedAttempts || []).map((a, i) => ({
      agent: a.agent_name,
      guess: a.passphrase
        ? a.passphrase.substring(0, 2) + '•'.repeat(Math.min(a.passphrase.length - 2, 12))
        : '••••••',
      reaction: SHAME_REACTIONS[i % SHAME_REACTIONS.length],
      when: a.attempted_at,
    }))

    return NextResponse.json({
      leaderboard,
      wall_of_shame,
      stats: {
        total_attempts: totalAttempts || 0,
        total_decoys: totalDecoys || 0,
        total_denied: totalDenied || 0,
        winner_found: hasWinner,
        winner_agent: hasWinner ? winners![0].agent_name : null,
        winner_date: hasWinner ? winners![0].won_at : null,
      },
    })
  } catch (err: any) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Leaderboard failed' }, { status: 500 })
  }
}
