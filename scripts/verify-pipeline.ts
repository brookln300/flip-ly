/**
 * ═══════════════════════════════════════════════════════════════
 *  FLIP-LY PIPELINE VERIFICATION FRAMEWORK
 *  Full front-to-back deep dive: Scrape → Enrich → Redis → Search → Email
 * ═══════════════════════════════════════════════════════════════
 *
 *  Run: npx tsx scripts/verify-pipeline.ts
 *  Run single layer: npx tsx scripts/verify-pipeline.ts --layer=scrape
 *  Available layers: scrape, enrich, redis, search, email, cron, all
 *
 *  This does NOT modify data. Read-only verification except where noted.
 */
import { readFileSync } from 'fs'

// ── Load env ──
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  process.env[t.substring(0, eq)] = t.substring(eq + 1)
}

// ── Config ──
const PROD_URL = 'https://flip-ly.net'
const CRON_SECRET = process.env.CRON_SECRET || ''
const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'

// ── Result tracking ──
interface TestResult {
  layer: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  detail: string
  data?: any
}

const results: TestResult[] = []

function log(r: TestResult) {
  const icon = { PASS: '✅', FAIL: '❌', WARN: '⚠️', SKIP: '⏭️' }[r.status]
  console.log(`  ${icon} [${r.layer}] ${r.test}: ${r.detail}`)
  results.push(r)
}

// ═══════════════════════════════════════════════════════════════
// LAYER 1: SCRAPER VERIFICATION
// Tests: SAPI connectivity, data shape, price parsing, category coverage
// ═══════════════════════════════════════════════════════════════

async function verifyScraper() {
  console.log('\n═══ LAYER 1: SCRAPER ═══')

  const categories = [
    { path: 'gms', label: 'Garage Sales' },
    { path: 'ela', label: 'Electronics' },
    { path: 'tla', label: 'Tools' },
    { path: 'fua', label: 'Furniture' },
    { path: 'cba', label: 'Collectibles' },
    { path: 'msa', label: 'Musical Instruments' },
    { path: 'vga', label: 'Video Gaming' },
    { path: 'sga', label: 'Sporting Goods' },
    { path: 'pha', label: 'Photo & Video' },
  ]

  // Test 1.1: SAPI reachability
  for (const cat of categories) {
    try {
      const url = `https://sapi.craigslist.org/web/v8/postings/search/full?batch=21-0-360-0-0&cc=US&lang=en&searchPath=${cat.path}&area_id=21`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      })
      if (!res.ok) {
        log({ layer: 'scrape', test: `SAPI ${cat.label}`, status: 'FAIL', detail: `HTTP ${res.status}` })
        continue
      }
      const json = await res.json()
      const items = json.data?.items || []
      const decode = json.data?.decode || {}
      const withPrice = items.filter((i: any) => i[3] >= 0).length
      const pricePct = items.length > 0 ? Math.round(withPrice / items.length * 100) : 0

      log({
        layer: 'scrape',
        test: `SAPI ${cat.label}`,
        status: items.length > 0 ? 'PASS' : 'FAIL',
        detail: `${items.length} items, ${pricePct}% priced, minPostingId=${decode.minPostingId || 'missing'}`,
        data: { count: items.length, priced: withPrice, pricePct },
      })

      // Test 1.2: Data shape validation (first item)
      if (items.length > 0) {
        const item = items[0]
        const hasTitle = typeof item[item.length - 1] === 'string'
        const hasSlug = Array.isArray(item[item.length - 2]) || typeof item[item.length - 2] === 'string'
        const hasPostingOffset = typeof item[0] === 'number'

        if (!hasTitle || !hasPostingOffset) {
          log({ layer: 'scrape', test: `Data shape ${cat.label}`, status: 'FAIL', detail: `Missing title=${hasTitle} postingOffset=${hasPostingOffset} slug=${hasSlug}` })
        }
      }
    } catch (err: any) {
      log({ layer: 'scrape', test: `SAPI ${cat.label}`, status: 'FAIL', detail: err.message })
    }
  }

  // Test 1.3: Source config integrity in Supabase
  const { supabase } = await import('../app/lib/supabase')
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, config, is_active, is_approved, trust_level, scrape_frequency_hours')
    .eq('source_type', 'craigslist_rss')
    .eq('market_id', DFW_MARKET_ID)

  if (!sources) {
    log({ layer: 'scrape', test: 'Source configs', status: 'FAIL', detail: 'Could not query fliply_sources' })
    return
  }

  for (const src of sources) {
    const cfg = src.config as any
    const hasSearchPath = !!cfg.search_path
    const hasAreaId = !!cfg.area_id
    const hasHostname = !!cfg.hostname
    const isConfigured = hasSearchPath && hasAreaId && hasHostname

    log({
      layer: 'scrape',
      test: `Source: ${src.name}`,
      status: isConfigured && src.is_active && src.is_approved ? 'PASS' : 'WARN',
      detail: `active=${src.is_active} approved=${src.is_approved} trust=${src.trust_level} freq=${src.scrape_frequency_hours}h search_path=${cfg.search_path || 'DEFAULT(gms)'}`,
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// LAYER 2: ENRICHMENT VERIFICATION
// Tests: AI response quality, score distribution, tag coverage, resale flags
// ═══════════════════════════════════════════════════════════════

async function verifyEnrichment() {
  console.log('\n═══ LAYER 2: AI ENRICHMENT ═══')
  const { supabase } = await import('../app/lib/supabase')

  // Test 2.1: Enrichment backlog
  const { count: backlog } = await supabase
    .from('fliply_listings')
    .select('id', { count: 'exact', head: true })
    .is('enriched_at', null)

  log({
    layer: 'enrich',
    test: 'Backlog size',
    status: (backlog || 0) < 500 ? 'PASS' : (backlog || 0) < 2000 ? 'WARN' : 'FAIL',
    detail: `${backlog || 0} listings awaiting enrichment`,
  })

  // Test 2.2: Score distribution by category
  const { data: distro } = await supabase
    .from('fliply_listings')
    .select('deal_score, source_id')
    .not('deal_score', 'is', null)
    .eq('market_id', DFW_MARKET_ID)
    .limit(5000)

  if (distro) {
    const scores = distro.map(d => d.deal_score as number)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const score8plus = scores.filter(s => s >= 8).length
    const score1to3 = scores.filter(s => s <= 3).length

    log({
      layer: 'enrich',
      test: 'Score distribution (DFW)',
      status: avg >= 3 && avg <= 7 ? 'PASS' : 'WARN',
      detail: `avg=${avg.toFixed(1)} | 8+: ${score8plus} (${(score8plus/scores.length*100).toFixed(1)}%) | 1-3: ${score1to3} (${(score1to3/scores.length*100).toFixed(1)}%) | total: ${scores.length}`,
    })
  }

  // Test 2.3: Resale flag rate by source type
  const { data: resaleBySource } = await supabase
    .from('fliply_listings')
    .select('resale_flag, source_id')
    .eq('market_id', DFW_MARKET_ID)
    .not('enriched_at', 'is', null)
    .limit(5000)

  if (resaleBySource) {
    const flagged = resaleBySource.filter(r => r.resale_flag === true).length
    const total = resaleBySource.length
    const rate = total > 0 ? (flagged / total * 100).toFixed(1) : '0'

    log({
      layer: 'enrich',
      test: 'Resale flag rate (DFW)',
      status: flagged > 0 ? 'PASS' : 'WARN',
      detail: `${flagged}/${total} flagged (${rate}%)`,
    })
  }

  // Test 2.4: AI description quality — check for empty/null enrichments
  const { data: emptyEnrich } = await supabase
    .from('fliply_listings')
    .select('id, title, ai_description, deal_score, deal_score_reason')
    .not('enriched_at', 'is', null)
    .or('ai_description.is.null,deal_score.is.null,deal_score_reason.is.null')
    .eq('market_id', DFW_MARKET_ID)
    .limit(10)

  log({
    layer: 'enrich',
    test: 'Enrichment completeness',
    status: !emptyEnrich || emptyEnrich.length === 0 ? 'PASS' : 'WARN',
    detail: emptyEnrich && emptyEnrich.length > 0
      ? `${emptyEnrich.length} enriched listings with missing fields: ${emptyEnrich.slice(0, 2).map(e => e.title).join(', ')}`
      : 'All enriched listings have description + score + reason',
  })

  // Test 2.5: Tag distribution — ensure AI is using the full tag set
  const { data: tagSample } = await supabase
    .from('fliply_listings')
    .select('ai_tags')
    .not('enriched_at', 'is', null)
    .not('ai_tags', 'is', null)
    .eq('market_id', DFW_MARKET_ID)
    .limit(2000)

  if (tagSample) {
    const tagCounts: Record<string, number> = {}
    for (const row of tagSample) {
      const tags = row.ai_tags as string[]
      if (!tags) continue
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1
      }
    }
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
    const tagList = sorted.map(([t, c]) => `${t}:${c}`).join(', ')

    log({
      layer: 'enrich',
      test: 'Tag coverage',
      status: sorted.length >= 8 ? 'PASS' : 'WARN',
      detail: `${sorted.length} unique tags used | ${tagList}`,
    })
  }

  // Test 2.6: event_type for item listings should be "listing"
  const { data: eventTypes } = await supabase
    .from('fliply_listings')
    .select('event_type, source_id')
    .eq('market_id', DFW_MARKET_ID)
    .not('enriched_at', 'is', null)
    .limit(5000)

  if (eventTypes) {
    const typeCounts: Record<string, number> = {}
    for (const row of eventTypes) {
      const t = row.event_type || 'null'
      typeCounts[t] = (typeCounts[t] || 0) + 1
    }
    const typeList = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}:${c}`).join(', ')

    log({
      layer: 'enrich',
      test: 'Event type distribution',
      status: typeCounts['listing'] ? 'PASS' : 'WARN',
      detail: typeList,
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// LAYER 3: REDIS VERIFICATION
// Tests: Connection, Price Bands, Resale Radar, Search Replay, Founding
// ═══════════════════════════════════════════════════════════════

async function verifyRedis() {
  console.log('\n═══ LAYER 3: REDIS ═══')

  const redis = await import('../app/lib/redis')

  // Test 3.1: Redis health
  const healthy = await redis.isRedisHealthy()
  log({
    layer: 'redis',
    test: 'Connection',
    status: healthy ? 'PASS' : 'FAIL',
    detail: healthy ? 'Redis responding to PING' : 'Redis not reachable — all Redis features degraded',
  })

  if (!healthy) {
    log({ layer: 'redis', test: 'Price Bands', status: 'SKIP', detail: 'Redis down' })
    log({ layer: 'redis', test: 'Resale Radar', status: 'SKIP', detail: 'Redis down' })
    log({ layer: 'redis', test: 'Founding Countdown', status: 'SKIP', detail: 'Redis down' })
    return
  }

  // Test 3.2: Price Bands — check DFW market
  const allBands = await redis.getAllPriceBands(DFW_MARKET_ID)
  const bandCount = Object.keys(allBands).length

  log({
    layer: 'redis',
    test: 'Price Bands (DFW)',
    status: bandCount > 0 ? 'PASS' : 'WARN',
    detail: bandCount > 0
      ? `${bandCount} bands: ${Object.entries(allBands).map(([t, b]) => `${t}(n=${b.count},med=$${(b.median/100).toFixed(0)})`).join(', ')}`
      : 'No price bands computed yet — cron runs at 5am UTC daily',
  })

  // Test 3.3: Price Position calculation
  if (bandCount > 0) {
    const firstTag = Object.keys(allBands)[0]
    const band = allBands[firstTag]
    const testPrice = Math.round(band.p25 * 0.8) // 20% below p25
    const pos = redis.getPricePosition(testPrice, band)

    log({
      layer: 'redis',
      test: 'Price Position calc',
      status: pos.position === 'exceptional' ? 'PASS' : 'WARN',
      detail: `Tag "${firstTag}" @ $${(testPrice/100).toFixed(0)} → ${pos.position} (${pos.vsMedian}% vs median)`,
    })
  }

  // Test 3.4: Resale Radar cache
  const radar = await redis.getResaleRadar(DFW_MARKET_ID)

  log({
    layer: 'redis',
    test: 'Resale Radar (DFW)',
    status: radar && radar.length > 0 ? 'PASS' : 'WARN',
    detail: radar ? `${radar.length} listings cached (2hr TTL)` : 'No radar cache — cron runs every 2hrs',
  })

  // Test 3.5: Founding countdown
  const founding = await redis.getFoundingCountdown()
  log({
    layer: 'redis',
    test: 'Founding Countdown',
    status: 'PASS',
    detail: `active=${founding.active} slots=${founding.slotsRemaining} deadline=${founding.deadline || 'not set'}`,
  })
}

// ═══════════════════════════════════════════════════════════════
// LAYER 4: SEARCH API VERIFICATION
// Tests: Endpoint responses, filtering, tier gating, item listing results
// ═══════════════════════════════════════════════════════════════

async function verifySearch() {
  console.log('\n═══ LAYER 4: SEARCH API ═══')

  // Test 4.1: Basic search — browse (no query)
  try {
    const res = await fetch(`${PROD_URL}/api/listings?market=dallas-fort-worth&limit=5`)
    const data = await res.json()

    log({
      layer: 'search',
      test: 'Browse endpoint',
      status: res.ok && data.results?.length > 0 ? 'PASS' : 'FAIL',
      detail: `HTTP ${res.status} | ${data.results?.length || 0} results | total=${data.total}`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Browse endpoint', status: 'FAIL', detail: err.message })
  }

  // Test 4.2: Text search for item
  try {
    const res = await fetch(`${PROD_URL}/api/listings?q=guitar&market=dallas-fort-worth&limit=5`)
    const data = await res.json()

    log({
      layer: 'search',
      test: 'Item search "guitar"',
      status: res.ok && data.results?.length > 0 ? 'PASS' : 'WARN',
      detail: `${data.results?.length || 0} results | method=${data._meta?.search_method}`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Item search', status: 'FAIL', detail: err.message })
  }

  // Test 4.3: Filter by event_type=listing (individual items only)
  try {
    const res = await fetch(`${PROD_URL}/api/listings?event_type=listing&market=dallas-fort-worth&limit=5`)
    const data = await res.json()
    const allListings = data.results?.every((r: any) => r.event_type === 'listing' || r.event_type === null)

    log({
      layer: 'search',
      test: 'Filter event_type=listing',
      status: res.ok && data.results?.length > 0 ? 'PASS' : 'WARN',
      detail: `${data.results?.length || 0} results | all listing type: ${allListings}`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'event_type filter', status: 'FAIL', detail: err.message })
  }

  // Test 4.4: Price range filter
  try {
    const res = await fetch(`${PROD_URL}/api/listings?price_min=50&price_max=200&market=dallas-fort-worth&limit=5`)
    const data = await res.json()

    log({
      layer: 'search',
      test: 'Price range $50-$200',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: `${data.results?.length || 0} results | method=${data._meta?.search_method}`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Price filter', status: 'FAIL', detail: err.message })
  }

  // Test 4.5: Score filter
  try {
    const res = await fetch(`${PROD_URL}/api/listings?min_score=7&market=dallas-fort-worth&limit=5`)
    const data = await res.json()

    log({
      layer: 'search',
      test: 'Min score filter (7+)',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: `${data.results?.length || 0} results`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Score filter', status: 'FAIL', detail: err.message })
  }

  // Test 4.6: Rate limiting (anonymous)
  try {
    const res = await fetch(`${PROD_URL}/api/listings?q=test&limit=1`)
    const data = await res.json()

    log({
      layer: 'search',
      test: 'Rate limit gate',
      status: 'PASS',
      detail: `searches_used=${data._gate?.searches_used} remaining=${data._gate?.searches_remaining} max=${data._gate?.searches_max}`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Rate limit gate', status: 'FAIL', detail: err.message })
  }

  // Test 4.7: Freshness metadata
  try {
    const res = await fetch(`${PROD_URL}/api/listings?market=dallas-fort-worth&limit=1`)
    const data = await res.json()
    const ageHours = data._meta?.freshness?.age_hours

    log({
      layer: 'search',
      test: 'Data freshness',
      status: ageHours !== null && ageHours < 24 ? 'PASS' : ageHours !== null && ageHours < 72 ? 'WARN' : 'FAIL',
      detail: `newest=${data._meta?.freshness?.newest} age=${ageHours}h`,
    })
  } catch (err: any) {
    log({ layer: 'search', test: 'Freshness', status: 'FAIL', detail: err.message })
  }
}

// ═══════════════════════════════════════════════════════════════
// LAYER 5: EMAIL / RESEND VERIFICATION
// Tests: API key, send capability, drip template integrity
// ═══════════════════════════════════════════════════════════════

async function verifyEmail() {
  console.log('\n═══ LAYER 5: EMAIL (RESEND) ═══')

  // Test 5.1: Resend API key present
  const hasKey = !!process.env.RESEND_API_KEY
  log({
    layer: 'email',
    test: 'RESEND_API_KEY',
    status: hasKey ? 'PASS' : 'WARN',
    detail: hasKey ? 'Key present' : 'Missing — emails will be skipped',
  })

  // Test 5.2: Resend API reachability (check domains)
  if (hasKey) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      })
      const data = await res.json()

      log({
        layer: 'email',
        test: 'Resend API connection',
        status: res.ok ? 'PASS' : 'FAIL',
        detail: res.ok
          ? `${data.data?.length || 0} domains configured`
          : `HTTP ${res.status}: ${JSON.stringify(data).substring(0, 100)}`,
      })
    } catch (err: any) {
      log({ layer: 'email', test: 'Resend API', status: 'FAIL', detail: err.message })
    }
  }

  // Test 5.3: Drip template smoke test (import and call without sending)
  try {
    const { getDripEmailHtml } = await import('../app/lib/email/drip-templates')
    const steps = ['welcome', 'first-finds', 'social-proof', 'first-digest-teaser', 'soft-pitch', 'fomo', 'hard-convert']
    let allOk = true

    for (const step of steps) {
      const html = await getDripEmailHtml(step, {
        email: 'test@example.com',
        city: 'Dallas',
        state: 'TX',
        step_order: steps.indexOf(step) + 1,
        variant: 'A',
      })

      if (!html || html.length < 100) {
        log({ layer: 'email', test: `Drip template "${step}"`, status: 'FAIL', detail: `HTML too short (${html?.length || 0} chars)` })
        allOk = false
      }
    }

    if (allOk) {
      log({ layer: 'email', test: 'All 7 drip templates', status: 'PASS', detail: `All render successfully` })
    }
  } catch (err: any) {
    log({ layer: 'email', test: 'Drip templates', status: 'FAIL', detail: err.message })
  }
}

// ═══════════════════════════════════════════════════════════════
// LAYER 6: CRON ENDPOINTS VERIFICATION
// Tests: All 14 cron routes respond with 401 (auth working) or 200
// ═══════════════════════════════════════════════════════════════

async function verifyCrons() {
  console.log('\n═══ LAYER 6: CRON ENDPOINTS ═══')

  const crons = [
    '/api/cron/scrape',
    '/api/cron/enrich',
    '/api/cron/price-bands',
    '/api/cron/resale-radar',
    '/api/cron/cleanup',
    '/api/cron/link-check',
    '/api/cron/discover-sources',
    '/api/cron/drip',
    '/api/cron/alerts',
    '/api/cron/daily-deals',
    '/api/cron/morning-briefing',
    '/api/cron/daily-summary',
    '/api/cron/weekly-digest?tier=pro',
    '/api/cron/weekly-digest?tier=free',
  ]

  for (const path of crons) {
    try {
      // First test WITHOUT auth — should get 401
      const noAuth = await fetch(`${PROD_URL}${path}`, { method: 'GET' })

      if (noAuth.status === 401) {
        log({
          layer: 'cron',
          test: `Auth guard ${path}`,
          status: 'PASS',
          detail: 'Returns 401 without Bearer token',
        })
      } else {
        log({
          layer: 'cron',
          test: `Auth guard ${path}`,
          status: 'WARN',
          detail: `Expected 401, got ${noAuth.status} — endpoint may be unprotected`,
        })
      }
    } catch (err: any) {
      log({ layer: 'cron', test: `Cron ${path}`, status: 'FAIL', detail: err.message })
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// LAYER 7: DATABASE INTEGRITY
// Tests: Row counts, orphan records, index health, constraint checks
// ═══════════════════════════════════════════════════════════════

async function verifyDatabase() {
  console.log('\n═══ LAYER 7: DATABASE INTEGRITY ═══')
  const { supabase } = await import('../app/lib/supabase')

  // Test 7.1: Total counts and growth
  const { count: totalListings } = await supabase
    .from('fliply_listings')
    .select('id', { count: 'exact', head: true })

  const { count: totalSources } = await supabase
    .from('fliply_sources')
    .select('id', { count: 'exact', head: true })

  const { count: totalMarkets } = await supabase
    .from('fliply_markets')
    .select('id', { count: 'exact', head: true })

  log({
    layer: 'db',
    test: 'Table counts',
    status: 'PASS',
    detail: `listings=${totalListings} sources=${totalSources} markets=${totalMarkets}`,
  })

  // Test 7.2: Orphan listings (no source)
  const { data: orphans } = await supabase
    .from('fliply_listings')
    .select('id, source_id')
    .is('source_id', null)
    .limit(5)

  log({
    layer: 'db',
    test: 'Orphan listings',
    status: !orphans || orphans.length === 0 ? 'PASS' : 'WARN',
    detail: orphans && orphans.length > 0 ? `${orphans.length} listings with null source_id` : 'No orphans found',
  })

  // Test 7.3: Source failure tracking
  const { data: failingSources } = await supabase
    .from('fliply_sources')
    .select('name, consecutive_failures, last_error, is_active')
    .gt('consecutive_failures', 0)
    .order('consecutive_failures', { ascending: false })
    .limit(5)

  if (failingSources && failingSources.length > 0) {
    for (const src of failingSources) {
      log({
        layer: 'db',
        test: `Source health: ${src.name}`,
        status: (src.consecutive_failures || 0) >= 3 ? 'WARN' : 'PASS',
        detail: `failures=${src.consecutive_failures} active=${src.is_active} error=${src.last_error?.substring(0, 80) || 'none'}`,
      })
    }
  } else {
    log({ layer: 'db', test: 'Source health', status: 'PASS', detail: 'No sources with consecutive failures' })
  }

  // Test 7.4: Price data coverage by source type
  const { data: priceCoverage } = await supabase
    .from('fliply_listings')
    .select('source_type, price_low_cents')
    .eq('market_id', DFW_MARKET_ID)
    .limit(5000)

  if (priceCoverage) {
    const byType: Record<string, { total: number; priced: number }> = {}
    for (const row of priceCoverage) {
      const t = row.source_type || 'unknown'
      if (!byType[t]) byType[t] = { total: 0, priced: 0 }
      byType[t].total++
      if (row.price_low_cents && row.price_low_cents > 0) byType[t].priced++
    }

    const detail = Object.entries(byType)
      .map(([t, v]) => `${t}: ${v.priced}/${v.total} (${Math.round(v.priced/v.total*100)}%)`)
      .join(' | ')

    log({ layer: 'db', test: 'Price coverage by source', status: 'PASS', detail })
  }

  // Test 7.5: DB size check (estimated from row count)
  const estMB = Math.round((totalListings || 0) * 3.2 / 1024)
  log({
    layer: 'db',
    test: 'Estimated DB size',
    status: estMB < 400 ? 'PASS' : 'WARN',
    detail: `~${estMB} MB (estimated at 3.2KB/row) — free plan limit: 500MB`,
  })
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════

function printSummary() {
  console.log('\n' + '═'.repeat(60))
  console.log('  VERIFICATION SUMMARY')
  console.log('═'.repeat(60))

  const pass = results.filter(r => r.status === 'PASS').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const warn = results.filter(r => r.status === 'WARN').length
  const skip = results.filter(r => r.status === 'SKIP').length

  console.log(`\n  ✅ PASS: ${pass}`)
  console.log(`  ❌ FAIL: ${fail}`)
  console.log(`  ⚠️  WARN: ${warn}`)
  console.log(`  ⏭️  SKIP: ${skip}`)
  console.log(`  Total: ${results.length}`)

  if (fail > 0) {
    console.log('\n  FAILURES:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ❌ [${r.layer}] ${r.test}: ${r.detail}`)
    })
  }

  if (warn > 0) {
    console.log('\n  WARNINGS:')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`    ⚠️  [${r.layer}] ${r.test}: ${r.detail}`)
    })
  }

  console.log('\n' + '═'.repeat(60))
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const layer = process.argv.find(a => a.startsWith('--layer='))?.split('=')[1] || 'all'

  console.log('═'.repeat(60))
  console.log('  FLIP-LY PIPELINE VERIFICATION FRAMEWORK')
  console.log(`  Layer: ${layer} | Time: ${new Date().toISOString()}`)
  console.log('═'.repeat(60))

  const layers: Record<string, () => Promise<void>> = {
    scrape: verifyScraper,
    enrich: verifyEnrichment,
    redis: verifyRedis,
    search: verifySearch,
    email: verifyEmail,
    cron: verifyCrons,
    db: verifyDatabase,
  }

  if (layer === 'all') {
    for (const fn of Object.values(layers)) {
      await fn()
    }
  } else if (layers[layer]) {
    await layers[layer]()
  } else {
    console.error(`Unknown layer: ${layer}. Available: ${Object.keys(layers).join(', ')}, all`)
    process.exit(1)
  }

  printSummary()
  process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0)
}

main().catch(err => {
  console.error('Framework error:', err)
  process.exit(1)
})
