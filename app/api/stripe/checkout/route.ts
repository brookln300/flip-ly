export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Stripe Price IDs — create these in Stripe Dashboard as recurring monthly prices
const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  power: process.env.STRIPE_POWER_PRICE_ID,
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // Require auth
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Parse tier from request body (default: pro)
  let tier = 'pro'
  try {
    const body = await req.json()
    if (body.tier === 'power') tier = 'power'
  } catch {}

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    return NextResponse.json({ error: `${tier} tier not configured` }, { status: 503 })
  }

  try {
    // Get user from DB
    const { data: user } = await supabase
      .from('fliply_users')
      .select('id, email, is_premium, subscription_tier, stripe_customer_id')
      .eq('id', session.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Block if user already has the same or higher tier (but allow pro → power upgrade)
    if (user.is_premium && user.subscription_tier !== 'admin') {
      const tierRank: Record<string, number> = { free: 0, pro: 1, power: 2 }
      const currentRank = tierRank[user.subscription_tier || 'free'] ?? 0
      const targetRank = tierRank[tier] ?? 0
      if (targetRank <= currentRank) {
        return NextResponse.json(
          { error: `Already on ${user.subscription_tier} plan` },
          { status: 400 }
        )
      }
    }

    // Reuse existing Stripe customer or create new
    let customerId = user.stripe_customer_id

    if (!customerId) {
      // Check for existing Stripe customer by email (prevents duplicates from double-click)
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { fliply_user_id: user.id },
        })
        customerId = customer.id
      }

      // Save customer ID — use conditional update to prevent race condition
      const { error: updateError } = await supabase
        .from('fliply_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
        .is('stripe_customer_id', null)

      if (updateError) {
        // Another request already set it — re-fetch
        const { data: refreshed } = await supabase
          .from('fliply_users')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()
        if (refreshed?.stripe_customer_id) {
          customerId = refreshed.stripe_customer_id
        }
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/pro?status=success`,
      cancel_url: `${req.nextUrl.origin}/pro?status=cancelled`,
      metadata: { fliply_user_id: user.id, tier },
      phone_number_collection: { enabled: false },
      subscription_data: {
        metadata: { fliply_user_id: user.id, tier },
      },
    })

    trackEvent('pro_checkout_started', {
      stripe_session_id: checkoutSession.id,
    }, user.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
