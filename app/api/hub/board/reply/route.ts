export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { displayName } from '../../../../lib/names'

/** Board replies. POST adds to a thread; DELETE (?id=) removes your own. */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to reply' }, { status: 401 })
  const email = session.email.toLowerCase()

  const b = await req.json().catch(() => null)
  if (!b?.post_id || !b?.body || typeof b.body !== 'string' || !b.body.trim()) {
    return NextResponse.json({ error: 'post_id and body required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('fliply_board_replies').insert({
    post_id: b.post_id,
    author_email: email,
    author_name: await displayName(email),
    body: b.body.trim().slice(0, 2000),
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: reply } = await supabase.from('fliply_board_replies').select('author_email').eq('id', id).maybeSingle()
  if (!reply) return NextResponse.json({ error: 'reply not found' }, { status: 404 })
  if (reply.author_email !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'you can only delete your own replies' }, { status: 403 })
  }

  const { error } = await supabase.from('fliply_board_replies').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
