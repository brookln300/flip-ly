import type { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { trackEvent } from './analytics'
import { sendTelegramAlert } from './telegram'

/**
 * Enroll a new OAuth user in the welcome-to-convert drip sequence.
 * Starts at step 1 (skips drip welcome) because /api/auth/assign-market
 * sends the welcome email with correct geo-resolved location on first
 * dashboard visit. This matches the email/password signup behavior.
 */
async function enrollInWelcomeSequence(userId: string) {
  const { data: seqs } = await supabase
    .from('drip_sequences')
    .select('id')
    .eq('name', 'welcome-to-convert')
    .eq('is_active', true)
    .limit(1)

  if (!seqs?.length) return

  const variant = Math.random() < 0.5 ? 'a' : 'b'

  await supabase.from('sequence_enrollments').upsert({
    user_id: userId,
    sequence_id: seqs[0].id,
    current_step: 1,
    status: 'active',
    variant,
  }, { onConflict: 'user_id,sequence_id' })

  console.log(`[DRIP] OAuth user ${userId} enrolled in welcome sequence at step 1 (variant ${variant})`)
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: user } = await supabase
          .from('fliply_users')
          .select('id, email, password_hash, city, state, market_id, is_premium')
          .eq('email', credentials.email.toLowerCase())
          .single()

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
          city: user.city,
          state: user.state,
          market_id: user.market_id,
          is_premium: user.is_premium,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers (Twitter), upsert user into fliply_users
      if (account?.provider === 'twitter' && user.email) {
        const { data: existing } = await supabase
          .from('fliply_users')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .single()

        if (!existing) {
          // New OAuth user — create account without password
          const { data: newUser } = await supabase
            .from('fliply_users')
            .insert({
              email: user.email.toLowerCase(),
              password_hash: '', // OAuth users don't have passwords
              x_id: account.providerAccountId,
              x_username: user.name || null,
              acquisition_source: 'twitter',
            })
            .select('id')
            .single()

          if (newUser) {
            user.id = newUser.id
            trackEvent('signup_complete', { signup_source: 'twitter', x_username: user.name || '' }, newUser.id)
            enrollInWelcomeSequence(newUser.id).catch(err =>
              console.error('[OAUTH] Twitter drip enrollment failed:', err.message)
            )
            sendTelegramAlert(`<b>New Signup (Twitter)</b>\nEmail: ${user.email}\nX: @${user.name || 'unknown'}`)
          }
        } else {
          // Existing user — link X account
          await supabase
            .from('fliply_users')
            .update({
              x_id: account.providerAccountId,
              x_username: user.name || null,
              x_oauth_token: account.access_token || null,
            })
            .eq('id', existing.id)

          user.id = existing.id
          trackEvent('login_complete', { auth_provider: 'twitter' }, existing.id)
        }
      }

      // Google OAuth — upsert user
      if (account?.provider === 'google' && user.email) {
        const { data: existing } = await supabase
          .from('fliply_users')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .single()

        if (!existing) {
          const { data: newUser } = await supabase
            .from('fliply_users')
            .insert({
              email: user.email.toLowerCase(),
              password_hash: '',
              google_id: account.providerAccountId,
              google_name: user.name || null,
              acquisition_source: 'google',
            })
            .select('id')
            .single()
          if (newUser) {
            user.id = newUser.id
            trackEvent('signup_complete', { signup_source: 'google', google_name: user.name || '' }, newUser.id)
            enrollInWelcomeSequence(newUser.id).catch(err =>
              console.error('[OAUTH] Google drip enrollment failed:', err.message)
            )
            sendTelegramAlert(`<b>New Signup (Google)</b>\nEmail: ${user.email}\nName: ${user.name || 'unknown'}`)
          }
        } else {
          await supabase
            .from('fliply_users')
            .update({ google_id: account.providerAccountId, google_name: user.name || null })
            .eq('id', existing.id)
          user.id = existing.id
          trackEvent('login_complete', { auth_provider: 'google' }, existing.id)
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
      }
      if (account?.provider === 'twitter') {
        token.xAccessToken = account.access_token
        token.provider = 'twitter'
      }
      if (account?.provider === 'google') {
        token.provider = 'google'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string
        (session.user as any).provider = (token.provider as string) || 'credentials'
      }
      return session
    },
  },

  pages: {
    signIn: '/',      // Redirect to home page for login
    error: '/',       // Show errors on home page
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days — matches existing cookie TTL
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
}
