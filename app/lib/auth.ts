import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getJwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET
  if (!s) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return new TextEncoder().encode(s)
}

export async function createToken(userId: string, email: string) {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('flip-session')?.value
  if (!token) return null
  return verifyToken(token)
}

// Admin emails allowed to access /api/admin/* endpoints
const ADMIN_EMAILS = ['aethercoreai@outlook.com', 'knation@gmail.com']

export async function requireAdmin(req: Request): Promise<{ userId: string; email: string } | null> {
  // Check for CRON_SECRET (for automated calls)
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return { userId: 'system', email: 'cron@flip-ly.net' }
  }

  // Check session-based auth
  const session = await getSession()
  if (!session) return null
  if (!ADMIN_EMAILS.includes(session.email)) return null
  return session
}
