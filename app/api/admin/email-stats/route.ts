export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Email stats dashboard endpoint.
 * Returns aggregate metrics from email_sends and email_events.
 *
 * GET /api/admin/email-stats
 * GET /api/admin/email-stats?days=7     (default: 30)
 * GET /api/admin/email-stats?sequence=welcome-to-convert
 */
export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')
  const sequence = searchParams.get('sequence') || null

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Overall send stats
    let sendQuery = supabase
      .from('email_sends')
      .select('status', { count: 'exact' })
      .gte('created_at', since)

    // Get all sends for counting
    const { data: allSends } = await supabase
      .from('email_sends')
      .select('status, template_key, variant')
      .gte('created_at', since)

    const sends = allSends || []

    // Count by status
    const statusCounts: Record<string, number> = {}
    const templateCounts: Record<string, Record<string, number>> = {}

    for (const send of sends) {
      // Status aggregation
      const s = send.status || 'unknown'
      statusCounts[s] = (statusCounts[s] || 0) + 1

      // Per-template aggregation
      const key = send.template_key || 'unknown'
      if (!templateCounts[key]) templateCounts[key] = {}
      templateCounts[key][s] = (templateCounts[key][s] || 0) + 1
    }

    const total = sends.length
    const delivered = statusCounts['delivered'] || 0
    const opened = statusCounts['opened'] || 0
    const clicked = statusCounts['clicked'] || 0
    const bounced = statusCounts['bounced'] || 0
    const complained = statusCounts['complained'] || 0

    // Digest stats
    const { count: digestsSent } = await supabase
      .from('fliply_digest_log')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', since)
      .eq('status', 'sent')

    // Subscriber stats
    const { count: totalUsers } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })

    const { count: unsubscribed } = await supabase
      .from('fliply_users')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', true)

    // Acquisition source breakdown
    const { data: acquisitionData } = await supabase
      .from('fliply_users')
      .select('acquisition_source')

    const acquisitionCounts: Record<string, number> = {}
    for (const u of (acquisitionData || [])) {
      const src = u.acquisition_source || 'signup'
      acquisitionCounts[src] = (acquisitionCounts[src] || 0) + 1
    }

    // Active drip enrollments
    const { count: activeEnrollments } = await supabase
      .from('sequence_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return NextResponse.json({
      period_days: days,
      since,
      email_sends: {
        total,
        by_status: statusCounts,
        rates: {
          delivery_rate: total > 0 ? `${((delivered + opened + clicked) / total * 100).toFixed(1)}%` : '0%',
          open_rate: total > 0 ? `${((opened + clicked) / total * 100).toFixed(1)}%` : '0%',
          click_rate: total > 0 ? `${(clicked / total * 100).toFixed(1)}%` : '0%',
          bounce_rate: total > 0 ? `${(bounced / total * 100).toFixed(1)}%` : '0%',
          complaint_rate: total > 0 ? `${(complained / total * 100).toFixed(1)}%` : '0%',
        },
        by_template: templateCounts,
      },
      digests: {
        sent_in_period: digestsSent || 0,
      },
      subscribers: {
        total: totalUsers || 0,
        unsubscribed: unsubscribed || 0,
        active: (totalUsers || 0) - (unsubscribed || 0),
        by_acquisition: acquisitionCounts,
      },
      drip: {
        active_enrollments: activeEnrollments || 0,
      },
    })
  } catch (err: any) {
    console.error('Email stats error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
