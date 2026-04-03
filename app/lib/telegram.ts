const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

/**
 * Send a Telegram alert message. Retries once on failure.
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log(`[TELEGRAM] Skipped alert — missing config`)
    return
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
  })

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[TELEGRAM] Alert failed (${res.status}): ${body}`)
        if (attempt < 2) continue
      } else {
        console.log(`[TELEGRAM] Alert sent`)
        return
      }
    } catch (err: any) {
      console.error(`[TELEGRAM] Error (attempt ${attempt}):`, err.message)
      if (attempt < 2) {
        // Brief pause before retry
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }
}
