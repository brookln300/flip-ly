import { supabase } from '../supabase'
import type { ScraperResult } from './types'

/**
 * Dedicated EstateSales.NET scraper.
 *
 * Parses JSON-LD SaleEvent objects embedded in search pages.
 * Zero AI tokens — pure HTML/JSON parsing.
 *
 * Public URLs: https://www.estatesales.net/estate-sales/{state}/{city}
 * Each page embeds <script type="application/ld+json"> blocks with SaleEvent schema.
 */

export interface EstateSalesNetConfig {
  state: string           // e.g. "TX"
  city_slug: string       // e.g. "Dallas", "Fort-Worth", "Los-Angeles"
  extra_slugs?: string[]  // Additional city slugs for metro areas (e.g. DFW: ["Fort-Worth", "Arlington"])
}

interface SaleEventLD {
  '@type'?: string
  url?: string
  name?: string
  image?: string[]
  startDate?: string
  endDate?: string
  description?: string
  eventAttendanceMode?: string
  organizer?: {
    name?: string
    telephone?: string
  }
  location?: {
    '@type'?: string
    address?: {
      streetAddress?: string
      addressLocality?: string
      addressRegion?: string
      postalCode?: string
    }
  }
}

/**
 * Extract sale ID from an EstateSales.NET URL.
 * Pattern: /TX/Dallas/75261/4848216 → "4848216"
 */
function extractSaleId(url: string): string | null {
  const match = url.match(/\/(\d{5,8})$/)
  return match ? match[1] : null
}

/**
 * Extract city, state, zip from the URL path segments.
 * Pattern: https://www.estatesales.net/TX/Fort-Worth/76126/4852062
 */
function parseUrlLocation(url: string): { city?: string; state?: string; zip?: string } {
  const match = url.match(/estatesales\.net\/([A-Z]{2})\/([^/]+)\/(\d{5})\//)
  if (!match) return {}
  return {
    state: match[1],
    city: match[2].replace(/-/g, ' '),
    zip: match[3],
  }
}

/**
 * Parse addresses from HTML sale-row elements.
 * Returns a map of sale URL → address text.
 *
 * EstateSales.NET uses Angular components:
 *   <div class="sale-row__address">
 *     <app-sale-address>
 *       <address>
 *         <div class="address-line-1">123 Main St</div>
 *         <div class="address-line-2"> Dallas,&nbsp;TX&nbsp;75201 </div>
 */
function parseAddressesFromHtml(html: string): Map<string, string> {
  const addresses = new Map<string, string>()

  // Split HTML at each sale link to isolate sale blocks
  const salePattern = /href="(\/[A-Z]{2}\/[^"]+\/\d{5,8})"/g
  let saleMatch: RegExpExecArray | null
  const salePositions: { href: string; index: number }[] = []

  while ((saleMatch = salePattern.exec(html)) !== null) {
    const href = saleMatch[1]
    if (!salePositions.find(s => s.href === href)) {
      salePositions.push({ href, index: saleMatch.index })
    }
  }

  for (let i = 0; i < salePositions.length; i++) {
    const start = salePositions[i].index
    const end = i + 1 < salePositions.length ? salePositions[i + 1].index : start + 5000
    const block = html.substring(start, Math.min(end, start + 5000))

    // Extract address-line-1 (street) and address-line-2 (city, state zip)
    const line1Match = block.match(/address-line-1[^>]*>([^<]+)</)
    const line2Match = block.match(/address-line-2[^>]*>([^<]+)</)

    const parts: string[] = []
    if (line1Match) parts.push(line1Match[1].trim())
    if (line2Match) parts.push(line2Match[1].replace(/&nbsp;/g, ' ').trim())

    if (parts.length > 0) {
      const url = `https://www.estatesales.net${salePositions[i].href}`
      addresses.set(url, parts.join(', '))
    }
  }

  return addresses
}

/**
 * Parse all JSON-LD SaleEvent blocks from HTML.
 */
function parseJsonLd(html: string): SaleEventLD[] {
  const events: SaleEventLD[] = []
  const pattern = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (data['@type'] === 'SaleEvent') {
        events.push(data)
      } else if (Array.isArray(data)) {
        events.push(...data.filter((d: any) => d['@type'] === 'SaleEvent'))
      }
    } catch {
      // Malformed JSON-LD block — skip
    }
  }

  return events
}

/**
 * Scrape a single EstateSales.NET search page for a city slug.
 */
async function scrapeCityPage(
  sourceId: string,
  marketId: string,
  state: string,
  citySlug: string,
  result: ScraperResult
): Promise<void> {
  const url = `https://www.estatesales.net/estate-sales/${state}/${citySlug}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })

  if (!res.ok) {
    result.errors.push(`EstateSales.NET ${state}/${citySlug}: HTTP ${res.status}`)
    return
  }

  const html = await res.text()

  // 1. Parse JSON-LD for structured sale data
  const events = parseJsonLd(html)

  if (events.length === 0) {
    result.errors.push(`EstateSales.NET ${state}/${citySlug}: 0 JSON-LD events found`)
    return
  }

  // 2. Parse addresses from HTML (JSON-LD often lacks physical address)
  const addressMap = parseAddressesFromHtml(html)

  // 3. Upsert each sale
  for (const event of events) {
    if (!event.name || !event.url) continue

    const saleId = extractSaleId(event.url)
    if (!saleId) continue

    const externalId = `es-${saleId}`
    const loc = parseUrlLocation(event.url)
    const address = addressMap.get(event.url) || null
    const isOnline = event.eventAttendanceMode?.includes('OnlineEventAttendanceMode')

    // Parse dates
    let eventDate: string | null = null
    let eventEndDate: string | null = null
    if (event.startDate) {
      eventDate = event.startDate.split('T')[0]
    }
    if (event.endDate) {
      eventEndDate = event.endDate.split('T')[0]
    }

    // Build description from available fields
    const descParts: string[] = []
    if (event.description) descParts.push(event.description)
    if (event.organizer?.name) descParts.push(`by ${event.organizer.name}`)
    if (isOnline) descParts.push('(Online Only)')
    const description = descParts.join(' — ') || null

    const imageUrl = event.image?.[0] || null

    try {
      const { error } = await supabase.from('fliply_listings').upsert({
        source_id: sourceId,
        market_id: marketId,
        external_id: externalId,
        title: event.name.substring(0, 500),
        description,
        address: address,
        city: loc.city || citySlug.replace(/-/g, ' '),
        state: loc.state || state,
        zip_code: loc.zip || null,
        source_url: event.url,
        source_type: 'estatesales_net',
        image_url: imageUrl,
        event_date: eventDate,
        event_end_date: eventEndDate,
        scraped_at: new Date().toISOString(),
      }, {
        onConflict: 'source_id,external_id',
        ignoreDuplicates: false, // Update existing with fresh data
      })

      if (error) {
        if (error.code === '23505') result.skipped++
        else result.errors.push(`Insert es-${saleId}: ${error.message}`)
      } else {
        result.inserted++
      }
    } catch (err: any) {
      result.errors.push(`Insert es-${saleId}: ${err.message}`)
    }
  }
}

/**
 * Main entry point — scrapes primary city + any extra slugs for metro areas.
 */
export async function scrapeEstateSalesNet(
  sourceId: string,
  marketId: string,
  config: EstateSalesNetConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

  // Scrape primary city
  await scrapeCityPage(sourceId, marketId, config.state, config.city_slug, result)

  // Scrape extra city slugs (for metro areas like DFW)
  if (config.extra_slugs) {
    for (const slug of config.extra_slugs) {
      await scrapeCityPage(sourceId, marketId, config.state, slug, result)
    }
  }

  const slugCount = 1 + (config.extra_slugs?.length || 0)
  console.log(`[ES.NET] ${config.state}/${config.city_slug} (+${slugCount - 1} extra): ${result.inserted} new, ${result.skipped} deduped`)

  return result
}
