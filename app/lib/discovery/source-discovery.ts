import { supabase } from '../supabase'
import { sendTelegramAlert } from '../telegram'
import { trackEvent } from '../analytics'

/**
 * Market source activation on signup.
 *
 * With the 009 migration, CL + Eventbrite sources are pre-seeded for all 414
 * markets as is_active=false. This function just flips them to active.
 *
 * AI research for local sources (Claude Haiku) is now handled by the hourly
 * /api/cron/discover-sources cron — no more fire-and-forget inline.
 *
 * Fire-and-forget — call without await so it doesn't block signup.
 */
export function discoverSourcesForMarket(marketId: string) {
  _activateMarketSources(marketId).catch((err) => {
    console.error('[DISCOVERY] Failed for market', marketId, err.message)
  })
}

async function _activateMarketSources(marketId: string) {
  // Fetch market details
  const { data: market } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, cl_subdomain')
    .eq('id', marketId)
    .single()

  if (!market) {
    console.log(`[DISCOVERY] Market not found: ${marketId}`)
    return
  }

  const marketName = market.display_name || market.name

  // Activate all pre-seeded sources for this market
  const { data: activated } = await supabase
    .from('fliply_sources')
    .update({ is_active: true })
    .eq('market_id', market.id)
    .eq('is_approved', true)
    .eq('is_active', false)
    .select('name, source_type')

  const count = activated?.length || 0
  console.log(`[DISCOVERY] Activated ${count} pre-seeded sources for ${marketName}`)

  // Clear local_sources_researched_at so the hourly cron picks this market up
  // for AI research (it only researches active markets)
  await supabase
    .from('fliply_markets')
    .update({ local_sources_researched_at: null })
    .eq('id', market.id)
    .is('local_sources_researched_at', null) // no-op if already null

  if (count > 0) {
    const sourceList = activated!.map(s => `✅ ${s.name}`).join('\n')
    await sendTelegramAlert([
      `<b>Market Activated</b>`,
      `${marketName}, ${market.state}`,
      ``,
      `<b>Sources activated (${count}):</b>`,
      sourceList,
      ``,
      `AI local research queued for next hourly cron.`,
    ].join('\n'))
  }

  trackEvent('market_activated', {
    market: market.cl_subdomain,
    market_name: marketName,
    state: market.state,
    sources_activated: count,
  })
}
