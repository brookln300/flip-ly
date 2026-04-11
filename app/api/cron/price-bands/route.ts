export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { setPriceBand, isRedisHealthy } from '../../../lib/redis'

// Compute percentile from sorted array
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export async function GET(req: NextRequest) {
  // Auth: require CRON_SECRET for automated + manual triggers
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redisUp = await isRedisHealthy()
  if (!redisUp) {
    return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })
  }

  // Pre-filter: only process markets that actually have enriched, priced listings
  // This avoids 400+ empty Supabase round-trips (413 total markets, ~20 have price data)
  const thirtyDaysAgoFilter = new Date()
  thirtyDaysAgoFilter.setDate(thirtyDaysAgoFilter.getDate() - 30)

  const { data: listingsWithMarket } = await supabase
    .from('fliply_listings')
    .select('market_id')
    .not('enriched_at', 'is', null)
    .not('price_low_cents', 'is', null)
    .gt('price_low_cents', 0)
    .gte('scraped_at', thirtyDaysAgoFilter.toISOString())
    .limit(2000)

  if (!listingsWithMarket || listingsWithMarket.length === 0) {
    return NextResponse.json({ message: 'No markets with priced listings found', bandsComputed: 0, marketsProcessed: 0 })
  }

  // Deduplicate to get unique market IDs
  const seenIds = new Set<string>()
  const markets: { id: string }[] = []
  for (const l of listingsWithMarket) {
    if (l.market_id && !seenIds.has(l.market_id)) {
      seenIds.add(l.market_id)
      markets.push({ id: l.market_id })
    }
  }

  console.log(`[PriceBands] Processing ${markets.length} markets with priced data (out of 413 total)`)

  let bandsComputed = 0
  let marketsProcessed = 0

  for (const market of markets) {
    // Get all enriched listings with prices in this market from last 30 days
    const { data: listings } = await supabase
      .from('fliply_listings')
      .select('price_low_cents, ai_tags')
      .eq('market_id', market.id)
      .not('enriched_at', 'is', null)
      .not('price_low_cents', 'is', null)
      .gt('price_low_cents', 0)
      .gte('scraped_at', thirtyDaysAgoFilter.toISOString())
      .limit(2000)

    if (!listings || listings.length === 0) continue

    // Build price arrays per tag
    const tagPrices: Record<string, number[]> = {}
    for (const listing of listings) {
      const tags: string[] = listing.ai_tags || []
      const price = listing.price_low_cents as number
      for (const tag of tags) {
        if (!tagPrices[tag]) tagPrices[tag] = []
        tagPrices[tag].push(price)
      }
    }

    // Compute bands for tags with enough data (10+ listings)
    for (const [tag, prices] of Object.entries(tagPrices)) {
      if (prices.length < 10) continue

      const sorted = prices.sort((a, b) => a - b)
      await setPriceBand(market.id, tag, {
        tag,
        count: sorted.length,
        p25: percentile(sorted, 25),
        median: percentile(sorted, 50),
        p75: percentile(sorted, 75),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        updatedAt: new Date().toISOString(),
      })
      bandsComputed++
    }
    marketsProcessed++
  }

  console.log(`[PriceBands] Computed ${bandsComputed} bands across ${marketsProcessed} markets`)
  return NextResponse.json({
    bandsComputed,
    marketsProcessed,
  })
}
