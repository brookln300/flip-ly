export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'
import { getFoundingSnapshot } from '../../../lib/founding'

const ALLOWED_EVENTS = new Set([
  'pricing_viewed',
  'founding_badge_shown',
  'plan_selected',
  'auth_started_with_plan_intent',
  'auth_completed_with_plan_intent',
  'checkout_session_abandoned',
])

export async function POST(req: NextRequest) {
  try {
    const { eventName, params } = await req.json()

    if (!eventName || typeof eventName !== 'string' || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
    }

    const session = await getSession()
    const founding = getFoundingSnapshot()
    const payload = {
      ...(params || {}),
      price_variant: params?.price_variant || founding.priceVariant,
      power_visibility: params?.power_visibility || process.env.NEXT_PUBLIC_POWER_VISIBILITY || 'public',
      logged_in: typeof params?.logged_in === 'boolean' ? params.logged_in : !!session,
    }

    trackEvent(eventName, payload, session?.userId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 })
  }
}
