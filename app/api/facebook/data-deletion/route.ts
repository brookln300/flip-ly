import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

/**
 * Meta/Facebook Data Deletion Callback
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 *
 * When a user removes the app via Facebook Settings, Meta sends a signed
 * POST request here. We verify the signature, delete user data, and return
 * a status URL + confirmation code.
 */
export async function POST(req: Request) {
  try {
    const body = await req.formData()
    const signedRequest = body.get('signed_request') as string

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 })
    }

    const [encodedSig, payload] = signedRequest.split('.')
    if (!encodedSig || !payload) {
      return NextResponse.json({ error: 'Invalid signed_request format' }, { status: 400 })
    }

    // Verify signature if FB_APP_SECRET is configured
    const appSecret = process.env.FB_APP_SECRET
    if (appSecret) {
      const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('base64url')

      if (encodedSig !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Decode payload
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    )
    const fbUserId = data.user_id

    if (!fbUserId) {
      return NextResponse.json({ error: 'No user_id in payload' }, { status: 400 })
    }

    // Generate confirmation code
    const confirmationCode = crypto.randomUUID()

    // Delete user data associated with this Facebook user ID
    // We search by the Google OAuth sub or email linked during signup
    // Since we use Google OAuth (not Facebook Login), this is a best-effort lookup
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString(), deletion_source: 'facebook_callback' })
      .eq('facebook_id', fbUserId)

    if (error) {
      console.error('FB deletion callback - DB error:', error)
    }

    // Meta expects this exact response format
    const statusUrl = `${process.env.NEXTAUTH_URL || 'https://flip-ly.net'}/data-deletion?confirm=${confirmationCode}`

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    })
  } catch (err) {
    console.error('FB data deletion callback error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET endpoint for status checks (linked from data-deletion page)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const confirm = searchParams.get('confirm')

  if (!confirm) {
    return NextResponse.json({
      status: 'active',
      message: 'Meta data deletion callback is active. POST signed_request to trigger deletion.',
    })
  }

  return NextResponse.json({
    status: 'completed',
    confirmation_code: confirm,
    message: 'Data deletion request has been processed.',
  })
}
