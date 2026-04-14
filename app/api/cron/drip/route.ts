export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getDripEmailHtml } from '../../../lib/email/drip-templates'
import { sendEmail } from '../../../lib/email/send'

/**
 * Drip processor — runs every 15 minutes via Vercel cron.
 *
 * OPTIMIZED: Batch-fetches all enrollments, steps, and users in 3 queries
 * instead of N+1 per enrollment. Batch-inserts logs and batch-updates
 * enrollments at the end.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'No RESEND_API_KEY' }, { status: 500 })
  }

  const start = Date.now()
  let sent = 0
  let skipped = 0
  let completed = 0
  let errors = 0

  try {
    // ── BATCH FETCH 1: All active enrollments ──────────────────
    const { data: enrollments, error: enrollErr } = await supabase
      .from('sequence_enrollments')
      .select('id, user_id, sequence_id, current_step, variant, status, enrolled_at, last_sent_at')
      .eq('status', 'active')

    if (enrollErr) {
      return NextResponse.json({ error: String(enrollErr.message), hint: enrollErr.hint || null }, { status: 500 })
    }

    if (!enrollments?.length) {
      return NextResponse.json({ message: 'No active enrollments', sent: 0 })
    }

    // ── BATCH FETCH 2: All active steps (one query, not N) ────
    const sequenceIds = Array.from(new Set(enrollments.map(e => e.sequence_id)))
    const { data: allSteps } = await supabase
      .from('sequence_steps')
      .select('*')
      .in('sequence_id', sequenceIds)
      .eq('is_active', true)
      .order('step_order', { ascending: true })

    // Build step lookup: { sequenceId -> { stepOrder -> step } }
    const stepMap = new Map<string, Map<number, any>>()
    for (const step of (allSteps || [])) {
      if (!stepMap.has(step.sequence_id)) stepMap.set(step.sequence_id, new Map())
      stepMap.get(step.sequence_id)!.set(step.step_order, step)
    }

    // ── BATCH FETCH 3: All users for these enrollments ────────
    const userIds = Array.from(new Set(enrollments.map(e => e.user_id)))
    const { data: allUsers } = await supabase
      .from('fliply_users')
      .select('id, email, city, state, market_id, unsubscribed')
      .in('id', userIds)

    // Build user lookup: { userId -> user }
    const userMap = new Map<string, any>()
    for (const user of (allUsers || [])) {
      userMap.set(user.id, user)
    }

    // ── PROCESS IN MEMORY ─────────────────────────────────────
    const emailLogs: any[] = []
    const enrollmentUpdates: { id: string; data: any }[] = []

    for (const enrollment of enrollments) {
      try {
        // Look up next step from pre-fetched map
        const seqSteps = stepMap.get(enrollment.sequence_id)
        const step = seqSteps?.get(enrollment.current_step + 1)

        if (!step) {
          // No more steps — mark completed
          enrollmentUpdates.push({
            id: enrollment.id,
            data: { status: 'completed', completed_at: new Date().toISOString() },
          })
          completed++
          continue
        }

        // Check timing
        const lastAction = enrollment.last_sent_at || enrollment.enrolled_at
        const lastActionTime = new Date(lastAction).getTime()
        const delayMs = step.delay_minutes * 60 * 1000

        if (Date.now() - lastActionTime < delayMs) {
          skipped++
          continue
        }

        // Look up user from pre-fetched map
        const user = userMap.get(enrollment.user_id)
        if (!user) {
          skipped++
          continue
        }

        // Skip unsubscribed
        if (user.unsubscribed) {
          enrollmentUpdates.push({
            id: enrollment.id,
            data: { status: 'cancelled', cancelled_at: new Date().toISOString() },
          })
          skipped++
          continue
        }

        // Choose subject (A/B variant)
        const subject = enrollment.variant === 'b' && step.subject_variant_b
          ? step.subject_variant_b
          : step.subject

        // Render email
        const html = await getDripEmailHtml(step.template_key, {
          email: user.email,
          city: user.city || 'DFW',
          state: user.state || 'TX',
          step_order: step.step_order,
          variant: enrollment.variant,
        })

        // Send
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

        const resolvedSubject = subject.replace('{city}', user.city || 'DFW')

        // Queue log insert (batch later)
        emailLogs.push({
          enrollment_id: enrollment.id,
          step_id: step.id,
          user_id: user.id,
          to_email: user.email,
          subject: resolvedSubject,
          template_key: step.template_key,
          variant: enrollment.variant,
          resend_message_id: messageId || null,
          status: 'sent',
        })

        // Queue enrollment update (batch later)
        enrollmentUpdates.push({
          id: enrollment.id,
          data: {
            current_step: step.step_order,
            last_sent_at: new Date().toISOString(),
          },
        })

        sent++
        console.log(`[DRIP] Sent step ${step.step_order} to ${user.email} (${step.template_key})`)

      } catch (err: any) {
        console.error('[DRIP] Enrollment error:', err.message)
        errors++
      }
    }

    // ── BATCH WRITE: Insert all email logs at once ────────────
    if (emailLogs.length > 0) {
      const { error: logErr } = await supabase.from('email_sends').insert(emailLogs)
      if (logErr) console.error('[DRIP] Batch log insert error:', logErr.message)
    }

    // ── BATCH WRITE: Update enrollments ───────────────────────
    // Supabase doesn't support bulk update with different values per row,
    // so we group by update payload and batch where possible
    for (const update of enrollmentUpdates) {
      await supabase
        .from('sequence_enrollments')
        .update(update.data)
        .eq('id', update.id)
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
