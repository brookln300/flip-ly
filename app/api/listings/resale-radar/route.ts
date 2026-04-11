export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getResaleRadar, setResaleRadar, isRedisHealthy } from '../../../lib/redis'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { isPremiumUser } from '../../../lib/user-tier'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user info
  const { data: user } = await supabase
    .from('fliply_users')
    .select('market_id, is_premium, subscription_tier')
    .eq('id', session.userId)
    .single()

  if (!user?.market_id) {
    return NextResponse.json({ listings: [], message: 'No market set' })
  }

  const isPro = isPremiumUser(user)
  const limit = isPro ? 20 : 3 // Free users get a taste

  // Try Redis cache first
  const redisUp = await isRedisHealthy()
  if (redisUp) {
    const cached = await getResaleRadar(user.market_id)
    if (cached) {
      const limited = cached.slice(0, limit)
      // Strip source_url for free users
      const results = isPro
        ? limited
        : limited.map(({ source_url, ...rest }: any) => rest)

      return NextResponse.json({
        listings: results,
        total: cached.length,
        gated: !isPro && cached.length > limit,
        gatedCount: !isPro ? cached.length - limit : 0,
        source: 'redis',
      })
    }
  }

  // Cache miss — query Supabase
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: listings } = await supabase
    .from('fliply_listings')
    .select('id, title, price_text, price_low_cents, deal_score, deal_score_reason, ai_tags, ai_description, source_url, event_date, scraped_at')
    .eq('market_id', user.market_id)
    .eq('resale_flag', true)
    .not('enriched_at', 'is', null)
    .or(`event_date.is.null,event_date.gte.${today}`)
    .gte('scraped_at', sevenDaysAgo.toISOString())
    .order('deal_score', { ascending: false })
    .limit(20)

  const results = listings || []

  // Cache in Redis
  if (redisUp && results.length > 0) {
    setResaleRadar(user.market_id, results).catch(() => {})
  }

  const limited = results.slice(0, limit)
  const output = isPro
    ? limited
    : limited.map(({ source_url, ...rest }: any) => rest)

  return NextResponse.json({
    listings: output,
    total: results.length,
    gated: !isPro && results.length > limit,
    gatedCount: !isPro ? results.length - limit : 0,
    source: 'supabase',
  })
}
