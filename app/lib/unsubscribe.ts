import { createHmac } from 'crypto'

const SECRET = process.env.JWT_SECRET || 'fliply-unsub-secret'

export function generateUnsubToken(email: string): string {
  return createHmac('sha256', SECRET).update(email.toLowerCase()).digest('hex').substring(0, 16)
}

export function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubToken(email)
  return `https://flip-ly.net/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}
