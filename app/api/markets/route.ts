/**
 * GET /api/markets — Public endpoint for market dropdown data.
 * Returns only markets that have active listings. No auth required.
 * Used by: signup form, search filter, anonymous landing page.
 *
 * Response shape:
 * { markets: { [state: string]: { id, slug, name, listing_count }[] } }
 *
 * Cached for 1h via Cache-Control — listing counts change with scrapes.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  // Only return markets that actually have recent listings (scraped within 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: marketsWithListings, error: countErr } = await supabase
    .rpc('get_active_markets', { since_date: sevenDaysAgo })

  // Fallback: if RPC doesn't exist yet, use active markets
  let markets: any[] = []

  if (countErr || !marketsWithListings) {
    console.warn('[MARKETS] RPC fallback — using is_active filter:', countErr?.message)
    const { data, error } = await supabase
      .from('fliply_markets')
      .select('id, slug, name, display_name, state')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      console.error('[MARKETS] Query error:', error.message)
      return NextResponse.json({ error: 'Failed to load markets' }, { status: 500 })
    }
    markets = data || []
  } else {
    markets = marketsWithListings
  }

  // Group by state for dropdown UI: State → [markets]
  const grouped: Record<string, { id: string; slug: string; name: string; listing_count?: number }[]> = {}

  for (const m of markets) {
    const state = m.state
    if (!grouped[state]) grouped[state] = []
    grouped[state].push({
      id: m.id,
      slug: m.slug,
      name: m.display_name || m.name,
      listing_count: m.listing_count || undefined,
    })
  }

  const res = NextResponse.json({ markets: grouped })
  // Cache for 1h — listing counts change with each scrape cycle
  res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')
  return res
}
