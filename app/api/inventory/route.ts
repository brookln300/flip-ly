export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

/**
 * Flip inventory + reporting. GET returns all items + rollup stats.
 * POST adds an item (from a listing_id, or a manual off-feed purchase).
 */
export async function GET() {
  const { data: items, error } = await supabase
    .from('fliply_inventory')
    .select('*, fliply_listings(source_url, image_url)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = items || []
  const active = rows.filter(r => r.status === 'bought' || r.status === 'listed')
  const sold = rows.filter(r => r.status === 'sold')
  const invested = active.reduce((s, r) => s + (r.bought_cents || 0), 0)
  const compValue = active.reduce((s, r) => s + (r.comp_cents || r.listed_cents || 0), 0)
  const soldCost = sold.reduce((s, r) => s + (r.bought_cents || 0) + (r.fees_cents || 0), 0)
  const revenue = sold.reduce((s, r) => s + (r.sold_cents || 0), 0)
  const netProfit = revenue - soldCost
  const roi = soldCost > 0 ? Math.round((netProfit / soldCost) * 100) : 0
  const flipDays = sold.filter(r => r.bought_at && r.sold_at)
    .map(r => (new Date(r.sold_at).getTime() - new Date(r.bought_at).getTime()) / 86400000)
  const avgDays = flipDays.length ? Math.round(flipDays.reduce((a, b) => a + b, 0) / flipDays.length) : null

  return NextResponse.json({
    items: rows,
    stats: {
      active_count: active.length, sold_count: sold.length,
      invested_cents: invested, comp_value_cents: compValue,
      revenue_cents: revenue, net_profit_cents: netProfit, roi_pct: roi, avg_flip_days: avgDays,
    },
  })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  let title = b.title, category = b.category || null, comp = b.comp_cents ?? null, listingId = b.listing_id || null
  if (listingId) {
    const { data: l } = await supabase
      .from('fliply_listings')
      .select('title, ai_tags, comp_median_cents, price_low_cents')
      .eq('id', listingId).maybeSingle()
    if (l) {
      title = title || l.title
      category = category || (l.ai_tags && l.ai_tags[0]) || null
      comp = comp ?? l.comp_median_cents ?? null
      if (b.bought_cents == null && l.price_low_cents) b.bought_cents = l.price_low_cents
    }
  }
  if (!title) return NextResponse.json({ error: 'title or listing_id required' }, { status: 400 })

  const { data, error } = await supabase.from('fliply_inventory').insert({
    listing_id: listingId, title: String(title).slice(0, 300), category,
    status: b.status || 'bought',
    bought_cents: typeof b.bought_cents === 'number' ? b.bought_cents : null,
    comp_cents: comp, notes: b.notes || null,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
