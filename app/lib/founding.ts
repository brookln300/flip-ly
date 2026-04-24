const DEFAULT_FOUNDING_DEADLINE = process.env.FOUNDING_DEADLINE || '2026-04-26T00:00:00Z'

export const FOUNDING_TOTAL_SLOTS = 88
export const FOUNDING_PRICE = 5
export const NORMAL_PRICE = 9

export function getFoundingSnapshot(now: Date = new Date()) {
  const deadline = new Date(DEFAULT_FOUNDING_DEADLINE)
  const active = deadline > now
  const msRemaining = Math.max(0, deadline.getTime() - now.getTime())

  return {
    active,
    deadline: DEFAULT_FOUNDING_DEADLINE,
    foundingPrice: FOUNDING_PRICE,
    normalPrice: NORMAL_PRICE,
    priceVariant: active ? 'founding' as const : 'regular' as const,
    timeRemaining: {
      days: Math.floor(msRemaining / (1000 * 60 * 60 * 24)),
      hours: Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)),
    },
  }
}
