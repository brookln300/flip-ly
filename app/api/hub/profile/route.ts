export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

/**
 * Your lantern. GET returns the signed-in member's profile; PATCH updates it.
 * Members can only ever edit their OWN lantern (email comes from the session,
 * never the body). Also touches last_active — visiting your lantern is presence.
 */
export async function GET() {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  const email = session.email.toLowerCase()

  supabase.from('fliply_profiles').update({ last_active: new Date().toISOString() }).eq('email', email).then(null, () => {})

  const { data } = await supabase.from('fliply_profiles').select('*').eq('email', email).maybeSingle()
  if (!data) {
    await supabase.from('fliply_profiles').insert({ email, display_name: email.split('@')[0] })
    const { data: fresh } = await supabase.from('fliply_profiles').select('*').eq('email', email).maybeSingle()
    return NextResponse.json({ profile: fresh })
  }
  return NextResponse.json({ profile: data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  const email = session.email.toLowerCase()

  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const u: Record<string, any> = { updated_at: new Date().toISOString(), last_active: new Date().toISOString() }
  for (const k of ['display_name', 'sigil', 'flame_style', 'status_text', 'status_emoji', 'story', 'allergies', 'household']) {
    if (typeof b[k] === 'string') u[k] = b[k].slice(0, k === 'story' ? 2000 : 120) || null
  }
  if (typeof b.lantern_hue === 'number') u.lantern_hue = Math.max(0, Math.min(360, Math.round(b.lantern_hue)))
  if (typeof b.birthday === 'string') u.birthday = b.birthday || null
  if (b.favorites && typeof b.favorites === 'object') u.favorites = b.favorites
  if (b.sizes && typeof b.sizes === 'object') u.sizes = b.sizes
  if (!['steady', 'flicker', 'sparkle', 'aurora', undefined].includes(b.flame_style)) delete u.flame_style

  const { error } = await supabase.from('fliply_profiles').update(u).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
