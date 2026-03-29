import { createHash } from 'crypto'

const SECURITY_SECRET = process.env.POW_SECRET || 'lobster-council-pow-secret-2026'

/**
 * Contest Security Utilities
 *
 * Honeypot detection, progressive delay, fingerprint hashing, bot detection
 */

/**
 * Check if honeypot field was filled (indicates bot)
 */
export function isHoneypotTriggered(honeypotValue: string | undefined | null): boolean {
  return !!honeypotValue && honeypotValue.length > 0
}

/**
 * Calculate progressive delay based on attempt count in current window.
 *
 * Attempts 1-5:   instant (0ms)
 * Attempts 6-10:  3 seconds
 * Attempts 11-15: 10 seconds
 * Attempts 16-20: 30 seconds
 */
export function getProgressiveDelay(attemptCount: number): number {
  if (attemptCount <= 5) return 0
  if (attemptCount <= 10) return 3000
  if (attemptCount <= 15) return 10000
  return 30000
}

/**
 * Hash a browser fingerprint for consistent device tracking.
 */
export function hashFingerprint(fingerprint: string): string {
  return createHash('sha256')
    .update(`${fingerprint}:${SECURITY_SECRET}`)
    .digest('hex')
    .substring(0, 32)
}

/**
 * Validate that the user-agent looks like a real browser.
 */
export function isLikelyBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()

  const botPatterns = [
    'bot', 'crawl', 'spider', 'scrape', 'fetch',
    'python-requests', 'python-urllib', 'httpx',
    'curl/', 'wget/', 'go-http-client',
    'java/', 'apache-httpclient',
    'node-fetch', 'undici', 'got/',
    'postman', 'insomnia', 'httpie',
    'phantomjs', 'headlesschrome',
  ]

  const hasBrowserSignals =
    ua.includes('mozilla') &&
    (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari') || ua.includes('edge'))

  if (botPatterns.some(p => ua.includes(p))) return true
  if (!hasBrowserSignals && ua !== 'unknown') return true

  return false
}
