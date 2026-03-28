import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('fliply_users')
    .select('stripe_customer_id')
    .eq('id', session.userId)
    .single()

  if (!user?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.nextUrl.origin}/pro`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error('Portal error:', err)
    return NextResponse.json({ error: err.message || 'Portal failed' }, { status: 500 })
  }
}
