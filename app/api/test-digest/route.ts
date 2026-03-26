import { NextResponse } from 'next/server'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const listingCount = Math.floor(Math.random() * 8) + 3

  console.log(`[TEST DIGEST] User ${session.userId} (${session.email}) triggered test digest — ${listingCount} chaotic listings would be sent`)

  await supabase.from('fliply_digest_log').insert({
    user_id: session.userId,
    listing_count: listingCount,
    status: 'skipped',
  })

  return NextResponse.json({
    success: true,
    message: `Test digest logged! ${listingCount} chaotic listings would have been emailed to you.`,
    listing_count: listingCount,
    mode: 'stub — no real email sent yet',
  })
}
