import { createHmac } from 'crypto'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const SECRET = process.env.JWT_SECRET

export function generateUnsubToken(email: string): string {
  return createHmac('sha256', SECRET).update(email.toLowerCase()).digest('hex').substring(0, 32)
}

export function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubToken(email)
  return `https://flip-ly.net/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}
