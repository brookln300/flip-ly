export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('fliply_users')
    .select('id, email, city, state, market_id, is_premium, created_at')
    .eq('id', session.userId)
    .single()

  // Resolve market slug for API calls
  let market_slug: string | null = null
  if (user?.market_id) {
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('slug')
      .eq('id', user.market_id)
      .single()
    if (market) market_slug = market.slug
  }

  return NextResponse.json({ user: user ? { ...user, market_slug } : null })
}
