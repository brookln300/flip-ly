import { lookupZip } from '../discovery/zip-lookup'
import { haversineMiles } from './geo-math'

export { haversineMiles }

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
