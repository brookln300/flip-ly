/**
 * One-time script: Register flip-ly's webhook URL with Telegram Bot API.
 *
 * Usage:
 *   npx tsx scripts/setup-telegram-webhook.ts
 *
 * This tells Telegram: "whenever someone sends a message to the bot,
 * POST it to https://flip-ly.net/api/telegram/webhook"
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env manually (no dotenv)
const envPath = resolve(process.cwd(), '.env.local')
const envFile = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env.local')
  process.exit(1)
}

const WEBHOOK_URL = 'https://flip-ly.net/api/telegram/webhook'

async function main() {
  // Set webhook
  const setRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message'],
      }),
    }
  )
  const setData = await setRes.json()
  console.log('setWebhook response:', JSON.stringify(setData, null, 2))

  // Verify
  const infoRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  )
  const infoData = await infoRes.json()
  console.log('getWebhookInfo:', JSON.stringify(infoData, null, 2))
}

main().catch(console.error)
