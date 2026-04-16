export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../lib/auth'

/**
 * Test digest endpoint — triggers a real digest email (admin only).
 *
 * GET /api/test-digest — sends digest to admin's email
 * GET /api/test-digest?email=foo@bar.com — sends to specific email
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email') || admin.email

  // Call the real digest endpoint in test mode
  const digestUrl = new URL('/api/cron/weekly-digest', req.url)
  digestUrl.searchParams.set('test', 'true')
  digestUrl.searchParams.set('email', email)

  const response = await fetch(digestUrl.toString(), {
    headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
  })

  const data = await response.json()

  return NextResponse.json({
    success: data.success || false,
    message: data.success
      ? `Real digest email sent to ${email}! Check your inbox (and Resend dashboard).`
      : `Digest failed: ${data.error || 'unknown error'}`,
    details: data,
  })
}

// Keep POST for backward compat
export async function POST(req: NextRequest) {
  return GET(req)
}
