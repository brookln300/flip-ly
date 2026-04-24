'use client'

type EventParams = Record<string, string | number | boolean>

const AUTH_INTENT_KEY = 'fliply_auth_pending_intent'
const AUTH_METHOD_KEY = 'fliply_auth_pending_method'
const AUTH_SURFACE_KEY = 'fliply_auth_pending_surface'

export function trackFunnelEvent(eventName: string, params: EventParams = {}) {
  if (typeof window !== 'undefined') {
    const w = window as any
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, params)
    }
  }

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, params }),
    keepalive: true,
  }).catch(() => {})
}

export function storeAuthIntent(intent: string, method: string, surface: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_INTENT_KEY, intent)
  sessionStorage.setItem(AUTH_METHOD_KEY, method)
  sessionStorage.setItem(AUTH_SURFACE_KEY, surface)
}

export function readAuthIntent() {
  if (typeof window === 'undefined') return null

  const intent = sessionStorage.getItem(AUTH_INTENT_KEY)
  const method = sessionStorage.getItem(AUTH_METHOD_KEY)
  const surface = sessionStorage.getItem(AUTH_SURFACE_KEY)

  if (!intent || !method || !surface) return null

  return { intent, method, surface }
}

export function clearAuthIntent() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_INTENT_KEY)
  sessionStorage.removeItem(AUTH_METHOD_KEY)
  sessionStorage.removeItem(AUTH_SURFACE_KEY)
}
