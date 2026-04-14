export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'
import { trackEvent } from '../../../lib/analytics'
import { scrapeCraigslist } from '../../../lib/scrapers/craigslist'
import { scrapeEventbrite } from '../../../lib/scrapers/eventbrite'
import { scrapeWithAI } from '../../../lib/scrapers/ai-extract'
import { scrapeEstateSalesNet } from '../../../lib/scrapers/estatesales-net'
import type { ScraperResult, CraigslistConfig, EventbriteConfig, AiExtractConfig, EstateSalesNetConfig } from '../../../lib/scrapers/types'

export async function GET(req: NextRequest) {
  // Auth: require CRON_SECRET for automated + manual triggers
  const authHeader = req.headers.get('authorization')
  const forceAll = new URL(req.url).searchParams.get('force') === 'true'
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const results: { source: string; result: ScraperResult }[] = []
  const sourceUpdates: { id: string; data: any }[] = []

  try {
    // Fetch all active, approved sources that are due for scraping
    const { data: sources } = await supabase
      .from('fliply_sources')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ message: 'No active sources to scrape', results: [] })
    }

    const now = new Date()

    for (const source of sources) {
      // Check if due for scraping (skip check if force=true)
      if (!forceAll && source.last_scraped_at) {
        const lastScraped = new Date(source.last_scraped_at)
        const hoursSince = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60)
        if (hoursSince < source.scrape_frequency_hours) {
          continue // Not due yet
        }
      }

      let result: ScraperResult = { inserted: 0, skipped: 0, errors: [] }

      try {
        switch (source.source_type) {
          case 'craigslist_rss':
            result = await scrapeCraigslist(source.id, source.market_id, source.config as CraigslistConfig)
            break
          case 'eventbrite_api':
            result = await scrapeEventbrite(source.id, source.market_id, source.config as EventbriteConfig)
            break
          case 'ai_extract':
            result = await scrapeWithAI(source.id, source.market_id, source.config as AiExtractConfig)
            break
          case 'city_permits':
            // Treat city permits as AI extraction too
            result = await scrapeWithAI(source.id, source.market_id, {
              url: (source.config as any).url,
              source_name: source.name,
              source_hint: 'City government garage sale permit page',
            })
            break
          case 'estatesales_net':
            result = await scrapeEstateSalesNet(source.id, source.market_id, source.config as EstateSalesNetConfig)
            break
          case 'local_site':
            // Claude-discovered local sites use the same AI extraction pipeline
            result = await scrapeWithAI(source.id, source.market_id, {
              url: (source.config as any).url,
              source_name: source.name,
              source_hint: (source.config as any).description || 'Local listing site',
            })
            break
          default:
            result.errors.push(`Unknown source type: ${source.source_type}`)
        }
      } catch (err: any) {
        result.errors.push(`Scraper crashed: ${err.message}`)
      }

      // Queue source metadata update (batch later)
      const updateData: any = {
        last_scraped_at: now.toISOString(),
        last_result_count: result.inserted,
      }

      if (result.errors.length > 0) {
        const failures = (source.consecutive_failures || 0) + 1
        updateData.consecutive_failures = failures
        updateData.last_error = result.errors[0]

        // Auto-deactivate after 5 consecutive failures
        if (failures >= 5) {
          updateData.is_active = false
          await sendTelegramAlert(
            `⚠️ <b>Source Deactivated</b> (5 consecutive failures)\n${source.name}\nLast error: ${result.errors[0]}`
          )
        }
      } else {
        updateData.consecutive_failures = 0
        updateData.last_error = null
      }

      sourceUpdates.push({ id: source.id, data: updateData })

      results.push({ source: source.name, result })
    }

    // Batch update all source metadata concurrently (instead of sequential N+1)
    await Promise.all(
      sourceUpdates.map(({ id, data }) =>
        supabase.from('fliply_sources').update(data).eq('id', id)
      )
    )

    // Enrichment now runs on its own cron (/api/cron/enrich every 30 min)
    // This frees the scrape cron to focus on ingestion within its 300s timeout

    // Telegram summary
    const totalInserted = results.reduce((sum, r) => sum + r.result.inserted, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.result.skipped, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.result.errors.length, 0)
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    // Check enrichment backlog for awareness
    const { count: enrichBacklog } = await supabase
      .from('fliply_listings')
      .select('id', { count: 'exact', head: true })
      .is('enriched_at', null)

    const summary = [
      `<b>Scrape Complete</b> (${elapsed}s)`,
      `Sources: ${results.length}`,
      `New listings: ${totalInserted}`,
      `Deduped: ${totalSkipped}`,
      `Errors: ${totalErrors}`,
      `Enrich backlog: ${enrichBacklog || 0} (separate cron)`,
    ]
    if (totalErrors > 0) {
      summary.push(``, `Errors:`)
      results.forEach((r) => r.result.errors.forEach((e) => summary.push(`- ${r.source}: ${e}`)))
    }

    await sendTelegramAlert(summary.join('\n'))

    trackEvent('scrape_complete', {
      sources_scraped: results.length,
      listings_inserted: totalInserted,
      listings_deduped: totalSkipped,
      enrich_backlog: enrichBacklog || 0,
      elapsed_seconds: parseFloat(elapsed),
    })

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      sources_scraped: results.length,
      total_inserted: totalInserted,
      total_skipped: totalSkipped,
      total_errors: totalErrors,
      enrich_backlog: enrichBacklog || 0,
      results: results.map((r) => ({ source: r.source, ...r.result })),
    })
  } catch (err: any) {
    console.error('Scrape cron error:', err)
    await sendTelegramAlert(`Scrape cron FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
// force rebuild 1774600619
