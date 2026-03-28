export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

/**
 * Unsubscribe endpoint — CAN-SPAM compliant one-click unsubscribe.
 *
 * GET /api/unsubscribe?email=xxx&token=xxx — renders confirmation page
 * POST /api/unsubscribe — processes unsubscribe (for List-Unsubscribe header)
 *
 * Token is a simple HMAC of the email to prevent abuse.
 */

import { generateUnsubToken } from '../../lib/unsubscribe'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email || !token) {
    return new NextResponse(renderPage('Missing parameters.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const expectedToken = generateUnsubToken(email)
  if (token !== expectedToken) {
    return new NextResponse(renderPage('Invalid link. The lobster is suspicious.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Process unsubscribe
  const { data: user } = await supabase
    .from('fliply_users')
    .select('id, unsubscribed')
    .eq('email', email.toLowerCase())
    .single()

  if (!user) {
    return new NextResponse(renderPage('Email not found. Maybe you already escaped.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (user.unsubscribed) {
    return new NextResponse(renderPage('You\'re already unsubscribed. The butler has accepted your departure.', true), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Unsubscribe
  await supabase
    .from('fliply_users')
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq('id', user.id)

  // Cancel active drip enrollments
  await supabase
    .from('sequence_enrollments')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active')

  trackEvent('unsubscribe', { method: 'link' }, user.id)

  return new NextResponse(renderPage('You have been unsubscribed. The butler is crying. But he respects your decision.', true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

// POST handler for List-Unsubscribe-Post header (RFC 8058)
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const email = params.get('email') || ''
    const token = params.get('token') || ''

    if (!email || !token || token !== generateUnsubToken(email)) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('fliply_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (user) {
      await supabase
        .from('fliply_users')
        .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
        .eq('id', user.id)

      await supabase
        .from('sequence_enrollments')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'active')
    }

    return NextResponse.json({ unsubscribed: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

function renderPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — flip-ly.net</title></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Courier New',monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="text-align:center;padding:32px;max-width:500px;">
  <p style="font-size:48px;">${success ? '🦞' : '⚠️'}</p>
  <h1 style="font-family:'Comic Sans MS',cursive;font-size:24px;color:${success ? '#0FFF50' : '#FF10F0'};margin-bottom:16px;">
    ${success ? 'UNSUBSCRIBED' : 'OOPS'}
  </h1>
  <p style="color:#ccc;font-size:14px;line-height:1.6;margin-bottom:24px;">${message}</p>
  <a href="https://flip-ly.net" style="color:#0FFF50;font-family:'Comic Sans MS',cursive;text-decoration:underline;font-size:13px;">
    ← return to the chaos (you can still browse)
  </a>
</div>
</body></html>`
}
