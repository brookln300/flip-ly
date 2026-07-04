export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * Actionable message count for the global notification badge.
 * Actionable = drafts awaiting approval + inbound replies not yet handled.
 */
export async function GET() {
  const [draftRes, replyRes] = await Promise.all([
    supabase.from('fliply_messages').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('fliply_messages').select('id', { count: 'exact', head: true }).eq('status', 'replied'),
  ])
  const drafts = draftRes.count || 0
  const replies = replyRes.count || 0
  return NextResponse.json({ actionable: drafts + replies, drafts, replies })
}
