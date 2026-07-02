export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'
import { getComps } from '../../../lib/ai/comps'

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const MAX_PER_RUN = 30

/**
 * Resale-comp cron — grounds scores in real eBay sold prices.
 * Picks high-score DFW listings with a real price and no comp yet, fetches
 * comps (rate-limited to be polite to eBay), and stores comp_median_cents +
 * margin_pct. Decoupled from enrichment so external fetches never block scoring.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: listings } = await supabase
    .from('fliply_listings')
    .select('id, title, price_low_cents')
    .eq('market_id', DFW_MARKET_ID)
    .is('comp_checked_at', null)
    .gte('deal_score', 6)
    .gt('price_low_cents', 100)
    .order('deal_score', { ascending: false })
    .limit(MAX_PER_RUN)

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: 'No listings need comps', checked: 0 })
  }

  let withComp = 0
  let flips = 0
  const now = new Date().toISOString()

  for (const l of listings) {
    let comp: Awaited<ReturnType<typeof getComps>> = null
    try {
      comp = await getComps(l.title)
    } catch {
      comp = null
    }

    const update: Record<string, any> = { comp_checked_at: now }
    if (comp?.median && l.price_low_cents) {
      const marginPct = Math.round(((comp.median - l.price_low_cents) / comp.median) * 100)
      update.comp_median_cents = comp.median
      update.margin_pct = marginPct
      withComp++
      if (marginPct >= 40) flips++
    }
    await supabase.from('fliply_listings').update(update).eq('id', l.id)

    // Be polite to eBay between fetches (skip delay when served from cache is fine; keep simple).
    await new Promise(r => setTimeout(r, 1200))
  }

  const summary = [
    `<b>Comps</b> — checked ${listings.length}`,
    `Matched: ${withComp} · strong flips (≥40% margin): ${flips}`,
  ]
  if (withComp === 0) {
    summary.push('', '⚠️ 0 comps matched — eBay may be blocking Vercel IPs. Set SCRAPINGBEE_API_KEY or EBAY_SCRAPER_URL in Vercel.')
  }
  await sendTelegramAlert(summary.join('\n'))

  return NextResponse.json({ checked: listings.length, with_comp: withComp, strong_flips: flips })
}
