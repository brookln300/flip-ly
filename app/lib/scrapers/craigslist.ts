import { supabase } from '../supabase'
import { extractPrice, extractZipCode, getNextSaturday, formatDate, generateExternalId } from './parse-utils'
import type { ScraperResult, CraigslistConfig } from './types'

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
    // Use rss2json proxy to bypass Craigslist's serverless IP blocks
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.rss_url)}&count=50`
    const rssRes = await fetch(proxyUrl)
    if (!rssRes.ok) {
      result.errors.push(`RSS proxy ${rssRes.status}: ${rssRes.statusText}`)
      return result
    }
    const json = await rssRes.json()
    if (json.status !== 'ok') {
      result.errors.push(`RSS proxy error: ${json.message || 'unknown'}`)
      return result
    }
    // rss2json returns { items: [{title, link, description, ...}] }
    const feed = { items: json.items || [] }

    if (!feed.items || feed.items.length === 0) {
      result.errors.push('Empty RSS feed')
      return result
    }

    const nextSat = getNextSaturday()

    for (const item of feed.items) {
      if (!item.title || !item.link) continue

      const externalId = generateExternalId(item.link)
      const desc = item.contentSnippet || item.description || ''
      const priceInfo = extractPrice(item.title + ' ' + desc)
      const zipCode = extractZipCode(desc || item.title || '')

      // Extract city from title if possible (CL often has "city" in parens)
      const cityMatch = item.title.match(/\(([^)]+)\)\s*$/)
      const city = cityMatch ? cityMatch[1].trim() : null

      const { error } = await supabase.from('fliply_listings').upsert({
        source_id: sourceId,
        market_id: marketId,
        external_id: externalId,
        title: item.title.replace(/\([^)]*\)\s*$/, '').trim(), // Remove trailing (city)
        description: desc || null,
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
