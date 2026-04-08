import { supabase } from '../supabase'
import { extractPrice, extractZipCode, formatDate } from './parse-utils'
import type { ScraperResult, CraigslistConfig } from './types'

/**
 * Scrape Craigslist garage sales via their internal Search API (SAPI).
 * This is the same JSON API the CL web app uses to render search results.
 * Legal: public API, same data served to any browser.
 */
export async function scrapeCraigslist(
  sourceId: string,
  marketId: string,
  config: CraigslistConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

  // Resolve area_id: use config.area_id if set, otherwise look it up by hostname
  let areaId: number | null = config.area_id || null
  if (!areaId && config.hostname) {
    areaId = await lookupAreaId(config.hostname)
  }
  if (!areaId) {
    result.errors.push(`No area_id for hostname "${config.hostname}"`)
    return result
  }

  try {
    // CL SAPI — returns structured JSON with all garage/moving sale listings
    const sapiUrl = `https://sapi.craigslist.org/web/v8/postings/search/full?batch=${areaId}-0-360-0-0&cc=US&lang=en&searchPath=gms&area_id=${areaId}`
    const res = await fetch(sapiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      result.errors.push(`CL SAPI ${res.status}: ${res.statusText}`)
      return result
    }

    const json = await res.json()
    if (json.errors?.length > 0) {
      result.errors.push(`CL SAPI errors: ${JSON.stringify(json.errors)}`)
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
      result.errors.push('CL SAPI returned 0 items')
      return result
    }

    const hostname = config.hostname || 'dallas'

    // Map CL hostname to display city name
    const cityFromHostname = hostnameToCity(hostname)

    for (const item of items) {
      try {
        // Item array format (SAPI v8):
        // [postingIdOffset, dateOffset, locationIdx, price, latLng, ?, ?, thumbnailInfo, images, [?,slug], title]
        // postingId = minPostingId + item[0]
        // eventDate = minDate + item[1] (unix seconds)
        const postingIdOffset = item[0]
        const postingId = minPostingId + (typeof postingIdOffset === 'number' ? postingIdOffset : 0)
        const dateOffset = item[1]
        const locationIdx = item[2]
        const rawPrice = item[3] // -1 = no price, otherwise whole dollars
        const latLngStr = item[4] // "1:1~lat~lng"
        const title = item[item.length - 1]
        const slugArr = item[item.length - 2] // [6, "slug-text"] or similar

        if (!postingId || !title) continue

        // Parse event date from SAPI offset
        let eventDate: string | null = null
        if (minDate && typeof dateOffset === 'number') {
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
        // Falls back to extracting prices from title text when SAPI returns -1
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

        // Build posting URL
        const slug = Array.isArray(slugArr) ? slugArr[1] || slugArr[0] : slugArr
        const postUrl = `https://${hostname}.craigslist.org/gms/d/${slug}/${postingId}.html`
        const externalId = `cl-${postingId}`

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
          zip_code: zipCode,
          latitude,
          longitude,
          source_url: postUrl,
          source_type: 'craigslist_rss', // keep existing source_type for DB compat
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

    console.log(`[CL] ${hostname}: ${items.length} found, ${result.inserted} new, ${result.skipped} deduped`)
  } catch (err: any) {
    result.errors.push(`CL SAPI fetch failed: ${err.message}`)
    console.error(`[CL] ${config.hostname} failed:`, err.message)
  }

  return result
}

/**
 * Map CL hostname to display city name.
 * Falls back to title-casing the hostname if not in map.
 */
const CL_HOSTNAME_CITIES: Record<string, string> = {
  dallas: 'Dallas', houston: 'Houston', austin: 'Austin', sanantonio: 'San Antonio',
  losangeles: 'Los Angeles', seattle: 'Seattle', phoenix: 'Phoenix', miami: 'Miami',
  chicago: 'Chicago', denver: 'Denver', portland: 'Portland', atlanta: 'Atlanta',
  sfbay: 'San Francisco', sandiego: 'San Diego', minneapolis: 'Minneapolis',
  tampa: 'Tampa', nashville: 'Nashville', boston: 'Boston', newyork: 'New York',
  philadelphia: 'Philadelphia', detroit: 'Detroit', stlouis: 'St. Louis',
  kansascity: 'Kansas City', raleigh: 'Raleigh', charlotte: 'Charlotte',
  columbus: 'Columbus', indianapolis: 'Indianapolis', jacksonville: 'Jacksonville',
  memphis: 'Memphis', oklahomacity: 'Oklahoma City', lasvegas: 'Las Vegas',
  saltlakecity: 'Salt Lake City', sacramento: 'Sacramento', orangecounty: 'Orange County',
  inlandempire: 'Inland Empire', fortworth: 'Fort Worth', bgky: 'Bowling Green',
}

function hostnameToCity(hostname: string): string {
  return CL_HOSTNAME_CITIES[hostname.toLowerCase()] ||
    hostname.charAt(0).toUpperCase() + hostname.slice(1)
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
