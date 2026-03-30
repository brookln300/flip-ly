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

  return NextResponse.json({ user })
}
