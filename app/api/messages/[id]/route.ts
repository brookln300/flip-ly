export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * PATCH /api/messages/:id — edit or transition a draft.
 * Body: { subject?, body?, to_addr?, status? }
 * status transitions: draft → approved → sent (each set by Keith's action).
 * This endpoint does NOT itself dispatch email — sending stays a deliberate,
 * separate, human step (approve, then send). Marking 'sent' just records it.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const patch = await req.json().catch(() => null)
  if (!patch) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const update: Record<string, any> = {}
  if (typeof patch.subject === 'string') update.subject = patch.subject.slice(0, 200)
  if (typeof patch.body === 'string') update.body = patch.body
  if (typeof patch.to_addr === 'string') update.to_addr = patch.to_addr.trim() || null
  if (patch.status === 'approved') update.approved_at = new Date().toISOString()
  if (patch.status === 'sent') update.sent_at = new Date().toISOString()
  if (['draft', 'approved', 'sent', 'replied', 'archived'].includes(patch.status)) update.status = patch.status
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

  const { error } = await supabase.from('fliply_messages').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
