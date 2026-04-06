import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'
import { discoverSourcesForMarket } from '../../../lib/discovery/source-discovery'
import { sendEmail } from '../../../lib/email/send'
import { sendTelegramAlert } from '../../../lib/telegram'

// Welcome email — informative with a touch of personality
const WELCOME_SUBJECT = "Welcome to flip-ly — here's how it works"

function getWelcomeEmail(email: string, marketName: string | null) {
  const username = email.split('@')[0]
  const location = marketName || 'your area'

  return `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Welcome — your Thursday deal digest starts this week
  <!-- Padding to prevent email client from pulling body text -->
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>
<div style="background:#ffffff;max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="background:#0a0a0a;padding:24px 32px;">
      <h1 style="color:#22C55E;font-size:22px;margin:0;font-weight:700;">flip-ly.net</h1>
    </div>
    <div style="padding:32px;color:#333;line-height:1.7;">
      <p style="font-size:16px;margin:0 0 20px;">Hey ${username},</p>
      <p style="font-size:15px;margin:0 0 20px;">Welcome to flip-ly. You're signed up for <strong>${location}</strong> — here's what to expect.</p>

      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="font-size:14px;font-weight:600;color:#000;margin:0 0 12px;">What you get:</p>
        <table style="width:100%;font-size:14px;color:#555;">
          <tr><td style="padding:6px 0;">📬</td><td style="padding:6px 8px;">Weekly email digest every <strong style="color:#000;">Thursday at noon</strong></td></tr>
          <tr><td style="padding:6px 0;">📍</td><td style="padding:6px 8px;">Garage sales, estate sales &amp; deals near <strong style="color:#000;">${location}</strong></td></tr>
          <tr><td style="padding:6px 0;">🔍</td><td style="padding:6px 8px;">Search across Craigslist, EstateSales.net &amp; 20+ local sources</td></tr>
          <tr><td style="padding:6px 0;">🆓</td><td style="padding:6px 8px;">Free tier: 10 searches/day, weekly digest, no credit card</td></tr>
        </table>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="font-size:14px;font-weight:600;color:#166534;margin:0 0 8px;">🚀 Want more?</p>
        <p style="font-size:13px;color:#555;margin:0;">Pro ($5/mo) and Power ($19/mo) members get unlimited searches, full AI score breakdowns, and deals before everyone else. Founding prices locked in for life. <a href="https://flip-ly.net/pro" style="color:#16a34a;font-weight:600;">See plans →</a></p>
      </div>

      <p style="font-size:15px;margin:0 0 24px;">Your first digest arrives this Thursday. In the meantime, <a href="https://flip-ly.net" style="color:#22C55E;font-weight:600;">search for deals now</a>.</p>

      <p style="font-size:14px;color:#888;margin:0;">Simple, honest, and built to save you time every week.</p>
    </div>
    <div style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee;">
      <p style="font-size:12px;color:#999;margin:0 0 4px;">flip-ly.net — Garage sale intelligence, delivered weekly.</p>
      <p style="font-size:11px;color:#bbb;margin:0;">
        <a href="https://flip-ly.net" style="color:#999;">Visit</a> · <a href="https://flip-ly.net/why" style="color:#999;">Why this exists</a> · <a href="https://flip-ly.net/privacy" style="color:#999;">Privacy</a>
      </p>
    </div>
  </div>`
}

/* ── ARCHIVED CHAOS TEMPLATES (kept for future A/B testing) ──
 * Original templates: Classic Chaos, FBI Style, Tech Support
 * These can be re-enabled for chaos-mode signups or drip sequences.
 * See git history: commit before this change for full templates.
 */

export async function POST(req: NextRequest) {
  try {
    const { email, password, market_id, include_events, utm_source, utm_medium, utm_campaign, gclid, fbclid } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (!market_id) {
      return NextResponse.json({ error: 'Please select your area' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Validate market exists
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('id, name, display_name, state, cl_subdomain')
      .eq('id', market_id)
      .single()

    if (!market) {
      return NextResponse.json({ error: 'Invalid market selected' }, { status: 400 })
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

    const marketDisplayName = market.display_name || market.name

    // Insert user — store city/state from market for email personalization
    const { data: user, error } = await supabase
      .from('fliply_users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        market_id: market.id,
        city: marketDisplayName,
        state: market.state,
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

    // Activate market + bump user count (fire-and-forget)
    supabase.rpc('increment_market_user_count', { p_market_id: market.id })
      .then(null, () => {
        // Fallback if RPC doesn't exist — just activate the market
        supabase
          .from('fliply_markets')
          .update({ is_active: true })
          .eq('id', market.id)
          .then(null, (err: any) => console.error('[SIGNUP] Market update failed:', err))
      })

    // GA4: signup_complete
    trackEvent('signup_complete', {
      signup_source: acquisitionSource,
      market: market.cl_subdomain,
      market_name: marketDisplayName,
      state: market.state,
      utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '',
      ...(gclid ? { gclid } : {}),
      ...(fbclid ? { fbclid } : {}),
    }, user.id)

    // Send welcome email
    try {
      const subject = WELCOME_SUBJECT
      const html = getWelcomeEmail(email, marketDisplayName)

      await sendEmail({
        to: email,
        subject,
        html,
        tags: [{ name: 'sequence', value: 'welcome' }],
      })
      console.log(`[SIGNUP] Welcome email sent to ${email}`)
      trackEvent('welcome_email_sent', { email_type: 'welcome' }, user.id)

      // Telegram: new signup alert
      sendTelegramAlert([
        `<b>New Signup</b> 🎉`,
        `Email: ${email}`,
        `Market: ${marketDisplayName}, ${market.state}`,
        `CL Region: ${market.cl_subdomain}`,
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

    console.log(`[SIGNUP] New user: ${email} → market: ${marketDisplayName} (${market.cl_subdomain})`)

    // Discover sources for this market if it's newly activated (fire-and-forget)
    discoverSourcesForMarket(market.id)

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
