export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Manually enroll a user in the welcome drip sequence.
 * Usage: /api/admin/enroll-user?email=knation@gmail.com
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = new URL(req.url).searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' })

  // Find user
  const { data: users } = await supabase
    .from('fliply_users')
    .select('id, email')
    .eq('email', email)
    .limit(1)

  if (!users?.length) return NextResponse.json({ error: `User ${email} not found` })

  // Find welcome sequence
  const { data: seqs } = await supabase
    .from('drip_sequences')
    .select('id')
    .eq('name', 'welcome-to-convert')
    .eq('is_active', true)
    .limit(1)

  if (!seqs?.length) return NextResponse.json({ error: 'No active welcome sequence' })

  const variant = Math.random() < 0.5 ? 'a' : 'b'

  const { data, error } = await supabase
    .from('sequence_enrollments')
    .upsert({
      user_id: users[0].id,
      sequence_id: seqs[0].id,
      current_step: 0,
      status: 'active',
      variant,
    }, { onConflict: 'user_id,sequence_id' })
    .select()

  return NextResponse.json({
    enrolled: !error,
    user: users[0].email,
    variant,
    enrollment: data,
    error: error?.message,
  })
}
