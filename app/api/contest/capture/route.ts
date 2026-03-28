import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'

/**
 * Contest Email Capture
 *
 * Captures emails from contest participants and upserts them into fliply_users
 * with acquisition_source = 'contest_*' so they can receive different
 * marketing sequences than organic signup users.
 *
 * These users found a hidden easter egg — they're high-engagement,
 * technically curious, and worth marketing to differently.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, agent_name, result_type, decoy_tier } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Determine acquisition source based on contest result
    let acquisitionSource = 'contest_denied'
    if (result_type === 'winner') {
      acquisitionSource = 'contest_winner'
    } else if (result_type === 'decoy') {
      acquisitionSource = 'contest_decoy'
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('fliply_users')
      .select('id, acquisition_source, contest_highest_tier')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      // User exists — update contest metadata if this is a better tier
      const updates: Record<string, any> = {}

      if (agent_name && !existing.contest_highest_tier) {
        updates.contest_agent_name = agent_name
      }

      // Upgrade acquisition source if they came from contest and weren't already tagged
      if (existing.acquisition_source === 'signup' || existing.acquisition_source === 'email') {
        updates.acquisition_source = acquisitionSource
      }

      // Track highest decoy tier reached
      if (decoy_tier && (!existing.contest_highest_tier || decoy_tier > existing.contest_highest_tier)) {
        updates.contest_highest_tier = decoy_tier
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('fliply_users')
          .update(updates)
          .eq('id', existing.id)
      }

      trackEvent('contest_email_capture', {
        is_new: false,
        acquisition_source: acquisitionSource,
        decoy_tier: decoy_tier || 0,
      }, existing.id)

      return NextResponse.json({
        success: true,
        is_new: false,
        message: "You're already in the system. The Lobster Council has updated your file.",
      })
    }

    // New user — create with contest acquisition source
    const { data: newUser, error } = await supabase
      .from('fliply_users')
      .insert({
        email: normalizedEmail,
        password_hash: '',  // No password — contest capture only
        acquisition_source: acquisitionSource,
        contest_agent_name: agent_name || null,
        contest_highest_tier: decoy_tier || null,
        auth_provider: 'contest',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Contest capture error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    trackEvent('contest_email_capture', {
      is_new: true,
      acquisition_source: acquisitionSource,
      decoy_tier: decoy_tier || 0,
    }, newUser?.id)

    return NextResponse.json({
      success: true,
      is_new: true,
      message: "You're in. The Lobster Council will be in touch.",
    })
  } catch (err: any) {
    console.error('Contest capture error:', err)
    return NextResponse.json({ error: 'System error' }, { status: 500 })
  }
}
