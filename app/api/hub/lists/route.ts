export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { displayNames } from '../../../lib/names'

/**
 * Shared checklists. GET all lists + items + a name map for attribution.
 * POST a new item (`list_id` + `text`) or a new list (`name` [+ `emoji`]).
 * PATCH toggles done (stamps done_by). DELETE one item (?id= — your own,
 * or anything already done) or clear a list's done pile (?list_id=&done=1).
 */
export async function GET() {
  const [listsRes, itemsRes] = await Promise.all([
    supabase.from('fliply_lists').select('*').order('created_at', { ascending: true }),
    supabase.from('fliply_list_items').select('*').order('created_at', { ascending: true }),
  ])
  if (listsRes.error) return NextResponse.json({ error: listsRes.error.message }, { status: 500 })
  if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 500 })

  const items = itemsRes.data || []
  const names = await displayNames(items.flatMap(i => [i.added_by, i.done_by]))
  return NextResponse.json({ lists: listsRes.data || [], items, names })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  const email = session.email.toLowerCase()

  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  // New item on an existing list
  if (b.list_id) {
    if (typeof b.text !== 'string' || !b.text.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 })
    const { data, error } = await supabase.from('fliply_list_items').insert({
      list_id: b.list_id,
      text: b.text.trim().slice(0, 200),
      added_by: email,
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  // New list
  if (typeof b.name !== 'string' || !b.name.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const { data, error } = await supabase.from('fliply_lists').insert({
    name: b.name.trim().slice(0, 60),
    emoji: typeof b.emoji === 'string' ? b.emoji.trim().slice(0, 8) || null : null,
    created_by: email,
  }).select('*').single()
  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return NextResponse.json({ error: status === 409 ? 'that list already exists' : error.message }, { status })
  }
  return NextResponse.json({ list: data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  const email = session.email.toLowerCase()

  const b = await req.json().catch(() => null)
  if (!b?.id || typeof b.done !== 'boolean') return NextResponse.json({ error: 'id + done true|false' }, { status: 400 })

  const { error } = await supabase
    .from('fliply_list_items')
    .update({ done: b.done, done_by: b.done ? email : null })
    .eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  const email = session.email.toLowerCase()
  const q = req.nextUrl.searchParams

  // Clear a list's done pile
  const listId = q.get('list_id')
  if (listId && q.get('done') === '1') {
    const { error } = await supabase.from('fliply_list_items').delete().eq('list_id', listId).eq('done', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Single item — your own, or anything already done
  const id = q.get('id')
  if (!id) return NextResponse.json({ error: 'id or list_id required' }, { status: 400 })
  const { data: item } = await supabase.from('fliply_list_items').select('added_by, done').eq('id', id).maybeSingle()
  if (!item) return NextResponse.json({ error: 'item not found' }, { status: 404 })
  if (!item.done && item.added_by !== email) {
    return NextResponse.json({ error: 'only the person who added it can remove an open item' }, { status: 403 })
  }

  const { error } = await supabase.from('fliply_list_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
