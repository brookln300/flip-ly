import Parser from 'rss-parser'
import { supabase } from '../supabase'
import { extractPrice, extractZipCode, getNextSaturday, formatDate, generateExternalId } from './parse-utils'
import type { ScraperResult, CraigslistConfig } from './types'

const parser = new Parser()

/**
 * Scrape Craigslist garage sales via RSS feed.
 * Legal: RSS is Craigslist's official public feed format.
 */
export async function scrapeCraigslist(
  sourceId: string,
  marketId: string,
  config: CraigslistConfig
): Promise<ScraperResult> {
  const result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

  try {
    const feed = await parser.parseURL(config.rss_url)

    if (!feed.items || feed.items.length === 0) {
      result.errors.push('Empty RSS feed')
      return result
    }

    const nextSat = getNextSaturday()

    for (const item of feed.items) {
      if (!item.title || !item.link) continue

      const externalId = generateExternalId(item.link)
      const priceInfo = extractPrice(item.title + ' ' + (item.contentSnippet || ''))
      const zipCode = extractZipCode(item.contentSnippet || item.title || '')

      // Extract city from title if possible (CL often has "city" in parens)
      const cityMatch = item.title.match(/\(([^)]+)\)\s*$/)
      const city = cityMatch ? cityMatch[1].trim() : null

      const { error } = await supabase.from('fliply_listings').upsert({
        source_id: sourceId,
        market_id: marketId,
        external_id: externalId,
        title: item.title.replace(/\([^)]*\)\s*$/, '').trim(), // Remove trailing (city)
        description: item.contentSnippet || null,
        price_text: priceInfo.price_text,
        price_low_cents: priceInfo.price_low_cents,
        price_high_cents: priceInfo.price_high_cents,
        city: city,
        zip_code: zipCode,
        source_url: item.link,
        source_type: 'craigslist_rss',
        event_date: formatDate(nextSat),
        expires_at: new Date(nextSat.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        scraped_at: new Date().toISOString(),
      }, {
        onConflict: 'source_id,external_id',
        ignoreDuplicates: true,
      })

      if (error) {
        if (error.code === '23505') { // unique violation = dedup
          result.skipped++
        } else {
          result.errors.push(`Insert error: ${error.message}`)
        }
      } else {
        result.inserted++
      }
    }

    console.log(`[CL] ${config.hostname}: ${result.inserted} new, ${result.skipped} deduped, ${result.errors.length} errors`)
  } catch (err: any) {
    result.errors.push(`Feed fetch failed: ${err.message}`)
    console.error(`[CL] ${config.hostname} failed:`, err.message)
  }

  return result
}
