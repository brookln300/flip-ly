export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { trackEvent } from '../../lib/analytics'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Donations not configured' }, { status: 503 })
  }

  try {
    const { amount } = await req.json()

    // Clamp between $1 and $100
    const cents = Math.min(Math.max(Math.round((amount || 1) * 100), 100), 10000)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: '🦞 Feed the Chaos — flip-ly.net Donation',
            description: 'You are literally paying to keep Comic Sans alive on the internet. Thank you.',
          },
          unit_amount: cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/donated?status=success`,
      cancel_url: `${req.nextUrl.origin}/donated?status=cancelled`,
    })

    // GA4: donation_initiated
    trackEvent('donation_initiated', {
      amount_cents: cents,
      stripe_session_id: session.id,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Donation error:', err)
    return NextResponse.json({ error: 'Donation failed' }, { status: 500 })
  }
}
