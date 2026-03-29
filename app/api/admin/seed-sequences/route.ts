export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Seed the 7-email welcome-to-convert drip sequence.
 * Safe to re-run — uses upsert on unique name.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const results: string[] = []

  // Create the welcome sequence
  const { data: seq, error: seqErr } = await supabase
    .from('drip_sequences')
    .upsert({
      name: 'welcome-to-convert',
      description: '7-email journey from signup to Pro subscriber. 21 days.',
      trigger_type: 'signup',
      is_active: true,
    }, { onConflict: 'name' })
    .select()
    .single()

  if (seqErr) {
    return NextResponse.json({ error: `Sequence create failed: ${seqErr.message}` })
  }

  results.push(`OK: Sequence "${seq.name}" (${seq.id})`)

  // Define the 7 steps
  const steps = [
    {
      step_order: 1,
      delay_minutes: 0, // Immediate on signup
      subject: '🎩 Welcome to the chaos — your butler is ready',
      subject_variant_b: '🦞 You signed up for a Comic Sans website. We respect that.',
      template_key: 'welcome',
    },
    {
      step_order: 2,
      delay_minutes: 24 * 60, // Day 1 (24 hours)
      subject: '🔥 The butler found deals near {city}',
      subject_variant_b: '📡 {city} garage sale intel — fresh from the AI',
      template_key: 'first-finds',
    },
    {
      step_order: 3,
      delay_minutes: 3 * 24 * 60, // Day 3
      subject: '💬 Your neighbors are already finding deals',
      subject_variant_b: '🏆 DFW flippers are using this — are you?',
      template_key: 'social-proof',
    },
    {
      step_order: 4,
      delay_minutes: 7 * 24 * 60, // Day 7
      subject: '📨 Your first weekly deal digest is here',
      subject_variant_b: '🎩 The butler\'s weekly report — {city} edition',
      template_key: 'first-digest-teaser',
    },
    {
      step_order: 5,
      delay_minutes: 10 * 24 * 60, // Day 10
      subject: '🔔 Unlock hot deal alerts — never miss a 9/10 again',
      subject_variant_b: '⚡ The deals you\'re missing (and how to stop missing them)',
      template_key: 'soft-pitch',
    },
    {
      step_order: 6,
      delay_minutes: 14 * 24 * 60, // Day 14
      subject: '⏱ Pro members got this deal 6 hours before you',
      subject_variant_b: '🚨 This 9/10 estate sale? Pro members saw it first.',
      template_key: 'fomo',
    },
    {
      step_order: 7,
      delay_minutes: 21 * 24 * 60, // Day 21
      subject: '🎁 The butler has a special offer — first month $1',
      subject_variant_b: '💰 $1 for your first month of Pro — the butler insists',
      template_key: 'hard-convert',
    },
  ]

  // Upsert each step
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
