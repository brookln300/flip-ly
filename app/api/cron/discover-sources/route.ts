export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'
import { researchLocalSources } from '../../../lib/discovery/claude-research'

/**
 * Hourly cron: two jobs in one endpoint.
 *
 * Job 1 — AI Source Discovery
 *   Picks up to 2 markets where local_sources_researched_at IS NULL,
 *   runs Claude Haiku research, inserts pending sources, sends TG alert.
 *   Retries automatically next hour if it fails.
 *
 * Job 2 — Auto-Approve High-Confidence Sources
 *   Sources with ai_confidence >= 7 that have been pending > 24 hours
 *   get auto-approved. Sends informational TG summary.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { researched: 0, sources_found: 0, auto_approved: 0, errors: [] as string[] }

  try {
    // ── Job 1: AI Source Discovery ──────────────────────────────
    await runSourceDiscovery(results)

    // ── Job 2: Auto-Approve High Confidence ─────────────────────
    await runAutoApprove(results)

    return NextResponse.json({ success: true, ...results })
  } catch (err: any) {
    console.error('[DISCOVER-SOURCES] Cron error:', err)
    await sendTelegramAlert(`⚠️ discover-sources cron FAILED: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Job 1: Research local sources for unresearched markets ──────
async function runSourceDiscovery(results: { researched: number; sources_found: number; errors: string[] }) {
  // Find markets that have users (is_active) but haven't been researched yet
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, cl_subdomain')
    .is('local_sources_researched_at', null)
    .eq('is_active', true)
    .order('user_count', { ascending: false })
    .limit(2) // Process 2 per invocation to stay under timeout

  if (!markets || markets.length === 0) {
    console.log('[DISCOVER-SOURCES] No markets need research')
    return
  }

  for (const market of markets) {
    const marketName = market.display_name || market.name
    const cityName = marketName.split('/')[0].trim()

    try {
      console.log(`[DISCOVER-SOURCES] Researching ${marketName}, ${market.state}`)
      const research = await researchLocalSources(cityName, market.state)

      const insertedSources: string[] = []

      for (const source of research.sources) {
        if (source.confidence < 0.5) continue

        const { error } = await supabase.from('fliply_sources').insert({
          market_id: market.id,
          name: source.name,
          source_type: source.source_type,
          config: { url: source.url, description: source.description },
          discovery_method: 'auto_claude',
          confidence: source.confidence,
          ai_confidence: Math.round(source.confidence * 10),
          ai_reasoning: source.description,
          trust_level: 'pending',
          scrape_frequency_hours: 24,
          is_active: true,
          is_approved: false,
        })
        if (!error) {
          insertedSources.push(`${source.name} (${Math.round(source.confidence * 10)}/10)`)
          results.sources_found++
        }
      }

      // Mark market as researched
      await supabase
        .from('fliply_markets')
        .update({ local_sources_researched_at: new Date().toISOString() })
        .eq('id', market.id)

      results.researched++

      // Fetch pending sources for numbered TG alert
      if (insertedSources.length > 0) {
        const { data: pendingSources } = await supabase
          .from('fliply_sources')
          .select('id, name, ai_confidence, config')
          .eq('market_id', market.id)
          .eq('trust_level', 'pending')
          .order('created_at', { ascending: true })

        const alertLines = [
          `<b>Source Discovery</b> — ${marketName}, ${market.state}`,
          `Found ${insertedSources.length} local source(s):`,
        ]

        if (pendingSources) {
          pendingSources.forEach((s, i) => {
            const url = (s.config as any)?.url || ''
            alertLines.push(`  ${i + 1}. ${s.name} (score: ${s.ai_confidence}/10)`)
            if (url) alertLines.push(`     ${url}`)
          })
          alertLines.push(``, `Reply: <code>Approve 1,3</code> or <code>Reject 2</code>`)

          // Store pending IDs for webhook mapping
          await supabase
            .from('fliply_markets')
            .update({ pending_source_ids: pendingSources.map(s => s.id) })
            .eq('id', market.id)
        }

        if (research.notes) alertLines.push(``, `Notes: ${research.notes}`)
        await sendTelegramAlert(alertLines.join('\n'))
      } else {
        console.log(`[DISCOVER-SOURCES] No local sources found for ${marketName}`)
      }
    } catch (err: any) {
      console.error(`[DISCOVER-SOURCES] Failed for ${marketName}:`, err.message)
      results.errors.push(`${marketName}: ${err.message}`)
      // Don't mark as researched — will retry next hour
    }
  }
}

// ── Job 2: Auto-approve sources with ai_confidence >= 7 after 24h ─
async function runAutoApprove(results: { auto_approved: number; errors: string[] }) {
  const { data: approved, error } = await supabase
    .from('fliply_sources')
    .update({
      is_approved: true,
      trust_level: 'auto_approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'auto_approve_cron',
    })
    .eq('is_approved', false)
    .eq('trust_level', 'pending')
    .gte('ai_confidence', 7)
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .select('id, name, market_id, ai_confidence')

  if (error) {
    console.error('[AUTO-APPROVE] Query failed:', error.message)
    results.errors.push(`Auto-approve: ${error.message}`)
    return
  }

  if (!approved || approved.length === 0) {
    console.log('[AUTO-APPROVE] No sources eligible for auto-approval')
    return
  }

  results.auto_approved = approved.length

  // Fetch market names for the TG summary
  const marketIds = Array.from(new Set(approved.map(s => s.market_id)))
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, name')
    .in('id', marketIds)

  const marketMap = new Map(markets?.map(m => [m.id, m.display_name || m.name]) || [])

  const alertLines = [
    `<b>Auto-Approved Sources</b> (${approved.length})`,
    ...approved.map(s =>
      `✅ ${s.name} (${s.ai_confidence}/10) — ${marketMap.get(s.market_id) || 'Unknown market'}`
    ),
  ]

  await sendTelegramAlert(alertLines.join('\n'))
  console.log(`[AUTO-APPROVE] Approved ${approved.length} sources`)
}
