export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * Resend webhook handler.
 * Receives email events (delivered, opened, clicked, bounced, complained).
 * Updates email_sends and logs raw events to email_events.
 *
 * Resend uses Svix for webhooks. Events are at-least-once delivery,
 * so we handle duplicates by using resend_message_id as the lookup key.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Resend webhook payload: { type, created_at, data: { email_id, ... } }
    const eventType = payload.type // e.g., "email.delivered", "email.opened"
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

      // Also link the event to the send
      await supabase
        .from('email_events')
        .update({ send_id: sendId })
        .eq('resend_message_id', resendMessageId)
        .is('send_id', null)
    }

    // Handle bounces and complaints: cancel user's enrollments
    if (eventType === 'email.bounced' || eventType === 'email.complained') {
      const toEmail = data.to?.[0] || data.email
      if (toEmail) {
        // Find user by email and cancel all active enrollments
        const { data: users } = await supabase
          .from('fliply_users')
          .select('id')
          .eq('email', toEmail)
          .limit(1)

        if (users?.[0]) {
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
