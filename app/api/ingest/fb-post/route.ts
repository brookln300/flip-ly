export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { contentHash } from '../../../lib/fb-free/hash'
import type { RawFbPost } from '../../../lib/fb-free/types'

/**
 * Ingest endpoint for the FB "free stuff" pipeline.
 *
 * The user-operated browser extension POSTs posts it captured from a group
 * page the user is viewing. This route does NOT touch Facebook — it only
 * receives, dedupes, and stores. Classification + Telegram delivery happen
 * in /api/cron/fb-free-digest.
 *
 * Auth: X-Ingest-Token header must equal FB_INGEST_TOKEN.
 * Body: a single post object, or an array of them.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-ingest-token')
  if (!process.env.FB_INGEST_TOKEN || token !== process.env.FB_INGEST_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const incoming: RawFbPost[] = Array.isArray(body) ? body : [body as RawFbPost]

  const rows = incoming
    .filter((p) => p && typeof p.raw_text === 'string' && p.raw_text.trim().length > 0)
    .map((p) => ({
      content_hash: contentHash(p.group_id || '', p.author_name || '', p.raw_text),
      group_id: p.group_id ?? null,
      group_name: p.group_name ?? null,
      post_url: p.post_url ?? null,
      author_name: p.author_name ?? null,
      raw_text: p.raw_text.trim(),
      image_urls: Array.isArray(p.image_urls) ? p.image_urls.slice(0, 10) : null,
      captured_at: p.captured_at || new Date().toISOString(),
      status: 'pending' as const,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid posts (raw_text required)' }, { status: 400 })
  }

  // Dedupe within the batch itself before hitting the DB.
  const seen = new Set<string>()
  const deduped = rows.filter((r) => {
    if (seen.has(r.content_hash)) return false
    seen.add(r.content_hash)
    return true
  })

  // ignoreDuplicates: existing content_hash rows are skipped silently.
  const { data, error } = await supabase
    .from('fb_free_posts')
    .upsert(deduped, { onConflict: 'content_hash', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error('[FB-INGEST] upsert failed:', error.message)
    return NextResponse.json({ error: 'Store failed' }, { status: 500 })
  }

  const accepted = data?.length ?? 0
  return NextResponse.json({
    accepted,
    duplicates: incoming.length - accepted,
    received: incoming.length,
  })
}
