import { supabase } from './supabase'

/**
 * Resolve the nearest fliply_market from Vercel geo headers.
 *
 * Vercel injects these headers on EVERY request (free, no API key):
 * - x-vercel-ip-city: "Dallas"
 * - x-vercel-ip-country-region: "TX"
 * - x-vercel-ip-latitude: "32.7767"
 * - x-vercel-ip-longitude: "-96.7970"
 *
 * Strategy:
 * 1. If lat/lng available → find nearest market by Haversine distance
 * 2. If only state available → pick first active market in that state
 * 3. Fallback → DFW (cl_subdomain = 'dallas')
 */
export async function resolveMarketFromHeaders(headers: Headers): Promise<{
  market_id: string
  display_name: string
  state: string
  cl_subdomain: string
  method: 'geo' | 'state' | 'fallback'
} | null> {
  const lat = parseFloat(headers.get('x-vercel-ip-latitude') || '')
  const lng = parseFloat(headers.get('x-vercel-ip-longitude') || '')
  const region = headers.get('x-vercel-ip-country-region') // State code: "TX", "FL", etc.

  // Strategy 1: Lat/lng distance match (most accurate)
  if (!isNaN(lat) && !isNaN(lng)) {
    // Fetch all markets with coordinates — lightweight query (id, lat, lng, name, state)
    const { data: markets } = await supabase
      .from('fliply_markets')
      .select('id, display_name, name, state, cl_subdomain, center_lat, center_lng')
      .not('center_lat', 'is', null)
      .not('center_lng', 'is', null)

    if (markets?.length) {
      let closest = markets[0]
      let minDist = Infinity

      for (const m of markets) {
        const dist = haversine(lat, lng, m.center_lat, m.center_lng)
        if (dist < minDist) {
          minDist = dist
          closest = m
        }
      }

      return {
        market_id: closest.id,
        display_name: closest.display_name || closest.name,
        state: closest.state,
        cl_subdomain: closest.cl_subdomain,
        method: 'geo',
      }
    }
  }

  // Strategy 2: State code match
  if (region) {
    const { data: stateMarkets } = await supabase
      .from('fliply_markets')
      .select('id, display_name, name, state, cl_subdomain')
      .eq('state', region.toUpperCase())
      .order('user_count', { ascending: false, nullsFirst: false })
      .limit(1)

    if (stateMarkets?.length) {
      const m = stateMarkets[0]
      return {
        market_id: m.id,
        display_name: m.display_name || m.name,
        state: m.state,
        cl_subdomain: m.cl_subdomain,
        method: 'state',
      }
    }
  }

  // Strategy 3: Fallback to DFW
  const { data: fallback } = await supabase
    .from('fliply_markets')
    .select('id, display_name, name, state, cl_subdomain')
    .eq('cl_subdomain', 'dallas')
    .limit(1)

  if (fallback?.length) {
    const m = fallback[0]
    return {
      market_id: m.id,
      display_name: m.display_name || m.name,
      state: m.state,
      cl_subdomain: m.cl_subdomain,
      method: 'fallback',
    }
  }

  return null
}

/**
 * Haversine distance in miles between two lat/lng points.
 * Good enough for "nearest city" — no need for Vincenty precision.
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
