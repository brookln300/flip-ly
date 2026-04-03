import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = '8353016152:AAFYYlUfk7SmW6DIKb3k7_O7VeYLjAK3wL4'
const KEITH_CHAT_ID = '7235586057'
const TODOIST_TOKEN = 'b062509bead997212339a205bd697e0818223b61'
const TODOIST_API = 'https://api.todoist.com/api/v1'
const OK = NextResponse.json({ ok: true })

// ═══════════════════════════════════════════════════════════
// TELEGRAM HELPERS
// ═══════════════════════════════════════════════════════════

async function send(text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: KEITH_CHAT_ID, text, parse_mode: 'HTML' }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) return
      if (attempt < 2) continue
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500))
    }
  }
}

async function reply(lines: string[]) {
  await send(lines.join('\n'))
  return OK
}

// ═══════════════════════════════════════════════════════════
// TODOIST HELPERS
// ═══════════════════════════════════════════════════════════

const todoistHeaders = { Authorization: `Bearer ${TODOIST_TOKEN}`, 'Content-Type': 'application/json' }

async function todoistGet(path: string) {
  const res = await fetch(`${TODOIST_API}${path}`, { headers: todoistHeaders })
  return res.json()
}

async function todoistPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${TODOIST_API}${path}`, {
    method: 'POST',
    headers: todoistHeaders,
    body: JSON.stringify(body),
  })
  if (res.status === 204) return null
  return res.json()
}

async function getProjects(): Promise<Record<string, { id: string; name: string }>> {
  const data = await todoistGet('/projects')
  const map: Record<string, { id: string; name: string }> = {}
  for (const p of data.results) {
    map[p.name.toLowerCase()] = { id: p.id, name: p.name }
  }
  return map
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message?.text || !message?.chat?.id) return OK
    if (String(message.chat.id) !== KEITH_CHAT_ID) return OK

    const text = message.text.trim()
    const lower = text.toLowerCase()

    // ── Router ──
    if (lower === 'help' || lower === '/help' || lower === '/start') return await handleHelp()
    if (lower === 'tasks' || lower === 'today') return await handleTasks()
    if (lower === 'status' || lower === 'ops') return await handleStatus()
    if (lower === 'brief') return await handleBrief()
    if (lower === 'projects') return await handleProjects()
    if (lower === 'overdue') return await handleOverdue()

    // tasks <project>
    const tasksMatch = text.match(/^tasks?\s+(.+)$/i)
    if (tasksMatch) return await handleTasksProject(tasksMatch[1].trim())

    // add <project> <task> [due]
    const addMatch = text.match(/^add\s+(\S+)\s+(.+)$/i)
    if (addMatch) return await handleAdd(addMatch[1].trim(), addMatch[2].trim())

    // done <task_id>
    const doneMatch = text.match(/^done\s+(\S+)$/i)
    if (doneMatch) return await handleDone(doneMatch[1].trim())

    // Unrecognized — gentle nudge
    return reply([`🤖 Unknown command. Type <b>help</b> for available commands.`])
  } catch (err: any) {
    console.error('[CLAWDIRECTOR] Error:', err.message)
    return OK
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ClawDirector webhook active' }, { status: 200 })
}

// ═══════════════════════════════════════════════════════════
// COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleHelp() {
  return reply([
    `<b>🐾 ClawDirector Commands</b>`,
    ``,
    `<b>—— Tasks ——</b>`,
    `<code>Tasks</code> — Today's tasks (all projects)`,
    `<code>Tasks fliply</code> — Tasks for one project`,
    `<code>Overdue</code> — All overdue items`,
    `<code>Add fliply Fix the bug tomorrow</code> — Add task`,
    `<code>Done [task_id]</code> — Complete a task`,
    ``,
    `<b>—— Operations ——</b>`,
    `<code>Status</code> / <code>Ops</code> — All project statuses`,
    `<code>Brief</code> — On-demand morning ops snapshot`,
    `<code>Projects</code> — List Todoist projects`,
    ``,
    `<i>All case-insensitive. Task IDs from task lists.</i>`,
  ])
}

async function handleTasks() {
  const projects = await getProjects()
  const data = await todoistGet('/tasks')
  const today = new Date().toISOString().split('T')[0]

  const grouped: Record<string, Array<{ id: string; content: string; due: string | null; status: string; priority: number }>> = {}

  for (const t of data.results) {
    const projName = Object.values(projects).find((p) => p.id === t.project_id)?.name || 'Inbox'
    if (!grouped[projName]) grouped[projName] = []
    const due = t.due?.date || null
    let status = ''
    if (due && due < today) status = ' ⚠️'
    else if (due === today) status = ' 📌'
    grouped[projName].push({ id: t.id, content: t.content, due, status, priority: t.priority })
  }

  // Show today + overdue first
  const lines = [`<b>📋 Today's Tasks</b>`, ``]
  let todayCount = 0
  let overdueCount = 0

  for (const [proj, tasks] of Object.entries(grouped)) {
    const urgent = tasks.filter((t) => t.status !== '')
    if (!urgent.length) continue
    lines.push(`<b>${proj}:</b>`)
    for (const t of urgent) {
      const p = t.priority === 4 ? '🔴' : t.priority === 3 ? '🟠' : t.priority === 2 ? '🟡' : '⚪'
      lines.push(`  ${p}${t.status} ${t.content}`)
      lines.push(`    <code>${t.id}</code>`)
      if (t.status.includes('⚠️')) overdueCount++
      else todayCount++
    }
  }

  if (todayCount === 0 && overdueCount === 0) {
    lines.push(`Nothing due today! 🎉`)
  } else {
    lines.push(``, `📌 ${todayCount} today | ⚠️ ${overdueCount} overdue`)
    lines.push(`<i>Complete: </i><code>done [task_id]</code>`)
  }

  return reply(lines)
}

async function handleTasksProject(projectName: string) {
  const projects = await getProjects()
  const match = projects[projectName.toLowerCase()]
  if (!match) {
    const available = Object.values(projects).map((p) => p.name).join(', ')
    return reply([`Project "${projectName}" not found.`, `Available: ${available}`])
  }

  const data = await todoistGet(`/tasks?project_id=${match.id}`)
  const today = new Date().toISOString().split('T')[0]

  if (!data.results?.length) return reply([`<b>${match.name}</b> — No tasks`])

  const lines = [`<b>📋 ${match.name} Tasks</b>`, ``]
  for (const t of data.results) {
    const due = t.due?.date || 'no date'
    let status = ''
    if (t.due?.date && t.due.date < today) status = ' ⚠️ OVERDUE'
    else if (t.due?.date === today) status = ' 📌 TODAY'
    const p = t.priority === 4 ? '🔴' : t.priority === 3 ? '🟠' : t.priority === 2 ? '🟡' : '⚪'
    lines.push(`${p} ${t.content} (${due})${status}`)
    lines.push(`  <code>${t.id}</code>`)
  }
  lines.push(``, `<i>Complete: </i><code>done [task_id]</code>`)
  return reply(lines)
}

async function handleOverdue() {
  const data = await todoistGet('/tasks')
  const today = new Date().toISOString().split('T')[0]
  const projects = await getProjects()

  const overdue = data.results.filter((t: any) => t.due?.date && t.due.date < today)

  if (!overdue.length) return reply([`✅ No overdue tasks!`])

  const lines = [`<b>⚠️ Overdue Tasks</b>`, ``]
  for (const t of overdue) {
    const projName = Object.values(projects).find((p) => p.id === t.project_id)?.name || 'Inbox'
    lines.push(`🔴 ${t.content}`)
    lines.push(`  ${projName} | was due: ${t.due.date}`)
    lines.push(`  <code>${t.id}</code>`)
  }
  lines.push(``, `${overdue.length} overdue. <i>Complete: </i><code>done [id]</code>`)
  return reply(lines)
}

async function handleAdd(projectName: string, rest: string) {
  const projects = await getProjects()
  const match = projects[projectName.toLowerCase()]
  if (!match) {
    const available = Object.values(projects).map((p) => p.name).join(', ')
    return reply([`Project "${projectName}" not found.`, `Available: ${available}`])
  }

  // Try to extract due date from end of string (e.g., "Fix the bug tomorrow")
  const body: Record<string, unknown> = { content: rest, project_id: match.id }

  // Let Todoist parse natural language dates via due_string
  body.due_string = rest.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|in \d+ days?)\b/i)?.[0]

  const task = await todoistPost('/tasks', body)
  if (!task) return reply([`❌ Failed to add task`])

  return reply([
    `✅ <b>Added to ${match.name}</b>`,
    `${task.content}`,
    task.due ? `📅 ${task.due.date}` : `📅 No date`,
    `<code>${task.id}</code>`,
  ])
}

async function handleDone(taskId: string) {
  try {
    await todoistPost(`/tasks/${taskId}/close`, {})
    return reply([`✅ Task completed!`])
  } catch {
    return reply([`❌ Could not complete task. Check the ID.`])
  }
}

async function handleProjects() {
  const projects = await getProjects()
  const lines = [`<b>📂 Todoist Projects</b>`, ``]
  for (const p of Object.values(projects)) {
    lines.push(`  • ${p.name}`)
  }
  lines.push(``, `<i>Use: </i><code>tasks [project_name]</code>`)
  return reply(lines)
}

async function handleStatus() {
  const projects = await getProjects()
  const data = await todoistGet('/tasks')
  const today = new Date().toISOString().split('T')[0]

  // Count per project
  const counts: Record<string, { total: number; today: number; overdue: number }> = {}
  for (const t of data.results) {
    const projName = Object.values(projects).find((p) => p.id === t.project_id)?.name || 'Inbox'
    if (!counts[projName]) counts[projName] = { total: 0, today: 0, overdue: 0 }
    counts[projName].total++
    if (t.due?.date === today) counts[projName].today++
    if (t.due?.date && t.due.date < today) counts[projName].overdue++
  }

  const lines = [`<b>📊 Operations Status</b>`, ``]
  for (const [proj, c] of Object.entries(counts)) {
    const emoji = c.overdue > 0 ? '⚠️' : c.today > 0 ? '📌' : '✅'
    lines.push(`${emoji} <b>${proj}</b>: ${c.total} tasks | ${c.today} today | ${c.overdue} overdue`)
  }

  const totalOverdue = Object.values(counts).reduce((s, c) => s + c.overdue, 0)
  const totalToday = Object.values(counts).reduce((s, c) => s + c.today, 0)
  lines.push(``, `Total: ${data.results.length} active | ${totalToday} today | ${totalOverdue} overdue`)
  return reply(lines)
}

async function handleBrief() {
  const projects = await getProjects()
  const data = await todoistGet('/tasks')
  const today = new Date().toISOString().split('T')[0]
  const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' })

  let todayCount = 0
  let overdueCount = 0
  const todayTasks: Record<string, string[]> = {}
  const overdueTasks: string[] = []

  for (const t of data.results) {
    const projName = Object.values(projects).find((p) => p.id === t.project_id)?.name || 'Inbox'
    if (t.due?.date === today) {
      todayCount++
      if (!todayTasks[projName]) todayTasks[projName] = []
      todayTasks[projName].push(t.content)
    }
    if (t.due?.date && t.due.date < today) {
      overdueCount++
      overdueTasks.push(`${t.content} (${projName})`)
    }
  }

  const lines = [
    `<b>☀️ OPS SNAPSHOT — ${dateStr}</b>`,
    ``,
    `<b>📋 TODOIST:</b> ${todayCount} due today, ${overdueCount} overdue`,
  ]

  for (const [proj, tasks] of Object.entries(todayTasks)) {
    lines.push(`  <b>${proj}:</b> ${tasks.join(', ')}`)
  }

  if (overdueTasks.length) {
    lines.push(``, `<b>⚠️ OVERDUE:</b>`)
    overdueTasks.forEach((t) => lines.push(`  • ${t}`))
  }

  // Top priority: first overdue, then today's P1s
  const p1Tasks = data.results
    .filter((t: any) => t.priority === 4 && t.due?.date && t.due.date <= today)
    .map((t: any) => t.content)

  if (p1Tasks.length) {
    lines.push(``, `<b>🎯 FOCUS:</b>`)
    p1Tasks.slice(0, 3).forEach((t: string, i: number) => lines.push(`  ${i + 1}. ${t}`))
  }

  lines.push(``, `<i>Full details: </i><code>tasks</code> <i>or</i> <code>status</code>`)
  return reply(lines)
}
