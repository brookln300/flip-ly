import { callHaiku } from './claude'
import { supabase } from '../supabase'

const SYSTEM_PROMPT = `You are a deal analysis engine for flip-ly.net. Given listings, return structured JSON.

Listings come in two forms:
1. SALE EVENTS (garage sales, estate sales, etc.) — score based on variety, motivation signals, and price signals
2. INDIVIDUAL ITEMS (electronics, tools, furniture, collectibles posted for sale) — score based on specific item value vs asking price

Rules:
- description: 1-2 sentences. Rewrite raw title into something useful. For individual items, include brand/model and condition if inferrable. For sales, be specific about likely item categories.
- deal_score: 1-10 integer. Score based on FLIP PROFIT POTENTIAL:
  FOR SALE EVENTS:
  * 1-3: Generic sale, no price signals, vague items, likely picked-over
  * 4-5: Average — standard garage sale or event with common items
  * 6-7: Good — mentions specific brands, tools, electronics, vintage, or bulk items. Prices mentioned and seem low.
  * 8-9: Great — clear underpriced items, estate liquidation with valuable categories, "everything must go" + specific high-value items named
  * 10: Exceptional — rare/collectible items at clearly below-market prices
  A generic "garage sale" with no details should score 4-5, NOT 7+. Estate sales without specific items should score 5-6.
  FOR INDIVIDUAL ITEMS:
  * 1-3: Common item at or above typical market price, no flip margin
  * 4-5: Decent item, priced near market value, minimal profit opportunity
  * 6-7: Known brand/model priced 20-40% below typical resale value. Clear margin exists.
  * 8-9: Specific high-demand item priced 40-60%+ below known resale. Brand items like DeWalt, Milwaukee, Herman Miller, KitchenAid, mid-century modern pieces, vintage audio.
  * 10: Collector/rare item at garage sale pricing. Resale 3x+ likely.
  Only score 8+ when there are concrete signals of profit opportunity.
- deal_score_reason: One sentence with specific evidence. For items: reference likely resale value if you can estimate it (e.g. "DeWalt 20V set at $60, typically resells for $120-150").
- tags: Array from ONLY: tools, furniture, electronics, vintage, kids, clothing, sports, books, kitchen, outdoor, automotive, collectibles, free, home-decor, musical
- event_type: Exactly one of: garage_sale, estate_sale, moving_sale, flea_market, auction, community_sale, thrift, event, listing
  Use "listing" for individual items posted for sale (not a sale event).
- resale_flag: true if specific items mentioned likely have 2x+ resale value on eBay/marketplace. For individual items with clear brand/model, be more aggressive with this flag — if the asking price is clearly below known market value, flag it.
- price_low_cents: If you can infer a low price from the title/description (e.g. "$5", "FREE"), return it in cents. Otherwise null.
- price_high_cents: If you can infer a high price or range (e.g. "$5-$50"), return high end in cents. Otherwise null.

Respond with ONLY a valid JSON array, one object per listing, in order. No markdown.`

interface EnrichmentResult {
  description: string
  deal_score: number
  deal_score_reason: string
  tags: string[]
  event_type?: string
  resale_flag: boolean
  price_low_cents?: number | null
  price_high_cents?: number | null
}

/**
 * Enrich a batch of listings with AI descriptions, scores, and tags.
 * Processes up to 10 listings per Haiku call (~$0.005 per batch).
 */
export async function enrichListingBatch(listings: {
  id: string
  title: string
  description: string | null
  price_text: string | null
  price_low_cents: number | null
  city: string | null
  state: string | null
  event_date: string | null
  source_type: string | null
}[]): Promise<number> {
  if (listings.length === 0) return 0

  const userMessage = listings.map((l, i) =>
    `Listing ${i + 1}:
Title: ${l.title}
Description: ${l.description || 'none'}
Price: ${l.price_text || 'not listed'}
Location: ${l.city || 'unknown'}, ${l.state || ''}
Date: ${l.event_date || 'unknown'}
Source: ${l.source_type || 'unknown'}`
  ).join('\n\n')

  const { parsed } = await callHaiku<EnrichmentResult[]>({
    system: SYSTEM_PROMPT,
    userMessage: `Analyze these ${listings.length} listings. Return a JSON array with one object per listing, in order.\n\n${userMessage}`,
    maxTokens: 4000,
  })

  if (!parsed || !Array.isArray(parsed)) {
    console.error('[ENRICH] Failed to parse AI response')
    return 0
  }

  let enriched = 0
  for (let i = 0; i < Math.min(listings.length, parsed.length); i++) {
    const result = parsed[i]
    const listing = listings[i]

    // Build update payload
    const updateData: Record<string, any> = {
      ai_description: result.description,
      deal_score: result.deal_score,
      deal_score_reason: result.deal_score_reason,
      ai_tags: result.tags || [],
      event_type: result.event_type || null,
      resale_flag: result.resale_flag || false,
      is_hot: result.deal_score >= 8,
      enriched_at: new Date().toISOString(),
    }

    // Backfill prices from AI extraction when listing has no price data
    if (!listing.price_low_cents && result.price_low_cents != null) {
      updateData.price_low_cents = result.price_low_cents
      updateData.price_high_cents = result.price_high_cents ?? result.price_low_cents
      updateData.price_text = result.price_low_cents === 0 ? 'FREE'
        : result.price_high_cents && result.price_high_cents !== result.price_low_cents
          ? `$${result.price_low_cents / 100} - $${result.price_high_cents / 100}`
          : `$${result.price_low_cents / 100}`
    }

    const { error } = await supabase.from('fliply_listings').update(updateData).eq('id', listing.id)

    if (!error) enriched++
  }

  return enriched
}

/**
 * Process a chunk of listings in parallel batches.
 * Runs CONCURRENCY batches simultaneously for speed.
 */
async function processChunk(listings: any[], batchSize: number, concurrency: number): Promise<number> {
  let totalEnriched = 0
  const batches: any[][] = []

  for (let i = 0; i < listings.length; i += batchSize) {
    batches.push(listings.slice(i, i + batchSize))
  }

  // Process in waves of CONCURRENCY parallel batches
  for (let w = 0; w < batches.length; w += concurrency) {
    const wave = batches.slice(w, w + concurrency)
    const results = await Promise.allSettled(
      wave.map(batch => enrichListingBatch(batch))
    )
    for (const r of results) {
      if (r.status === 'fulfilled') totalEnriched += r.value
    }
  }

  return totalEnriched
}

/**
 * Pre-filter: Aggressively fast-classify Eventbrite events that are NOT
 * garage sales, estate sales, or resale events. Eventbrite avg deal_score
 * is 2.3 — only 2% produce high-value listings. Don't waste AI calls.
 *
 * Only Eventbrite listings with sale/resale keywords get sent to AI.
 * Everything else gets auto-scored as a generic event.
 */
async function fastClassifyBulkEvents(): Promise<number> {
  // Keywords that indicate this Eventbrite event IS worth AI-enriching
  const resaleSignals = [
    'garage sale', 'yard sale', 'estate sale', 'moving sale',
    'flea market', 'swap meet', 'rummage sale', 'thrift',
    'antique', 'vintage', 'collectible', 'auction',
    'liquidation', 'clearance', 'everything must go',
    'barn sale', 'tag sale', 'community sale',
    'furniture', 'tools', 'electronics',
  ]

  // Fetch ALL unenriched Eventbrite listings (aggressive — process up to 500)
  const { data: bulkEvents } = await supabase
    .from('fliply_listings')
    .select('id, title, description, source_type')
    .is('enriched_at', null)
    .eq('source_type', 'eventbrite_api')
    .order('scraped_at', { ascending: true })
    .limit(500)

  if (!bulkEvents || bulkEvents.length === 0) return 0

  let fastScored = 0
  for (const listing of bulkEvents) {
    const titleLower = (listing.title || '').toLowerCase()
    const descLower = (listing.description || '').toLowerCase()
    const combined = titleLower + ' ' + descLower

    // If it matches ANY resale signal, let AI handle it
    const hasResaleSignal = resaleSignals.some(s => combined.includes(s))

    if (!hasResaleSignal) {
      // No resale signal = generic event, skip AI entirely
      const { error } = await supabase.from('fliply_listings').update({
        ai_description: listing.title,
        deal_score: 2,
        deal_score_reason: 'Non-resale event — no garage sale, estate sale, or flip indicators',
        ai_tags: [],
        event_type: 'event',
        is_hot: false,
        enriched_at: new Date().toISOString(),
      }).eq('id', listing.id)

      if (!error) fastScored++
    }
  }

  if (fastScored > 0) {
    console.log(`[ENRICH] Fast-classified ${fastScored} non-resale Eventbrite events (skipped AI)`)
  }
  return fastScored
}

/**
 * Process all unenriched listings with priority queue and parallel batching.
 *
 * Priority order:
 *   1. Listings with event_date within 48 hours (time-sensitive)
 *   2. Non-eventbrite listings (higher value density)
 *   3. Everything else (oldest first)
 *
 * Throughput: ~10 listings/batch × 3 concurrent = 30 listings per wave
 * At 200ms avg API response: ~500 listings per minute
 */
export async function enrichAllPending(options?: {
  maxListings?: number
  batchSize?: number
  concurrency?: number
}): Promise<{ enriched: number; fastClassified: number; batches: number }> {
  const MAX_LISTINGS = options?.maxListings ?? 500
  const BATCH_SIZE = options?.batchSize ?? 10
  const CONCURRENCY = options?.concurrency ?? 3

  // Phase 0: Fast-classify obvious generic events (no AI cost)
  const fastClassified = await fastClassifyBulkEvents()

  // Phase 1: Priority — time-sensitive listings (event within 48h)
  const { data: urgent } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_text, price_low_cents, city, state, event_date, source_type')
    .is('enriched_at', null)
    .gte('event_date', new Date().toISOString().split('T')[0])
    .lte('event_date', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(Math.floor(MAX_LISTINGS * 0.3))

  // Phase 2: HIGH VALUE — Craigslist, AI extract, estate sales, local sites
  // These sources avg 5.5+ deal score vs Eventbrite's 2.3. Process them first.
  const remaining = MAX_LISTINGS - (urgent?.length || 0)
  const { data: highValue } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_text, price_low_cents, city, state, event_date, source_type')
    .is('enriched_at', null)
    .in('source_type', ['craigslist_rss', 'ai_extract', 'local_site', 'city_permits'])
    .order('scraped_at', { ascending: true })
    .limit(Math.floor(remaining * 0.8))  // 80% of remaining capacity to high-value sources

  // Phase 3: Remaining Eventbrite (only ones that passed the resale signal filter)
  const finalRemaining = remaining - (highValue?.length || 0)
  const { data: overflow } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_text, price_low_cents, city, state, event_date, source_type')
    .is('enriched_at', null)
    .order('scraped_at', { ascending: true })
    .limit(Math.min(finalRemaining, 50))  // Cap Eventbrite overflow at 50 per run

  // Deduplicate (a listing could appear in multiple phases)
  const seen = new Set<string>()
  const allListings: any[] = []
  for (const list of [urgent || [], highValue || [], overflow || []]) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        allListings.push(item)
      }
    }
  }

  if (allListings.length === 0) {
    return { enriched: 0, fastClassified, batches: 0 }
  }

  const totalEnriched = await processChunk(allListings, BATCH_SIZE, CONCURRENCY)
  const totalBatches = Math.ceil(allListings.length / BATCH_SIZE)

  console.log(`[ENRICH] ${totalEnriched} enriched (${fastClassified} fast-classified) in ${totalBatches} batches | ${allListings.length} processed`)
  return { enriched: totalEnriched, fastClassified, batches: totalBatches }
}
