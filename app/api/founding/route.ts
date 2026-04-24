export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getFoundingCountdown,
  initFoundingCountdown,
  isRedisHealthy,
} from '../../lib/redis'
import {
  FOUNDING_TOTAL_SLOTS,
  getFoundingSnapshot,
} from '../../lib/founding'
import { getPowerVisibility } from '../../lib/pricing'

const { deadline: FOUNDING_DEADLINE, foundingPrice: FOUNDING_PRICE, normalPrice: NORMAL_PRICE } = getFoundingSnapshot()

export async function GET(req: NextRequest) {
  const redisUp = await isRedisHealthy()

  const powerVisibility = getPowerVisibility()

  if (!redisUp) {
    // Fallback: compute from current time only (no live slot tracking)
    const founding = getFoundingSnapshot()

    return NextResponse.json({
      active: founding.active,
      deadline: founding.deadline,
      slotsRemaining: null, // unknown without Redis
      totalSlots: FOUNDING_TOTAL_SLOTS,
      foundingPrice: FOUNDING_PRICE,
      normalPrice: NORMAL_PRICE,
      priceVariant: founding.priceVariant,
      powerVisibility,
      timeRemaining: founding.timeRemaining,
      source: 'fallback',
    })
  }

  // Ensure founding countdown is initialized
  await initFoundingCountdown(FOUNDING_DEADLINE, FOUNDING_TOTAL_SLOTS)

  const countdown = await getFoundingCountdown()
  const resolvedFounding = getFoundingSnapshot(countdown.deadline ? new Date(countdown.deadline) : new Date())

  return NextResponse.json({
    active: countdown.active,
    deadline: countdown.deadline || FOUNDING_DEADLINE,
    slotsRemaining: countdown.slotsRemaining,
    totalSlots: FOUNDING_TOTAL_SLOTS,
    foundingPrice: FOUNDING_PRICE,
    normalPrice: NORMAL_PRICE,
    priceVariant: resolvedFounding.priceVariant,
    powerVisibility,
    timeRemaining: resolvedFounding.timeRemaining,
    slotsClaimed: FOUNDING_TOTAL_SLOTS - countdown.slotsRemaining,
    source: 'redis',
  })
}
