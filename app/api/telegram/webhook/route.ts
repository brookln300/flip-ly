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

function parseNumbers(str: string): number[] {
  return str
    .split(/[\s,]+/)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0)
}

/**
 * Handle "Approve 1,3,5" or "Reject 2,4" — uses pending_source_ids from most recent market
 */
async function handleByNumbers(numbers: number[], action: 'approved' | 'rejected') {
  // Find the most recent market with pending_source_ids
  const { data: market } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, pending_source_ids')
    .not('pending_source_ids', 'eq', '{}')
    .order('sources_discovered_at', { ascending: false })
    .limit(1)
    .single()

  if (!market || !market.pending_source_ids?.length) {
    await sendTelegramAlert('No pending sources found.')
    return NextResponse.json({ ok: true })
  }

  const ids = market.pending_source_ids as string[]
  const targetIds: string[] = []
  const outOfRange: number[] = []

  for (const n of numbers) {
    if (n <= ids.length) {
      targetIds.push(ids[n - 1])
    } else {
      outOfRange.push(n)
    }
  }

  if (targetIds.length === 0) {
    await sendTelegramAlert(`Numbers out of range. Market has ${ids.length} pending sources.`)
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

  // Fetch names for confirmation
  const { data: updated } = await supabase
    .from('fliply_sources')
    .select('name')
    .in('id', targetIds)

  const names = updated?.map(s => s.name) || []
  const emoji = isApproved ? '✅' : '❌'
  const marketName = market.display_name || market.name

  // Remove approved/rejected from pending list
  const remaining = ids.filter(id => !targetIds.includes(id))
  await supabase
    .from('fliply_markets')
    .update({ pending_source_ids: remaining })
    .eq('id', market.id)

  const lines = [
    `${emoji} <b>${action.toUpperCase()}</b> (${marketName}, ${market.state})`,
    ``,
    ...names.map(n => `${emoji} ${n}`),
  ]

  if (outOfRange.length > 0) {
    lines.push(``, `⚠️ Skipped #${outOfRange.join(', #')} (out of range)`)
  }

  if (remaining.length > 0) {
    lines.push(``, `${remaining.length} source(s) still pending`)
  } else {
    lines.push(``, `All sources reviewed for ${marketName} 🎉`)
  }

  await sendTelegramAlert(lines.join('\n'))
  return NextResponse.json({ ok: true })
}

/**
 * Handle "Approve all" / "Reject all" for most recent market
 */
async function handleBulkAll(action: 'approved' | 'rejected') {
  const { data: market } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, pending_source_ids')
    .not('pending_source_ids', 'eq', '{}')
    .order('sources_discovered_at', { ascending: false })
    .limit(1)
    .single()

  if (!market || !market.pending_source_ids?.length) {
    await sendTelegramAlert('No pending sources found.')
    return NextResponse.json({ ok: true })
  }

  const ids = market.pending_source_ids as string[]
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

  // Clear pending list
  await supabase
    .from('fliply_markets')
    .update({ pending_source_ids: [] })
    .eq('id', market.id)

  const marketName = market.display_name || market.name
  const emoji = isApproved ? '✅' : '❌'

  await sendTelegramAlert(
    `${emoji} <b>${action.toUpperCase()} ALL</b> — ${ids.length} sources for ${marketName}, ${market.state}`
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
    lines.push(`  ${i + 1}. ${s.name} (score: ${s.ai_confidence}/10)`)
  })

  await sendTelegramAlert(lines.join('\n'))
  return NextResponse.json({ ok: true })
}
