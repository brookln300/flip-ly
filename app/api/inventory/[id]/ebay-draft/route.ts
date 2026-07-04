export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

/**
 * Generate an eBay-ready listing draft (title / price / description) for an
 * inventory item, priced off the resale comp. Stored on the item as ebay_draft.
 * Actual posting to eBay requires the Sell API (OAuth with Keith's eBay dev
 * app) — staged. For now this draft is copy/prefill-ready.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: it } = await supabase
    .from('fliply_inventory')
    .select('title, category, comp_cents, listed_cents, bought_cents')
    .eq('id', params.id).maybeSingle()
  if (!it) return NextResponse.json({ error: 'item not found' }, { status: 404 })

  // Price at ~95% of the resale comp to move it; fall back to 2x cost.
  const anchor = it.comp_cents || it.listed_cents || (it.bought_cents ? it.bought_cents * 2 : null)
  const priceCents = anchor ? Math.round(anchor * 0.95 / 100) * 100 : null

  const title = String(it.title).replace(/\s+/g, ' ').trim().slice(0, 80) // eBay title cap
  const priceStr = priceCents ? `$${Math.round(priceCents / 100).toLocaleString()}` : '—'
  const description = [
    title,
    '',
    'Condition: please see photos — described accurately. Message with any questions.',
    'Located in the Dallas–Fort Worth area. Fast shipping or local pickup available.',
    'Priced to sell — serious offers considered.',
  ].join('\n')

  const draft = { title, price_cents: priceCents, description }
  await supabase.from('fliply_inventory').update({
    ebay_draft: draft,
    listed_cents: it.listed_cents ?? priceCents,
  }).eq('id', params.id)

  return NextResponse.json({ draft, price: priceStr })
}
