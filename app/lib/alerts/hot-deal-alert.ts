import { supabase } from '../supabase'
import { sendTelegramAlert } from '../telegram'

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const MAX_PER_RUN = 10

/**
 * Instant hot-deal alerts — the family's top feature.
 *
 * After enrichment scores fresh listings, ping the Telegram chat with the
 * standouts: deal_score >= 9 OR verified margin_pct >= 50 (real eBay comps).
 * Deduped via alerted_at so each listing pings once. Non-fatal by design —
 * a Telegram hiccup must never break the enrich cron.
 *
 * When the saved-search UI ships, this becomes the "instant" tier alongside
 * per-user saved-search matching.
 */
export async function runHotDealAlerts(): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const nowIso = new Date().toISOString()

  const { data: hits } = await supabase
    .from('fliply_listings')
    .select('id, title, price_text, deal_score, deal_score_reason, city, state, source_url, margin_pct, comp_median_cents, ai_tags')
    .eq('market_id', DFW_MARKET_ID)
    .is('alerted_at', null)
    .gte('scraped_at', dayAgo)
    .or('deal_score.gte.9,margin_pct.gte.50')
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order('deal_score', { ascending: false })
    .limit(MAX_PER_RUN)

  if (!hits || hits.length === 0) return 0

  let sent = 0
  for (const h of hits) {
    const tag = (h.ai_tags && h.ai_tags[0]) || 'listing'
    const loc = [h.city, h.state].filter(Boolean).join(', ')
    const lines = [
      `🔥 <b>Hot deal — score ${h.deal_score}${h.margin_pct != null ? ` · ${h.margin_pct}% margin` : ''}</b>`,
      `${h.title}`,
      `${h.price_text || 'Price n/a'}${h.comp_median_cents ? ` · ~$${Math.round(h.comp_median_cents / 100).toLocaleString()} sold on eBay` : ''} · ${tag}${loc ? ` · ${loc}` : ''}`,
    ]
    if (h.deal_score_reason) lines.push(`<i>${h.deal_score_reason}</i>`)
    if (h.source_url) lines.push(h.source_url)

    try {
      await sendTelegramAlert(lines.join('\n'))
      await supabase.from('fliply_listings').update({ alerted_at: new Date().toISOString() }).eq('id', h.id)
      sent++
    } catch {
      // leave alerted_at null → retry next run
    }
  }

  return sent
}
