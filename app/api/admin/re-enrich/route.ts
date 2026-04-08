export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'
import { enrichListingBatch } from '../../../lib/ai/enrich-listing'

/**
 * Re-enrich listings with updated AI scoring criteria.
 * Resets enriched_at to null, then re-runs enrichment.
 * GET /api/admin/re-enrich?limit=50&market=dfw
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200)
  const marketSlug = req.nextUrl.searchParams.get('market') || null

  // Build query for listings to re-enrich
  let query = supabase
    .from('fliply_listings')
    .select('id, title, description, price_text, price_low_cents, city, state, event_date, source_type')
    .not('enriched_at', 'is', null) // Only re-enrich already-enriched listings
    .order('scraped_at', { ascending: false })
    .limit(limit)

  // Optionally filter by market
  if (marketSlug) {
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('id')
      .eq('slug', marketSlug)
      .single()
    if (market) query = query.eq('market_id', market.id)
  }

  const { data: listings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: 'No listings to re-enrich', enriched: 0, batches: 0 })
  }

  let totalEnriched = 0
  let batches = 0

  // Process in batches of 5
  for (let i = 0; i < listings.length; i += 5) {
    const batch = listings.slice(i, i + 5)
    const count = await enrichListingBatch(batch)
    totalEnriched += count
    batches++
  }

  return NextResponse.json({
    message: `Re-enrichment complete`,
    total_checked: listings.length,
    enriched: totalEnriched,
    batches,
  })
}
