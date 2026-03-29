import { NextRequest } from 'next/server'

/**
 * Get client IP from request.
 * Uses Vercel's x-real-ip header (set by their edge, not spoofable),
 * falls back to x-forwarded-for first entry.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
