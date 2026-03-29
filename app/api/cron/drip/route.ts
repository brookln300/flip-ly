export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getDripEmailHtml } from '../../../lib/email/drip-templates'
import { sendEmail } from '../../../lib/email/send'

/**
 * Drip processor — runs every 5 minutes via Vercel cron.
 *
 * For each active enrollment:
 * 1. Check if enough time has passed since last send (based on step delay)
 * 2. If due, send the next email
 * 3. Advance the enrollment to the next step (or complete it)
 * 4. Log everything to email_sends
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'No RESEND_API_KEY' })
  }

  const start = Date.now()
  let sent = 0
  let skipped = 0
  let completed = 0
  let errors = 0

  try {
    // Fetch all enrollments (then filter in code to debug RLS issues)
    const { data: allEnrollments, error: enrollErr } = await supabase
      .from('sequence_enrollments')
      .select('id, user_id, sequence_id, current_step, variant, status, enrolled_at, last_sent_at')

    if (enrollErr) {
      return NextResponse.json({ error: String(enrollErr.message), hint: enrollErr.hint || null })
    }

    // Filter active in application code (bypasses any RLS/index weirdness)
    const enrollments = (allEnrollments || []).filter(e => e.status === 'active')

    if (!enrollments.length) {
      return NextResponse.json({
        message: 'No active enrollments',
        sent: 0,
        total_in_db: allEnrollments?.length || 0,
        statuses: allEnrollments?.map(e => ({ id: e.id?.substring(0, 8), status: e.status, step: e.current_step })),
      })
    }

    for (const enrollment of enrollments) {
      try {
        // Get the next step for this enrollment
        const { data: steps } = await supabase
          .from('sequence_steps')
          .select('*')
          .eq('sequence_id', enrollment.sequence_id)
          .eq('step_order', enrollment.current_step + 1)
          .eq('is_active', true)
          .limit(1)

        if (!steps?.length) {
          // No more steps — mark enrollment as completed
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', enrollment.id)
          completed++
          continue
        }

        const step = steps[0]

        // Check timing: has enough time passed?
        const lastAction = enrollment.last_sent_at || enrollment.enrolled_at
        const lastActionTime = new Date(lastAction).getTime()
        const delayMs = step.delay_minutes * 60 * 1000
        const now = Date.now()

        if (now - lastActionTime < delayMs) {
          skipped++ // Not due yet
          continue
        }

        // Get user email + check unsubscribe
        const { data: users } = await supabase
          .from('fliply_users')
          .select('id, email, city, state, zip_code, unsubscribed')
          .eq('id', enrollment.user_id)
          .limit(1)

        if (!users?.length) {
          skipped++
          continue
        }

        const user = users[0]

        // Skip unsubscribed users and cancel their enrollment
        if (user.unsubscribed) {
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', enrollment.id)
          skipped++
          continue
        }

        // Choose subject (A/B variant)
        const subject = enrollment.variant === 'b' && step.subject_variant_b
          ? step.subject_variant_b
          : step.subject

        // Render email HTML
        const html = await getDripEmailHtml(step.template_key, {
          email: user.email,
          city: user.city || 'DFW',
          state: user.state || 'TX',
          step_order: step.step_order,
          variant: enrollment.variant,
        })

        // Send via centralized sender (adds List-Unsubscribe headers)
        const { id: messageId, error: sendError } = await sendEmail({
          to: user.email,
          subject: subject.replace('{city}', user.city || 'DFW'),
          html,
          tags: [
            { name: 'sequence', value: 'drip' },
            { name: 'step', value: String(step.step_order) },
            { name: 'template', value: step.template_key },
          ],
        })

        if (sendError) {
          console.error(`[DRIP] Send failed for ${user.email}:`, sendError)
          errors++
          continue
        }
        const sendResult = messageId ? { id: messageId } : null

        // Log the send
        await supabase.from('email_sends').insert({
          enrollment_id: enrollment.id,
          step_id: step.id,
          user_id: user.id,
          to_email: user.email,
          subject,
          template_key: step.template_key,
          variant: enrollment.variant,
          resend_message_id: sendResult?.id || null,
          status: 'sent',
        })

        // Advance enrollment
        await supabase
          .from('sequence_enrollments')
          .update({
            current_step: step.step_order,
            last_sent_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)

        sent++
        console.log(`[DRIP] Sent step ${step.step_order} to ${user.email} (${step.template_key})`)

      } catch (err: any) {
        console.error('[DRIP] Enrollment error:', err.message)
        errors++
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      elapsed_seconds: parseFloat(elapsed),
      processed: enrollments.length,
      sent,
      skipped,
      completed,
      errors,
    })
  } catch (err: any) {
    console.error('[DRIP] Cron error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
