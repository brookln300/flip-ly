import { createHmac } from 'crypto'

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return s
}

export function generateUnsubToken(email: string): string {
  return createHmac('sha256', getSecret()).update(email.toLowerCase()).digest('hex').substring(0, 32)
}

export function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubToken(email)
  return `https://flip-ly.net/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}
