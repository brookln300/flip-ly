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

    if (items.length === 0) {
      result.errors.push('CL SAPI returned 0 items')
      return result
    }

    const hostname = config.hostname || 'dallas'

    for (const item of items) {
      try {
        // Item array format: [postingId, ?, locationIdx, price, latLng, ?, ?, thumbnailInfo, images, [?,slug], title]
        const postingId = item[0]
        const locationIdx = item[2]
        const rawPrice = item[3] // -1 = no price, otherwise cents
        const latLngStr = item[4] // "1:1~lat~lng"
        const title = item[item.length - 1]
        const slugArr = item[item.length - 2] // [6, "slug-text"] or similar

        if (!postingId || !title) continue

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

        // Parse price
        let priceCents: number | null = null
        let priceText = 'Not listed'
        if (typeof rawPrice === 'number' && rawPrice >= 0) {
          priceCents = rawPrice
          priceText = rawPrice === 0 ? 'FREE' : `$${rawPrice}`
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
          price_high_cents: priceCents,
          city: location,
          zip_code: zipCode,
          latitude,
          longitude,
          source_url: postUrl,
          source_type: 'craigslist_rss', // keep existing source_type for DB compat
          scraped_at: new Date().toISOString(),
        }, {
          onConflict: 'source_id,external_id',
          ignoreDuplicates: true,
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
