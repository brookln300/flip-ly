export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getFoundingCountdown,
  initFoundingCountdown,
  isRedisHealthy,
} from '../../lib/redis'

// Founding member window: 14 days from launch, 88 slots
const FOUNDING_DEADLINE = '2026-04-26T00:00:00Z'
const FOUNDING_TOTAL_SLOTS = 88
const FOUNDING_PRICE = 5
const NORMAL_PRICE = 9

export async function GET(req: NextRequest) {
  const redisUp = await isRedisHealthy()

  if (!redisUp) {
    // Fallback: compute from current time only (no live slot tracking)
    const deadline = new Date(FOUNDING_DEADLINE)
    const now = new Date()
    const active = deadline > now
    const msRemaining = Math.max(0, deadline.getTime() - now.getTime())

    return NextResponse.json({
      active,
      deadline: FOUNDING_DEADLINE,
      slotsRemaining: null, // unknown without Redis
      totalSlots: FOUNDING_TOTAL_SLOTS,
      foundingPrice: FOUNDING_PRICE,
      normalPrice: NORMAL_PRICE,
      timeRemaining: {
        days: Math.floor(msRemaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)),
      },
      source: 'fallback',
    })
  }

  // Ensure founding countdown is initialized
  await initFoundingCountdown(FOUNDING_DEADLINE, FOUNDING_TOTAL_SLOTS)

  const countdown = await getFoundingCountdown()
  const deadline = countdown.deadline ? new Date(countdown.deadline) : new Date(FOUNDING_DEADLINE)
  const now = new Date()
  const msRemaining = Math.max(0, deadline.getTime() - now.getTime())

  return NextResponse.json({
    active: countdown.active,
    deadline: countdown.deadline || FOUNDING_DEADLINE,
    slotsRemaining: countdown.slotsRemaining,
    totalSlots: FOUNDING_TOTAL_SLOTS,
    foundingPrice: FOUNDING_PRICE,
    normalPrice: NORMAL_PRICE,
    timeRemaining: {
      days: Math.floor(msRemaining / (1000 * 60 * 60 * 24)),
      hours: Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)),
    },
    slotsClaimed: FOUNDING_TOTAL_SLOTS - countdown.slotsRemaining,
    source: 'redis',
  })
}
