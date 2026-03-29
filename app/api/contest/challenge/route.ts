import { NextResponse } from 'next/server'
import { generateChallenge } from '../../../lib/proof-of-work'

/**
 * GET /api/contest/challenge
 *
 * Issues a proof-of-work challenge that the client must solve
 * before submitting a contest attempt.
 */
export async function GET() {
  const challenge = generateChallenge()
  return NextResponse.json(challenge)
}
