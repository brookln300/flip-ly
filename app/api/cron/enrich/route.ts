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
  // Fail closed: if CRON_SECRET is unset, "Bearer undefined" would authorize anyone.
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
      maxListings: parseInt(params.get('max') || '750'),
      batchSize: parseInt(params.get('batch') || '15'),
      concurrency: parseInt(params.get('concurrency') || '5'),
    })

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const remainingBacklog = (backlog || 0) - result.enriched - result.fastClassified

    // ── Health alert: AI batches ran but scored nothing → key/credit problem ──
    // This is the signature of an invalid/revoked ANTHROPIC_API_KEY (401) or
    // exhausted credit: real listings get sent to the model but none come back scored.
    if (result.batches > 0 && result.enriched === 0) {
      await sendTelegramAlert(
        `🚨 <b>Enrichment NOT scoring</b>\n` +
        `${result.batches} AI batches ran but 0 listings were enriched.\n` +
        `Almost always an invalid/expired ANTHROPIC_API_KEY or no credit.\n` +
        `Fix: replace ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy.\n` +
        `Backlog: ~${Math.max(0, remainingBacklog)} listings waiting.`
      )
    } else if (result.enriched > 0 || result.fastClassified > 0) {
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
