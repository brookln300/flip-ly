import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { getSession } from '../../lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, category } = body

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return NextResponse.json({ error: 'Feedback too short (min 5 chars)' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Feedback too long (max 2000 chars)' }, { status: 400 })
  }

  const validCategories = ['bug', 'feature', 'ux', 'general']
  const cat = validCategories.includes(category) ? category : 'general'

  // Try to get session — feedback works for both logged-in and anonymous
  const session = await getSession()
  let userId: string | null = null
  let email: string | null = null
  let userTier = 'anonymous'
  let market: string | null = null

  if (session) {
    const { data: user } = await supabase
      .from('fliply_users')
      .select('id, email, is_premium, market_id')
      .eq('id', session.userId)
      .single()

    if (user) {
      userId = user.id
      email = user.email
      userTier = user.is_premium ? 'pro' : 'free'

      if (user.market_id) {
        const { data: m } = await supabase
          .from('fliply_markets')
          .select('display_name')
          .eq('id', user.market_id)
          .single()
        market = m?.display_name || null
      }
    }
  }

  const { error } = await supabase
    .from('fliply_feedback')
    .insert({
      user_id: userId,
      email,
      category: cat,
      message: message.trim(),
      user_tier: userTier,
      market,
    })

  if (error) {
    console.error('[FEEDBACK] Insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
