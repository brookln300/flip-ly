/**
 * GET /api/markets — Public endpoint for market dropdown data.
 * Returns all markets grouped by state. No auth required.
 * Used by: signup form, search filter, anonymous landing page.
 *
 * Response shape:
 * { markets: { [state: string]: { id, slug, name }[] } }
 *
 * Cached for 24h via Cache-Control — market list rarely changes.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  const { data: markets, error } = await supabase
    .from('fliply_markets')
    .select('id, slug, name, display_name, state, cl_subdomain')
    .order('display_name', { ascending: true })

  if (error) {
    console.error('[MARKETS] Query error:', error.message)
    return NextResponse.json({ error: 'Failed to load markets' }, { status: 500 })
  }

  // Group by state for dropdown UI: State → [markets]
  const grouped: Record<string, { id: string; slug: string; name: string }[]> = {}

  for (const m of markets || []) {
    const state = m.state
    if (!grouped[state]) grouped[state] = []
    grouped[state].push({
      id: m.id,
      slug: m.slug,
      name: m.display_name || m.name,
    })
  }

  const res = NextResponse.json({ markets: grouped })
  // Cache for 24h — market list is static after import
  res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600')
  return res
}
