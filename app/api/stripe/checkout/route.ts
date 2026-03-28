import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Set your Stripe Price ID in Vercel env — create a $5/mo recurring price in Stripe Dashboard
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID

export async function POST(req: NextRequest) {
  if (!stripe || !PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // Require auth
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  try {
    // Get user from DB
    const { data: user } = await supabase
      .from('fliply_users')
      .select('id, email, is_premium, stripe_customer_id')
      .eq('id', session.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.is_premium) {
      return NextResponse.json({ error: 'Already a Pro member' }, { status: 400 })
    }

    // Reuse existing Stripe customer or create new
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { fliply_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('fliply_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/pro?status=success`,
      cancel_url: `${req.nextUrl.origin}/pro?status=cancelled`,
      metadata: { fliply_user_id: user.id },
      subscription_data: {
        metadata: { fliply_user_id: user.id },
      },
    })

    trackEvent('pro_checkout_started', {
      stripe_session_id: checkoutSession.id,
    }, user.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 })
  }
}
