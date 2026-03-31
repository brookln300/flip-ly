import { callHaiku } from './claude'
import { supabase } from '../supabase'

const SYSTEM_PROMPT = `You are a garage sale analysis engine for flip-ly.net. Given listings, return structured JSON with: a helpful description, a deal quality score, category tags, and a resale flag.

Rules:
- description: 1-2 sentences. Rewrite the raw title into something useful. Be specific about likely item categories.
- deal_score: 1-10 integer. Multi-family=higher, estate sale=higher, low prices=higher, "everything must go"=higher, early morning Saturday=higher. 1-3=skip, 4-6=average, 7-8=good, 9-10=treasure.
- deal_score_reason: One sentence justification.
- tags: Array from ONLY these values: tools, furniture, electronics, vintage, kids, clothing, sports, books, kitchen, outdoor, automotive, collectibles, free, home-decor, musical
- resale_flag: true if items likely have 3x+ resale value on eBay/marketplace

Respond with ONLY a valid JSON array, one object per listing, in order. No markdown.`

interface EnrichmentResult {
  description: string
  deal_score: number
  deal_score_reason: string
  tags: string[]
  resale_flag: boolean
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

    const { error } = await supabase.from('fliply_listings').update({
      ai_description: result.description,
      deal_score: result.deal_score,
      deal_score_reason: result.deal_score_reason,
      ai_tags: result.tags || [],
      is_hot: result.deal_score >= 8,
      enriched_at: new Date().toISOString(),
    }).eq('id', listing.id)

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
    .select('id, title, description, price_text, city, state, event_date, source_type')
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
