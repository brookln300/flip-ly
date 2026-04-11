import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'
import { sendTelegramAlert } from '../../../lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_name, email, password, level_cleared } = body

    // Validate inputs
    if (!agent_name || typeof agent_name !== 'string' || agent_name.trim().length === 0) {
      return NextResponse.json({ error: 'agent_name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!level_cleared || typeof level_cleared !== 'number' || level_cleared < 1 || level_cleared > 7) {
      return NextResponse.json({ error: 'level_cleared must be between 1 and 7' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const sanitizedAgentName = agent_name.trim().substring(0, 50)

    // Check if email already exists
    const { data: existing } = await supabase
      .from('fliply_users')
      .select('id, contest_highest_tier')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      // Update contest fields if new level is higher
      const currentTier = existing.contest_highest_tier ?? 0
      if (level_cleared > currentTier) {
        await supabase
          .from('fliply_users')
          .update({
            contest_agent_name: sanitizedAgentName,
            contest_highest_tier: level_cleared,
          })
          .eq('id', existing.id)
      }

      // Create token for existing user
      const token = await createToken(existing.id, normalizedEmail)
      const response = NextResponse.json({
        success: true,
        message: `Welcome back, agent. Your record has been updated to Level ${Math.max(level_cleared, currentTier)}.`,
        is_new: false,
      })

      response.cookies.set('flip-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })

      return response
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from('fliply_users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        user_status: 'trial',
        acquisition_source: 'shell_protocol',
        contest_agent_name: sanitizedAgentName,
        contest_highest_tier: level_cleared,
        auth_provider: 'email',
      })
      .select('id, email')
      .single()

    if (error) {
      console.error('[SHELL] Register DB error:', error)
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    // Create JWT token
    const token = await createToken(user.id, user.email)

    const response = NextResponse.json({
      success: true,
      message: `Account created. Welcome to flip-ly, Agent ${sanitizedAgentName}. Your Level ${level_cleared} clearance has been recorded.`,
      is_new: true,
    })

    response.cookies.set('flip-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    // Telegram alert for new shell signups (fire-and-forget)
    sendTelegramAlert(
      [
        '<b>Shell Protocol Signup</b>',
        `Agent: ${sanitizedAgentName}`,
        `Email: ${normalizedEmail}`,
        `Level cleared: ${level_cleared}`,
      ].join('\n')
    ).catch(() => {})

    console.log(`[SHELL] New signup: ${normalizedEmail} as ${sanitizedAgentName} (Level ${level_cleared})`)

    return response
  } catch (err) {
    console.error('[SHELL] Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
