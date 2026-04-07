export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { getSession } from '../../lib/auth'

/**
 * GET /api/saved-deals — Fetch user's saved deals
 * POST /api/saved-deals — Save a deal
 * DELETE /api/saved-deals?listing_id=xxx — Unsave a deal
 */

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('fliply_saved_deals')
    .select('listing_id, saved_at, notes')
    .eq('user_id', session.userId)
    .order('saved_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: data || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { listing_id, notes } = body

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('fliply_saved_deals')
    .upsert({
      user_id: session.userId,
      listing_id,
      notes: notes || null,
    }, { onConflict: 'user_id,listing_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listingId = new URL(req.url).searchParams.get('listing_id')
  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('fliply_saved_deals')
    .delete()
    .eq('user_id', session.userId)
    .eq('listing_id', listingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
