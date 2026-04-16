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

CRITICAL — $1 PLACEHOLDER PRICING:
On Craigslist, individual item listings priced at exactly $1 are almost NEVER actually $1. Sellers use $1 as a placeholder because Craigslist requires a price. It means "make an offer" or "see description for real price."
- For INDIVIDUAL ITEMS at $1: treat the price as UNKNOWN, not as $1. Score based on the item alone without assuming it's a steal. Cap these at deal_score 5 max unless the title/description explicitly confirms the $1 price (e.g. "$1 each", "everything $1").
- For SALE EVENTS (garage sales, estate sales) at $1: $1 pricing CAN be legitimate ("everything $1!"). Score normally based on other signals.
- Never calculate resale margins against a $1 placeholder price. Set resale_flag to false for $1 placeholder items.

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
    let finalScore = result.deal_score
    let finalResaleFlag = result.resale_flag || false
    let finalReason = result.deal_score_reason

    // ── $1 placeholder guard ──
    // CL individual items at $1 are placeholder prices, not real deals.
    // Hard cap: score ≤ 5 unless it's a sale event (garage_sale, estate_sale, etc.)
    const isPlaceholderPrice = listing.price_low_cents === 100
    const isSaleEvent = ['garage_sale', 'estate_sale', 'moving_sale', 'community_sale', 'flea_market', 'auction'].includes(result.event_type || '')
    if (isPlaceholderPrice && !isSaleEvent && finalScore > 5) {
      finalScore = 5
      finalResaleFlag = false
      finalReason = `[Score capped: $1 is a placeholder price on CL, not actual asking price] ${finalReason}`
    }

    const updateData: Record<string, any> = {
      ai_description: result.description,
      deal_score: finalScore,
      deal_score_reason: finalReason,
      ai_tags: result.tags || [],
      event_type: result.event_type || null,
      resale_flag: finalResaleFlag,
      is_hot: finalScore >= 8,
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
  let failedBatches = 0
  for (let w = 0; w < batches.length; w += concurrency) {
    const wave = batches.slice(w, w + concurrency)
    const results = await Promise.allSettled(
      wave.map(batch => enrichListingBatch(batch))
    )
    for (const r of results) {
      if (r.status === 'fulfilled') {
        totalEnriched += r.value
      } else {
        failedBatches++
        console.error(`[ENRICH] Batch failed: ${r.reason?.message || r.reason}`)
      }
    }
  }
  if (failedBatches > 0) {
    console.warn(`[ENRICH] ${failedBatches}/${batches.length} batches failed`)
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
 * Pre-filter: Fast-classify low-value Craigslist item listings without AI.
 * CL items average lower deal scores than sale events. Skip obvious junk:
 * - Generic titles with no brand/model (e.g. "couch for sale", "old dresser")
 * - Common low-value categories (basic furniture, clothing, kids toys)
 * - Items with $1 placeholder pricing AND no brand signals
 *
 * Items WITH brand names, model numbers, or price signals pass through to AI.
 */
async function fastClassifyCLItems(): Promise<number> {
  // Brand/model signals — if present, send to AI for proper scoring
  const valueSignals = [
    // Power tools
    'dewalt', 'milwaukee', 'makita', 'bosch', 'ridgid', 'ryobi', 'craftsman', 'snap-on', 'snap on',
    // Electronics
    'apple', 'iphone', 'ipad', 'macbook', 'samsung', 'sony', 'bose', 'lg', 'dell', 'lenovo',
    'nvidia', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'switch', 'oculus', 'meta quest',
    // Furniture brands
    'herman miller', 'steelcase', 'pottery barn', 'restoration hardware', 'west elm', 'crate and barrel',
    'mid-century', 'mid century', 'mcm', 'eames', 'knoll',
    // Kitchen/appliance
    'kitchenaid', 'kitchen aid', 'vitamix', 'le creuset', 'wolf', 'viking', 'sub-zero', 'breville',
    // Music
    'fender', 'gibson', 'martin', 'taylor', 'yamaha', 'roland', 'marshall', 'mesa boogie',
    // Outdoor/auto
    'yeti', 'traeger', 'weber', 'stihl', 'husqvarna', 'honda', 'toro',
    // Collectibles
    'vintage', 'antique', 'rare', 'collectible', 'limited edition', 'signed', 'first edition',
    'sterling silver', 'solid gold', '14k', '18k', 'rolex', 'omega',
    // Value signals
    'new in box', 'nib', 'sealed', 'mint condition', 'never used', 'never opened',
    'retail', 'msrp', 'paid $', 'worth $', 'sells for',
  ]

  // Low-value patterns — generic items unlikely to have flip margin
  const junkPatterns = [
    /^(old|used|nice|good|great|big|small|large)\s+(couch|sofa|dresser|desk|table|chair|bed|mattress|lamp|rug|mirror|shelf|bookcase)/i,
    /^(couch|sofa|dresser|desk|table|chair|bed frame|mattress|lamp|rug|mirror|shelf|bookcase)\s*(for sale)?$/i,
    /^(kids|baby|toddler)\s+(clothes|clothing|toys|shoes|items|stuff)/i,
    /^(women'?s?|men'?s?|girls?|boys?)\s+(clothes|clothing|shoes|jeans|shirts?)/i,
    /^(misc|miscellaneous|various|assorted|random)\s+(items?|stuff|things|household)/i,
    /^(moving|must go|need gone|free|curb|curbside)\s*$/i,
    /^(books|dvds?|cds?|vhs|tapes?|magazines?)\s*(for sale|lot)?$/i,
    /^(hangers|picture frames?|storage bins?|plastic bins?|cardboard boxes)/i,
  ]

  const { data: clItems } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_low_cents, source_type')
    .is('enriched_at', null)
    .eq('source_type', 'craigslist_rss')
    .order('scraped_at', { ascending: true })
    .limit(500)

  if (!clItems || clItems.length === 0) return 0

  let fastScored = 0
  for (const listing of clItems) {
    const titleLower = (listing.title || '').toLowerCase()
    const descLower = (listing.description || '').toLowerCase()
    const combined = titleLower + ' ' + descLower

    // If it has any brand/value signal, let AI handle it
    const hasValueSignal = valueSignals.some(s => combined.includes(s))
    if (hasValueSignal) continue

    // Check if title matches a junk pattern
    const isJunkTitle = junkPatterns.some(p => p.test(listing.title || ''))
    const isPlaceholderPrice = listing.price_low_cents === 100

    // Fast-classify if: junk title OR ($1 placeholder + no value signals)
    if (isJunkTitle || (isPlaceholderPrice && titleLower.length < 40)) {
      const score = isPlaceholderPrice ? 2 : 3
      const reason = isPlaceholderPrice
        ? 'Generic CL item with $1 placeholder price — no brand/model signals'
        : 'Generic low-value item — no brand, model, or flip indicators'

      const { error } = await supabase.from('fliply_listings').update({
        ai_description: listing.title,
        deal_score: score,
        deal_score_reason: reason,
        ai_tags: [],
        event_type: 'listing',
        resale_flag: false,
        is_hot: false,
        enriched_at: new Date().toISOString(),
      }).eq('id', listing.id)

      if (!error) fastScored++
    }
  }

  if (fastScored > 0) {
    console.log(`[ENRICH] Fast-classified ${fastScored} low-value CL items (skipped AI)`)
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
  const MAX_LISTINGS = options?.maxListings ?? 750
  const BATCH_SIZE = options?.batchSize ?? 15
  const CONCURRENCY = options?.concurrency ?? 5

  // Phase 0: Fast-classify obvious junk without AI
  const fastClassifiedEvents = await fastClassifyBulkEvents()
  const fastClassifiedCL = await fastClassifyCLItems()
  const fastClassified = fastClassifiedEvents + fastClassifiedCL

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
    .limit(Math.min(finalRemaining, 100))  // Cap Eventbrite overflow at 100 per run

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
