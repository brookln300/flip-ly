import { supabase } from '../supabase'
import { callHaiku } from '../ai/claude'
import { formatDate } from './parse-utils'
import type { ScraperResult } from './types'

/**
 * Universal AI-powered scraper.
 *
 * Give it ANY URL that lists garage/estate/yard sales → it fetches the HTML,
 * sends it to Haiku, and gets back structured listing data.
 *
 * No per-site parser code. No CSS selectors. No regex.
 * If the site changes their layout, Haiku still extracts correctly.
 *
 * This is our DIY Firecrawl — same concept, using our own API credits.
 * Cost: ~$0.003-0.01 per page extraction.
 */

export interface AiExtractConfig {
  url: string               // The page URL to scrape
  source_name: string       // Human-readable name (e.g., "EstateSales.net Dallas")
  source_hint?: string      // Hint for the AI about what this source is
  max_pages?: number        // Max pages to follow (default 1)
  pagination_hint?: string  // How pagination works (e.g., "?page=2", "next button")
}

interface ExtractedListing {
  title: string
  description?: string
  price?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  event_date?: string
  event_time?: string
  source_url?: string
  image_url?: string
}

/**
 * Fetch a page, strip it to essential content, and extract listings via Haiku.
 */
export async function scrapeWithAI(
  sourceId: string,
  marketId: string,
  config: AiExtractConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }
  const maxPages = config.max_pages || 1
  const allListings: ExtractedListing[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      // Build URL with pagination
      let url = config.url
      if (page > 1 && config.pagination_hint) {
        url = config.pagination_hint.replace('{page}', String(page))
      }

      // 1. Fetch the page
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      if (!res.ok) {
        result.errors.push(`Fetch ${res.status} for ${url}`)
        continue
      }

      const html = await res.text()

      // 2. Strip to essential content (reduce tokens = reduce cost)
      const cleaned = stripHtml(html)

      if (cleaned.length < 100) {
        result.errors.push(`Page too short after stripping: ${cleaned.length} chars`)
        continue
      }

      // Truncate to ~15k chars to keep Haiku costs low
      const truncated = cleaned.substring(0, 15000)

      // 3. Send to Haiku for extraction
      const { parsed, inputTokens, outputTokens } = await callHaiku<ExtractedListing[]>({
        system: `You are a data extraction assistant. Extract garage sale, estate sale, yard sale, flea market, and swap meet listings from the provided web page content.

Return a JSON array of listings. Each listing should have these fields (omit if not found):
- title (string, required): The listing title
- description (string): Description or details
- price (string): Price text as shown (e.g., "Free", "$5-$200", "Make offer")
- address (string): Street address if shown
- city (string): City name
- state (string): State abbreviation (e.g., "TX")
- zip_code (string): 5-digit zip code
- event_date (string): Date in YYYY-MM-DD format if possible
- event_time (string): Time text (e.g., "7AM-2PM")
- source_url (string): Link to the individual listing if available (full URL)
- image_url (string): Image URL if available (full URL)

Important:
- Only extract ACTUAL listings, not ads or navigation
- If a listing has no title, skip it
- Convert relative URLs to absolute using the base URL: ${url}
- Return an empty array [] if no listings found
- Return ONLY the JSON array, no other text`,
        userMessage: `Source: ${config.source_name}${config.source_hint ? ` (${config.source_hint})` : ''}
Page URL: ${url}

Page content:
${truncated}`,
        maxTokens: 3000,
      })

      if (parsed && Array.isArray(parsed)) {
        allListings.push(...parsed)
        console.log(`[AI-EXTRACT] Page ${page}: ${parsed.length} listings, ${inputTokens}in/${outputTokens}out tokens`)
      } else {
        result.errors.push(`AI returned non-array for page ${page}`)
      }

      // If we got fewer than 3 listings, probably no more pages
      if (parsed && parsed.length < 3) break

    } catch (err: any) {
      result.errors.push(`Page ${page} failed: ${err.message}`)
    }
  }

  // 4. Upsert all extracted listings to Supabase
  for (const listing of allListings) {
    if (!listing.title) continue

    try {
      // Generate external ID from title + source (deterministic dedup)
      const externalId = `ai-${hashString(listing.title + (listing.source_url || config.url))}`

      const { error } = await supabase.from('fliply_listings').upsert({
        source_id: sourceId,
        market_id: marketId,
        external_id: externalId,
        title: listing.title.substring(0, 500),
        description: listing.description?.substring(0, 1000) || null,
        price_text: listing.price || 'Not listed',
        price_low_cents: parsePriceCents(listing.price),
        city: listing.city || null,
        state: listing.state || null,
        zip_code: listing.zip_code || null,
        address: listing.address || null,
        latitude: listing.latitude || null,
        longitude: listing.longitude || null,
        source_url: listing.source_url || config.url,
        source_type: 'ai_extract',
        image_url: listing.image_url || null,
        event_date: listing.event_date || null,
        event_time_text: listing.event_time || null,
        scraped_at: new Date().toISOString(),
      }, {
        onConflict: 'source_id,external_id',
        ignoreDuplicates: true,
      })

      if (error) {
        if (error.code === '23505') result.skipped++
        else result.errors.push(`Insert: ${error.message}`)
      } else {
        result.inserted++
      }
    } catch (err: any) {
      result.errors.push(`Listing insert: ${err.message}`)
    }
  }

  console.log(`[AI-EXTRACT] ${config.source_name}: ${allListings.length} found, ${result.inserted} new, ${result.skipped} deduped`)
  return result
}

/**
 * Strip HTML to essential text content.
 * Removes scripts, styles, nav, footer, ads — keeps main content.
 * This reduces token count by ~80%, cutting AI costs dramatically.
 */
function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove common non-content elements
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove SVG
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    // Strip tags but keep text
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Simple string hash for generating deterministic external IDs.
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return String(Math.abs(hash))
}

/**
 * Try to extract cents from a price string.
 */
function parsePriceCents(price?: string): number | null {
  if (!price) return null
  if (/free/i.test(price)) return 0
  const match = price.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/)
  if (!match) return null
  return Math.round(parseFloat(match[1].replace(/,/g, '')) * 100)
}
