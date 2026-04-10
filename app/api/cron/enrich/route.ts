export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramAlert } from '../../../lib/telegram'
import { enrichAllPending } from '../../../lib/ai/enrich-listing'
import { supabase } from '../../../lib/supabase'

/**
 * Dedicated enrichment cron — runs independently of scraping.
 * Schedule: every 30 minutes (48 runs/day)
 * Throughput: ~500 listings per run × 48 = ~24,000/day capacity
 *
 * GET /api/cron/enrich
 * Query params:
 *   - max: override max listings (default 500)
 *   - batch: override batch size (default 10)
 *   - concurrency: override parallel batches (default 3)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const params = new URL(req.url).searchParams

  try {
    // Check backlog size before starting
    const { count: backlog } = await supabase
      .from('fliply_listings')
      .select('id', { count: 'exact', head: true })
      .is('enriched_at', null)

    const result = await enrichAllPending({
      maxListings: parseInt(params.get('max') || '500'),
      batchSize: parseInt(params.get('batch') || '10'),
      concurrency: parseInt(params.get('concurrency') || '3'),
    })

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const remainingBacklog = (backlog || 0) - result.enriched - result.fastClassified

    // Only alert on significant runs or problems
    if (result.enriched > 0 || result.fastClassified > 0) {
      await sendTelegramAlert(
        `<b>Enrich Complete</b> (${elapsed}s)\n` +
        `AI enriched: ${result.enriched} (${result.batches} batches)\n` +
        `Fast-classified: ${result.fastClassified}\n` +
        `Backlog remaining: ~${Math.max(0, remainingBacklog)}`
      )
    }

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      enriched: result.enriched,
      fast_classified: result.fastClassified,
      batches: result.batches,
      backlog_before: backlog,
      backlog_remaining: Math.max(0, remainingBacklog),
    })
  } catch (err: any) {
    console.error('Enrich cron error:', err)
    await sendTelegramAlert(`Enrich cron FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
