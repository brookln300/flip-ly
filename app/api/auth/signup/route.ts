export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'
import { discoverSourcesForMarket } from '../../../lib/discovery/source-discovery'
import { sendEmail } from '../../../lib/email/send'
import { getDripEmailHtml } from '../../../lib/email/drip-templates'
import { sendTelegramAlert } from '../../../lib/telegram'

// Welcome email uses the shared drip template — single source of truth
const WELCOME_SUBJECT = "Welcome to flip-ly — here's how it works"

export async function POST(req: NextRequest) {
  try {
    const { email, password, market_id, include_events, utm_source, utm_medium, utm_campaign, gclid, fbclid } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Optionally resolve market if provided, otherwise defer to geo-detection on dashboard
    let market: { id: string; name: string; display_name: string | null; state: string; cl_subdomain: string } | null = null
    if (market_id) {
      const { data: m } = await supabase
        .from('fliply_markets')
        .select('id, name, display_name, state, cl_subdomain')
        .eq('id', market_id)
        .single()
      if (!m) {
        return NextResponse.json({ error: 'Invalid market selected' }, { status: 400 })
      }
      market = m
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('fliply_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Determine acquisition source from UTM or default to 'signup'
    const acquisitionSource = utm_source
      ? String(utm_source).substring(0, 50).replace(/[^a-zA-Z0-9_-]/g, '')
      : 'signup'

    const marketDisplayName = market ? (market.display_name || market.name) : null

    // Insert user — market fields are null when deferred to geo-detection
    const { data: user, error } = await supabase
      .from('fliply_users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        market_id: market?.id ?? null,
        city: marketDisplayName ?? null,
        state: market?.state ?? null,
        include_events: include_events !== false,
        user_status: 'trial',
        acquisition_source: acquisitionSource,
      })
      .select('id, email')
      .single()

    if (error) {
      console.error('Signup DB error:', error)
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
    }

    // Activate market + bump user count (fire-and-forget) — only if market was provided
    if (market) {
      supabase.rpc('increment_market_user_count', { p_market_id: market.id })
        .then(null, () => {
          supabase
            .from('fliply_markets')
            .update({ is_active: true })
            .eq('id', market!.id)
            .then(null, (err: any) => console.error('[SIGNUP] Market update failed:', err))
        })
    }

    // GA4: signup_complete
    trackEvent('signup_complete', {
      signup_source: acquisitionSource,
      market: market?.cl_subdomain || 'pending-geo',
      market_name: marketDisplayName || 'pending-geo',
      state: market?.state || '',
      utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '',
      ...(gclid ? { gclid } : {}),
      ...(fbclid ? { fbclid } : {}),
    }, user.id)

    // Send welcome email — uses the shared drip template (single source of truth)
    // This ensures: unsubscribe link in body, consistent branding, no emojis
    try {
      const subject = WELCOME_SUBJECT
      const html = await getDripEmailHtml('welcome', {
        email,
        city: marketDisplayName || 'your area',
        state: market?.state || '',
        step_order: 0,
        variant: 'a',
      })

      const { id: resendMessageId, error: sendError } = await sendEmail({
        to: email,
        subject,
        html,
        tags: [
          { name: 'sequence', value: 'welcome' },
          { name: 'template', value: 'welcome' },
        ],
      })

      if (!sendError) {
        console.log(`[SIGNUP] Welcome email sent to ${email} (resend: ${resendMessageId})`)

        // Log to email_sends so webhook can track bounces/complaints/opens
        await supabase.from('email_sends').insert({
          user_id: user.id,
          to_email: email.toLowerCase(),
          subject,
          template_key: 'welcome',
          variant: 'a',
          resend_message_id: resendMessageId || null,
          status: 'sent',
        }).then(null, (err: any) =>
          console.error('[SIGNUP] email_sends log failed:', err.message)
        )
      } else {
        console.error(`[SIGNUP] Welcome email send error: ${sendError}`)
      }

      trackEvent('welcome_email_sent', { email_type: 'welcome' }, user.id)

      // Telegram: new signup alert
      sendTelegramAlert([
        `<b>New Signup</b>`,
        `Email: ${email}`,
        `Market: ${marketDisplayName || 'pending geo-detection'}${market ? `, ${market.state}` : ''}`,
        market ? `CL Region: ${market.cl_subdomain}` : 'CL Region: pending',
        `Source: ${acquisitionSource}${utm_medium ? ` / ${utm_medium}` : ''}${utm_campaign ? ` / ${utm_campaign}` : ''}`,
      ].join('\n'))
    } catch (emailErr) {
      console.error('[SIGNUP] Welcome email failed:', emailErr)
    }

    // Create JWT
    const token = await createToken(user.id, user.email)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    })

    response.cookies.set('flip-session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    console.log(`[SIGNUP] New user: ${email} → market: ${marketDisplayName || 'pending geo'}`)

    // Discover sources for this market if it's newly activated (fire-and-forget)
    if (market) {
      discoverSourcesForMarket(market.id)
    }

    // Enroll in welcome-to-convert drip sequence (7 emails over 21 days)
    enrollInWelcomeSequence(user.id).catch(err =>
      console.error('[SIGNUP] Drip enrollment failed:', err.message)
    )

    return response
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Enroll a new user in the welcome-to-convert drip sequence.
 * Randomly assigns A/B variant for subject line testing.
 */
async function enrollInWelcomeSequence(userId: string) {
  const { data: seqs } = await supabase
    .from('drip_sequences')
    .select('id')
    .eq('name', 'welcome-to-convert')
    .eq('is_active', true)
    .limit(1)

  if (!seqs?.length) {
    console.log('[DRIP] No active welcome sequence found — skipping enrollment')
    return
  }

  const variant = Math.random() < 0.5 ? 'a' : 'b'

  // Start at step 1 (not 0) because email/password signup already sends
  // a standalone welcome email. This skips the drip "welcome" step and
  // starts with "first-finds" on Day 1. OAuth signups use current_step: 0
  // in next-auth.ts since they don't get a standalone welcome.
  await supabase.from('sequence_enrollments').upsert({
    user_id: userId,
    sequence_id: seqs[0].id,
    current_step: 1,
    status: 'active',
    variant,
  }, { onConflict: 'user_id,sequence_id' })

  console.log(`[DRIP] User ${userId} enrolled in welcome sequence at step 1 (variant ${variant})`)
}
