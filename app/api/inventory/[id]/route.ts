export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// PATCH /api/inventory/:id — update lifecycle fields.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const u: Record<string, any> = {}
  for (const k of ['bought_cents', 'listed_cents', 'sold_cents', 'fees_cents', 'comp_cents']) {
    if (typeof b[k] === 'number') u[k] = b[k]
    else if (b[k] === null) u[k] = null
  }
  for (const k of ['notes', 'ebay_item_id', 'category', 'bought_at', 'listed_at', 'sold_at']) {
    if (typeof b[k] === 'string') u[k] = b[k] || null
  }
  if (['bought', 'listed', 'sold', 'passed'].includes(b.status)) {
    u.status = b.status
    const today = new Date().toISOString().split('T')[0]
    if (b.status === 'listed' && !b.listed_at) u.listed_at = today
    if (b.status === 'sold' && !b.sold_at) u.sold_at = today
  }
  if (Object.keys(u).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

  const { error } = await supabase.from('fliply_inventory').update(u).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/inventory/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('fliply_inventory').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
