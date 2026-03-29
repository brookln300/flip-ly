import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'
import { discoverSourcesForZip } from '../../../lib/discovery/source-discovery'
import { sendEmail } from '../../../lib/email/send'
import { sendTelegramAlert } from '../../../lib/telegram'

// Random chaotic welcome subjects
const SUBJECTS = [
  "🦞 Welcome to the chaos — you're one of us now",
  "⚠️ flip-ly.net has infected your inbox (you asked for this)",
  "💾 Your garage sale subscription has been activated at 56k",
  "🎉 Congrats! You signed up for a website with Comic Sans",
  "📡 Connected at 56,000 bps — deals incoming",
  "🔥 HOT GARAGE SALES IN YOUR AREA (for real this time)",
]

// Random chaotic welcome email bodies
function getWelcomeEmail(email: string, city: string | null) {
  const username = email.split('@')[0]
  const location = city || 'somewhere in the universe'

  const TEMPLATES = [
    // Template 1: Classic chaos
    `<div style="background:#0D0D0D;color:#fff;padding:32px;font-family:'Courier New',monospace;max-width:500px;margin:0 auto;">
      <div style="border:3px dashed #0FFF50;padding:24px;margin-bottom:20px;">
        <h1 style="font-family:'Comic Sans MS',cursive;color:#0FFF50;font-size:28px;margin:0 0 16px;">🦞 Welcome to flip-ly.net</h1>
        <p style="color:#ccc;font-size:14px;line-height:1.8;">Hey ${username},</p>
        <p style="color:#ccc;font-size:14px;line-height:1.8;">You actually signed up. For a website that uses Comic Sans. On purpose. We respect that energy.</p>
        <p style="color:#FFB81C;font-size:14px;line-height:1.8;">Here's what happens next:</p>
        <ul style="color:#ccc;font-size:13px;line-height:2;">
          <li>Every Monday at 8 AM CDT, you get a weekly email</li>
          <li>It'll have garage sales near <strong style="color:#0FFF50">${location}</strong></li>
          <li>The deals are real. The website design is not.</li>
          <li>Unsubscribe anytime. We won't cry. (We will.)</li>
        </ul>
      </div>
      <div style="border:3px dashed #FF10F0;padding:16px;text-align:center;">
        <p style="font-family:'Comic Sans MS',cursive;color:#FF10F0;font-size:16px;margin:0 0 8px;">YOUR CHAOS LEVEL</p>
        <p style="font-family:'Comic Sans MS',cursive;color:#FFB81C;font-size:32px;margin:0;">MAXIMUM 🔥</p>
      </div>
      <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
        flip-ly.net — We scrape nothing. We make everything up. You're welcome.<br/>
        <a href="https://flip-ly.net" style="color:#9D4EDD;">Visit the chaos</a>
      </p>
    </div>`,

    // Template 2: FBI style
    `<div style="background:#0D0D0D;color:#fff;padding:32px;font-family:'Courier New',monospace;max-width:500px;margin:0 auto;">
      <div style="background:#000080;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">🚔 OFFICIAL NOTIFICATION 🚔</p>
      </div>
      <div style="padding:20px;">
        <p style="color:#ccc;font-size:14px;line-height:1.8;">Dear ${username},</p>
        <p style="color:#ccc;font-size:14px;line-height:1.8;">This email confirms that you have been <strong style="color:#0FFF50">officially registered</strong> as a flip-ly.net chaos agent in the <strong style="color:#FFB81C">${location}</strong> district.</p>
        <p style="color:#ccc;font-size:14px;line-height:1.8;">Your weekly briefing of questionable garage sale intelligence will arrive every Monday at 0800 hours CDT.</p>
        <p style="color:#FF10F0;font-size:14px;line-height:1.8;">This message will self-destruct in... actually it won't. Gmail keeps everything forever.</p>
        <div style="border-top:2px solid #333;margin-top:20px;padding-top:16px;">
          <p style="color:#888;font-size:11px;">Agent ID: #${Math.floor(Math.random() * 90000 + 10000)}</p>
          <p style="color:#888;font-size:11px;">Clearance Level: COMIC SANS</p>
          <p style="color:#888;font-size:11px;">Status: ACTIVE (and slightly confused)</p>
        </div>
      </div>
      <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
        <a href="https://flip-ly.net" style="color:#9D4EDD;">Return to HQ</a> |
        <a href="https://flip-ly.net/why" style="color:#9D4EDD;">Why does this exist?</a>
      </p>
    </div>`,

    // Template 3: Tech support
    `<div style="background:#0D0D0D;color:#fff;padding:32px;font-family:'Courier New',monospace;max-width:500px;margin:0 auto;">
      <div style="background:#C0C0C0;color:#000;padding:4px 8px;font-family:Tahoma,sans-serif;font-size:12px;margin-bottom:2px;">
        <strong>flip-ly.net — Confirmation Receipt</strong>
      </div>
      <div style="background:#FFFFF0;color:#000;padding:20px;font-family:Tahoma,sans-serif;font-size:13px;border:2px inset #999;">
        <p style="margin:0 0 12px;"><strong>⚠️ ATTENTION: ${username}</strong></p>
        <p style="margin:0 0 12px;line-height:1.7;">Your account has been successfully created on flip-ly.net. Our technicians have verified your modem connection at 56,000 bps.</p>
        <p style="margin:0 0 12px;line-height:1.7;"><strong>Location registered:</strong> ${location}</p>
        <p style="margin:0 0 12px;line-height:1.7;"><strong>Weekly digest:</strong> Monday 8:00 AM CDT</p>
        <p style="margin:0 0 12px;line-height:1.7;"><strong>Chaos level:</strong> Unlimited</p>
        <hr style="border:1px solid #ddd;margin:16px 0;" />
        <p style="margin:0 0 8px;color:#666;font-size:11px;">If you did not create this account, someone else is now receiving garage sale deals in your area. Lucky them.</p>
        <p style="margin:0;color:#666;font-size:11px;">Do not reply to this email. Our inbox is also made of Comic Sans.</p>
      </div>
      <p style="color:#555;font-size:11px;text-align:center;margin-top:16px;font-family:Tahoma,sans-serif;">
        © 1997-2026 flip-ly.net | <a href="https://flip-ly.net" style="color:#9D4EDD;">The chaos awaits</a>
      </p>
    </div>`,
  ]

  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, city, state, zip_code, include_events } = await req.json()

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

    // Insert user
    const { data: user, error } = await supabase
      .from('fliply_users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        include_events: include_events !== false, // default true
        user_status: 'trial',
      })
      .select('id, email')
      .single()

    if (error) {
      console.error('Signup DB error:', error)
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
    }

    // GA4: signup_complete
    trackEvent('signup_complete', {
      signup_source: 'email',
      city: city || 'unknown',
      zip_code: zip_code || 'unknown',
    }, user.id)

    // Send chaotic welcome email via centralized sender
    try {
      const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
      const html = getWelcomeEmail(email, city)

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
        `Location: ${city || '?'}, ${state || '?'} ${zip_code || ''}`,
      ].join('\n'))
    } catch (emailErr) {
      console.error('[SIGNUP] Welcome email failed:', emailErr)
    }

    // Create JWT
    const token = await createToken(user.id, user.email)

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    })

    response.cookies.set('flip-session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log(`[SIGNUP] New user: ${email} from ${city || 'unknown'} (${zip_code || 'no zip'})`)

    // Auto-discover sources for this user's area (fire-and-forget)
    if (zip_code) {
      discoverSourcesForZip(zip_code, include_events !== false)
    }

    // Enroll in welcome drip sequence (fire-and-forget)
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
  // Find the active welcome sequence
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

  await supabase.from('sequence_enrollments').upsert({
    user_id: userId,
    sequence_id: seqs[0].id,
    current_step: 0,
    status: 'active',
    variant,
  }, { onConflict: 'user_id,sequence_id' })

  console.log(`[DRIP] User ${userId} enrolled in welcome sequence (variant ${variant})`)
}
