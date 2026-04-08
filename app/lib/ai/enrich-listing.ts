import { callHaiku } from './claude'
import { supabase } from '../supabase'

const SYSTEM_PROMPT = `You are a deal analysis engine for flip-ly.net. Given listings, return structured JSON.

Rules:
- description: 1-2 sentences. Rewrite raw title into something useful. Be specific about likely item categories.
- deal_score: 1-10 integer. Score based on FLIP PROFIT POTENTIAL, not just sale type:
  * 1-3: Generic sale, no price signals, vague items, likely picked-over
  * 4-5: Average — standard garage sale or event with common items
  * 6-7: Good — mentions specific brands, tools, electronics, vintage, or bulk items. Prices mentioned and seem low.
  * 8-9: Great — clear underpriced items, estate liquidation with valuable categories, "everything must go" + specific high-value items named
  * 10: Exceptional — rare/collectible items at clearly below-market prices
  A generic "garage sale" with no details should score 4-5, NOT 7+. Estate sales without specific items should score 5-6. Only score 8+ when there are concrete signals of profit opportunity.
- deal_score_reason: One sentence with specific evidence from the listing.
- tags: Array from ONLY: tools, furniture, electronics, vintage, kids, clothing, sports, books, kitchen, outdoor, automotive, collectibles, free, home-decor, musical
- event_type: Exactly one of: garage_sale, estate_sale, moving_sale, flea_market, auction, community_sale, thrift, event, listing
- resale_flag: true ONLY if specific items mentioned likely have 3x+ resale value on eBay
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
 * Processes up to 5 listings per Haiku call (~$0.003 per batch).
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
    maxTokens: 2000,
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
 * Process all unenriched listings in batches of 5.
 */
export async function enrichAllPending(): Promise<{ enriched: number; batches: number }> {
  // Fetch ALL unenriched listings, oldest first, so none get orphaned
  const { data: pending } = await supabase
    .from('fliply_listings')
    .select('id, title, description, price_text, price_low_cents, city, state, event_date, source_type')
    .is('enriched_at', null)
    .order('scraped_at', { ascending: true })
    .limit(200)

  if (!pending || pending.length === 0) return { enriched: 0, batches: 0 }

  let totalEnriched = 0
  let batches = 0

  // Process in batches of 5
  for (let i = 0; i < pending.length; i += 5) {
    const batch = pending.slice(i, i + 5)
    const count = await enrichListingBatch(batch)
    totalEnriched += count
    batches++
  }

  console.log(`[ENRICH] ${totalEnriched} listings enriched in ${batches} batches`)
  return { enriched: totalEnriched, batches }
}
