import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'
import { createToken } from '../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, city, state, zip_code } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
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
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
      })
      .select('id, email')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
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

    return response
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
