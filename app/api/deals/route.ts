export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

/**
 * Private DFW dealfinder feed — full filtering, no rate limit, full data.
 *
 * Powers the /deals explorer. Unlike /api/listings (the legacy freemium
 * endpoint with rate limits + progressive-reveal gating), this serves the
 * complete listing for the family super-user tool.
 *
 * Params (all optional):
 *   q          text match on title / ai_description
 *   tags       comma-separated ai_tags — ANY overlap (electronics,tools,…)
 *   price_min  dollars (inclusive)
 *   price_max  dollars (inclusive)
 *   score_min  1–10
 *   score_max  1–10
 *   event_type garage_sale, estate_sale, listing, …
 *   sort       score | newest | price_low | price_high
 *   limit      default 40, max 100
 *   offset     pagination
 */
const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'

function sanitize(text: string): string {
  return text.replace(/[,%_().*]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const q = (p.get('q') || '').trim()
  const tags = (p.get('tags') || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  const priceMin = p.get('price_min') ? Math.round(parseFloat(p.get('price_min')!) * 100) : null
  const priceMax = p.get('price_max') ? Math.round(parseFloat(p.get('price_max')!) * 100) : null
  const scoreMin = p.get('score_min') ? parseInt(p.get('score_min')!) : null
  const scoreMax = p.get('score_max') ? parseInt(p.get('score_max')!) : null
  const eventType = p.get('event_type') || null
  const sort = p.get('sort') || 'score'
  const limit = Math.max(1, Math.min(parseInt(p.get('limit') || '40') || 40, 100))
  const offset = Math.max(0, parseInt(p.get('offset') || '0') || 0)

  const nowIso = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  let dbq = supabase
    .from('fliply_listings')
    .select('id, title, price_text, price_low_cents, deal_score, deal_score_reason, ai_tags, ai_description, city, state, event_type, source_url, image_url, scraped_at, latitude, longitude, resale_flag', { count: 'exact' })
    .eq('market_id', DFW_MARKET_ID)
    .or(`event_date.is.null,event_date.gte.${today}`)
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .gte('scraped_at', maxAge)

  if (scoreMin !== null) dbq = dbq.gte('deal_score', scoreMin)
  if (scoreMax !== null) dbq = dbq.lte('deal_score', scoreMax)
  if (priceMin !== null) dbq = dbq.gte('price_low_cents', priceMin)
  if (priceMax !== null) dbq = dbq.lte('price_low_cents', priceMax)
  if (eventType) dbq = dbq.eq('event_type', eventType)
  if (tags.length) dbq = dbq.overlaps('ai_tags', tags)
  if (q) {
    const safe = sanitize(q)
    if (safe) dbq = dbq.or(`title.ilike.%${safe}%,ai_description.ilike.%${safe}%`)
  }

  if (sort === 'newest') {
    dbq = dbq.order('scraped_at', { ascending: false })
  } else if (sort === 'price_low') {
    dbq = dbq.order('price_low_cents', { ascending: true, nullsFirst: false })
  } else if (sort === 'price_high') {
    dbq = dbq.order('price_low_cents', { ascending: false, nullsFirst: false })
  } else {
    dbq = dbq.order('deal_score', { ascending: false, nullsFirst: false }).order('scraped_at', { ascending: false })
  }

  dbq = dbq.range(offset, offset + limit - 1)

  const { data, count, error } = await dbq
  if (error) {
    console.error('[DEALS] query error:', error.message)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const results = (data || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    price: l.price_text || 'Not listed',
    price_cents: l.price_low_cents,
    score: l.deal_score,
    reason: l.deal_score_reason,
    description: l.ai_description,
    tags: l.ai_tags || [],
    city: [l.city, l.state].filter(Boolean).join(', ') || null,
    event_type: l.event_type,
    source_url: l.source_url,
    image_url: l.image_url,
    posted_at: l.scraped_at,
    lat: l.latitude,
    lng: l.longitude,
    resale_flag: l.resale_flag || false,
  }))

  return NextResponse.json({ results, total: count || 0, offset, limit })
}
