export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'
import { lookupZip } from '../../../lib/discovery/zip-lookup'

const CENSUS_GEOCODE_URL =
  'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress'

/**
 * Geocode listings that have NULL lat/lng.
 *
 * Strategy (in priority order):
 *   1. If listing has address + city + state → Census address geocode
 *   2. If listing has zip_code → lookupZip (cached table → Census fallback)
 *   3. If listing has city + state → Census city-level geocode
 *
 * GET /api/admin/backfill-geocode?limit=100&market=dallas-tx
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100'), 500)
  const marketSlug = req.nextUrl.searchParams.get('market') || null

  // Fetch listings missing coordinates
  let query = supabase
    .from('fliply_listings')
    .select('id, address, city, state, zip_code')
    .is('latitude', null)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (marketSlug) {
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('id')
      .eq('slug', marketSlug)
      .single()
    if (market) {
      query = query.eq('market_id', market.id)
    }
  }

  const { data: listings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: 'No listings need geocoding', updated: 0 })
  }

  let updated = 0
  let failed = 0
  const methods: Record<string, number> = { address: 0, zip: 0, city: 0 }

  for (const listing of listings) {
    let lat: number | null = null
    let lng: number | null = null
    let method = ''

    // Strategy 1: Full address geocode
    if (!lat && listing.address && listing.city && listing.state) {
      const coords = await geocodeAddress(
        `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code || ''}`
      )
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        method = 'address'
      }
    }

    // Strategy 2: Zip code lookup (uses cached table + Census fallback)
    if (!lat && listing.zip_code) {
      const zipData = await lookupZip(listing.zip_code)
      if (zipData && zipData.latitude && zipData.longitude) {
        lat = zipData.latitude
        lng = zipData.longitude
        method = 'zip'
      }
    }

    // Strategy 3: City + state geocode
    if (!lat && listing.city && listing.state) {
      const coords = await geocodeAddress(`${listing.city}, ${listing.state}`)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        method = 'city'
      }
    }

    if (lat && lng) {
      const { error: updateError } = await supabase
        .from('fliply_listings')
        .update({ latitude: lat, longitude: lng })
        .eq('id', listing.id)

      if (!updateError) {
        updated++
        methods[method]++
      } else {
        failed++
      }
    } else {
      failed++
    }
  }

  return NextResponse.json({
    message: 'Geocode backfill complete',
    total_checked: listings.length,
    updated,
    failed,
    methods,
  })
}

/**
 * Geocode a free-form address string via the Census Bureau API.
 * Free, no API key, ~200ms per request.
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${CENSUS_GEOCODE_URL}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
    const json = await res.json()
    const match = json?.result?.addressMatches?.[0]
    if (match?.coordinates) {
      const lat = parseFloat(match.coordinates.y)
      const lng = parseFloat(match.coordinates.x)
      if (lat && lng) return { lat, lng }
    }
  } catch {
    // Timeout or network error — skip this listing
  }
  return null
}
