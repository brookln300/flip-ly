const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID
const GA4_API_SECRET = process.env.GA4_API_SECRET
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

/**
 * Fire a server-side GA4 event via Measurement Protocol.
 * Non-blocking — errors are logged but never throw.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean>,
  userId?: string
) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    console.log(`[GA4] Skipped ${eventName} — missing config`)
    return
  }

  const clientId = userId ? `server-${userId}` : `server-anonymous-${Date.now()}`

  const payload = {
    client_id: clientId,
    user_id: userId || undefined,
    events: [
      {
        name: eventName,
        params: {
          ...params,
          engagement_time_msec: '1',
          session_id: userId ? `${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 13)}` : `anon-${new Date().toISOString().slice(0, 13)}`,
        },
      },
    ],
  }

  const url = `${GA4_ENDPOINT}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) console.error(`[GA4] ${eventName} failed: ${res.status}`)
      else console.log(`[GA4] ${eventName} sent for ${userId || 'anonymous'}`)
    })
    .catch((err) => {
      console.error(`[GA4] ${eventName} error:`, err.message)
    })
}
