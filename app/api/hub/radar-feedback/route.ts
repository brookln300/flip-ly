export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

/**
 * Deal Radar family feedback — the "good call?" verdict on a scored find.
 * POST {id, value}: 1 = good find (underrated), -1 = bad call (overrated),
 * 0 = clear the verdict. The scorer reads outcome_feedback to calibrate.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to leave a verdict' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (typeof b?.id !== 'string' || !UUID_RE.test(b.id)) {
    return NextResponse.json({ error: 'valid listing id required' }, { status: 400 })
  }
  if (b.value !== 1 && b.value !== -1 && b.value !== 0) {
    return NextResponse.json({ error: 'value must be 1, -1, or 0' }, { status: 400 })
  }

  const { error } = await supabase
    .from('deal_listings')
    .update({ outcome_feedback: b.value === 0 ? null : b.value })
    .eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
