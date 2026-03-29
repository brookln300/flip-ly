import { createHash } from 'crypto'

/**
 * Proof-of-Work Challenge System
 *
 * Before submitting a contest attempt, the client must solve a computational
 * puzzle. This makes automated mass-guessing expensive while being trivial
 * for a single human user (~100-500ms in browser).
 *
 * Protocol:
 * 1. Server issues a challenge: { challenge, difficulty, expires }
 * 2. Client finds a nonce where SHA256(challenge + nonce) starts with `difficulty` zeros
 * 3. Client sends { challenge, nonce, solution } with the attempt
 * 4. Server verifies in O(1) — just one hash
 */

const POW_DIFFICULTY = 4 // Number of leading hex zeros required (4 = ~65k iterations avg)
const POW_TTL_MS = 5 * 60 * 1000 // Challenge valid for 5 minutes
const POW_SECRET = process.env.POW_SECRET || 'lobster-council-pow-secret-2026'

export function sha256hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Generate a new proof-of-work challenge
 */
export function generateChallenge(): {
  challenge: string
  difficulty: number
  expires: number
  signature: string
} {
  const expires = Date.now() + POW_TTL_MS
  const challenge = sha256hex(`${Date.now()}-${Math.random()}-${POW_SECRET}`)
  const signature = sha256hex(`${challenge}:${expires}:${POW_SECRET}`)

  return {
    challenge,
    difficulty: POW_DIFFICULTY,
    expires,
    signature,
  }
}

/**
 * Verify a proof-of-work solution
 * Returns { valid: boolean, error?: string }
 */
export function verifyProofOfWork(
  challenge: string,
  nonce: string,
  signature: string,
  expires: number,
): { valid: boolean; error?: string } {
  // Check expiry
  if (Date.now() > expires) {
    return { valid: false, error: 'Challenge expired. Request a new one.' }
  }

  // Verify signature (prevents forged/tampered challenges)
  const expectedSig = sha256hex(`${challenge}:${expires}:${POW_SECRET}`)
  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid challenge signature.' }
  }

  // Verify the solution
  const hash = sha256hex(`${challenge}${nonce}`)
  const prefix = '0'.repeat(POW_DIFFICULTY)
  if (!hash.startsWith(prefix)) {
    return { valid: false, error: 'Proof of work failed. Solution incorrect.' }
  }

  return { valid: true }
}
