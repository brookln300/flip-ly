import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header automatically)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow manual triggers without auth for now (test endpoint)
    // In production, uncomment: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all users
    const { data: users, error } = await supabase
      .from('fliply_users')
      .select('id, email, city, zip_code')

    if (error) {
      console.error('Digest cron: failed to fetch users', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const results = []

    for (const user of (users || [])) {
      const listingCount = Math.floor(Math.random() * 8) + 3 // 3-10 fake listings

      // Log what WOULD be sent
      console.log(`[DIGEST STUB] Would send weekly digest to user ${user.id} (${user.email}) in ${user.city || 'unknown city'} with ${listingCount} chaotic listings`)

      // Log to digest_log table
      await supabase.from('fliply_digest_log').insert({
        user_id: user.id,
        listing_count: listingCount,
        status: 'skipped', // stub — not actually sending
      })

      results.push({
        user_id: user.id,
        email: user.email,
        city: user.city,
        listing_count: listingCount,
        status: 'logged (not sent — stub mode)',
      })
    }

    return NextResponse.json({
      success: true,
      message: `Digest stub ran for ${results.length} users`,
      users_processed: results.length,
      results,
      next_run: 'Monday 8:00 AM CDT',
      mode: 'stub — no real emails sent',
    })
  } catch (err) {
    console.error('Digest cron error:', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
