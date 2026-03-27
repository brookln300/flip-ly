import { supabase } from '../supabase'

export interface ZipData {
  zip_code: string
  city: string
  state: string
  county: string
  latitude: number
  longitude: number
  craigslist_region: string | null
}

/**
 * Look up geographic data for a US zip code.
 * First checks fliply_zip_data table, then falls back to Census geocoding API.
 */
export async function lookupZip(zipCode: string): Promise<ZipData | null> {
  // Try local database first
  const { data } = await supabase
    .from('fliply_zip_data')
    .select('*')
    .eq('zip_code', zipCode)
    .single()

  if (data) return data as ZipData

  // Fallback: Census geocoding API (free, no key needed)
  try {
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${zipCode}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
    )
    const json = await res.json()
    const match = json?.result?.addressMatches?.[0]

    if (match) {
      const zipData: ZipData = {
        zip_code: zipCode,
        city: match.addressComponents?.city || 'Unknown',
        state: match.addressComponents?.state || 'Unknown',
        county: match.geographies?.Counties?.[0]?.BASENAME || 'Unknown',
        latitude: parseFloat(match.coordinates?.y || '0'),
        longitude: parseFloat(match.coordinates?.x || '0'),
        craigslist_region: null,
      }

      // Cache it for future lookups
      await supabase.from('fliply_zip_data').upsert(zipData, { onConflict: 'zip_code' })

      return zipData
    }
  } catch (err) {
    console.error('[ZIP] Census API failed:', err)
  }

  return null
}

/**
 * Find the market for a given city/state, or return null if none exists.
 */
export async function findMarket(city: string, state: string) {
  const slug = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`

  const { data } = await supabase
    .from('fliply_markets')
    .select('*')
    .eq('slug', slug)
    .single()

  return data
}

/**
 * Create a new market for a city.
 */
export async function createMarket(city: string, state: string, lat: number, lng: number) {
  const slug = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`

  const { data, error } = await supabase
    .from('fliply_markets')
    .insert({
      slug,
      name: `${city}, ${state}`,
      state,
      center_lat: lat,
      center_lng: lng,
      radius_miles: 30,
    })
    .select('*')
    .single()

  if (error) {
    // May already exist (race condition) — try to fetch it
    const { data: existing } = await supabase
      .from('fliply_markets')
      .select('*')
      .eq('slug', slug)
      .single()
    return existing
  }

  return data
}
