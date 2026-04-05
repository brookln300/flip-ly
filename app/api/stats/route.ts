import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  try {
    const [listingsRes, sourcesRes, marketsRes] = await Promise.all([
      supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
      supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('fliply_markets').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      total_listings: listingsRes.count || 0,
      total_sources: sourcesRes.count || 0,
      total_markets: marketsRes.count || 413,
    })
  } catch {
    return NextResponse.json({
      total_listings: 0,
      total_sources: 20,
      total_markets: 413,
    })
  }
}
