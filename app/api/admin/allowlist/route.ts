export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { isAdmin } from '../../../lib/allowlist'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.email || !(await isAdmin(session.email))) return null
  return session
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'admin only' }, { status: 403 })
  const { data } = await supabase.from('fliply_allowlist').select('email, role, label, created_at').order('created_at', { ascending: true })
  return NextResponse.json({ members: data || [], me: admin.email })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'admin only' }, { status: 403 })
  const b = await req.json().catch(() => null)
  const email = (b?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'valid email required' }, { status: 400 })
  const { error } = await supabase.from('fliply_allowlist').upsert({
    email, role: b.role === 'admin' ? 'admin' : 'family', label: b.label?.slice(0, 60) || null, added_by: admin.email,
  }, { onConflict: 'email' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'admin only' }, { status: 403 })
  const email = (new URL(req.url).searchParams.get('email') || '').toLowerCase()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (email === admin.email.toLowerCase()) return NextResponse.json({ error: "can't remove yourself" }, { status: 400 })
  const { error } = await supabase.from('fliply_allowlist').delete().eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
