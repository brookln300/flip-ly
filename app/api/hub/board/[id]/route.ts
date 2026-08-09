export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

/**
 * One board post. PATCH pin/unpin — any family member can pin (we trust
 * each other). DELETE — your own posts only; replies cascade with it.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (typeof b?.pinned !== 'boolean') return NextResponse.json({ error: 'pinned true|false' }, { status: 400 })

  const { error } = await supabase.from('fliply_board_posts').update({ pinned: b.pinned }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const { data: post } = await supabase.from('fliply_board_posts').select('author_email').eq('id', params.id).maybeSingle()
  if (!post) return NextResponse.json({ error: 'post not found' }, { status: 404 })
  if (post.author_email !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'you can only delete your own posts' }, { status: 403 })
  }

  const { error } = await supabase.from('fliply_board_posts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
