export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAllPriceBands, isRedisHealthy } from '../../../lib/redis'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { isPremiumUser } from '../../../lib/user-tier'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redisUp = await isRedisHealthy()
  if (!redisUp) {
    return NextResponse.json({ bands: {}, source: 'unavailable' })
  }

  // Get user's market and tier info
  const { data: user } = await supabase
    .from('fliply_users')
    .select('market_id, is_premium, subscription_tier')
    .eq('id', session.userId)
    .single()

  if (!isPremiumUser(user)) {
    return NextResponse.json({
      bands: {},
      message: 'Price intelligence is a Pro feature',
      upgrade: true
    })
  }

  if (!user?.market_id) {
    return NextResponse.json({ bands: {}, message: 'No market set' })
  }

  const bands = await getAllPriceBands(user.market_id)

  return NextResponse.json({
    bands,
    marketId: user.market_id,
    source: 'redis',
  })
}
