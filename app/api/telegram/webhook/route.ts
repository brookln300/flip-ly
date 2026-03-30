import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

export const dynamic = 'force-dynamic'

const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID

/**
 * Telegram Bot Webhook — receives messages from Keith's TG chat.
 *
 * Commands:
 *   "Approve 1,3,5"   → approve sources by number from last market alert
 *   "Reject 2,4"      → reject sources by number
 *   "Approve all"      → approve all pending for most recent market
 *   "Reject all"       → reject all pending for most recent market
 *   "Pending"          → list all pending sources across all markets
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    // Security: only respond to Keith's chat
    if (String(message.chat.id) !== ALLOWED_CHAT_ID) {
      console.log(`[TG-WEBHOOK] Ignored message from chat ${message.chat.id}`)
      return NextResponse.json({ ok: true })
    }

    const text = message.text.trim()
    const lower = text.toLowerCase()

    // ── "Pending" — list all pending sources ──
    if (lower === 'pending') {
      return await handlePending()
    }

    // ── "Sources" — list ALL sources (approved + pending) ──
    if (lower === 'sources') {
      return await handleSources()
    }

    // ── "Approve all" / "Reject all" ──
    if (lower === 'approve all' || lower === 'reject all') {
      const action = lower.startsWith('approve') ? 'approved' : 'rejected'
      return await handleBulkAll(action)
    }

    // ── "Approve 1,2,3" / "Reject 4,5" ──
    const approveMatch = text.match(/^approve\s+(.+)$/i)
    const rejectMatch = text.match(/^reject\s+(.+)$/i)

    if (approveMatch) {
      const numbers = parseNumbers(approveMatch[1])
      if (numbers.length > 0) {
        return await handleByNumbers(numbers, 'approved')
      }
    }

    if (rejectMatch) {
      const numbers = parseNumbers(rejectMatch[1])
      if (numbers.length > 0) {
        return await handleByNumbers(numbers, 'rejected')
      }
    }

    // Unknown command — don't respond (avoid spam)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[TG-WEBHOOK] Error:', err.message)
    return NextResponse.json({ ok: true })
  }
}

/**
 * Parse flexible number input: "1,3,5" or "1-6" or "1-6, 9, 14-20"
 */
function parseNumbers(str: string): number[] {
  const results: number[] = []
  const parts = str.split(/[\s,]+/)
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start && end - start < 100) {
        for (let i = start; i <= end; i++) results.push(i)
      }
    } else {
      const n = parseInt(part.trim(), 10)
      if (!isNaN(n) && n > 0) results.push(n)
    }
  }
  return Array.from(new Set(results)).sort((a, b) => a - b)
}

/**
 * Handle "Approve 1,3,5" or "Reject 2,4"
 * Numbers match the GLOBAL pending list (same order as "Pending" command)
 */
async function handleByNumbers(numbers: number[], action: 'approved' | 'rejected') {
  // Fetch the same global pending list that "Pending" command shows
  const { data: allPending } = await supabase
    .from('fliply_sources')
    .select('id, name, market_id, fliply_markets(display_name, state)')
    .eq('trust_level', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  if (!allPending || allPending.length === 0) {
    await sendTelegramAlert('No pending sources found.')
    return NextResponse.json({ ok: true })
  }

  const targetIds: string[] = []
  const targetNames: string[] = []
  const outOfRange: number[] = []

  for (const n of numbers) {
    if (n >= 1 && n <= allPending.length) {
      targetIds.push(allPending[n - 1].id)
      targetNames.push(allPending[n - 1].name)
    } else {
      outOfRange.push(n)
    }
  }

  if (targetIds.length === 0) {
    await sendTelegramAlert(`Numbers out of range. There are ${allPending.length} pending sources total.`)
    return NextResponse.json({ ok: true })
  }

  // Update sources
  const isApproved = action === 'approved'
  const { error } = await supabase
    .from('fliply_sources')
    .update({
      trust_level: action,
      is_approved: isApproved,
      is_active: isApproved,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'keith_telegram',
    })
    .in('id', targetIds)

  if (error) {
    await sendTelegramAlert(`Error updating sources: ${error.message}`)
    return NextResponse.json({ ok: true })
  }

  // Clean up pending_source_ids on affected markets
  const affectedMarketIds = Array.from(new Set(
    allPending.filter(s => targetIds.includes(s.id)).map(s => s.market_id)
  ))
  for (const mId of affectedMarketIds) {
    const remainingForMarket = allPending
      .filter(s => s.market_id === mId && !targetIds.includes(s.id))
      .map(s => s.id)
    await supabase
      .from('fliply_markets')
      .update({ pending_source_ids: remainingForMarket })
      .eq('id', mId)
  }

  const emoji = isApproved ? '✅' : '❌'
  const remainingTotal = allPending.length - targetIds.length

  const lines = [
    `${emoji} <b>${action.toUpperCase()}</b> (${targetIds.length} sources)`,
    ``,
    ...targetNames.map(n => `${emoji} ${n}`),
  ]

  if (outOfRange.length > 0) {
    lines.push(``, `⚠️ Skipped #${outOfRange.join(', #')} (out of range)`)
  }

  if (remainingTotal > 0) {
    lines.push(``, `${remainingTotal} source(s) still pending`)
  } else {
    lines.push(``, `All sources reviewed 🎉`)
  }

  await sendTelegramAlert(lines.join('\n'))
  return NextResponse.json({ ok: true })
}

/**
 * Handle "Approve all" / "Reject all" — ALL pending sources across ALL markets
 */
async function handleBulkAll(action: 'approved' | 'rejected') {
  const { data: allPending } = await supabase
    .from('fliply_sources')
    .select('id, market_id')
    .eq('trust_level', 'pending')

  if (!allPending || allPending.length === 0) {
    await sendTelegramAlert('No pending sources found.')
    return NextResponse.json({ ok: true })
  }

  const ids = allPending.map(s => s.id)
  const isApproved = action === 'approved'

  const { error } = await supabase
    .from('fliply_sources')
    .update({
      trust_level: action,
      is_approved: isApproved,
      is_active: isApproved,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'keith_telegram',
    })
    .in('id', ids)

  if (error) {
    await sendTelegramAlert(`Error: ${error.message}`)
    return NextResponse.json({ ok: true })
  }

  // Clear pending_source_ids on all affected markets
  const marketIds = Array.from(new Set(allPending.map(s => s.market_id)))
  for (const mId of marketIds) {
    await supabase
      .from('fliply_markets')
      .update({ pending_source_ids: [] })
      .eq('id', mId)
  }

  const emoji = isApproved ? '✅' : '❌'

  await sendTelegramAlert(
    `${emoji} <b>${action.toUpperCase()} ALL</b> — ${ids.length} sources across ${marketIds.length} market(s)`
  )

  return NextResponse.json({ ok: true })
}

/**
 * Handle "Pending" — list all pending sources across all markets
 */
async function handlePending() {
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, ai_confidence, market_id, config, fliply_markets(display_name, state)')
    .eq('trust_level', 'pending')
    .order('created_at', { ascending: true })
    .limit(30)

  if (!sources || sources.length === 0) {
    await sendTelegramAlert('No pending sources across any market.')
    return NextResponse.json({ ok: true })
  }

  const lines = [`<b>Pending Sources</b> (${sources.length} total)`, ``]

  let currentMarket = ''
  sources.forEach((s: any, i: number) => {
    const market = s.fliply_markets
    const marketLabel = market ? `${market.display_name}, ${market.state}` : 'Unknown'
    if (marketLabel !== currentMarket) {
      currentMarket = marketLabel
      lines.push(`<b>${marketLabel}:</b>`)
    }
    lines.push(`  ${i + 1}. ${s.name} (score: ${s.ai_confidence ?? 'auto'}/10)`)
  })

  await sendTelegramAlert(lines.join('\n'))
  return NextResponse.json({ ok: true })
}

/**
 * Handle "Sources" — list ALL sources grouped by market (approved + pending + rejected)
 */
async function handleSources() {
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, ai_confidence, trust_level, discovery_method, market_id, fliply_markets(display_name, state)')
    .order('created_at', { ascending: true })
    .limit(50)

  if (!sources || sources.length === 0) {
    await sendTelegramAlert('No sources found across any market.')
    return NextResponse.json({ ok: true })
  }

  const statusIcon: Record<string, string> = {
    approved: '✅',
    pending: '⏳',
    rejected: '❌',
  }

  const lines = [`<b>All Sources</b> (${sources.length} total)`, ``]

  let currentMarket = ''
  sources.forEach((s: any) => {
    const market = s.fliply_markets
    const marketLabel = market ? `${market.display_name || 'Unknown'}, ${market.state}` : 'Unknown'
    if (marketLabel !== currentMarket) {
      currentMarket = marketLabel
      lines.push(`<b>${marketLabel}:</b>`)
    }
    const icon = statusIcon[s.trust_level] || '❓'
    const method = s.discovery_method === 'auto_craigslist' ? 'CL'
      : s.discovery_method === 'auto_eventbrite' ? 'EB'
      : s.discovery_method === 'auto_claude' ? 'AI'
      : s.discovery_method || '?'
    lines.push(`  ${icon} ${s.name} [${method}]`)
  })

  const approved = sources.filter((s: any) => s.trust_level === 'approved').length
  const pending = sources.filter((s: any) => s.trust_level === 'pending').length
  const rejected = sources.filter((s: any) => s.trust_level === 'rejected').length

  lines.push(``, `✅ ${approved} approved | ⏳ ${pending} pending | ❌ ${rejected} rejected`)

  await sendTelegramAlert(lines.join('\n'))
  return NextResponse.json({ ok: true })
}
