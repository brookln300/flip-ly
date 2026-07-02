export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const MAX_BATCH = 500

/**
 * Hermes → flip-ly ingestion seam.
 *
 * The external Hermes agent (and any off-Vercel worker) posts opportunities it
 * scraped from login/bot-walled sources (OfferUp, FB Marketplace, X, …) here.
 * Rows land with enriched_at=null so flip-ly's enrich cron scores + comps +
 * alerts them automatically — zero further flip-ly changes per new source.
 *
 * Auth: Bearer CRON_SECRET (same trust boundary as the crons). Hermes could
 * also write Supabase directly with the service role; this HTTP seam exists for
 * when it shouldn't hold DB creds.
 *
 * Body: {
 *   source_id: uuid,            // a fliply_sources row Hermes owns (is_active=false)
 *   source_type: string,        // 'offerup' | 'fb_marketplace' | 'x_post' | ...
 *   opportunity_type?: string,  // 'item' (default) | 'event' | 'gig' | 'arbitrage' | 'signal'
 *   listings: [{ external_id, title, price_text?, price_low_cents?, price_high_cents?,
 *                city?, state?, source_url?, image_url?, latitude?, longitude?, description? }]
 * }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { source_id, source_type, opportunity_type, listings } = body || {}
  if (!source_id || !source_type || !Array.isArray(listings)) {
    return NextResponse.json({ error: 'source_id, source_type, and listings[] required' }, { status: 400 })
  }
  if (listings.length === 0) return NextResponse.json({ inserted: 0 })
  if (listings.length > MAX_BATCH) {
    return NextResponse.json({ error: `Batch too large (max ${MAX_BATCH})` }, { status: 400 })
  }

  const now = new Date().toISOString()
  const rows = listings
    .filter((l: any) => l && l.external_id && l.title)
    .map((l: any) => ({
      source_id,
      market_id: DFW_MARKET_ID,
      external_id: String(l.external_id),
      title: String(l.title).slice(0, 500),
      description: l.description ?? l.city ?? null,
      price_text: l.price_text ?? null,
      price_low_cents: typeof l.price_low_cents === 'number' ? l.price_low_cents : null,
      price_high_cents: typeof l.price_high_cents === 'number' ? l.price_high_cents : null,
      city: l.city ?? null,
      state: l.state ?? 'TX',
      source_url: l.source_url ?? null,
      image_url: l.image_url ?? null,
      latitude: typeof l.latitude === 'number' ? l.latitude : null,
      longitude: typeof l.longitude === 'number' ? l.longitude : null,
      source_type: String(source_type),
      opportunity_type: opportunity_type || 'item',
      scraped_at: now,
    }))

  if (rows.length === 0) return NextResponse.json({ inserted: 0, skipped: listings.length })

  const { error } = await supabase
    .from('fliply_listings')
    .upsert(rows, { onConflict: 'source_id,external_id', ignoreDuplicates: false })

  if (error) {
    console.error('[INGEST] upsert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reflect activity on the source row so /system shows Hermes-feed health.
  await supabase.from('fliply_sources')
    .update({ last_scraped_at: now, last_result_count: rows.length, consecutive_failures: 0, last_error: null })
    .eq('id', source_id)

  return NextResponse.json({ inserted: rows.length, skipped: listings.length - rows.length })
}
