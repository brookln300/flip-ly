import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'

export const dynamic = 'force-dynamic'

const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const OK = NextResponse.json({ ok: true })

/**
 * Telegram Bot Webhook — Keith's command center for flip-ly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message

    if (!message?.text || !message?.chat?.id) return OK

    // Security: only respond to Keith's chat
    if (String(message.chat.id) !== ALLOWED_CHAT_ID) return OK

    const text = message.text.trim()
    const lower = text.toLowerCase()

    // ── Router ──
    if (lower === 'help' || lower === '/help') return await handleHelp()
    if (lower === 'pending') return await handlePending()
    if (lower === 'sources') return await handleSources()
    if (lower === 'markets') return await handleMarkets()
    if (lower === 'users') return await handleUsers()
    if (lower === 'stats') return await handleStats()
    if (lower === 'approve all' || lower === 'reject all') {
      return await handleBulkAll(lower.startsWith('approve') ? 'approved' : 'rejected')
    }

    // ── Parameterized commands ──
    const approveMatch = text.match(/^approve\s+(.+)$/i)
    if (approveMatch) {
      const nums = parseNumbers(approveMatch[1])
      if (nums.length > 0) return await handleByNumbers(nums, 'approved')
    }

    const rejectMatch = text.match(/^reject\s+(.+)$/i)
    if (rejectMatch) {
      const nums = parseNumbers(rejectMatch[1])
      if (nums.length > 0) return await handleByNumbers(nums, 'rejected')
    }

    // scan <market name or state>
    const scanMatch = text.match(/^scan\s+(.+)$/i)
    if (scanMatch) return await handleScan(scanMatch[1].trim())

    // market <name> — deep dive into one market
    const marketMatch = text.match(/^market\s+(.+)$/i)
    if (marketMatch) return await handleMarketDetail(marketMatch[1].trim())

    // add <market> | <url> | <name>
    const addMatch = text.match(/^add\s+(.+)$/i)
    if (addMatch) return await handleAdd(addMatch[1].trim())

    // activate/deactivate by source number (from Sources list)
    const activateMatch = text.match(/^activate\s+(.+)$/i)
    if (activateMatch) {
      const nums = parseNumbers(activateMatch[1])
      if (nums.length > 0) return await handleToggle(nums, true)
    }
    const deactivateMatch = text.match(/^deactivate\s+(.+)$/i)
    if (deactivateMatch) {
      const nums = parseNumbers(deactivateMatch[1])
      if (nums.length > 0) return await handleToggle(nums, false)
    }

    // delete source by number
    const deleteMatch = text.match(/^delete\s+(.+)$/i)
    if (deleteMatch) {
      const nums = parseNumbers(deleteMatch[1])
      if (nums.length > 0) return await handleDelete(nums)
    }

    // user <email> — lookup user
    const userMatch = text.match(/^user\s+(.+)$/i)
    if (userMatch) return await handleUserLookup(userMatch[1].trim())

    // move user@email market — reassign user to a different market
    const moveMatch = text.match(/^move\s+(\S+)\s+(.+)$/i)
    if (moveMatch) return await handleMoveUser(moveMatch[1].trim(), moveMatch[2].trim())

    // pause/resume market
    const pauseMatch = text.match(/^pause\s+(.+)$/i)
    if (pauseMatch) return await handleMarketToggle(pauseMatch[1].trim(), false)
    const resumeMatch = text.match(/^resume\s+(.+)$/i)
    if (resumeMatch) return await handleMarketToggle(resumeMatch[1].trim(), true)

    // health — DB health check
    if (lower === 'health') return await handleHealth()

    // cleanup — fix orphans and stale data
    if (lower === 'cleanup') return await handleCleanup()

    // digest <market> — preview next digest
    const digestMatch = text.match(/^digest\s+(.+)$/i)
    if (digestMatch) return await handleDigestPreview(digestMatch[1].trim())

    // dupes — find duplicate sources
    if (lower === 'dupes' || lower === 'duplicates') return await handleDupes()

    // errors — recent scrape/system errors
    if (lower === 'errors' || lower === 'logs') return await handleErrors()

    return OK
  } catch (err: any) {
    console.error('[TG-WEBHOOK] Error:', err.message)
    return OK
  }
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function parseNumbers(str: string): number[] {
  const results: number[] = []
  for (const part of str.split(/[\s,]+/)) {
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

function reply(lines: string[]) {
  sendTelegramAlert(lines.join('\n')).catch(console.error)
  return OK
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ═══════════════════════════════════════════════════════════
// APPROVE / REJECT
// ═══════════════════════════════════════════════════════════

async function handleByNumbers(numbers: number[], action: 'approved' | 'rejected') {
  const { data: allPending } = await supabase
    .from('fliply_sources')
    .select('id, name, market_id, fliply_markets(display_name, state)')
    .eq('trust_level', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  if (!allPending?.length) return reply(['No pending sources found.'])

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

  if (!targetIds.length) return reply([`Numbers out of range. ${allPending.length} pending sources total.`])

  const isApproved = action === 'approved'
  await supabase.from('fliply_sources').update({
    trust_level: action, is_approved: isApproved, is_active: isApproved,
    reviewed_at: new Date().toISOString(), reviewed_by: 'keith_telegram',
  }).in('id', targetIds)

  // Clean up pending_source_ids
  const affectedMarkets = Array.from(new Set(allPending.filter(s => targetIds.includes(s.id)).map(s => s.market_id)))
  for (const mId of affectedMarkets) {
    const remaining = allPending.filter(s => s.market_id === mId && !targetIds.includes(s.id)).map(s => s.id)
    await supabase.from('fliply_markets').update({ pending_source_ids: remaining }).eq('id', mId)
  }

  const emoji = isApproved ? '✅' : '❌'
  const remaining = allPending.length - targetIds.length
  const lines = [
    `${emoji} <b>${action.toUpperCase()}</b> (${targetIds.length} sources)`,
    ``, ...targetNames.map(n => `${emoji} ${n}`),
  ]
  if (outOfRange.length) lines.push(``, `⚠️ Skipped #${outOfRange.join(', #')} (out of range)`)
  if (remaining > 0) lines.push(``, `${remaining} source(s) still pending`)
  else lines.push(``, `All sources reviewed 🎉`)

  return reply(lines)
}

async function handleBulkAll(action: 'approved' | 'rejected') {
  const { data: allPending } = await supabase.from('fliply_sources').select('id, market_id').eq('trust_level', 'pending')
  if (!allPending?.length) return reply(['No pending sources found.'])

  const isApproved = action === 'approved'
  await supabase.from('fliply_sources').update({
    trust_level: action, is_approved: isApproved, is_active: isApproved,
    reviewed_at: new Date().toISOString(), reviewed_by: 'keith_telegram',
  }).in('id', allPending.map(s => s.id))

  const marketIds = Array.from(new Set(allPending.map(s => s.market_id)))
  for (const mId of marketIds) {
    await supabase.from('fliply_markets').update({ pending_source_ids: [] }).eq('id', mId)
  }

  const emoji = isApproved ? '✅' : '❌'
  return reply([`${emoji} <b>${action.toUpperCase()} ALL</b> — ${allPending.length} sources across ${marketIds.length} market(s)`])
}

// ═══════════════════════════════════════════════════════════
// VIEW COMMANDS
// ═══════════════════════════════════════════════════════════

async function handlePending() {
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, ai_confidence, market_id, config, fliply_markets(display_name, state)')
    .eq('trust_level', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  if (!sources?.length) return reply(['No pending sources across any market.'])

  const lines = [`<b>Pending Sources</b> (${sources.length} total)`, ``]
  let currentMarket = ''
  sources.forEach((s: any, i: number) => {
    const market = s.fliply_markets
    const label = market ? `${market.display_name || market.state}, ${market.state}` : 'Unknown'
    if (label !== currentMarket) { currentMarket = label; lines.push(`<b>${label}:</b>`) }
    lines.push(`  ${i + 1}. ${s.name} (score: ${s.ai_confidence ?? 'auto'}/10)`)
  })
  lines.push(``, `Reply: <code>Approve 1-3, 5</code> or <code>Reject 4</code>`)
  return reply(lines)
}

async function handleSources() {
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, trust_level, is_active, discovery_method, market_id, fliply_markets(display_name, state)')
    .order('created_at', { ascending: true })
    .limit(60)

  if (!sources?.length) return reply(['No sources found.'])

  const icon: Record<string, string> = { approved: '✅', pending: '⏳', rejected: '❌' }
  const lines = [`<b>All Sources</b> (${sources.length} total)`, ``]
  let currentMarket = ''
  sources.forEach((s: any, i: number) => {
    const market = s.fliply_markets
    const label = market ? `${market.display_name || 'Unknown'}, ${market.state}` : 'Unknown'
    if (label !== currentMarket) { currentMarket = label; lines.push(`<b>${label}:</b>`) }
    const st = icon[s.trust_level] || '❓'
    const active = s.is_active ? '' : ' 💤'
    const method = s.discovery_method === 'auto_craigslist' ? 'CL'
      : s.discovery_method === 'auto_eventbrite' ? 'EB'
      : s.discovery_method === 'auto_claude' ? 'AI'
      : s.discovery_method === 'manual' ? 'MAN' : '?'
    lines.push(`  ${i + 1}. ${st} ${s.name} [${method}]${active}`)
  })

  const approved = sources.filter((s: any) => s.trust_level === 'approved').length
  const pending = sources.filter((s: any) => s.trust_level === 'pending').length
  const rejected = sources.filter((s: any) => s.trust_level === 'rejected').length
  const inactive = sources.filter((s: any) => !s.is_active).length
  lines.push(``, `✅ ${approved} | ⏳ ${pending} | ❌ ${rejected} | 💤 ${inactive} inactive`)
  lines.push(``, `<i>Use <code>Activate 3</code> / <code>Deactivate 5</code> / <code>Delete 7</code> by number</i>`)
  return reply(lines)
}

async function handleMarkets() {
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, is_active, user_count, sources_discovered_at, cl_subdomain')
    .eq('is_active', true)
    .order('user_count', { ascending: false })

  if (!markets?.length) return reply(['No active markets.'])

  // Get source counts per market
  const { data: sourceCounts } = await supabase
    .from('fliply_sources')
    .select('market_id, trust_level')

  const countMap: Record<string, { approved: number; pending: number; total: number }> = {}
  for (const s of (sourceCounts || [])) {
    if (!countMap[s.market_id]) countMap[s.market_id] = { approved: 0, pending: 0, total: 0 }
    countMap[s.market_id].total++
    if (s.trust_level === 'approved') countMap[s.market_id].approved++
    if (s.trust_level === 'pending') countMap[s.market_id].pending++
  }

  const lines = [`<b>Active Markets</b> (${markets.length})`, ``]
  markets.forEach((m: any, i: number) => {
    const name = m.display_name || m.name
    const counts = countMap[m.id] || { approved: 0, pending: 0, total: 0 }
    const scanned = timeAgo(m.sources_discovered_at)
    const pending = counts.pending > 0 ? ` ⚠️${counts.pending} pending` : ''
    lines.push(
      `${i + 1}. <b>${name}, ${m.state}</b>`,
      `   👥 ${m.user_count || 0} users | 📡 ${counts.approved}/${counts.total} sources${pending}`,
      `   🔍 Scanned: ${scanned} | CL: ${m.cl_subdomain || 'none'}`,
    )
  })

  lines.push(``, `<i>Use <code>Market dallas</code> for deep dive, <code>Scan dallas</code> to re-discover</i>`)
  return reply(lines)
}

async function handleStats() {
  const [users, sources, listings, markets] = await Promise.all([
    supabase.from('fliply_users').select('id, is_premium, created_at', { count: 'exact', head: false }),
    supabase.from('fliply_sources').select('trust_level', { count: 'exact', head: false }),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_markets').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const totalUsers = users.data?.length || 0
  const proUsers = users.data?.filter((u: any) => u.is_premium)?.length || 0
  const recentUsers = users.data?.filter((u: any) => {
    const d = Date.now() - new Date(u.created_at).getTime()
    return d < 7 * 24 * 60 * 60 * 1000
  })?.length || 0

  const totalSources = sources.data?.length || 0
  const approvedSources = sources.data?.filter((s: any) => s.trust_level === 'approved')?.length || 0
  const pendingSources = sources.data?.filter((s: any) => s.trust_level === 'pending')?.length || 0

  const lines = [
    `<b>📊 flip-ly Stats</b>`,
    ``,
    `<b>Users:</b>`,
    `  👥 ${totalUsers} total | ⭐ ${proUsers} pro | 🆕 ${recentUsers} this week`,
    ``,
    `<b>Markets:</b>`,
    `  🗺️ ${markets.count || 0} active`,
    ``,
    `<b>Sources:</b>`,
    `  📡 ${totalSources} total | ✅ ${approvedSources} approved | ⏳ ${pendingSources} pending`,
    ``,
    `<b>Listings:</b>`,
    `  📋 ${listings.count || 0} in database`,
  ]
  return reply(lines)
}

async function handleUsers() {
  const { data: users } = await supabase
    .from('fliply_users')
    .select('id, email, city, state, is_premium, created_at, market_id, fliply_markets(display_name)')
    .order('created_at', { ascending: false })
    .limit(30)

  if (!users?.length) return reply(['No users found.'])

  const lines = [`<b>Users</b> (${users.length} shown)`, ``]
  users.forEach((u: any, i: number) => {
    const market = (u.fliply_markets as any)?.display_name || u.city || 'no market'
    const pro = u.is_premium ? ' ⭐PRO' : ''
    const age = timeAgo(u.created_at)
    lines.push(`${i + 1}. ${u.email}${pro}`)
    lines.push(`   📍 ${market}, ${u.state || '?'} | joined ${age}`)
  })
  lines.push(``, `<i>Use <code>User email@example.com</code> for details</i>`)
  return reply(lines)
}

// ═══════════════════════════════════════════════════════════
// MARKET COMMANDS
// ═══════════════════════════════════════════════════════════

async function handleMarketDetail(query: string) {
  // Fuzzy match market by name, display_name, or state
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('*')
    .or(`display_name.ilike.%${query}%,name.ilike.%${query}%,cl_subdomain.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${query}".`])

  const m = markets[0]
  const name = m.display_name || m.name

  // Get sources for this market
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('name, trust_level, is_active, discovery_method, config, ai_confidence')
    .eq('market_id', m.id)
    .order('created_at', { ascending: true })

  // Get user count
  const { count: userCount } = await supabase
    .from('fliply_users')
    .select('id', { count: 'exact', head: true })
    .eq('market_id', m.id)

  const icon: Record<string, string> = { approved: '✅', pending: '⏳', rejected: '❌' }

  const lines = [
    `<b>Market: ${name}, ${m.state}</b>`,
    ``,
    `🆔 ${m.id}`,
    `🌐 CL: ${m.cl_subdomain || 'none'}.craigslist.org`,
    `📍 ${m.center_lat?.toFixed(2)}, ${m.center_lng?.toFixed(2)}`,
    `👥 ${userCount || 0} users`,
    `🔍 Discovered: ${timeAgo(m.sources_discovered_at)}`,
    ``,
    `<b>Sources (${sources?.length || 0}):</b>`,
  ]

  if (sources?.length) {
    sources.forEach((s: any) => {
      const st = icon[s.trust_level] || '❓'
      const active = s.is_active ? '' : ' 💤'
      const url = (s.config as any)?.url || (s.config as any)?.rss_url || ''
      lines.push(`  ${st} ${s.name}${active}`)
      if (url) lines.push(`     ${url}`)
    })
  } else {
    lines.push(`  (none)`)
  }

  lines.push(``, `<i>Use <code>Scan ${query}</code> to re-discover sources</i>`)
  return reply(lines)
}

async function handleScan(query: string) {
  // Find market
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, name, display_name, state, cl_subdomain, sources_discovered_at')
    .or(`display_name.ilike.%${query}%,name.ilike.%${query}%,cl_subdomain.ilike.%${query}%`)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${query}".`])

  const m = markets[0]
  const name = m.display_name || m.name

  // Clear the gate so discovery re-runs
  await supabase
    .from('fliply_markets')
    .update({ sources_discovered_at: null })
    .eq('id', m.id)

  // Fire discovery (import dynamically to avoid circular deps)
  const { discoverSourcesForMarket } = await import('../../../lib/discovery/source-discovery')
  discoverSourcesForMarket(m.id)

  return reply([
    `🔍 <b>Scanning ${name}, ${m.state}</b>`,
    ``,
    `Previous scan: ${timeAgo(m.sources_discovered_at)}`,
    `Re-running source discovery...`,
    ``,
    `<i>Results will appear as a new alert when complete.</i>`,
  ])
}

// ═══════════════════════════════════════════════════════════
// SOURCE MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function handleAdd(input: string) {
  // Expected format: market | url | name  OR  market | url
  const parts = input.split('|').map(p => p.trim())
  if (parts.length < 2) {
    return reply([
      `<b>Usage:</b> <code>Add market | url | source name</code>`,
      ``,
      `Example:`,
      `<code>Add dallas | https://example.com/sales | DFW Garage Sales</code>`,
    ])
  }

  const [marketQuery, url, sourceName] = parts
  const name = sourceName || new URL(url).hostname

  // Find market
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state')
    .or(`display_name.ilike.%${marketQuery}%,name.ilike.%${marketQuery}%,cl_subdomain.ilike.%${marketQuery}%`)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${marketQuery}".`])

  const m = markets[0]

  const { error } = await supabase.from('fliply_sources').insert({
    market_id: m.id,
    name,
    source_type: 'web_scrape',
    config: { url },
    discovery_method: 'manual',
    confidence: 1.0,
    ai_confidence: 10,
    trust_level: 'approved',
    is_active: true,
    is_approved: true,
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'keith_telegram',
  })

  if (error) return reply([`Error adding source: ${error.message}`])

  return reply([
    `✅ <b>Source Added</b>`,
    ``,
    `Name: ${name}`,
    `URL: ${url}`,
    `Market: ${m.display_name}, ${m.state}`,
    `Status: Approved + Active`,
  ])
}

async function handleToggle(numbers: number[], activate: boolean) {
  // Numbers reference the Sources list (all sources)
  const { data: allSources } = await supabase
    .from('fliply_sources')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(60)

  if (!allSources?.length) return reply(['No sources found.'])

  const targetIds: string[] = []
  const targetNames: string[] = []

  for (const n of numbers) {
    if (n >= 1 && n <= allSources.length) {
      targetIds.push(allSources[n - 1].id)
      targetNames.push(allSources[n - 1].name)
    }
  }

  if (!targetIds.length) return reply([`Numbers out of range. ${allSources.length} sources total.`])

  await supabase.from('fliply_sources').update({ is_active: activate }).in('id', targetIds)

  const emoji = activate ? '🟢' : '💤'
  const action = activate ? 'ACTIVATED' : 'DEACTIVATED'
  return reply([
    `${emoji} <b>${action}</b> (${targetIds.length} sources)`,
    ``, ...targetNames.map(n => `${emoji} ${n}`),
  ])
}

async function handleDelete(numbers: number[]) {
  const { data: allSources } = await supabase
    .from('fliply_sources')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(60)

  if (!allSources?.length) return reply(['No sources found.'])

  const targetIds: string[] = []
  const targetNames: string[] = []

  for (const n of numbers) {
    if (n >= 1 && n <= allSources.length) {
      targetIds.push(allSources[n - 1].id)
      targetNames.push(allSources[n - 1].name)
    }
  }

  if (!targetIds.length) return reply([`Numbers out of range.`])

  await supabase.from('fliply_sources').delete().in('id', targetIds)

  return reply([
    `🗑️ <b>DELETED</b> (${targetIds.length} sources)`,
    ``, ...targetNames.map(n => `🗑️ ${n}`),
    ``, `<i>Permanently removed. Use <code>Add</code> to re-create.</i>`,
  ])
}

// ═══════════════════════════════════════════════════════════
// USER COMMANDS
// ═══════════════════════════════════════════════════════════

async function handleUserLookup(query: string) {
  const { data: users } = await supabase
    .from('fliply_users')
    .select('*, fliply_markets(display_name, state, cl_subdomain)')
    .or(`email.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(1)

  if (!users?.length) return reply([`No user found matching "${query}".`])

  const u = users[0] as any
  const market = u.fliply_markets
  const marketName = market ? `${market.display_name}, ${market.state}` : 'none'

  const lines = [
    `<b>User: ${u.email}</b>`,
    ``,
    `🆔 ${u.id}`,
    `📍 ${u.city || '?'}, ${u.state || '?'}`,
    `🗺️ Market: ${marketName}`,
    `⭐ Pro: ${u.is_premium ? 'YES' : 'no'}`,
    `📧 Unsubscribed: ${u.unsubscribed ? 'yes' : 'no'}`,
    `🕐 Joined: ${timeAgo(u.created_at)}`,
  ]

  if (u.stripe_customer_id) lines.push(`💳 Stripe: ${u.stripe_customer_id}`)

  return reply(lines)
}

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function handleMoveUser(emailQuery: string, marketQuery: string) {
  const { data: users } = await supabase
    .from('fliply_users')
    .select('id, email, market_id')
    .ilike('email', `%${emailQuery}%`)
    .limit(1)

  if (!users?.length) return reply([`No user found matching "${emailQuery}".`])

  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state')
    .or(`display_name.ilike.%${marketQuery}%,name.ilike.%${marketQuery}%,cl_subdomain.ilike.%${marketQuery}%`)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${marketQuery}".`])

  const u = users[0]
  const m = markets[0]

  await supabase.from('fliply_users').update({ market_id: m.id }).eq('id', u.id)

  // Update user count on old and new market (direct update, no rpc needed)
  if (u.market_id) {
    const { data: oldMarket } = await supabase.from('fliply_markets').select('user_count').eq('id', u.market_id).single()
    if (oldMarket) {
      await supabase.from('fliply_markets').update({ user_count: Math.max(0, (oldMarket.user_count || 1) - 1) }).eq('id', u.market_id)
    }
  }
  const { data: newMarket } = await supabase.from('fliply_markets').select('user_count').eq('id', m.id).single()
  if (newMarket) {
    await supabase.from('fliply_markets').update({ user_count: (newMarket.user_count || 0) + 1 }).eq('id', m.id)
  }

  return reply([
    `📦 <b>User Moved</b>`,
    ``,
    `${u.email} → ${m.display_name}, ${m.state}`,
  ])
}

// ═══════════════════════════════════════════════════════════
// MARKET TOGGLE (Pause/Resume)
// ═══════════════════════════════════════════════════════════

async function handleMarketToggle(query: string, activate: boolean) {
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state')
    .or(`display_name.ilike.%${query}%,name.ilike.%${query}%,cl_subdomain.ilike.%${query}%`)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${query}".`])

  const m = markets[0]
  await supabase.from('fliply_markets').update({ is_active: activate }).eq('id', m.id)

  // Also toggle all sources for this market
  await supabase.from('fliply_sources').update({ is_active: activate }).eq('market_id', m.id).eq('trust_level', 'approved')

  const emoji = activate ? '▶️' : '⏸️'
  const action = activate ? 'RESUMED' : 'PAUSED'
  return reply([
    `${emoji} <b>Market ${action}</b>`,
    ``,
    `${m.display_name}, ${m.state}`,
    activate ? 'Scraping + digest delivery resumed.' : 'All scraping + digest delivery paused.',
    ``,
    `<i>Use <code>${activate ? 'Pause' : 'Resume'} ${query}</code> to reverse.</i>`,
  ])
}

// ═══════════════════════════════════════════════════════════
// DB HEALTH & MAINTENANCE
// ═══════════════════════════════════════════════════════════

async function handleHealth() {
  const checks: string[] = [`<b>🏥 Database Health Check</b>`, ``]
  let issues = 0

  // 1. Orphaned users (market_id points to non-existent or inactive market)
  const { data: orphanedUsers } = await supabase
    .from('fliply_users')
    .select('id, email, market_id')
    .is('market_id', null)

  if (orphanedUsers?.length) {
    checks.push(`⚠️ ${orphanedUsers.length} user(s) with no market assigned`)
    orphanedUsers.slice(0, 5).forEach(u => checks.push(`   - ${u.email}`))
    issues++
  }

  // 2. Sources with no market
  const { data: orphanedSources } = await supabase
    .from('fliply_sources')
    .select('id, name, market_id')
    .is('market_id', null)

  if (orphanedSources?.length) {
    checks.push(`⚠️ ${orphanedSources.length} source(s) with no market`)
    issues++
  }

  // 3. Markets with no sources
  const { data: allMarkets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state')
    .eq('is_active', true)

  if (allMarkets) {
    for (const m of allMarkets) {
      const { count } = await supabase
        .from('fliply_sources')
        .select('id', { count: 'exact', head: true })
        .eq('market_id', m.id)
        .eq('is_active', true)

      if (!count || count === 0) {
        checks.push(`⚠️ ${m.display_name || 'Unknown'}, ${m.state} — 0 active sources`)
        issues++
      }
    }
  }

  // 4. Markets with null display_name
  const { data: nullNames } = await supabase
    .from('fliply_markets')
    .select('id, name')
    .is('display_name', null)
    .eq('is_active', true)

  if (nullNames?.length) {
    checks.push(`⚠️ ${nullNames.length} market(s) with null display_name`)
    nullNames.forEach(m => checks.push(`   - ${m.name}`))
    issues++
  }

  // 5. Sources with null ai_confidence
  const { data: nullConf } = await supabase
    .from('fliply_sources')
    .select('id', { count: 'exact', head: true })
    .is('ai_confidence', null)

  if (nullConf) {
    // use count
    const { count } = await supabase
      .from('fliply_sources')
      .select('id', { count: 'exact', head: true })
      .is('ai_confidence', null)
    if (count && count > 0) {
      checks.push(`⚠️ ${count} source(s) with null ai_confidence`)
      issues++
    }
  }

  // 6. User count mismatch (market.user_count vs actual)
  if (allMarkets) {
    for (const m of allMarkets) {
      const { count: actual } = await supabase
        .from('fliply_users')
        .select('id', { count: 'exact', head: true })
        .eq('market_id', m.id)

      const { data: mFull } = await supabase
        .from('fliply_markets')
        .select('user_count')
        .eq('id', m.id)
        .single()

      if (mFull && (mFull.user_count || 0) !== (actual || 0)) {
        checks.push(`⚠️ ${m.display_name || m.state}: user_count=${mFull.user_count} but actual=${actual}`)
        issues++
      }
    }
  }

  if (issues === 0) {
    checks.push(`✅ All checks passed — database is clean.`)
  } else {
    checks.push(``, `Found ${issues} issue(s). Use <code>Cleanup</code> to auto-fix safe ones.`)
  }

  return reply(checks)
}

async function handleCleanup() {
  const fixes: string[] = [`<b>🧹 Running Cleanup</b>`, ``]
  let fixed = 0

  // 1. Fix null display_name on markets
  const { data: nullNames } = await supabase
    .from('fliply_markets')
    .select('id, name')
    .is('display_name', null)

  if (nullNames?.length) {
    for (const m of nullNames) {
      await supabase.from('fliply_markets').update({ display_name: m.name }).eq('id', m.id)
    }
    fixes.push(`✅ Fixed ${nullNames.length} market(s) with null display_name → set to name`)
    fixed++
  }

  // 2. Fix null ai_confidence on sources
  const { data: nullConf } = await supabase
    .from('fliply_sources')
    .select('id, discovery_method')
    .is('ai_confidence', null)

  if (nullConf?.length) {
    // Auto sources get 10, AI sources keep null → set to 5 as default
    for (const s of nullConf) {
      const score = s.discovery_method?.startsWith('auto_') ? 10 : 5
      await supabase.from('fliply_sources').update({ ai_confidence: score }).eq('id', s.id)
    }
    fixes.push(`✅ Fixed ${nullConf.length} source(s) with null ai_confidence`)
    fixed++
  }

  // 3. Sync user_count on all active markets
  const { data: allMarkets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state, user_count')
    .eq('is_active', true)

  if (allMarkets) {
    for (const m of allMarkets) {
      const { count: actual } = await supabase
        .from('fliply_users')
        .select('id', { count: 'exact', head: true })
        .eq('market_id', m.id)

      if ((m.user_count || 0) !== (actual || 0)) {
        await supabase.from('fliply_markets').update({ user_count: actual || 0 }).eq('id', m.id)
        fixes.push(`✅ Synced ${m.display_name}: ${m.user_count} → ${actual}`)
        fixed++
      }
    }
  }

  // 4. Clear stale pending_source_ids (markets where pending sources already reviewed)
  const { data: marketsWithPending } = await supabase
    .from('fliply_markets')
    .select('id, display_name, pending_source_ids')
    .not('pending_source_ids', 'is', null)

  if (marketsWithPending) {
    for (const m of marketsWithPending) {
      const ids = m.pending_source_ids as string[]
      if (!ids?.length) continue

      // Check which are still actually pending
      const { data: stillPending } = await supabase
        .from('fliply_sources')
        .select('id')
        .in('id', ids)
        .eq('trust_level', 'pending')

      const stillIds = stillPending?.map(s => s.id) || []
      if (stillIds.length !== ids.length) {
        await supabase.from('fliply_markets').update({ pending_source_ids: stillIds.length ? stillIds : [] }).eq('id', m.id)
        fixes.push(`✅ Cleaned pending_source_ids for ${m.display_name} (${ids.length} → ${stillIds.length})`)
        fixed++
      }
    }
  }

  if (fixed === 0) {
    fixes.push(`✅ Nothing to clean — database is tidy.`)
  } else {
    fixes.push(``, `Fixed ${fixed} issue(s).`)
  }

  return reply(fixes)
}

async function handleDupes() {
  // Find sources with similar names in the same market
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, market_id, trust_level, fliply_markets(display_name, state)')
    .order('market_id')
    .order('name')

  if (!sources?.length) return reply(['No sources found.'])

  const dupes: string[] = []
  const seen = new Map<string, any[]>()

  for (const s of sources) {
    const key = `${s.market_id}::${s.name.toLowerCase().trim()}`
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(s)
  }

  const lines = [`<b>🔍 Duplicate Check</b>`, ``]
  let found = 0

  for (const [, group] of seen) {
    if (group.length > 1) {
      const market = (group[0] as any).fliply_markets
      const mName = market ? `${market.display_name}, ${market.state}` : 'Unknown'
      lines.push(`⚠️ <b>${mName}</b>: "${group[0].name}" × ${group.length}`)
      group.forEach((s: any) => {
        lines.push(`   - ID: ${s.id.slice(0, 8)}… [${s.trust_level}]`)
      })
      found++
    }
  }

  if (found === 0) {
    lines.push(`✅ No exact duplicates found.`)
  } else {
    lines.push(``, `${found} duplicate group(s). Use <code>Delete</code> to remove extras.`)
  }

  return reply(lines)
}

async function handleDigestPreview(query: string) {
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, display_name, state')
    .or(`display_name.ilike.%${query}%,name.ilike.%${query}%,cl_subdomain.ilike.%${query}%`)
    .limit(1)

  if (!markets?.length) return reply([`No market found matching "${query}".`])

  const m = markets[0]

  // Get active approved sources
  const { data: sources } = await supabase
    .from('fliply_sources')
    .select('id, name, source_type, config, is_active')
    .eq('market_id', m.id)
    .eq('trust_level', 'approved')
    .eq('is_active', true)

  // Get recent listings
  const { data: listings, count: listingCount } = await supabase
    .from('fliply_listings')
    .select('id, title, source_id, sale_date, created_at', { count: 'exact' })
    .eq('market_id', m.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get user count
  const { count: userCount } = await supabase
    .from('fliply_users')
    .select('id', { count: 'exact', head: true })
    .eq('market_id', m.id)

  const lines = [
    `<b>📧 Digest Preview: ${m.display_name}, ${m.state}</b>`,
    ``,
    `<b>Would send to:</b> ${userCount || 0} user(s)`,
    `<b>Active sources:</b> ${sources?.length || 0}`,
    `<b>Listings in DB:</b> ${listingCount || 0}`,
    ``,
  ]

  if (sources?.length) {
    lines.push(`<b>Sources pulling from:</b>`)
    sources.forEach(s => {
      const url = (s.config as any)?.url || (s.config as any)?.rss_url || ''
      lines.push(`  📡 ${s.name} (${s.source_type})`)
      if (url) lines.push(`     ${url}`)
    })
  }

  if (listings?.length) {
    lines.push(``, `<b>Recent listings:</b>`)
    listings.forEach((l: any) => {
      const date = l.sale_date || timeAgo(l.created_at)
      lines.push(`  • ${l.title?.slice(0, 60) || 'Untitled'} — ${date}`)
    })
  } else {
    lines.push(``, `⚠️ No listings yet. Scraper hasn't run or found data.`)
  }

  if (!sources?.length) {
    lines.push(``, `⚠️ No active sources — digest would be empty!`)
    lines.push(`<i>Use <code>Scan ${query}</code> to find sources.</i>`)
  } else if (!listingCount) {
    lines.push(``, `<i>Sources ready but no listings scraped yet. Next cron run will populate.</i>`)
  }

  return reply(lines)
}

async function handleErrors() {
  // Check for recent failed scrapes or issues
  const lines = [`<b>📋 System Status</b>`, ``]

  // Sources that are active but might be failing
  const { data: activeSources } = await supabase
    .from('fliply_sources')
    .select('id, name, last_scraped_at, scrape_error, market_id, fliply_markets(display_name)')
    .eq('is_active', true)
    .eq('trust_level', 'approved')
    .order('last_scraped_at', { ascending: true, nullsFirst: true })
    .limit(30)

  // Never scraped
  const neverScraped = activeSources?.filter(s => !s.last_scraped_at) || []
  if (neverScraped.length) {
    lines.push(`<b>⚠️ Never Scraped (${neverScraped.length}):</b>`)
    neverScraped.slice(0, 10).forEach(s => {
      const market = (s as any).fliply_markets?.display_name || '?'
      lines.push(`  - ${s.name} (${market})`)
    })
    lines.push(``)
  }

  // Has scrape errors
  const withErrors = activeSources?.filter(s => s.scrape_error) || []
  if (withErrors.length) {
    lines.push(`<b>❌ Scrape Errors (${withErrors.length}):</b>`)
    withErrors.slice(0, 10).forEach(s => {
      lines.push(`  - ${s.name}`)
      lines.push(`    ${(s.scrape_error as string)?.slice(0, 80) || '?'}`)
    })
    lines.push(``)
  }

  // Stale (not scraped in 48+ hours)
  const stale = activeSources?.filter(s => {
    if (!s.last_scraped_at) return false
    const hours = (Date.now() - new Date(s.last_scraped_at).getTime()) / 3600000
    return hours > 48
  }) || []

  if (stale.length) {
    lines.push(`<b>⏰ Stale (>48h since scrape) (${stale.length}):</b>`)
    stale.slice(0, 10).forEach(s => {
      lines.push(`  - ${s.name} — last: ${timeAgo(s.last_scraped_at)}`)
    })
    lines.push(``)
  }

  if (!neverScraped.length && !withErrors.length && !stale.length) {
    lines.push(`✅ All systems operational. No errors or stale sources.`)
  }

  return reply(lines)
}

// ═══════════════════════════════════════════════════════════
// HELP
// ═══════════════════════════════════════════════════════════

async function handleHelp() {
  const lines = [
    `<b>🦞 flip-ly Bot Commands</b>`,
    ``,
    `<b>── View ──</b>`,
    `<code>Stats</code> — System overview`,
    `<code>Markets</code> — Active markets + source counts`,
    `<code>Market dallas</code> — Deep dive into a market`,
    `<code>Sources</code> — All sources (numbered)`,
    `<code>Pending</code> — Pending sources only (numbered)`,
    `<code>Users</code> — Recent users`,
    `<code>User email@...</code> — Lookup a user`,
    ``,
    `<b>── Approve / Reject ──</b>`,
    `<code>Approve 1-6, 9</code> — Approve by Pending #`,
    `<code>Reject 4, 7-8</code> — Reject by Pending #`,
    `<code>Approve all</code> / <code>Reject all</code>`,
    ``,
    `<b>── Source Management ──</b>`,
    `<code>Activate 3, 5</code> — Turn on by Sources #`,
    `<code>Deactivate 7</code> — Turn off (keeps data)`,
    `<code>Delete 12</code> — Permanently remove`,
    `<code>Add dallas | url | name</code> — Manual add`,
    `<code>Scan dallas</code> — Re-discover sources`,
    ``,
    `<b>── Market Ops ──</b>`,
    `<code>Pause dallas</code> — Stop scraping a market`,
    `<code>Resume dallas</code> — Restart it`,
    `<code>Digest dallas</code> — Preview next digest`,
    ``,
    `<b>── User Ops ──</b>`,
    `<code>Move user@email dallas</code> — Reassign market`,
    ``,
    `<b>── DB Health ──</b>`,
    `<code>Health</code> — Check for orphans, nulls, mismatches`,
    `<code>Cleanup</code> — Auto-fix safe issues`,
    `<code>Dupes</code> — Find duplicate sources`,
    `<code>Errors</code> — Stale scrapes + failures`,
    ``,
    `<i>Numbers from Pending list for approve/reject.</i>`,
    `<i>Numbers from Sources list for activate/deactivate/delete.</i>`,
    `<i>All case-insensitive. Ranges (1-6) and mixed (1-3, 7) work.</i>`,
  ]
  return reply(lines)
}
