export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { resolveMarketFromHeaders } from '../../../lib/geo-market'
import { sendEmail } from '../../../lib/email/send'
import { getDripEmailHtml } from '../../../lib/email/drip-templates'
import { sendTelegramAlert } from '../../../lib/telegram'
import { trackEvent } from '../../../lib/analytics'

/**
 * POST /api/auth/assign-market
 *
 * Auto-assigns a market to OAuth users who signed up without selecting one.
 * Uses Vercel's free geo headers to find the nearest market by lat/lng.
 *
 * Called by the dashboard when it detects market_id is null.
 * Idempotent — if user already has a market, returns it without changes.
 *
 * Flow:
 * 1. Read Vercel geo headers (x-vercel-ip-latitude, etc.)
 * 2. Find nearest fliply_market via Haversine distance
 * 3. Update user record with market_id, city, state
 * 4. Activate market sources
 * 5. Send welcome email (now with correct location)
 * 6. Log to email_sends for webhook tracking
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if user already has a market (idempotent)
  const { data: user } = await supabase
    .from('fliply_users')
    .select('id, email, market_id, city, state, acquisition_source')
    .eq('id', session.userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.market_id) {
    return NextResponse.json({
      already_assigned: true,
      market_id: user.market_id,
      city: user.city,
      state: user.state,
    })
  }

  // Resolve market from Vercel geo headers
  const resolved = await resolveMarketFromHeaders(req.headers)

  if (!resolved) {
    return NextResponse.json({ error: 'Could not resolve market' }, { status: 500 })
  }

  // Update user with resolved market
  const { error: updateErr } = await supabase
    .from('fliply_users')
    .update({
      market_id: resolved.market_id,
      city: resolved.display_name,
      state: resolved.state,
    })
    .eq('id', user.id)

  if (updateErr) {
    console.error('[ASSIGN-MARKET] Update failed:', updateErr.message)
    return NextResponse.json({ error: 'Failed to assign market' }, { status: 500 })
  }

  // Activate market + bump user count (fire-and-forget)
  supabase.rpc('increment_market_user_count', { p_market_id: resolved.market_id })
    .then(null, () => {
      supabase
        .from('fliply_markets')
        .update({ is_active: true })
        .eq('id', resolved.market_id)
        .then(null, (err: any) => console.error('[ASSIGN-MARKET] Market activation failed:', err))
    })

  // Send welcome email with correct location
  try {
    const subject = "Welcome to flip-ly — here's how it works"
    const html = await getDripEmailHtml('welcome', {
      email: user.email,
      city: resolved.display_name,
      state: resolved.state,
      step_order: 0,
      variant: 'a',
    })

    const { id: resendMessageId, error: sendError } = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: [
        { name: 'sequence', value: 'welcome' },
        { name: 'template', value: 'welcome' },
      ],
    })

    if (!sendError) {
      console.log(`[ASSIGN-MARKET] Welcome email sent to ${user.email} (${resolved.display_name}, ${resolved.state})`)

      await supabase.from('email_sends').insert({
        user_id: user.id,
        to_email: user.email.toLowerCase(),
        subject,
        template_key: 'welcome',
        variant: 'a',
        resend_message_id: resendMessageId || null,
        status: 'sent',
      }).then(null, (err: any) =>
        console.error('[ASSIGN-MARKET] email_sends log failed:', err.message)
      )

      trackEvent('welcome_email_sent', { email_type: 'welcome', geo_method: resolved.method }, user.id)
    }
  } catch (err: any) {
    console.error('[ASSIGN-MARKET] Welcome email failed:', err.message)
  }

  // Update drip enrollment with correct city/state (so future drip emails are accurate)
  // The enrollment already exists from next-auth.ts signIn callback

  sendTelegramAlert([
    `<b>Market Auto-Assigned</b>`,
    `User: ${user.email}`,
    `Market: ${resolved.display_name}, ${resolved.state}`,
    `Method: ${resolved.method}`,
    `Source: ${user.acquisition_source || 'oauth'}`,
  ].join('\n'))

  console.log(`[ASSIGN-MARKET] ${user.email} → ${resolved.display_name}, ${resolved.state} (${resolved.method})`)

  return NextResponse.json({
    assigned: true,
    market_id: resolved.market_id,
    city: resolved.display_name,
    state: resolved.state,
    method: resolved.method,
  })
}
