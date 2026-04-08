/**
 * Batch geocode zip codes for listings missing lat/lng.
 * Reads from Supabase, calls Census API, writes back.
 *
 * Usage: node scripts/backfill-geocode.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env from .env.local
const envFile = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const CENSUS_GEO_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

async function geocodeViaCensus(address) {
  try {
    const res = await fetch(
      `${CENSUS_GEO_URL}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    const json = await res.json()
    const match = json?.result?.addressMatches?.[0]
    if (match?.coordinates) {
      return {
        lat: parseFloat(match.coordinates.y),
        lng: parseFloat(match.coordinates.x),
        city: match.addressComponents?.city || null,
        state: match.addressComponents?.state || null,
      }
    }
  } catch (e) {
    // silent
  }
  return null
}

async function geocodeViaNominatim(query) {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&countrycodes=us&format=json&limit=1`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'flip-ly-geocoder/1.0' },
      }
    )
    const json = await res.json()
    if (json?.[0]?.lat && json?.[0]?.lon) {
      return {
        lat: parseFloat(json[0].lat),
        lng: parseFloat(json[0].lon),
        city: null,
        state: null,
      }
    }
  } catch (e) {
    // silent
  }
  return null
}

async function geocodeZipNominatim(zip) {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?postalcode=${zip}&country=US&format=json&limit=1`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'flip-ly-geocoder/1.0' },
      }
    )
    const json = await res.json()
    if (json?.[0]?.lat && json?.[0]?.lon) {
      // Extract city from display_name: "75261, Grapevine, Tarrant County, Texas, United States"
      const parts = json[0].display_name?.split(', ') || []
      return {
        lat: parseFloat(json[0].lat),
        lng: parseFloat(json[0].lon),
        city: parts[1] || null,
        state: parts.length >= 4 ? parts[parts.length - 2] : null,
      }
    }
  } catch (e) {
    // silent
  }
  return null
}

async function geocodeZip(zip) {
  // Try Census with full zip format
  let result = await geocodeViaCensus(zip + ', USA')
  if (result) return result

  // Fallback: Nominatim postalcode search — 1 req/sec limit
  result = await geocodeZipNominatim(zip)
  return result
}

async function main() {
  // Get distinct zip codes needing geocoding
  const { data: zips, error } = await supabase
    .from('fliply_listings')
    .select('zip_code')
    .is('latitude', null)
    .not('zip_code', 'is', null)

  if (error) { console.error(error); process.exit(1) }

  const uniqueZips = [...new Set(zips.map(r => r.zip_code))].sort()
  console.log(`Found ${uniqueZips.length} unique zip codes to geocode`)

  let cached = 0, geocoded = 0, failed = 0

  for (const zip of uniqueZips) {
    // Check cache first
    const { data: existing } = await supabase
      .from('fliply_zip_data')
      .select('latitude, longitude')
      .eq('zip_code', zip)
      .single()

    if (existing?.latitude) {
      cached++
      continue
    }

    // Call Census API
    const result = await geocodeZip(zip)
    if (result && result.lat && result.lng) {
      // Cache in zip_data
      await supabase.from('fliply_zip_data').upsert({
        zip_code: zip,
        city: result.city || 'Unknown',
        state: result.state || 'Unknown',
        county: 'Unknown',
        latitude: result.lat,
        longitude: result.lng,
        craigslist_region: null,
      }, { onConflict: 'zip_code' })

      geocoded++
      process.stdout.write(`  [OK] ${zip} → ${result.lat}, ${result.lng} (${result.city}, ${result.state})\n`)
    } else {
      failed++
      process.stdout.write(`  [MISS] ${zip}\n`)
    }

    // Rate limit: Nominatim requires max 1 req/sec
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\nPhase 1 done: ${cached} cached, ${geocoded} geocoded, ${failed} failed`)

  // Phase 2: Update listings from zip_data cache
  const { data: fixable } = await supabase.rpc('backfill_listing_coords_from_zip')
    .select('*')
    .single()

  // If RPC doesn't exist, do it manually
  const { data: listings } = await supabase
    .from('fliply_listings')
    .select('id, zip_code')
    .is('latitude', null)
    .not('zip_code', 'is', null)
    .limit(1000)

  let updated = 0
  for (const listing of (listings || [])) {
    const { data: zd } = await supabase
      .from('fliply_zip_data')
      .select('latitude, longitude')
      .eq('zip_code', listing.zip_code)
      .single()

    if (zd?.latitude && zd?.longitude) {
      const { error: ue } = await supabase
        .from('fliply_listings')
        .update({ latitude: zd.latitude, longitude: zd.longitude })
        .eq('id', listing.id)
      if (!ue) updated++
    }
  }

  console.log(`Phase 2: Updated ${updated} listings with coordinates`)

  // Phase 3: For listings with no zip but city+state, geocode city
  const { data: noZip } = await supabase
    .from('fliply_listings')
    .select('id, city, state')
    .is('latitude', null)
    .is('zip_code', null)
    .not('city', 'is', null)
    .not('state', 'is', null)
    .limit(200)

  let cityFixed = 0
  const cityCache = new Map()
  for (const listing of (noZip || [])) {
    const key = `${listing.city},${listing.state}`
    let coords = cityCache.get(key)
    if (!coords) {
      coords = await geocodeViaCensus(`${listing.city}, ${listing.state}`)
      if (!coords) coords = await geocodeViaNominatim(`${listing.city}, ${listing.state}, USA`)
      cityCache.set(key, coords)
      await new Promise(r => setTimeout(r, 1100)) // Nominatim: 1 req/sec
    }
    if (coords?.lat && coords?.lng) {
      const { error: ue } = await supabase
        .from('fliply_listings')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', listing.id)
      if (!ue) cityFixed++
    }
  }

  console.log(`Phase 3: Fixed ${cityFixed} listings via city geocode`)
  console.log('Done!')
}

main().catch(console.error)
