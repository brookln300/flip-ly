/**
 * Local enrichment worker — $0 enrichment via Ollama on Keith's PC.
 *
 * Replaces the paid Anthropic enrich cron. Pulls unenriched DFW listings from
 * Supabase, scores them with a local model (hermes3:8b, GPU), writes back the
 * exact same fields the Vercel pipeline expects. Hot-deal Telegram alerts then
 * fire automatically (they key on alerted_at + deal_score, source-agnostic).
 *
 * Run:  node scripts/local-enrich.mjs
 * Schedule: Windows Task Scheduler, nightly (and/or on-demand).
 *
 * Env (local only — never commit the key):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (required)
 *   OLLAMA_HOST   (default http://localhost:11434)
 *   OLLAMA_MODEL  (default hermes3:8b)
 *   ENRICH_MAX    (default 4000)  — local is free, so cap high or unlimited
 *   BATCH_SIZE    (default 15)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load flip-ly-app/.env.local (gitignored) if present — no dotenv dep.
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* no .env.local — rely on process env */ }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'hermes3:8b'
const MARKET_ID = process.env.MARKET_ID || '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const MAX = parseInt(process.env.ENRICH_MAX || '4000', 10)
const BATCH = parseInt(process.env.BATCH_SIZE || '6', 10)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}
if (SUPABASE_KEY.includes('PASTE_YOUR')) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is still the placeholder — paste the real key into flip-ly-app/.env.local.')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const SYSTEM = `You are a resale deal-scoring engine for a Dallas–Fort Worth flipper. Given numbered listings, return JSON only.
Return: {"results":[{"n":INT the listing number this object is for, "deal_score":INT 1-10, "description":"1-2 sentence useful rewrite of THIS listing's title (brand/model/condition if inferable)", "deal_score_reason":"one sentence with specific resale evidence", "tags":[from ONLY: tools,furniture,electronics,vintage,kids,clothing,sports,books,kitchen,outdoor,automotive,collectibles,free,home-decor,musical], "event_type":"one of garage_sale,estate_sale,moving_sale,flea_market,auction,community_sale,thrift,event,listing", "resale_flag":BOOL true ONLY if this specific item likely resells for 2x+ its price}]}. Return exactly one object per listing. The "n" MUST match the listing number, and every field must describe that same listing — do not shift or reorder.
Score on FLIP PROFIT and BE CONSERVATIVE. Most listings are 3-6. The score reflects margin vs the STATED price, not desirability. Rules:
- A used/desirable item at or near typical market price = 3-5. Do NOT score high just because the brand is good (a MacBook at a normal price is a 4, not a 9).
- 6-7: known brand priced clearly 20-40% below typical resale.
- 8-9: high-demand item with a STATED price clearly 40-60%+ below typical resale (DeWalt/Milwaukee/Herman Miller/KitchenAid/retro consoles N64/SNES/Sega/sealed LEGO/graded cards).
- 10: rare/collector item at garage-sale pricing only.
- No stated price, "price n/a", or vague item → cap at 5. Never score 8+ on vibes or without a clearly below-market price.
- Generic garage sale, no details = 4-5. $1 on Craigslist = placeholder (make-offer), not real — cap individual $1 items at 5, resale_flag false unless text says "$1 each".
tags: pick only the 1-2 MOST relevant from the list; do not guess unrelated tags.`

async function ollamaBatch(listings) {
  const user = listings.map((l, i) =>
    `Listing ${i + 1}: ${l.title} — ${l.price_text || 'price n/a'} | ${l.city || ''} | src:${l.source_type || '?'}`
  ).join('\n')
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL, stream: false, format: 'json',
      options: { temperature: 0.2, num_ctx: 8192 },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `Analyze these ${listings.length} listings.\n${user}` }],
    }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.message.content)
  return parsed.results || []
}

async function run() {
  const started = Date.now()
  let total = 0, batches = 0

  while (total < MAX) {
    const { data: listings } = await supabase
      .from('fliply_listings')
      .select('id, title, price_text, price_low_cents, city, source_type')
      .eq('market_id', MARKET_ID)
      .is('enriched_at', null)
      .is('duplicate_of', null)
      .order('scraped_at', { ascending: false })
      .limit(BATCH)
    if (!listings || listings.length === 0) break

    let results
    try {
      results = await ollamaBatch(listings)
    } catch (e) {
      console.error('batch failed:', e.message); break
    }

    // Map results by their echoed listing number — never by array position
    // (the model can drop/reorder/merge elements; index-mapping misassigns).
    const byN = new Map()
    for (const r of results) {
      if (r && Number.isInteger(r.n) && r.n >= 1 && r.n <= listings.length) byN.set(r.n, r)
    }

    for (let i = 0; i < listings.length; i++) {
      const l = listings[i]
      const r = byN.get(i + 1)
      if (!r) continue // no matched result → leave unenriched, retry next run
      let score = Math.max(1, Math.min(10, parseInt(r.deal_score) || 3))
      let resale = !!r.resale_flag
      const isSaleEvent = ['garage_sale', 'estate_sale', 'moving_sale', 'community_sale', 'flea_market', 'auction'].includes(r.event_type)
      if (l.price_low_cents === 100 && !isSaleEvent && score > 5) { score = 5; resale = false }
      await supabase.from('fliply_listings').update({
        ai_description: r.description || l.title,
        deal_score: score,
        deal_score_reason: r.deal_score_reason || null,
        ai_tags: Array.isArray(r.tags) ? r.tags : [],
        event_type: r.event_type || 'listing',
        resale_flag: resale,
        is_hot: score >= 8,
        enriched_at: new Date().toISOString(),
      }).eq('id', l.id)
    }
    total += listings.length; batches++
    if (batches % 10 === 0) console.log(`  ${total} enriched...`)
  }

  const secs = ((Date.now() - started) / 1000).toFixed(0)
  console.log(`Done: ${total} listings in ${batches} batches, ${secs}s (${OLLAMA_MODEL}, local, $0).`)
}

run().catch(e => { console.error(e); process.exit(1) })
