import { Resend } from 'resend'
import { getUnsubscribeUrl } from '../unsubscribe'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM_ADDRESS || 'Jeeves at flip-ly.net <jeeves@flip-ly.net>'

/**
 * Centralized email sender with proper deliverability headers.
 *
 * EVERY email from flip-ly goes through this function.
 * This ensures:
 * - List-Unsubscribe header (Gmail shows unsubscribe button instead of "report spam")
 * - List-Unsubscribe-Post header (RFC 8058 one-click unsubscribe)
 * - Unique X-Entity-Ref-ID (prevents Gmail threading unrelated emails)
 * - Proper Reply-To
 * - Consistent from address
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}): Promise<{ id?: string; error?: string }> {
  if (!resend) {
    console.log(`[EMAIL] Skipped — no RESEND_API_KEY: ${opts.subject} → ${opts.to}`)
    return { error: 'no-api-key' }
  }

  const unsubUrl = getUnsubscribeUrl(opts.to)
  const entityRefId = `fliply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to.toLowerCase(),
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || 'aethercoreai@outlook.com',
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': entityRefId,
      },
      tags: opts.tags,
    })

    if (error) {
      console.error(`[EMAIL] Send failed: ${error.message}`)
      return { error: error.message }
    }

    return { id: data?.id }
  } catch (err: any) {
    console.error(`[EMAIL] Send error: ${err.message}`)
    return { error: err.message }
  }
}
