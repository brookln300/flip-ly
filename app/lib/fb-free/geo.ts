import { lookupZip } from '../discovery/zip-lookup'

/** Great-circle distance in miles (same formula as app/lib/geo-market.ts). */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Distance in miles between two US ZIP codes, or null if either can't be resolved.
 * Reuses lookupZip (fliply_zip_data + Census fallback with caching).
 */
export async function zipDistanceMiles(homeZip: string, postZip: string): Promise<number | null> {
  if (!homeZip || !postZip) return null
  const [home, post] = await Promise.all([lookupZip(homeZip), lookupZip(postZip)])
  if (!home || !post) return null
  return haversineMiles(home.latitude, home.longitude, post.latitude, post.longitude)
}
