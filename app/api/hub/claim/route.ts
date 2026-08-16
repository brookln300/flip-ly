export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { displayName } from '../../../lib/names'
import { parseClaim } from '../../../components/radar/types'

/**
 * Deal claim — "I'm going for this one." POST {id} flips a scored/alerted
 * find to status='claimed' and stamps the claimant into `reasoning`
 * ("[claimed by NAME @ iso]") so no schema change is needed. The update is
 * conditional on the current status, so the second claimer loses the race
 * and gets told who beat them (409 + claimed_by).
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in to claim' }, { status: 401 })

  const b = await req.json().catch(() => null)
  if (typeof b?.id !== 'string' || !UUID_RE.test(b.id)) {
    return NextResponse.json({ error: 'valid listing id required' }, { status: 400 })
  }

  const { data: row, error: readErr } = await supabase
    .from('deal_listings')
    .select('id, status, reasoning')
    .eq('id', b.id)
    .maybeSingle()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'listing not found' }, { status: 404 })

  if (row.status === 'claimed') {
    const claim = parseClaim(row.reasoning)
    return NextResponse.json(
      { error: 'already claimed', claimed_by: claim?.name || 'someone', claimed_at: claim?.at || null },
      { status: 409 }
    )
  }
  if (row.status !== 'scored' && row.status !== 'alerted') {
    return NextResponse.json({ error: `can't claim a listing in status "${row.status}"` }, { status: 400 })
  }

  const name = await displayName(session.email)
  const stamp = `[claimed by ${name} @ ${new Date().toISOString()}]`
  const reasoning = row.reasoning ? `${row.reasoning}\n${stamp}` : stamp

  // Conditional update — only wins if the row is still unclaimed.
  const { data: updated, error: upErr } = await supabase
    .from('deal_listings')
    .update({ status: 'claimed', reasoning })
    .eq('id', b.id)
    .in('status', ['scored', 'alerted'])
    .select('id')
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  if (!updated?.length) {
    // Someone beat us between the read and the write.
    const { data: after } = await supabase
      .from('deal_listings')
      .select('reasoning')
      .eq('id', b.id)
      .maybeSingle()
    const claim = parseClaim(after?.reasoning || null)
    return NextResponse.json(
      { error: 'already claimed', claimed_by: claim?.name || 'someone', claimed_at: claim?.at || null },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, claimed_by: name })
}
