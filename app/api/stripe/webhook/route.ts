import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhooks not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.fliply_user_id
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (userId) {
          await supabase
            .from('fliply_users')
            .update({
              is_premium: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', userId)

          trackEvent('pro_subscription_activated', {
            subscription_id: subscriptionId,
          }, userId)

          console.log(`[Stripe] Pro activated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.fliply_user_id

        if (userId) {
          await supabase
            .from('fliply_users')
            .update({
              is_premium: false,
              stripe_subscription_id: null,
            })
            .eq('id', userId)

          trackEvent('pro_subscription_cancelled', {
            subscription_id: subscription.id,
          }, userId)

          console.log(`[Stripe] Pro cancelled for user ${userId}`)
        } else {
          // Fallback: find by customer ID
          const customerId = subscription.customer as string
          await supabase
            .from('fliply_users')
            .update({
              is_premium: false,
              stripe_subscription_id: null,
            })
            .eq('stripe_customer_id', customerId)

          console.log(`[Stripe] Pro cancelled for customer ${customerId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Look up user by customer ID
        const { data: user } = await supabase
          .from('fliply_users')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          trackEvent('pro_payment_failed', {
            invoice_id: invoice.id || 'unknown',
          }, user.id)

          console.log(`[Stripe] Payment failed for user ${user.id} (${user.email})`)
        }
        break
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`)
    }
  } catch (err: any) {
    console.error(`[Stripe] Webhook handler error (${event.type}):`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
