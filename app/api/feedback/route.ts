import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { getSession, requireAdmin } from '../../lib/auth'

// GET /api/feedback?key=<admin_key>&status=new&limit=50
export async function GET(req: NextRequest) {
  // Require admin access for listing/reading feedback
  const admin = await requireAdmin(req as unknown as Request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status') // 'new', 'reviewed', 'implemented', 'dismissed', or null for all
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
  const category = searchParams.get('category') // 'bug', 'feature', 'ux', 'general'

  let query = supabase
    .from('fliply_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Summary stats
  const { data: stats } = await supabase
    .from('fliply_feedback')
    .select('status, category')

  const summary = {
    total: stats?.length || 0,
    by_status: {} as Record<string, number>,
    by_category: {} as Record<string, number>,
  }
  stats?.forEach(row => {
    summary.by_status[row.status || 'new'] = (summary.by_status[row.status || 'new'] || 0) + 1
    summary.by_category[row.category] = (summary.by_category[row.category] || 0) + 1
  })

  return NextResponse.json({ summary, feedback: data })
}

// PATCH /api/feedback — update status of a feedback item
export async function PATCH(req: NextRequest) {
  // Require admin access for modifying feedback
  const admin = await requireAdmin(req as unknown as Request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  const validStatuses = ['new', 'reviewed', 'implemented', 'dismissed']
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('fliply_feedback')
    .update({ status })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id, status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, category } = body

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return NextResponse.json({ error: 'Feedback too short (min 5 chars)' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Feedback too long (max 2000 chars)' }, { status: 400 })
  }

  const validCategories = ['bug', 'feature', 'ux', 'general']
  const cat = validCategories.includes(category) ? category : 'general'

  // Try to get session — feedback works for both logged-in and anonymous
  const session = await getSession()
  let userId: string | null = null
  let email: string | null = null
  let userTier = 'anonymous'
  let market: string | null = null

  if (session) {
    const { data: user } = await supabase
      .from('fliply_users')
      .select('id, email, is_premium, market_id')
      .eq('id', session.userId)
      .single()

    if (user) {
      userId = user.id
      email = user.email
      userTier = user.is_premium ? 'pro' : 'free'

      if (user.market_id) {
        const { data: m } = await supabase
          .from('fliply_markets')
          .select('display_name')
          .eq('id', user.market_id)
          .single()
        market = m?.display_name || null
      }
    }
  }

  const { error } = await supabase
    .from('fliply_feedback')
    .insert({
      user_id: userId,
      email,
      category: cat,
      message: message.trim(),
      user_tier: userTier,
      market,
    })

  if (error) {
    console.error('[FEEDBACK] Insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
