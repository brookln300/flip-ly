export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Seed the contest-acquired user drip sequence.
 * These users found the Lobster Hunt — they're technical, curious, engaged.
 * Different tone than organic signups. Lean into the mystery.
 * Safe to re-run — uses upsert.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const results: string[] = []

  const { data: seq, error: seqErr } = await supabase
    .from('drip_sequences')
    .upsert({
      name: 'contest-to-convert',
      description: '5-email journey for Lobster Hunt participants. 14 days. Nerdy tone.',
      trigger_type: 'contest',
      is_active: true,
    }, { onConflict: 'name' })
    .select()
    .single()

  if (seqErr) {
    return NextResponse.json({ error: `Sequence create failed: ${seqErr.message}` })
  }

  results.push(`OK: Sequence "${seq.name}" (${seq.id})`)

  const steps = [
    {
      step_order: 1,
      delay_minutes: 0, // Immediate on capture
      subject: '🦞 You found the Lobster Hunt. The lobster noticed.',
      subject_variant_b: '🔒 You decoded something on flip-ly.net. We need to talk.',
      template_key: 'contest-welcome',
    },
    {
      step_order: 2,
      delay_minutes: 24 * 60, // Day 1
      subject: '🧠 The clues go deeper than you think',
      subject_variant_b: '🔍 7 decoys. 1 real password. Nobody has cracked it yet.',
      template_key: 'contest-depth',
    },
    {
      step_order: 3,
      delay_minutes: 3 * 24 * 60, // Day 3
      subject: '🎩 BTW — the website behind the easter egg is actually useful',
      subject_variant_b: '💰 While you were decoding hex, people were flipping $3 lamps for $30',
      template_key: 'contest-reveal',
    },
    {
      step_order: 4,
      delay_minutes: 7 * 24 * 60, // Day 7
      subject: '📊 Hall of Almost update — new agents are getting close',
      subject_variant_b: '🦞 The leaderboard changed. Someone found Tier 7.',
      template_key: 'contest-leaderboard',
    },
    {
      step_order: 5,
      delay_minutes: 14 * 24 * 60, // Day 14
      subject: '🔓 Hint: the real password uses fragments from 3 encoding types',
      subject_variant_b: '🦞 One last clue. The words "entry" and "split" mean something.',
      template_key: 'contest-final-hint',
    },
  ]

  for (const step of steps) {
    const { error } = await supabase
      .from('sequence_steps')
      .upsert({
        sequence_id: seq.id,
        ...step,
        is_active: true,
      }, { onConflict: 'sequence_id,step_order' })

    results.push(error
      ? `FAIL step ${step.step_order}: ${error.message}`
      : `OK: Step ${step.step_order} — ${step.template_key} (${step.delay_minutes}min delay)`)
  }

  return NextResponse.json({ sequence_id: seq.id, results })
}
