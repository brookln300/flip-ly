export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendTelegramMessage } from '../../../lib/telegram'
import { classifyBatch } from '../../../lib/fb-free/classify'
import { zipDistanceMiles } from '../../../lib/fb-free/geo'
import type { FbFreePost } from '../../../lib/fb-free/types'

/**
 * FB "free stuff" digest — classify pending posts, then deliver the free ones
 * to a Telegram group.
 *
 * Cron: every 10 minutes (see vercel.json).
 * Also callable manually for testing: GET /api/cron/fb-free-digest with the
 * Bearer CRON_SECRET header.
 *
 * This route never touches Facebook — it reads rows the ingest endpoint stored.
 */

const CLASSIFY_LIMIT = 50 // pending posts processed per run
const CLASSIFY_BATCH = 5 // posts per Haiku call (mirrors enrich-listing.ts)
const DELIVER_LIMIT = 30 // ready posts sent to Telegram per run
const SEND_DELAY_MS = 1200 // stay under Telegram's ~1 msg/sec per-chat limit

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMessage(row: FbFreePost): string {
  const lines: string[] = [`🆓 <b>${esc(row.item_summary || 'Free item')}</b>`]

  const metaParts = [row.location_hint, row.pickup_note].filter(Boolean).map((s) => esc(s as string))
  if (row.distance_mi != null) metaParts.push(`~${Math.round(row.distance_mi)} mi away`)
  if (metaParts.length) lines.push(metaParts.join(' · '))

  if (row.group_name) lines.push(`<i>${esc(row.group_name)}</i>`)
  if (row.post_url) lines.push(`<a href="${esc(row.post_url)}">Open post →</a>`)

  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chatId = process.env.TELEGRAM_FREE_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  const stats = { classified: 0, free: 0, rejected: 0, sent: 0 }

  // ── Pass 1: classify pending posts ──────────────────────────────
  const { data: pending } = await supabase
    .from('fb_free_posts')
    .select('*')
    .eq('status', 'pending')
    .order('captured_at', { ascending: true })
    .limit(CLASSIFY_LIMIT)

  const pendingRows = (pending ?? []) as FbFreePost[]

  for (let i = 0; i < pendingRows.length; i += CLASSIFY_BATCH) {
    const batch = pendingRows.slice(i, i + CLASSIFY_BATCH)
    const verdicts = await classifyBatch(batch.map((r) => ({ raw_text: r.raw_text })))

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      const v = verdicts.find((x) => x.index === j)
      // No verdict parsed for this row: leave it pending to retry next run.
      if (!v) continue

      const isFree = v.is_free === true
      const locationZip = isFree ? (v.location_zip || null) : null

      // Soft distance filter: only rejects when we can actually resolve a
      // distance AND it exceeds the user's radius. A post with no parseable ZIP
      // is never dropped on distance — the group itself is the geo scope.
      let distanceMi: number | null = null
      let status: FbFreePost['status'] = isFree ? 'ready' : 'rejected'
      let reason = v.reason ?? null
      if (isFree && row.home_zip && row.radius_mi && locationZip) {
        distanceMi = await zipDistanceMiles(row.home_zip, locationZip)
        if (distanceMi !== null && distanceMi > row.radius_mi) {
          status = 'rejected'
          reason = `out of radius (${Math.round(distanceMi)}mi > ${row.radius_mi}mi)`
        }
      }

      await supabase
        .from('fb_free_posts')
        .update({
          is_free: isFree,
          item_summary: isFree ? v.item_summary : null,
          location_hint: isFree ? v.location_hint : null,
          pickup_note: isFree ? v.pickup_note : null,
          location_zip: locationZip,
          distance_mi: distanceMi,
          ai_reason: reason,
          status,
          processed_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      stats.classified++
      status === 'ready' ? stats.free++ : stats.rejected++
    }
  }

  // ── Pass 2: deliver ready posts to Telegram ─────────────────────
  const { data: ready } = await supabase
    .from('fb_free_posts')
    .select('*')
    .eq('status', 'ready')
    .order('captured_at', { ascending: true })
    .limit(DELIVER_LIMIT)

  const readyRows = (ready ?? []) as FbFreePost[]

  if (readyRows.length > 0 && !chatId) {
    console.warn('[FB-DIGEST] Ready posts exist but no TELEGRAM_FREE_CHAT_ID / TELEGRAM_CHAT_ID set — not delivering')
  }

  if (chatId) {
    for (const row of readyRows) {
      await sendTelegramMessage(chatId, buildMessage(row))
      await supabase
        .from('fb_free_posts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      stats.sent++
      if (stats.sent < readyRows.length) await sleep(SEND_DELAY_MS)
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}
