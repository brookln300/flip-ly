/**
 * Maps a lat/lng to the nearest Craigslist region.
 * Uses the official Craigslist reference API.
 */

interface CraigslistArea {
  Hostname: string
  Latitude: number
  Longitude: number
  Description: string
}

let cachedAreas: CraigslistArea[] | null = null
let cacheTime = 0
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch all Craigslist areas (cached for 24h).
 */
async function getAreas(): Promise<CraigslistArea[]> {
  if (cachedAreas && Date.now() - cacheTime < CACHE_TTL) {
    return cachedAreas
  }

  try {
    const res = await fetch('https://reference.craigslist.org/Areas')
    const data = await res.json()
    cachedAreas = data as CraigslistArea[]
    cacheTime = Date.now()
    return cachedAreas
  } catch (err) {
    console.error('[CL-REGIONS] Failed to fetch areas:', err)
    return cachedAreas || []
  }
}

/**
 * Haversine distance between two lat/lng points in miles.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Find the nearest Craigslist region for a given lat/lng.
 * Returns the hostname (e.g., 'dallas') and the RSS URL for garage sales.
 */
export async function findCraigslistRegion(lat: number, lng: number): Promise<{
  hostname: string
  rssUrl: string
  distance: number
} | null> {
  const areas = await getAreas()
  if (areas.length === 0) return null

  let closest: CraigslistArea | null = null
  let closestDist = Infinity

  for (const area of areas) {
    if (!area.Latitude || !area.Longitude) continue
    const dist = haversineDistance(lat, lng, area.Latitude, area.Longitude)
    if (dist < closestDist) {
      closestDist = dist
      closest = area
    }
  }

  if (!closest) return null

  return {
    hostname: closest.Hostname,
    rssUrl: `https://${closest.Hostname}.craigslist.org/search/gms?format=rss`,
    distance: Math.round(closestDist),
  }
}
