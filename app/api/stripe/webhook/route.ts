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
          const rawTier = session.metadata?.tier || 'pro'
          const tier = ['pro', 'power'].includes(rawTier) ? rawTier : 'pro'

          // Activate subscription in database
          await supabase
            .from('fliply_users')
            .update({
              is_premium: true,
              subscription_tier: tier,
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

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subStatus = subscription.status
        let userId = subscription.metadata?.fliply_user_id
        const rawTier = subscription.metadata?.tier || 'pro'
        const tier = ['pro', 'power'].includes(rawTier) ? rawTier : 'pro'

        // Fallback: look up user by stripe_customer_id if no metadata
        if (!userId) {
          const customerId = subscription.customer as string
          const { data: custLookup } = await supabase
            .from('fliply_users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          if (custLookup) userId = custLookup.id
        }

        if (userId) {
          // Protect admin users from any downgrade
          const { data: subUser } = await supabase
            .from('fliply_users')
            .select('subscription_tier')
            .eq('id', userId)
            .single()

          const isAdmin = subUser?.subscription_tier === 'admin'

          if (subStatus === 'active') {
            // Re-activate or confirm active — always safe
            if (!isAdmin) {
              await supabase
                .from('fliply_users')
                .update({ is_premium: true, subscription_tier: tier })
                .eq('id', userId)
            }
          } else if (subStatus === 'past_due' || subStatus === 'unpaid') {
            // Cut access until payment resolves (except admins)
            if (!isAdmin) {
              await supabase
                .from('fliply_users')
                .update({ is_premium: false })
                .eq('id', userId)
            }
          }
          // canceled status: do nothing — let customer.subscription.deleted handle full cleanup

          trackEvent('subscription_status_updated', {
            subscription_id: subscription.id,
            status: subStatus,
          }, userId)

          console.log(`[Stripe] Subscription updated for user ${userId}: status=${subStatus}, admin=${isAdmin}`)

          if (subStatus === 'past_due') {
            sendTelegramAlert([
              `<b>Subscription Past Due!</b>`,
              `User: ${userId}`,
              `Status: ${subStatus}`,
              `Tier: ${subUser?.subscription_tier || tier}`,
            ].join('\n'))
          } else if (subStatus !== 'active') {
            sendTelegramAlert([
              `<b>Subscription Status Change</b>`,
              `User: ${userId}`,
              `Status: ${subStatus}`,
              `Tier: ${subUser?.subscription_tier || tier}`,
            ].join('\n'))
          }
        } else {
          console.warn(`[Stripe] subscription.updated for unknown customer: ${subscription.customer}`)
          sendTelegramAlert([
            `<b>Orphaned Subscription Update</b>`,
            `Customer: ${subscription.customer}`,
            `Status: ${subStatus}`,
            `Sub ID: ${subscription.id}`,
          ].join('\n'))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.fliply_user_id

        if (userId) {
          // Don't downgrade admin users — they have manual access
          const { data: cancelUser } = await supabase
            .from('fliply_users')
            .select('subscription_tier')
            .eq('id', userId)
            .single()

          if (cancelUser?.subscription_tier !== 'admin') {
            await supabase
              .from('fliply_users')
              .update({
                is_premium: false,
                subscription_tier: null,
                stripe_subscription_id: null,
              })
              .eq('id', userId)
          } else {
            // Admin: just clear the Stripe sub ID, keep access
            await supabase
              .from('fliply_users')
              .update({ stripe_subscription_id: null })
              .eq('id', userId)
          }

          trackEvent('pro_subscription_cancelled', {
            subscription_id: subscription.id,
          }, userId)

          console.log(`[Stripe] Subscription cancelled for user ${userId} (tier: ${cancelUser?.subscription_tier})`)

          sendTelegramAlert([
            `<b>Subscription Cancelled</b>`,
            `User: ${userId}`,
            `Was tier: ${cancelUser?.subscription_tier || 'pro'}`,
          ].join('\n'))
        } else {
          // Fallback: find by customer ID — skip admin users
          const customerId = subscription.customer as string
          const { data: custUser } = await supabase
            .from('fliply_users')
            .select('subscription_tier')
            .eq('stripe_customer_id', customerId)
            .single()

          if (custUser?.subscription_tier !== 'admin') {
            await supabase
              .from('fliply_users')
              .update({
                is_premium: false,
                subscription_tier: null,
                stripe_subscription_id: null,
              })
              .eq('stripe_customer_id', customerId)
          } else {
            // Admin: just clear the Stripe sub ID, keep access
            await supabase
              .from('fliply_users')
              .update({ stripe_subscription_id: null })
              .eq('stripe_customer_id', customerId)
          }

          console.log(`[Stripe] Pro cancelled for customer ${customerId} (tier: ${custUser?.subscription_tier})`)
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
        } else {
          console.warn(`[Stripe] invoice.payment_failed for unknown customer: ${customerId}`)
          sendTelegramAlert([
            `<b>Orphaned Payment Failed</b>`,
            `Customer: ${customerId}`,
            `Invoice: ${invoice.id || 'unknown'}`,
            `No matching user found in fliply_users`,
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
