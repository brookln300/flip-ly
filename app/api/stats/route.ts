import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [listingsRes, sourcesRes, marketsRes, scoredThisWeekRes, usersRes] = await Promise.all([
      supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
      supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fliply_markets').select('id', { count: 'exact', head: true }),
      supabase.from('fliply_listings').select('id', { count: 'exact', head: true })
        .not('deal_score', 'is', null)
        .gte('scraped_at', sevenDaysAgo),
      supabase.from('fliply_users').select('id', { count: 'exact', head: true }),
    ])

    // For markets with recent listings, fetch distinct market_ids
    const { data: activeMarketRows } = await supabase
      .from('fliply_listings')
      .select('market_id')
      .gte('scraped_at', sevenDaysAgo)
      .not('market_id', 'is', null)
      .limit(500)

    const distinctMarkets = activeMarketRows
      ? new Set(activeMarketRows.map((r: { market_id: string }) => r.market_id)).size
      : 0

    return NextResponse.json({
      total_listings: listingsRes.count || 0,
      total_sources: sourcesRes.count || 0,
      total_markets: marketsRes.count || 413,
      deals_scored_this_week: scoredThisWeekRes.count || 0,
      total_users: usersRes.count || 0,
      markets_with_listings: distinctMarkets || marketsRes.count || 0,
    })
  } catch {
    return NextResponse.json({
      total_listings: 0,
      total_sources: 20,
      total_markets: 413,
      deals_scored_this_week: 0,
      total_users: 0,
      markets_with_listings: 0,
    })
  }
}
