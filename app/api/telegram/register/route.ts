export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

/**
 * One-shot (idempotent) Telegram webhook self-registration.
 *
 * The @fliplyalert_bot token lives ONLY in Vercel env (TELEGRAM_BOT_TOKEN); it
 * never leaves the server. This route tells Telegram to POST inbound messages
 * to our webhook so bot commands (help, stats, sources, approve …) work.
 *
 * Safe to expose: the destination URL is hardcoded here, so a caller cannot
 * point the webhook anywhere else, and the response never contains the token
 * (setWebhook / getWebhookInfo payloads exclude it).
 */
const WEBHOOK_URL = 'https://flip-ly.net/api/telegram/webhook'

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set in env' }, { status: 500 })
  }

  const base = `https://api.telegram.org/bot${token}`

  const setWebhook = await fetch(`${base}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ['message'],
      drop_pending_updates: false,
    }),
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: String(e) }))

  const info = await fetch(`${base}/getWebhookInfo`)
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: String(e) }))

  return NextResponse.json({
    setWebhook,
    webhookInfo: info?.result ?? info,
  })
}
