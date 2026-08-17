export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

/**
 * Deal Radar family feedback — verdicts and reasons on a scored find.
 * POST {id, value?, note?}:
 *   value: 1 = good find (underrated), -1 = bad call (overrated), 0 = clear.
 *   note:  optional free-text reason ("too far for a wagon") — appended to
 *          feedback_note with the author's name; the scorer injects these
 *          verbatim into its calibration prompt.
 * At least one of value/note must be present.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to leave feedback' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (typeof b?.id !== 'string' || !UUID_RE.test(b.id)) {
    return NextResponse.json({ error: 'valid listing id required' }, { status: 400 })
  }
  const hasValue = b.value === 1 || b.value === -1 || b.value === 0
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 300) : ''
  if (!hasValue && !note) {
    return NextResponse.json({ error: 'value (1/-1/0) or note required' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (hasValue) patch.outcome_feedback = b.value === 0 ? null : b.value

  if (note) {
    const { data: row, error: readErr } = await supabase
      .from('deal_listings')
      .select('feedback_note')
      .eq('id', b.id)
      .single()
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
    const who = session.email.split('@')[0]
    const author = who.charAt(0).toUpperCase() + who.slice(1)
    const existing = (row?.feedback_note || '').trim()
    patch.feedback_note = ((existing ? existing + ' | ' : '') + `${author}: ${note}`).slice(0, 800)
  }

  const { error } = await supabase.from('deal_listings').update(patch).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
