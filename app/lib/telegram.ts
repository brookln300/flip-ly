const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

/**
 * Send a Telegram alert message. Non-blocking, logs errors.
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log(`[TELEGRAM] Skipped alert — missing config: ${message}`)
    return
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!res.ok) {
      console.error(`[TELEGRAM] Alert failed: ${res.status}`)
    } else {
      console.log(`[TELEGRAM] Alert sent`)
    }
  } catch (err: any) {
    console.error(`[TELEGRAM] Error:`, err.message)
  }
}
