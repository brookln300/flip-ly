import { supabase } from '../supabase'
import { formatDate } from './parse-utils'
import type { ScraperResult, EventbriteConfig } from './types'

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_TOKEN

/**
 * Search Eventbrite for local events (flea markets, swap meets, card shows, etc.)
 */
export async function scrapeEventbrite(
  sourceId: string,
  marketId: string,
  config: EventbriteConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

  if (!EVENTBRITE_TOKEN) {
    result.errors.push('No EVENTBRITE_API_TOKEN')
    return result
  }

  for (const keyword of config.keywords) {
    try {
      // Use Eventbrite destination search (current API)
      const url = new URL('https://www.eventbriteapi.com/v3/destination/search/')
      url.searchParams.set('q', keyword)
      url.searchParams.set('latitude', String(config.latitude))
      url.searchParams.set('longitude', String(config.longitude))
      url.searchParams.set('within', config.radius)
      url.searchParams.set('page_size', '20')

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        result.errors.push(`Eventbrite API ${res.status} for "${keyword}": ${errText.substring(0, 100)}`)
        continue
      }

      const data = await res.json()
      const events = data.events || []

      for (const event of events) {
        const externalId = `eb-${event.id}`
        const venue = event.venue || {}
        const address = venue.address || {}

        const startDate = event.start?.local
          ? new Date(event.start.local)
          : null

        const { error } = await supabase.from('fliply_listings').upsert({
          source_id: sourceId,
          market_id: marketId,
          external_id: externalId,
          title: event.name?.text || 'Untitled Event',
          description: (event.description?.text || '').substring(0, 500),
          city: address.city || null,
          state: address.region || null,
          zip_code: address.postal_code || null,
          address: address.localized_address_display || null,
          latitude: venue.latitude ? parseFloat(venue.latitude) : null,
          longitude: venue.longitude ? parseFloat(venue.longitude) : null,
          source_url: event.url || null,
          source_type: 'eventbrite_api',
          image_url: event.logo?.url || null,
          event_date: startDate ? formatDate(startDate) : null,
          event_time_text: startDate ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null,
          expires_at: event.end?.local ? new Date(event.end.local + 'Z').toISOString() : null,
          tags: [keyword.toLowerCase().replace(/\s+/g, '-')],
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
      }
    } catch (err: any) {
      result.errors.push(`EB "${keyword}" failed: ${err.message}`)
    }
  }

  console.log(`[EB] ${result.inserted} new, ${result.skipped} deduped, ${result.errors.length} errors`)
  return result
}
