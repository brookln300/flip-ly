/**
 * Local comps worker — grounds deal_score in real eBay market prices ($0).
 *
 * Runs on Keith's PC (residential IP dodges the eBay bot-block that 403s Vercel).
 * eBay has NO sold-data API, and sold-search scraping is heavily blocked — so we
 * gauge off ACTIVE listings (what others are ASKING). Asking > sold, so a CL item
 * priced clearly BELOW the eBay asking-median is a genuine deal signal. We try
 * sold-search first (better signal); if it returns too little, fall back to active.
 *
 * For each priced, decently-scored DFW listing: fetch comp median → margin_pct →
 * ELEVATE deal_score into the 8-10 hot band ONLY when margin is comp-verified
 * (the local LLM is capped at 7; comps own 8-10). Sets comp_median_cents + is_hot.
 *
 * Run:  node scripts/local-comps.mjs      (reads flip-ly-app/.env.local)
 * Schedule: Windows Task Scheduler, nightly AFTER local-enrich.
 *
 * Optional env: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → pings newly comp-verified
 * hot deals (score >= 9) to Telegram, deduped via alerted_at.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
const execFileP = promisify(execFile)

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MARKET_ID = process.env.MARKET_ID || '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const MAX = parseInt(process.env.COMPS_MAX || '150', 10)
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT = process.env.TELEGRAM_CHAT_ID
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
// eBay bot-blocks plain requests; this fuller browser header set gets real HTML.
const EBAY_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131"',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'none',
  'upgrade-insecure-requests': '1',
}
const TTL_MS = 14 * 24 * 60 * 60 * 1000

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.includes('PASTE_YOUR')) {
  console.error('Missing/placeholder Supabase creds in .env.local.'); process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const STOP = new Set(['for', 'sale', 'the', 'and', 'with', 'new', 'used', 'obo', 'nice', 'great', 'excellent', 'condition', 'good', 'lot', 'set', 'of', 'a', 'an', 'in', 'or', 'brand', 'like', 'very', 'must', 'go', 'free', 'price', 'firm', 'each'])
function normalizeQuery(title) {
  return (title || '').toLowerCase().replace(/[^\w\s.-]/g, ' ').replace(/\$[\d,]+/g, ' ')
    .split(/\s+/).filter(t => t.length > 1 && !STOP.has(t)).slice(0, 6).join(' ').trim().slice(0, 80)
}
function median(a) { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) }

async function fetchHtml(base) {
  // eBay fingerprints node's fetch (TLS/HTTP2) and 403s it, but lets curl
  // through with browser headers. Shell to curl (built into Windows 10+).
  if (process.env.SCRAPINGBEE_API_KEY) {
    const u = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(base)}`
    const r = await fetch(u); return r.ok ? r.text() : null
  }
  const args = ['-s', '--compressed', '--max-time', '20', '-A', UA]
  for (const [k, v] of Object.entries(EBAY_HEADERS)) { if (k !== 'User-Agent') args.push('-H', `${k}: ${v}`) }
  args.push('-b', 'dp1=;', base)
  // eBay throttles rapid requests to an empty body — retry a couple times with backoff.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { stdout } = await execFileP('curl', args, { maxBuffer: 25 * 1024 * 1024, windowsHide: true })
      if (stdout && stdout.length > 50000) return stdout
    } catch {}
    await new Promise(r => setTimeout(r, 2500 * (attempt + 1)))
  }
  return null
}

async function scrapeEbay(query, sold) {
  const base = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_ipg=60${sold ? '&LH_Sold=1&LH_Complete=1' : ''}`
  try {
    const html = await fetchHtml(base)
    if (!html || /pardon our interruption|Checking your browser/i.test(html)) return null // bot wall
    // New eBay markup: su-item-card__price. Fall back to legacy s-item__price.
    const blocks = html.match(/su-item-card__price"[^>]*>\s*\$[\d,]+\.\d{2}/g)
      || html.match(/s-item__price[^$]*\$[\d,]+\.\d{2}/g) || []
    const prices = []
    for (const b of blocks) { const m = b.match(/\$([\d,]+\.\d{2})/); if (m) { const c = Math.round(parseFloat(m[1].replace(/,/g, '')) * 100); if (c > 200) prices.push(c) } }
    const clean = prices.slice(1) // drop eBay's leading placeholder result
    if (clean.length < 3) return null
    const med = median(clean)
    const trimmed = clean.filter(p => p >= med / 4 && p <= med * 4)
    const use = trimmed.length >= 3 ? trimmed : clean
    return { median: median(use), low: Math.min(...use), high: Math.max(...use), n: use.length, source: sold ? 'ebay_sold' : 'ebay_active' }
  } catch { return null }
}

async function getComp(query) {
  if (!query || query.length < 4) return null
  const { data: cached } = await supabase.from('fliply_comps').select('*').eq('query_norm', query).maybeSingle()
  if (cached && Date.now() - new Date(cached.updated_at).getTime() < TTL_MS) {
    return cached.median_cents ? { median: cached.median_cents, low: cached.low_cents, high: cached.high_cents, n: cached.sample_size, source: cached.source } : null
  }
  let comp = await scrapeEbay(query, true)          // prefer sold
  if (!comp) comp = await scrapeEbay(query, false)  // fall back to active asking
  await supabase.from('fliply_comps').upsert({
    query_norm: query, median_cents: comp?.median ?? null, low_cents: comp?.low ?? null,
    high_cents: comp?.high ?? null, sample_size: comp?.n ?? 0, source: comp?.source ?? 'none',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'query_norm' })
  return comp
}

// Comps own the 8-10 band. Thresholds are conservative because active-asking
// medians skew high vs true sold (being under asking is a weaker signal than
// under sold). Below 35% margin, keep the LLM's score (capped 7).
function elevate(baseScore, marginPct, source) {
  if (marginPct == null) return baseScore
  const strict = source === 'ebay_active' // asking-based → demand more margin
  if (marginPct >= (strict ? 70 : 60)) return 10
  if (marginPct >= (strict ? 55 : 45)) return 9
  if (marginPct >= (strict ? 40 : 30)) return 8
  return baseScore
}

async function tgPing(l, score, marginPct, comp) {
  if (!TG_TOKEN || !TG_CHAT) return
  const text = `🔥 <b>Comp-verified deal — score ${score} · ${marginPct}% under market</b>\n${l.title}\n${l.price_text || ''} vs ~$${Math.round(comp.median / 100).toLocaleString()} ${comp.source === 'ebay_sold' ? 'sold' : 'asking'} on eBay${l.source_url ? `\n${l.source_url}` : ''}`
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    await supabase.from('fliply_listings').update({ alerted_at: new Date().toISOString() }).eq('id', l.id)
  } catch {}
}

async function run() {
  const started = Date.now()
  const { data: listings } = await supabase
    .from('fliply_listings')
    .select('id, title, price_text, price_low_cents, deal_score, source_url, alerted_at')
    .eq('market_id', MARKET_ID)
    .is('duplicate_of', null)
    .is('comp_checked_at', null)
    .gte('deal_score', 5)
    .gt('price_low_cents', 500)
    .order('deal_score', { ascending: false })
    .limit(MAX)

  if (!listings || listings.length === 0) { console.log('No listings need comps.'); return }

  let matched = 0, elevated = 0, pinged = 0
  for (const l of listings) {
    const comp = await getComp(normalizeQuery(l.title))
    const update = { comp_checked_at: new Date().toISOString() }
    if (comp?.median) {
      const marginPct = Math.round(((comp.median - l.price_low_cents) / comp.median) * 100)
      const newScore = elevate(l.deal_score, marginPct, comp.source)
      update.comp_median_cents = comp.median
      update.margin_pct = marginPct
      update.deal_score = newScore
      update.is_hot = newScore >= 8
      matched++
      if (newScore > l.deal_score) elevated++
      await supabase.from('fliply_listings').update(update).eq('id', l.id)
      if (newScore >= 9 && !l.alerted_at) { await tgPing({ ...l, price_text: l.price_text }, newScore, marginPct, comp); pinged++ }
    } else {
      await supabase.from('fliply_listings').update(update).eq('id', l.id)
    }
    await new Promise(r => setTimeout(r, 1500)) // polite to eBay
  }

  console.log(`Comps: checked ${listings.length}, matched ${matched}, elevated ${elevated} to 8-10, pinged ${pinged}. ${((Date.now() - started) / 1000).toFixed(0)}s, $0.`)
}

run().catch(e => { console.error(e); process.exit(1) })
