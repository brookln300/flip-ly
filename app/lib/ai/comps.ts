import { supabase } from '../supabase'

/**
 * Resale-comp engine — grounds deal_score in real eBay sold prices.
 *
 * getComps(title) → normalized query → cached fliply_comps row (14d TTL) or a
 * fresh eBay sold-search scrape → { median, low, high, n } in cents.
 *
 * NOTE: eBay's sold-search HTML sometimes 403s Vercel datacenter IPs. Set
 * EBAY_SCRAPER_URL (a proxy that takes ?url=) or SCRAPINGBEE_API_KEY to route
 * around it. Without a proxy it best-effort direct-fetches and degrades to null
 * (no comp) — it never throws into the caller.
 */

const TTL_MS = 14 * 24 * 60 * 60 * 1000
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const STOPWORDS = new Set([
  'for', 'sale', 'the', 'and', 'with', 'new', 'used', 'obo', 'nice', 'great',
  'excellent', 'condition', 'good', 'lot', 'set', 'of', 'a', 'an', 'in', 'or',
  'brand', 'like', 'very', 'must', 'go', 'free', 'price', 'firm', 'each',
])

export function normalizeQuery(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\$[\d,]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
    .slice(0, 6)
    .join(' ')
    .trim()
    .slice(0, 80)
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

async function fetchEbaySold(query: string): Promise<{ median: number; low: number; high: number; n: number } | null> {
  const search = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_ipg=60`
  let url = search
  const headers: Record<string, string> = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
  if (process.env.SCRAPINGBEE_API_KEY) {
    url = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(search)}`
  } else if (process.env.EBAY_SCRAPER_URL) {
    url = `${process.env.EBAY_SCRAPER_URL}${encodeURIComponent(search)}`
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()

    // Sold prices render inside s-item__price spans. Grab dollar amounts.
    const priceBlocks = html.match(/s-item__price[^$]*\$[\d,]+\.\d{2}/g) || []
    const prices: number[] = []
    for (const b of priceBlocks) {
      const m = b.match(/\$([\d,]+\.\d{2})/)
      if (m) {
        const cents = Math.round(parseFloat(m[1].replace(/,/g, '')) * 100)
        if (cents > 0) prices.push(cents)
      }
    }
    // Drop the leading placeholder result eBay injects, and trim extreme outliers.
    const clean = prices.slice(1).filter(p => p >= 200) // ignore sub-$2 noise
    if (clean.length < 3) return null
    const med = median(clean)
    // outlier trim: keep within 4x of median both ways
    const trimmed = clean.filter(p => p >= med / 4 && p <= med * 4)
    const use = trimmed.length >= 3 ? trimmed : clean
    return {
      median: median(use),
      low: Math.min(...use),
      high: Math.max(...use),
      n: use.length,
    }
  } catch {
    return null
  }
}

export async function getComps(title: string): Promise<{ median: number; low: number; high: number; n: number } | null> {
  const q = normalizeQuery(title)
  if (!q || q.length < 4) return null

  const { data: cached } = await supabase
    .from('fliply_comps')
    .select('median_cents, low_cents, high_cents, sample_size, updated_at')
    .eq('query_norm', q)
    .maybeSingle()

  if (cached && Date.now() - new Date(cached.updated_at).getTime() < TTL_MS) {
    if (!cached.median_cents) return null
    return { median: cached.median_cents, low: cached.low_cents || 0, high: cached.high_cents || 0, n: cached.sample_size }
  }

  const fresh = await fetchEbaySold(q)
  // Cache the result either way (null = "checked, no comp") so we don't refetch for TTL.
  await supabase.from('fliply_comps').upsert({
    query_norm: q,
    median_cents: fresh?.median ?? null,
    low_cents: fresh?.low ?? null,
    high_cents: fresh?.high ?? null,
    sample_size: fresh?.n ?? 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'query_norm' })

  return fresh
}
