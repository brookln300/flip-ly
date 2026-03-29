export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { generateChallenge } from '../../../lib/proof-of-work'

/**
 * GET /api/contest/challenge
 *
 * Issues a proof-of-work challenge that the client must solve
 * before submitting a contest attempt.
 *
 * MUST be force-dynamic — each challenge has a 5-minute TTL.
 * Cached responses = expired challenges = all attempts fail with 400.
 */
export async function GET() {
  const challenge = generateChallenge()
  return NextResponse.json(challenge)
}
