import type { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
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
          .select('id, email, password_hash, city, state, zip_code, is_premium')
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
          zip_code: user.zip_code,
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
            })
            .select('id')
            .single()

          if (newUser) {
            user.id = newUser.id
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
