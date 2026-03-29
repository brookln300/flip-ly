import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Find user
    const { data: user, error } = await supabase
      .from('fliply_users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Reject users without a proper bcrypt hash (contest captures, OAuth-only)
    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // GA4: login_complete
    trackEvent('login_complete', { auth_provider: 'email' }, user.id)

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

    return response
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
