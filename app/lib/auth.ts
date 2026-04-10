import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import { supabase } from './supabase'

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

  // 1. Try custom JWT first (email/password users)
  const customToken = cookieStore.get('flip-session')?.value
  if (customToken) {
    const session = await verifyToken(customToken)
    if (session) return session
  }

  // 2. Fallback: check NextAuth session token (Google/Twitter OAuth users)
  const nextAuthToken = cookieStore.get('next-auth.session-token')?.value
    || cookieStore.get('__Secure-next-auth.session-token')?.value
  if (nextAuthToken) {
    try {
      // NextAuth JWT uses the same secret (NEXTAUTH_SECRET || JWT_SECRET)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
      if (secret) {
        const secretKey = new TextEncoder().encode(secret)
        const { payload } = await jwtVerify(nextAuthToken, secretKey)
        const userId = (payload as any).userId || (payload as any).sub
        const email = (payload as any).email
        if (userId && email) {
          // Look up the actual user ID from our DB (NextAuth sub may differ)
          const { data: user } = await supabase
            .from('fliply_users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()
          if (user) {
            return { userId: user.id, email: user.email }
          }
        }
      }
    } catch {
      // NextAuth token invalid or expired — fall through
    }
  }

  return null
}

// Admin emails allowed to access /api/admin/* endpoints
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'aethercoreai@outlook.com,knation@gmail.com').split(',')

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
