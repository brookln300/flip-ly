export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { displayNames } from '../../../lib/names'

/**
 * Family wishlist — rides the deal pipeline's grail_list, so every wish
 * is a live matching contract for the radar's scorer. GET all wishes;
 * POST derives match_terms from the item name; PATCH pauses/resumes;
 * DELETE (?id=) removes your own.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'for', 'of', 'and', 'or', 'to', 'in', 'on', 'at',
  'with', 'my', 'our', 'any', 'some', 'that', 'this', 'like',
])

/** Lowercase significant words from the wish name — what the scorer greps for. */
function toMatchTerms(name: string): string[] {
  const terms = Array.from(new Set(
    name.toLowerCase().split(/[^a-z0-9+]+/).filter(w => w.length >= 2 && !STOPWORDS.has(w))
  ))
  return terms.length > 0 ? terms : [name.toLowerCase().trim()]
}

export async function GET() {
  const { data, error } = await supabase
    .from('grail_list')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const wishes = data || []
  const names = await displayNames(wishes.map(w => w.requested_by))
  return NextResponse.json({ wishes, names })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to add a wish' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (typeof b?.name !== 'string' || !b.name.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const name = b.name.trim().slice(0, 140)

  const maxPrice = typeof b.max_price === 'number' && b.max_price > 0 ? b.max_price : null
  const { data, error } = await supabase.from('grail_list').insert({
    name,
    match_terms: toMatchTerms(name),
    max_price: maxPrice,
    notes: typeof b.notes === 'string' ? b.notes.trim().slice(0, 500) || null : null,
    active: true,
    requested_by: session.email.toLowerCase(),
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (!b?.id || typeof b.active !== 'boolean') return NextResponse.json({ error: 'id + active true|false' }, { status: 400 })

  const { error } = await supabase.from('grail_list').update({ active: b.active }).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: wish } = await supabase.from('grail_list').select('requested_by').eq('id', id).maybeSingle()
  if (!wish) return NextResponse.json({ error: 'wish not found' }, { status: 404 })
  if (wish.requested_by !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'you can only remove your own wishes' }, { status: 403 })
  }

  const { error } = await supabase.from('grail_list').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
