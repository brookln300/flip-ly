export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

/**
 * Seller-communication drafts. Human-in-the-loop by design:
 * POST creates a DRAFT only; nothing is ever sent without explicit approval
 * (and, for now, the actual send is done by Keith from the approved draft).
 */

// GET /api/messages?status=draft — list, newest first, with listing context.
export async function GET(req: NextRequest) {
  const status = new URL(req.url).searchParams.get('status')
  let q = supabase
    .from('fliply_messages')
    .select('id, listing_id, direction, status, channel, to_addr, subject, body, offer_cents, created_at, approved_at, sent_at, fliply_listings(title, price_text, source_url, city)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data || [] })
}

// POST /api/messages { listing_id, offer_pct? } — generate an inquiry draft.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const { data: l } = await supabase
    .from('fliply_listings')
    .select('id, title, price_low_cents, price_text, source_url, source_type, deal_score, margin_pct, comp_median_cents')
    .eq('id', body.listing_id)
    .maybeSingle()
  if (!l) return NextResponse.json({ error: 'listing not found' }, { status: 404 })

  const offerPct = typeof body.offer_pct === 'number' ? body.offer_pct : 0.85
  const offerCents = l.price_low_cents && l.price_low_cents > 100 ? Math.round(l.price_low_cents / 100 * offerPct) * 100 : null
  const offerStr = offerCents ? `$${Math.round(offerCents / 100).toLocaleString()}` : null

  const subject = `Interested — ${l.title}`.slice(0, 120)
  const lines = [
    `Hi,`,
    ``,
    `Is your "${l.title}" still available? Could you share its condition and any details not in the post?`,
    ``,
    offerStr
      ? `I'm interested — would you take ${offerStr} cash? I can pick up anywhere in the DFW area this week, whatever's easiest for you.`
      : `I'm interested and can pick up anywhere in the DFW area this week. What's the lowest you'd take?`,
    ``,
    `Thanks!`,
  ]
  const channel = l.source_type === 'craigslist_rss' ? 'craigslist' : 'email'

  const { data: msg, error } = await supabase.from('fliply_messages').insert({
    listing_id: l.id, direction: 'outbound', status: 'draft', channel,
    to_addr: null, subject, body: lines.join('\n'), offer_cents: offerCents,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: msg.id, subject, body: lines.join('\n') })
}
