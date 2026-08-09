export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { displayName } from '../../../lib/names'

const CATEGORIES = ['general', 'deals', 'plans', 'wins'] as const

/**
 * The Board — family bulletin. GET posts (pinned first, newest first) with
 * reply counts, or `?post=<id>` for one post's reply thread. POST a new
 * note (signed-in). Reads are open to the circle like the other hub feeds.
 */
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('post')

  if (postId) {
    const { data, error } = await supabase
      .from('fliply_board_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ replies: data || [] })
  }

  const { data: posts, error } = await supabase
    .from('fliply_board_posts')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  const ids = (posts || []).map(p => p.id)
  if (ids.length > 0) {
    const { data: reps } = await supabase.from('fliply_board_replies').select('post_id').in('post_id', ids)
    for (const r of reps || []) counts[r.post_id] = (counts[r.post_id] || 0) + 1
  }

  return NextResponse.json({
    posts: (posts || []).map(p => ({ ...p, reply_count: counts[p.id] || 0 })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to post' }, { status: 401 })
  const email = session.email.toLowerCase()

  const b = await req.json().catch(() => null)
  if (!b?.body || typeof b.body !== 'string' || !b.body.trim()) {
    return NextResponse.json({ error: 'say something first' }, { status: 400 })
  }

  const { data, error } = await supabase.from('fliply_board_posts').insert({
    author_email: email,
    author_name: await displayName(email),
    title: typeof b.title === 'string' ? b.title.trim().slice(0, 140) || null : null,
    body: b.body.trim().slice(0, 4000),
    category: CATEGORIES.includes(b.category) ? b.category : 'general',
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
