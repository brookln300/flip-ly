import { supabase } from '../supabase'
import { sendTelegramAlert } from '../telegram'
import { trackEvent } from '../analytics'
import { lookupZip, findMarket, createMarket } from './zip-lookup'
import { findCraigslistRegion } from './craigslist-regions'
import { researchLocalSources } from './claude-research'

/**
 * Main discovery orchestrator.
 * Given a zip code, discovers all available data sources.
 * Creates market if new. Caches everything in fliply_sources.
 * Sends Telegram alert for your approval.
 *
 * Fire-and-forget — call without await so it doesn't block signup.
 */
export function discoverSourcesForZip(zipCode: string, includeEvents: boolean = true) {
  // Run async, don't block caller
  _discover(zipCode, includeEvents).catch((err) => {
    console.error('[DISCOVERY] Failed for zip', zipCode, err.message)
  })
}

async function _discover(zipCode: string, includeEvents: boolean) {
  // Step 1: Look up zip code
  const zipData = await lookupZip(zipCode)
  if (!zipData) {
    console.log(`[DISCOVERY] Unknown zip: ${zipCode}`)
    return
  }

  const { city, state, latitude, longitude } = zipData

  // Step 2: Check if market already exists
  let market = await findMarket(city, state)
  if (market) {
    console.log(`[DISCOVERY] Market already exists: ${city}, ${state}`)
    return // Sources already discovered for this area
  }

  // Step 3: Create new market
  market = await createMarket(city, state, latitude, longitude)
  if (!market) {
    console.error(`[DISCOVERY] Failed to create market for ${city}, ${state}`)
    return
  }

  console.log(`[DISCOVERY] New market created: ${city}, ${state} (${market.id})`)
  const discoveredSources: string[] = []

  // Step 4: Always add Craigslist RSS (universal)
  const clRegion = await findCraigslistRegion(latitude, longitude)
  if (clRegion) {
    const { error } = await supabase.from('fliply_sources').insert({
      market_id: market.id,
      name: `Craigslist ${clRegion.hostname} Garage Sales`,
      source_type: 'craigslist_rss',
      config: { rss_url: clRegion.rssUrl, hostname: clRegion.hostname, area_id: clRegion.areaId },
      discovery_method: 'auto_craigslist',
      confidence: 1.0,
      scrape_frequency_hours: 12,
      is_active: true,
      is_approved: true, // Craigslist is always pre-approved
    })
    if (!error) discoveredSources.push(`Craigslist (${clRegion.hostname})`)
  }

  // Step 5: Always add Eventbrite (universal, searches by lat/lng)
  {
    const keywords = includeEvents
      ? ['garage sale', 'estate sale', 'flea market', 'swap meet', 'card show', 'antique show']
      : ['garage sale', 'estate sale', 'flea market']

    const { error } = await supabase.from('fliply_sources').insert({
      market_id: market.id,
      name: `Eventbrite ${city} Events`,
      source_type: 'eventbrite_api',
      config: { latitude, longitude, radius: '30mi', keywords, city_slug: `${state.toLowerCase()}--${city.toLowerCase().replace(/\s+/g, '-')}` },
      discovery_method: 'auto_eventbrite',
      confidence: 1.0,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true, // Eventbrite is always pre-approved
    })
    if (!error) discoveredSources.push(`Eventbrite (${city})`)
  }

  // Step 6: Claude AI research for local sources (city-specific)
  const research = await researchLocalSources(city, state, includeEvents)
  for (const source of research.sources) {
    if (source.confidence < 0.5) continue // Skip low-confidence results

    const { error } = await supabase.from('fliply_sources').insert({
      market_id: market.id,
      name: source.name,
      source_type: source.source_type,
      config: { url: source.url, description: source.description },
      discovery_method: 'auto_claude',
      confidence: source.confidence,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: false, // Requires your approval
    })
    if (!error) discoveredSources.push(`${source.name} (pending approval)`)
  }

  // Step 7: Telegram alert
  const alertLines = [
    `<b>New Market Discovered</b>`,
    `City: ${city}, ${state}`,
    `Zip: ${zipCode}`,
    ``,
    `<b>Sources Added:</b>`,
    ...discoveredSources.map((s) => `- ${s}`),
  ]

  if (research.notes) {
    alertLines.push(``, `Notes: ${research.notes}`)
  }

  const pendingCount = research.sources.filter((s) => s.confidence >= 0.5).length
  if (pendingCount > 0) {
    alertLines.push(``, `⚠️ ${pendingCount} source(s) pending your approval`)
  }

  await sendTelegramAlert(alertLines.join('\n'))

  // Step 8: GA4 tracking
  trackEvent('market_discovered', {
    city,
    state,
    zip_code: zipCode,
    sources_count: discoveredSources.length,
    pending_approval: pendingCount,
  })

  console.log(`[DISCOVERY] Complete: ${city}, ${state} — ${discoveredSources.length} sources`)
}
