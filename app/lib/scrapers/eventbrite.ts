import { supabase } from '../supabase'
import { formatDate } from './parse-utils'
import type { ScraperResult, EventbriteConfig } from './types'

/**
 * Scrape Eventbrite events by parsing LD+JSON structured data from search pages.
 * The Eventbrite public search API was deprecated in 2020, but their search pages
 * embed Schema.org ItemList data that's clean, structured, and meant to be parsed.
 */
export async function scrapeEventbrite(
  sourceId: string,
  marketId: string,
  config: EventbriteConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

  // Build city slug for Eventbrite search URL
  // Format: eventbrite.com/d/{state}--{city}/{keyword}/
  const citySlug = config.city_slug || buildCitySlug(config)

  for (const keyword of config.keywords) {
    try {
      const searchSlug = keyword.toLowerCase().replace(/\s+/g, '-')
      const searchUrl = `https://www.eventbrite.com/d/${citySlug}/${searchSlug}/`

      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
          'Accept': 'text/html',
        },
      })

      if (!res.ok) {
        result.errors.push(`EB page ${res.status} for "${keyword}"`)
        continue
      }

      const html = await res.text()

      // Extract LD+JSON blocks
      const ldJsonRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      let match: RegExpExecArray | null
      let events: any[] = []

      while ((match = ldJsonRegex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(match[1])
          if (parsed['@type'] === 'ItemList' && parsed.itemListElement) {
            events = parsed.itemListElement
              .filter((item: any) => item.item?.['@type'] === 'Event')
              .map((item: any) => item.item)
            break
          }
        } catch {
          // skip malformed JSON
        }
      }

      if (events.length === 0) {
        // Not an error — just no results for this keyword
        continue
      }

      for (const event of events) {
        try {
          // Extract event ID from URL: /e/name-tickets-1234567890
          const urlMatch = event.url?.match(/tickets?-(\d+)/)
          const eventId = urlMatch ? urlMatch[1] : null
          if (!eventId) continue

          const externalId = `eb-${eventId}`
          const location = event.location || {}
          const address = location.address || {}
          const geo = location.geo || {}

          const startDate = event.startDate ? new Date(event.startDate) : null
          const endDate = event.endDate ? new Date(event.endDate) : null

          const { error } = await supabase.from('fliply_listings').upsert({
            source_id: sourceId,
            market_id: marketId,
            external_id: externalId,
            title: event.name || 'Untitled Event',
            description: (event.description || '').substring(0, 500),
            city: address.addressLocality || null,
            state: address.addressRegion || null,
            zip_code: address.postalCode || null,
            address: address.streetAddress || null,
            latitude: geo.latitude ? parseFloat(geo.latitude) : null,
            longitude: geo.longitude ? parseFloat(geo.longitude) : null,
            source_url: event.url || null,
            source_type: 'eventbrite_api', // keep existing source_type for DB compat
            image_url: event.image || null,
            event_date: startDate ? formatDate(startDate) : null,
            event_time_text: startDate ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null,
            expires_at: endDate ? endDate.toISOString() : null,
            tags: [searchSlug],
            scraped_at: new Date().toISOString(),
          }, {
            onConflict: 'source_id,external_id',
            ignoreDuplicates: true,
          })

          if (error) {
            if (error.code === '23505') result.skipped++
            else result.errors.push(`EB insert: ${error.message}`)
          } else {
            result.inserted++
          }
        } catch (itemErr: any) {
          result.errors.push(`EB item parse: ${itemErr.message}`)
        }
      }
    } catch (err: any) {
      result.errors.push(`EB "${keyword}" failed: ${err.message}`)
    }
  }

  console.log(`[EB] ${result.inserted} new, ${result.skipped} deduped, ${result.errors.length} errors`)
  return result
}

/**
 * Build Eventbrite city slug from config.
 * Format: "state--city-name" (e.g., "tx--dallas", "fl--miami", "ut--salt-lake-city")
 * Falls back to "united-states" if we can't determine the location.
 */
function buildCitySlug(config: EventbriteConfig): string {
  // city_slug should be set by source-discovery.ts — use it if available
  if (config.city_slug) return config.city_slug
  // Fallback: can't determine location without city_slug
  return 'united-states'
}
