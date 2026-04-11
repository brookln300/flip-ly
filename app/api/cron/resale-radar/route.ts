export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { setResaleRadar, isRedisHealthy } from '../../../lib/redis'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redisUp = await isRedisHealthy()
  if (!redisUp) {
    return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })
  }

  // Get markets that have active users
  const { data: activeMarkets } = await supabase
    .from('fliply_users')
    .select('market_id')
    .not('market_id', 'is', null)

  if (!activeMarkets) {
    return NextResponse.json({ message: 'No active markets' })
  }

  // Deduplicate market IDs
  const marketIds = Array.from(new Set(activeMarkets.map(u => u.market_id).filter(Boolean)))

  let marketsUpdated = 0
  let totalListings = 0

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  for (const marketId of marketIds) {
    const { data: listings } = await supabase
      .from('fliply_listings')
      .select('id, title, price_text, price_low_cents, deal_score, deal_score_reason, ai_tags, ai_description, source_url, event_date, scraped_at')
      .eq('market_id', marketId)
      .eq('resale_flag', true)
      .not('enriched_at', 'is', null)
      .or(`event_date.is.null,event_date.gte.${today}`)
      .gte('scraped_at', sevenDaysAgo.toISOString())
      .order('deal_score', { ascending: false })
      .limit(20)

    if (listings && listings.length > 0) {
      await setResaleRadar(marketId, listings)
      marketsUpdated++
      totalListings += listings.length
    }
  }

  console.log(`[ResaleRadar] Cached ${totalListings} listings across ${marketsUpdated} markets`)
  return NextResponse.json({
    marketsUpdated,
    totalListings,
  })
}
