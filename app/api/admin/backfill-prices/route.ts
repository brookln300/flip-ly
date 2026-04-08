export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'
import { extractPrice } from '../../../lib/scrapers/parse-utils'

/**
 * Backfill prices from title text for listings with NULL price_low_cents.
 * GET /api/admin/backfill-prices?limit=500
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '500')

  // Fetch listings with no price data
  const { data: listings, error } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_text')
    .is('price_low_cents', null)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: 'No listings need price backfill', updated: 0 })
  }

  let updated = 0
  let skipped = 0

  for (const listing of listings) {
    // Try title first, then description
    const textToSearch = `${listing.title || ''} ${listing.description || ''}`
    const price = extractPrice(textToSearch)

    if (price.price_low_cents !== null) {
      const { error: updateError } = await supabase
        .from('fliply_listings')
        .update({
          price_low_cents: price.price_low_cents,
          price_high_cents: price.price_high_cents,
          price_text: price.price_text,
        })
        .eq('id', listing.id)

      if (!updateError) updated++
    } else {
      skipped++
    }
  }

  return NextResponse.json({
    message: `Backfill complete`,
    total_checked: listings.length,
    updated,
    skipped,
    still_null: skipped,
  })
}
