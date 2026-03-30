import { supabase } from '../supabase'
import { sendTelegramAlert } from '../telegram'
import { trackEvent } from '../analytics'
import { researchLocalSources } from './claude-research'

/**
 * Market-based source discovery.
 * Runs once per market lifetime (when first user signs up).
 *
 * Gate logic:
 *   - Market already has sources_discovered_at? → SKIP (already scouted)
 *   - Market has cl_subdomain? → Auto-create CL source (always)
 *   - Then run AI/Brave research for bonus local sources
 *
 * Fire-and-forget — call without await so it doesn't block signup.
 */
export function discoverSourcesForMarket(marketId: string) {
  _discover(marketId).catch((err) => {
    console.error('[DISCOVERY] Failed for market', marketId, err.message)
  })
}

async function _discover(marketId: string) {
  // Fetch market details
  const { data: market } = await supabase
    .from('fliply_markets')
    .select('*')
    .eq('id', marketId)
    .single()

  if (!market) {
    console.log(`[DISCOVERY] Market not found: ${marketId}`)
    return
  }

  // Gate: already discovered?
  if (market.sources_discovered_at) {
    console.log(`[DISCOVERY] Sources already discovered for ${market.name} — skipping`)
    return
  }

  const marketName = market.display_name || market.name
  console.log(`[DISCOVERY] Starting source discovery for ${marketName}`)
  const discoveredSources: string[] = []

  // ── 1. Always add Craigslist (we have the subdomain from CL data) ──
  if (market.cl_subdomain) {
    const clName = `Craigslist ${marketName} Garage Sales`
    const { error } = await supabase.from('fliply_sources').upsert({
      market_id: market.id,
      name: clName,
      source_type: 'craigslist_rss',
      config: {
        rss_url: `https://${market.cl_subdomain}.craigslist.org/search/gms?format=rss`,
        hostname: market.cl_subdomain,
        area_id: market.cl_area_id,
      },
      discovery_method: 'auto_craigslist',
      confidence: 1.0,
      ai_confidence: 10,
      trust_level: 'approved',
      scrape_frequency_hours: 12,
      is_active: true,
      is_approved: true,
    }, { onConflict: 'market_id,name', ignoreDuplicates: true })

    if (!error) discoveredSources.push(`Craigslist (${market.cl_subdomain})`)
  }

  // ── 2. Always add Eventbrite (geo search by lat/lng) ──
  if (market.center_lat && market.center_lng) {
    const ebName = `Eventbrite ${marketName} Events`
    const { error } = await supabase.from('fliply_sources').upsert({
      market_id: market.id,
      name: ebName,
      source_type: 'eventbrite_api',
      config: {
        latitude: market.center_lat,
        longitude: market.center_lng,
        radius: '30mi',
        keywords: ['garage sale', 'estate sale', 'flea market', 'swap meet'],
        city_slug: `${market.state.toLowerCase()}--${marketName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      },
      discovery_method: 'auto_eventbrite',
      confidence: 1.0,
      ai_confidence: 10,
      trust_level: 'approved',
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true,
    }, { onConflict: 'market_id,name', ignoreDuplicates: true })

    if (!error) discoveredSources.push(`Eventbrite (${marketName})`)
  }

  // ── 3. AI research for local sources (city-specific) ──
  // Extract city name from CL description (e.g., "dallas / fort worth" → "Dallas")
  const cityName = marketName.split('/')[0].trim()
  const research = await researchLocalSources(cityName, market.state)

  for (const source of research.sources) {
    if (source.confidence < 0.5) continue

    const { error } = await supabase.from('fliply_sources').insert({
      market_id: market.id,
      name: source.name,
      source_type: source.source_type,
      config: { url: source.url, description: source.description },
      discovery_method: 'auto_claude',
      confidence: source.confidence,
      ai_confidence: Math.round(source.confidence * 10),
      ai_reasoning: source.description,
      trust_level: 'pending',
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: false, // Requires Keith's approval
    })
    if (!error) discoveredSources.push(`${source.name} (pending approval)`)
  }

  // ── 4. Mark market as discovered ──
  await supabase
    .from('fliply_markets')
    .update({ sources_discovered_at: new Date().toISOString() })
    .eq('id', market.id)

  // ── 5. Telegram alert ──
  const pendingCount = research.sources.filter(s => s.confidence >= 0.5).length
  const alertLines = [
    `<b>New Market Activated</b> 🗺️`,
    `Market: ${marketName}, ${market.state}`,
    `CL: ${market.cl_subdomain}.craigslist.org`,
    ``,
    `<b>Sources Added:</b>`,
    ...discoveredSources.map(s => `- ${s}`),
  ]

  if (research.notes) {
    alertLines.push(``, `Notes: ${research.notes}`)
  }

  if (pendingCount > 0) {
    alertLines.push(``, `⚠️ ${pendingCount} source(s) pending your approval`)
  }

  await sendTelegramAlert(alertLines.join('\n'))

  // ── 6. GA4 tracking ──
  trackEvent('market_activated', {
    market: market.cl_subdomain,
    market_name: marketName,
    state: market.state,
    sources_count: discoveredSources.length,
    pending_approval: pendingCount,
  })

  console.log(`[DISCOVERY] Complete: ${marketName} — ${discoveredSources.length} sources`)
}
