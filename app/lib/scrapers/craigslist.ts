import { supabase } from '../supabase'
import { extractPrice, extractZipCode, formatDate } from './parse-utils'
import type { ScraperResult, CraigslistConfig } from './types'

// ── Category metadata ──
// Maps CL search_path codes to human-readable names and default event_type
const CL_CATEGORIES: Record<string, { label: string; eventType: string }> = {
  gms: { label: 'Garage Sales', eventType: 'garage_sale' },
  ela: { label: 'Electronics', eventType: 'listing' },
  tla: { label: 'Tools', eventType: 'listing' },
  fua: { label: 'Furniture', eventType: 'listing' },
  cba: { label: 'Collectibles', eventType: 'listing' },
  ppa: { label: 'Appliances', eventType: 'listing' },
  sga: { label: 'Sporting Goods', eventType: 'listing' },
  msa: { label: 'Musical Instruments', eventType: 'listing' },
  vga: { label: 'Video Gaming', eventType: 'listing' },
  ata: { label: 'Antiques', eventType: 'listing' },
  zip: { label: 'Free Stuff', eventType: 'listing' },
  hsa: { label: 'Household', eventType: 'listing' },
  foa: { label: 'General For Sale', eventType: 'listing' },
}

/**
 * Scrape Craigslist listings via their internal Search API (SAPI).
 * Supports both garage sales (gms) and individual item categories (ela, tla, fua, cba, etc.)
 * This is the same JSON API the CL web app uses to render search results.
 */
export async function scrapeCraigslist(
  sourceId: string,
  marketId: string,
  config: CraigslistConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }
  const seenExternalIds: string[] = [] // Track IDs seen in SAPI for staleness detection

  // Resolve area_id: use config.area_id if set, otherwise look it up by hostname
  let areaId: number | null = config.area_id || null
  if (!areaId && config.hostname) {
    areaId = await lookupAreaId(config.hostname)
  }
  if (!areaId) {
    result.errors.push(`No area_id for hostname "${config.hostname}"`)
    return result
  }

  // Category: defaults to garage sales for backward compat
  const searchPath = config.search_path || 'gms'
  const isItemListing = searchPath !== 'gms'
  const categoryMeta = CL_CATEGORIES[searchPath] || { label: searchPath, eventType: 'listing' }

  try {
    // CL SAPI — returns structured JSON for any for-sale category
    const sapiUrl = `https://sapi.craigslist.org/web/v8/postings/search/full?batch=${areaId}-0-360-0-0&cc=US&lang=en&searchPath=${searchPath}&area_id=${areaId}`
    const res = await fetch(sapiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      result.errors.push(`CL SAPI ${res.status} [${searchPath}]: ${res.statusText}`)
      return result
    }

    const json = await res.json()
    if (json.errors?.length > 0) {
      result.errors.push(`CL SAPI errors [${searchPath}]: ${JSON.stringify(json.errors)}`)
      return result
    }

    const items = json.data?.items || []
    const decode = json.data?.decode || {}
    const locationDescs: string[] = decode.locationDescriptions || []
    // SAPI v8 encodes posting IDs as offsets from minPostingId
    const minPostingId: number = decode.minPostingId || 0
    // SAPI v8 encodes event/posting dates as offsets from minDate (unix seconds)
    const minDate: number = decode.minDate || 0

    if (items.length === 0) {
      result.errors.push(`CL SAPI returned 0 items [${searchPath}]`)
      return result
    }

    const hostname = config.hostname || 'dallas'

    // Map CL hostname to display city + state
    const cityFromHostname = hostnameToCity(hostname)
    const stateFromHostname = hostnameToState(hostname)

    for (const item of items) {
      try {
        // Item array format (SAPI v8):
        // [postingIdOffset, dateOffset, locationIdx, price, latLng, ?, ?, thumbnailInfo, images, [?,slug], title]
        // postingId = minPostingId + item[0]
        // date = minDate + item[1] (unix seconds) — event date for gms, posting date for items
        const postingIdOffset = item[0]
        const postingId = minPostingId + (typeof postingIdOffset === 'number' ? postingIdOffset : 0)
        const dateOffset = item[1]
        const locationIdx = item[2]
        const rawPrice = item[3] // -1 = no price, otherwise whole dollars
        const latLngStr = item[4] // "1:1~lat~lng"
        const title = item[item.length - 1]
        const slugArr = item[item.length - 2] // [6, "slug-text"] or similar

        if (!postingId || !title) continue

        // Parse date from SAPI offset
        // For garage sales (gms): this is the EVENT date (when the sale happens)
        // For item listings: this is the POSTING date (when it was listed) — store as null event_date
        let eventDate: string | null = null
        if (!isItemListing && minDate && typeof dateOffset === 'number') {
          const d = new Date((minDate + dateOffset) * 1000)
          // Only use if the date is reasonable (within 30 days)
          if (d.getTime() > Date.now() - 7 * 86400000 && d.getTime() < Date.now() + 30 * 86400000) {
            eventDate = d.toISOString().split('T')[0]
          }
        }

        // Parse location
        const location = (typeof locationIdx === 'number' && locationDescs[locationIdx]) || null

        // Parse lat/lng
        let latitude: number | null = null
        let longitude: number | null = null
        if (typeof latLngStr === 'string' && latLngStr.includes('~')) {
          const parts = latLngStr.split('~')
          latitude = parseFloat(parts[1]) || null
          longitude = parseFloat(parts[2]) || null
        }

        // Parse price — SAPI returns price in whole dollars, convert to cents for DB
        // Individual item listings almost always have prices (unlike garage sales)
        let priceCents: number | null = null
        let priceHighCents: number | null = null
        let priceText = 'Not listed'
        if (typeof rawPrice === 'number' && rawPrice >= 0) {
          priceCents = rawPrice * 100
          priceHighCents = priceCents
          priceText = rawPrice === 0 ? 'FREE' : `$${rawPrice}`
        } else {
          // SAPI price is -1 — try extracting from title
          const titlePrice = extractPrice(String(title))
          if (titlePrice.price_low_cents !== null) {
            priceCents = titlePrice.price_low_cents
            priceHighCents = titlePrice.price_high_cents
            priceText = titlePrice.price_text
          }
        }

        // Build posting URL — use the correct category path
        const slug = Array.isArray(slugArr) ? slugArr[1] || slugArr[0] : slugArr
        const postUrl = `https://${hostname}.craigslist.org/${searchPath}/d/${slug}/${postingId}.html`
        const externalId = `cl-${postingId}`
        seenExternalIds.push(externalId)

        // Extract zip from location text
        const zipCode = location ? extractZipCode(location) : null

        const { error } = await supabase.from('fliply_listings').upsert({
          source_id: sourceId,
          market_id: marketId,
          external_id: externalId,
          title: String(title).trim(),
          description: location || null,
          price_text: priceText,
          price_low_cents: priceCents,
          price_high_cents: priceHighCents,
          city: cityFromHostname,
          state: stateFromHostname,
          zip_code: zipCode,
          latitude,
          longitude,
          source_url: postUrl,
          source_type: 'craigslist_rss', // keep existing source_type for pipeline compat
          event_date: eventDate,
          scraped_at: new Date().toISOString(),
        }, {
          onConflict: 'source_id,external_id',
          ignoreDuplicates: false, // Update existing listings with fresh data + correct URLs
        })

        if (error) {
          if (error.code === '23505') result.skipped++
          else result.errors.push(`Insert error: ${error.message}`)
        } else {
          result.inserted++
        }
      } catch (itemErr: any) {
        result.errors.push(`Item parse error: ${itemErr.message}`)
      }
    }

    console.log(`[CL] ${hostname}/${searchPath} (${categoryMeta.label}): ${items.length} found, ${result.inserted} new, ${result.skipped} deduped`)

    // ── Staleness detection ──
    // Any listing in our DB from this source that was NOT in the SAPI response
    // has likely been deleted/sold/flagged on CL. Set expires_at so it drops
    // from search results within 24h instead of lingering for 7 days.
    if (seenExternalIds.length > 0) {
      try {
        // Find DB listings from this source that weren't in the SAPI response
        const { data: dbListings } = await supabase
          .from('fliply_listings')
          .select('id, external_id')
          .eq('source_id', sourceId)
          .is('expires_at', null) // Only target listings not already marked for expiry

        if (dbListings && dbListings.length > 0) {
          const seenSet = new Set(seenExternalIds)
          const missingIds = dbListings
            .filter(l => !seenSet.has(l.external_id))
            .map(l => l.id)

          if (missingIds.length > 0) {
            // Set expires_at to 24h from now — gives one more scrape cycle to reappear
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            await supabase
              .from('fliply_listings')
              .update({ expires_at: expiresAt })
              .in('id', missingIds)

            console.log(`[CL] ${hostname}/${searchPath}: marked ${missingIds.length} missing listings for expiry`)
          }
        }
      } catch (staleErr: any) {
        console.warn(`[CL] Staleness check failed: ${staleErr.message}`)
      }
    }
  } catch (err: any) {
    result.errors.push(`CL SAPI fetch failed [${searchPath}]: ${err.message}`)
    console.error(`[CL] ${config.hostname}/${searchPath} failed:`, err.message)
  }

  return result
}

/**
 * Map CL hostname to display city name.
 * Falls back to title-casing the hostname if not in map.
 */
const CL_HOSTNAME_MAP: Record<string, { city: string; state: string }> = {
  dallas: { city: 'Dallas', state: 'TX' }, houston: { city: 'Houston', state: 'TX' },
  austin: { city: 'Austin', state: 'TX' }, sanantonio: { city: 'San Antonio', state: 'TX' },
  fortworth: { city: 'Fort Worth', state: 'TX' },
  losangeles: { city: 'Los Angeles', state: 'CA' }, sfbay: { city: 'San Francisco', state: 'CA' },
  sandiego: { city: 'San Diego', state: 'CA' }, sacramento: { city: 'Sacramento', state: 'CA' },
  orangecounty: { city: 'Orange County', state: 'CA' }, inlandempire: { city: 'Inland Empire', state: 'CA' },
  seattle: { city: 'Seattle', state: 'WA' }, portland: { city: 'Portland', state: 'OR' },
  phoenix: { city: 'Phoenix', state: 'AZ' }, miami: { city: 'Miami', state: 'FL' },
  tampa: { city: 'Tampa', state: 'FL' }, jacksonville: { city: 'Jacksonville', state: 'FL' },
  chicago: { city: 'Chicago', state: 'IL' }, denver: { city: 'Denver', state: 'CO' },
  atlanta: { city: 'Atlanta', state: 'GA' }, minneapolis: { city: 'Minneapolis', state: 'MN' },
  nashville: { city: 'Nashville', state: 'TN' }, memphis: { city: 'Memphis', state: 'TN' },
  boston: { city: 'Boston', state: 'MA' }, newyork: { city: 'New York', state: 'NY' },
  philadelphia: { city: 'Philadelphia', state: 'PA' }, detroit: { city: 'Detroit', state: 'MI' },
  stlouis: { city: 'St. Louis', state: 'MO' }, kansascity: { city: 'Kansas City', state: 'MO' },
  raleigh: { city: 'Raleigh', state: 'NC' }, charlotte: { city: 'Charlotte', state: 'NC' },
  columbus: { city: 'Columbus', state: 'OH' }, indianapolis: { city: 'Indianapolis', state: 'IN' },
  oklahomacity: { city: 'Oklahoma City', state: 'OK' }, lasvegas: { city: 'Las Vegas', state: 'NV' },
  saltlakecity: { city: 'Salt Lake City', state: 'UT' }, bgky: { city: 'Bowling Green', state: 'KY' },
}

function hostnameToCity(hostname: string): string {
  return CL_HOSTNAME_MAP[hostname.toLowerCase()]?.city ||
    hostname.charAt(0).toUpperCase() + hostname.slice(1)
}

function hostnameToState(hostname: string): string | null {
  return CL_HOSTNAME_MAP[hostname.toLowerCase()]?.state || null
}

/**
 * Look up a Craigslist area_id by hostname using their reference API.
 */
async function lookupAreaId(hostname: string): Promise<number | null> {
  try {
    const res = await fetch('https://reference.craigslist.org/Areas', {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const areas = await res.json()
    const match = areas.find((a: any) =>
      a.Hostname?.toLowerCase() === hostname.toLowerCase()
    )
    return match?.AreaID || null
  } catch {
    return null
  }
}
