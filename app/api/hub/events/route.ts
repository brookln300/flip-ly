export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

/** Family calendar. GET upcoming; POST create (signed-in); PATCH rsvp (signed-in). */
export async function GET() {
  const since = new Date(Date.now() - 6 * 3600e3).toISOString()
  const { data, error } = await supabase
    .from('fliply_events')
    .select('*')
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
    .limit(40)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: data || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to add events' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b?.title || !b?.starts_at) return NextResponse.json({ error: 'title and starts_at required' }, { status: 400 })

  const { data, error } = await supabase.from('fliply_events').insert({
    title: String(b.title).slice(0, 140),
    emoji: b.emoji?.slice(0, 8) || null,
    starts_at: b.starts_at,
    location: b.location?.slice(0, 140) || null,
    notes: b.notes?.slice(0, 1000) || null,
    created_by: session.email.toLowerCase(),
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to RSVP' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b?.id || !['yes', 'no', 'maybe'].includes(b.rsvp)) return NextResponse.json({ error: 'id + rsvp yes|no|maybe' }, { status: 400 })

  const { data: ev } = await supabase.from('fliply_events').select('rsvps').eq('id', b.id).maybeSingle()
  if (!ev) return NextResponse.json({ error: 'event not found' }, { status: 404 })
  const rsvps = { ...(ev.rsvps || {}), [session.email.toLowerCase()]: b.rsvp }
  const { error } = await supabase.from('fliply_events').update({ rsvps }).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
