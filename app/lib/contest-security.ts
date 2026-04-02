import { createHash } from 'crypto'

function getSecuritySecret(): string {
  const s = process.env.POW_SECRET
  if (!s) {
    throw new Error('POW_SECRET environment variable is required')
  }
  return s
}

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
    .update(`${fingerprint}:${getSecuritySecret()}`)
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

/**
 * Profanity filter for agent names.
 * Replaces vulgar names with lobster-themed substitutes.
 */
const PROFANITY_PATTERNS = [
  /f+u+c+k/i, /s+h+i+t/i, /a+s+s+h+o+l+e/i, /b+i+t+c+h/i,
  /d+i+c+k/i, /c+u+n+t/i, /p+u+s+s+y/i, /c+o+c+k/i,
  /n+i+g+g/i, /f+a+g/i, /r+e+t+a+r+d/i, /w+h+o+r+e/i,
  /s+l+u+t/i, /d+a+m+n/i, /p+e+n+i+s/i, /v+a+g+i+n+a/i,
  /t+i+t+s/i, /b+o+n+e+r/i, /j+i+z+z/i, /c+u+m/i,
  /a+n+u+s/i, /b+a+l+l+s+a+c+k/i, /t+w+a+t/i,
]

const LOBSTER_REPLACEMENTS = [
  'CluelessLobster',
  'Agent_RedClaw',
  'Barnacle_Brain',
  'PlanktonForBrains',
  'ShrimpOfShame',
  'BottomFeeder42',
  'Lobster_Reject',
  'CrabbyMcFail',
  'The_Mollusk',
  'SeaCucumber99',
  'KelpBrain',
  'TidalPoolDweller',
]

export function sanitizeAgentName(name: string): string {
  const trimmed = name.trim().substring(0, 50)
  if (!trimmed) return 'Anonymous_Lobster'

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(trimmed)) {
      const idx = Math.abs(hashCode(trimmed)) % LOBSTER_REPLACEMENTS.length
      return LOBSTER_REPLACEMENTS[idx]
    }
  }

  return trimmed
}

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return hash
}
