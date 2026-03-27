export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const zip = searchParams.get('zip') || ''
  const city = searchParams.get('city') || ''
  const hot = searchParams.get('hot') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let dbQuery = supabase
    .from('fliply_listings')
    .select('*', { count: 'exact' })
    .order('scraped_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filters
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,ai_description.ilike.%${query}%`)
  }
  if (zip) {
    dbQuery = dbQuery.eq('zip_code', zip)
  }
  if (city) {
    dbQuery = dbQuery.ilike('city', `%${city}%`)
  }
  if (hot) {
    dbQuery = dbQuery.eq('is_hot', true)
  }

  const { data: listings, count, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format for the frontend
  const results = (listings || []).map(l => ({
    id: l.id,
    title: l.title,
    description: l.ai_description || l.description || null,
    price: l.price_text || 'Not listed',
    city: [l.city, l.state].filter(Boolean).join(', ') || null,
    zip_code: l.zip_code,
    date: l.event_date || null,
    time: l.event_time_text || null,
    hot: l.is_hot || false,
    deal_score: l.deal_score || null,
    deal_reason: l.deal_score_reason || null,
    tags: l.ai_tags || l.tags || [],
    source: l.source_type === 'craigslist_rss' ? 'craigslist' : l.source_type === 'eventbrite_api' ? 'eventbrite' : l.source_type,
    source_url: l.source_url,
    image_url: l.image_url,
    address: l.address,
    lat: l.latitude,
    lng: l.longitude,
    posted_at: l.scraped_at,
    enriched: !!l.enriched_at,
  }))

  // GA4: listing_search
  trackEvent('listing_search', {
    query: query || 'browse',
    result_count: results.length,
    total_available: count || 0,
    filter_zip: zip || 'none',
    filter_city: city || 'none',
    filter_hot: hot,
  })

  return NextResponse.json({
    results,
    total: count || 0,
    query: query || null,
    offset,
    limit,
    _meta: {
      real_data: true,
      scraped_sources: ['craigslist', 'eventbrite'],
    },
  })
}
