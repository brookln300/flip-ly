/**
 * Centralized premium/tier check.
 * Admin users always get premium access regardless of is_premium flag.
 */
export type SubscriptionTier = 'pro' | 'power' | 'admin' | null

export function isPremiumUser(user: { is_premium?: boolean; subscription_tier?: string | null } | null): boolean {
  if (!user) return false
  return user.is_premium === true || ['pro', 'power', 'admin'].includes(user.subscription_tier as string)
}

export function getUserTier(user: { is_premium?: boolean; subscription_tier?: string | null } | null): string {
  if (!user) return 'anonymous'
  if (user.subscription_tier === 'admin') return 'admin'
  if (user.subscription_tier === 'power') return 'power'
  if (user.subscription_tier === 'pro' || user.is_premium) return 'pro'
  return 'free'
}
