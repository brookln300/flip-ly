export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Resend webhook handler with Svix signature verification.
 *
 * Resend uses Svix for webhook delivery. Each request includes:
 * - svix-id: unique message ID
 * - svix-timestamp: unix timestamp
 * - svix-signature: HMAC signatures (v1,<base64>)
 *
 * Set RESEND_WEBHOOK_SECRET in Vercel env (from Resend dashboard → Webhooks).
 * The secret starts with "whsec_" — strip that prefix before using.
 */

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

function verifySignature(payload: string, headers: Headers): boolean {
  if (!WEBHOOK_SECRET) return true // Skip verification if no secret configured (dev mode)

  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject timestamps older than 5 minutes (replay protection)
  const ts = parseInt(svixTimestamp)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > 300) return false

  // Strip "whsec_" prefix and base64-decode the secret
  const secretBytes = Buffer.from(
    WEBHOOK_SECRET.startsWith('whsec_') ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET,
    'base64'
  )

  // Compute expected signature
  const signaturePayload = `${svixId}.${svixTimestamp}.${payload}`
  const expectedSig = createHmac('sha256', secretBytes)
    .update(signaturePayload)
    .digest('base64')

  // Svix sends multiple signatures separated by space: "v1,<sig1> v1,<sig2>"
  const signatures = svixSignature.split(' ')
  for (const sig of signatures) {
    const [version, value] = sig.split(',')
    if (version === 'v1' && value) {
      try {
        const expected = Buffer.from(expectedSig)
        const received = Buffer.from(value)
        if (expected.length === received.length && timingSafeEqual(expected, received)) {
          return true
        }
      } catch {
        continue
      }
    }
  }

  return false
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify webhook signature
  if (!verifySignature(rawBody, req.headers)) {
    console.error('[WEBHOOK] Resend signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    const eventType = payload.type
    const data = payload.data || {}
    const resendMessageId = data.email_id

    if (!eventType || !resendMessageId) {
      return NextResponse.json({ error: 'Missing event type or email_id' }, { status: 400 })
    }

    // Log raw event
    await supabase.from('email_events').insert({
      resend_message_id: resendMessageId,
      event_type: eventType,
      payload: payload,
    })

    // Find the matching email_send
    const { data: sends } = await supabase
      .from('email_sends')
      .select('id')
      .eq('resend_message_id', resendMessageId)
      .limit(1)

    const sendId = sends?.[0]?.id

    // Update email_send status based on event type
    if (sendId) {
      const now = new Date().toISOString()
      const updateData: Record<string, any> = {}

      switch (eventType) {
        case 'email.delivered':
          updateData.delivered_at = now
          updateData.status = 'delivered'
          break
        case 'email.opened':
          updateData.opened_at = now
          updateData.status = 'opened'
          break
        case 'email.clicked':
          updateData.clicked_at = now
          updateData.status = 'clicked'
          break
        case 'email.bounced':
          updateData.bounced_at = now
          updateData.status = 'bounced'
          break
        case 'email.complained':
          updateData.complained_at = now
          updateData.status = 'complained'
          break
        case 'email.delivery_delayed':
          updateData.status = 'delayed'
          break
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('email_sends')
          .update(updateData)
          .eq('id', sendId)
      }

      // Link event to send
      await supabase
        .from('email_events')
        .update({ send_id: sendId })
        .eq('resend_message_id', resendMessageId)
        .is('send_id', null)
    }

    // Handle bounces and complaints: unsubscribe + cancel enrollments
    if (eventType === 'email.bounced' || eventType === 'email.complained') {
      const toEmail = data.to?.[0] || data.email
      if (toEmail) {
        const { data: users } = await supabase
          .from('fliply_users')
          .select('id')
          .eq('email', toEmail.toLowerCase())
          .limit(1)

        if (users?.[0]) {
          // Set unsubscribed flag
          await supabase
            .from('fliply_users')
            .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
            .eq('id', users[0].id)

          // Cancel active drip enrollments
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('user_id', users[0].id)
            .eq('status', 'active')
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[WEBHOOK] Resend error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
