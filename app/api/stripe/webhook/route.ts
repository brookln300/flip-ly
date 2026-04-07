import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'
import { sendTelegramAlert } from '../../../lib/telegram'
import { sendEmail } from '../../../lib/email/send'
import { getProUpgradeEmail, getPaymentFailedEmail } from '../../../lib/email/drip-templates'

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
          // Activate Pro in database
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

          // Get user email for confirmation
          const { data: proUser } = await supabase
            .from('fliply_users')
            .select('email')
            .eq('id', userId)
            .single()

          const tier = session.metadata?.tier || 'pro'

          // Send Pro upgrade confirmation email
          if (proUser?.email) {
            const subject = tier === 'power'
              ? "You're on Power — here's what's unlocked"
              : "You're on Pro — here's what's unlocked"
            const html = getProUpgradeEmail(proUser.email, tier)

            const { id: resendMessageId } = await sendEmail({
              to: proUser.email,
              subject,
              html,
              tags: [
                { name: 'sequence', value: 'transactional' },
                { name: 'template', value: 'pro-upgrade' },
              ],
            })

            // Log for webhook tracking
            await supabase.from('email_sends').insert({
              user_id: userId,
              to_email: proUser.email.toLowerCase(),
              subject,
              template_key: 'pro-upgrade',
              resend_message_id: resendMessageId || null,
              status: 'sent',
            }).then(null, (err: any) =>
              console.error('[STRIPE] email_sends log failed:', err.message)
            )

            console.log(`[Stripe] Pro upgrade email sent to ${proUser.email}`)
          }

          // Cancel any active drip enrollments — they converted, stop selling
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'converted', completed_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('status', 'active')

          sendTelegramAlert([
            `<b>NEW PRO SUBSCRIBER!</b>`,
            `User: ${proUser?.email || userId}`,
            `Tier: ${tier}`,
            `Subscription: ${subscriptionId}`,
          ].join('\n'))
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

          sendTelegramAlert([
            `😢 <b>Pro Cancelled</b>`,
            `User: ${userId}`,
            `The lobster is disappointed.`,
          ].join('\n'))
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
        const { data: failedUser } = await supabase
          .from('fliply_users')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (failedUser) {
          trackEvent('pro_payment_failed', {
            invoice_id: invoice.id || 'unknown',
          }, failedUser.id)

          // Send payment failed email — helpful, not scary
          const failSubject = 'Heads up — your payment didn\'t go through'
          const failHtml = getPaymentFailedEmail(failedUser.email)

          const { id: failMsgId } = await sendEmail({
            to: failedUser.email,
            subject: failSubject,
            html: failHtml,
            tags: [
              { name: 'sequence', value: 'transactional' },
              { name: 'template', value: 'payment-failed' },
            ],
          })

          await supabase.from('email_sends').insert({
            user_id: failedUser.id,
            to_email: failedUser.email.toLowerCase(),
            subject: failSubject,
            template_key: 'payment-failed',
            resend_message_id: failMsgId || null,
            status: 'sent',
          }).then(null, (err: any) =>
            console.error('[STRIPE] email_sends log failed:', err.message)
          )

          console.log(`[Stripe] Payment failed email sent to ${failedUser.email}`)

          sendTelegramAlert([
            `<b>Payment Failed</b>`,
            `User: ${failedUser.email}`,
            `Invoice: ${invoice.id || 'unknown'}`,
          ].join('\n'))
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
