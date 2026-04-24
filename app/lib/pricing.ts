import { getFoundingSnapshot } from './founding'

export type PaidTier = 'pro' | 'power'
export type Tier = 'free' | PaidTier
export type PriceVariant = 'founding' | 'regular'
export type PowerVisibility = 'hidden' | 'waitlist' | 'public'

export const PRICES: Record<PaidTier, Record<PriceVariant, number>> = {
  pro:   { founding: 5,  regular: 9  },
  power: { founding: 19, regular: 39 },
}

export function currentVariant(now: Date = new Date()): PriceVariant {
  return getFoundingSnapshot(now).priceVariant
}

export function priceIdFor(tier: PaidTier, variant: PriceVariant): string | undefined {
  if (tier === 'pro') {
    return variant === 'founding'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID_REGULAR
  }
  return variant === 'founding'
    ? process.env.STRIPE_POWER_PRICE_ID
    : process.env.STRIPE_POWER_PRICE_ID_REGULAR
}

export function getPowerVisibility(): PowerVisibility {
  const raw = (process.env.NEXT_PUBLIC_POWER_VISIBILITY ?? 'hidden').toLowerCase()
  if (raw === 'waitlist' || raw === 'public') return raw
  return 'hidden'
}

export function isPowerPurchasable(): boolean {
  return getPowerVisibility() === 'public'
}

/**
 * Resolve a Stripe price ID for checkout. If the requested variant is 'regular'
 * but no regular price is configured, falls back to the founding price so
 * checkout never 503s purely on a missing env var post-deadline.
 */
export function resolveCheckoutPrice(tier: PaidTier): {
  priceId: string | undefined
  variantRequested: PriceVariant
  variantUsed: PriceVariant
  fellBack: boolean
} {
  const variantRequested = currentVariant()
  const primary = priceIdFor(tier, variantRequested)
  if (primary) {
    return { priceId: primary, variantRequested, variantUsed: variantRequested, fellBack: false }
  }
  if (variantRequested === 'regular') {
    const founding = priceIdFor(tier, 'founding')
    if (founding) {
      return { priceId: founding, variantRequested, variantUsed: 'founding', fellBack: true }
    }
  }
  return { priceId: undefined, variantRequested, variantUsed: variantRequested, fellBack: false }
}
