export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Add new AI-powered scraping sources for DFW market.
 * One-time setup endpoint. DELETE after running.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const results: string[] = []

  // Find DFW market ID
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id')
    .ilike('name', '%dallas%')
    .limit(1)

  if (!markets?.length) {
    return NextResponse.json({ error: 'No DFW market found' })
  }

  const marketId = markets[0].id

  const newSources = [
    {
      name: 'EstateSales.net DFW',
      source_type: 'ai_extract',
      config: {
        url: 'https://www.estatesales.net/TX/Dallas-Fort-Worth-Arlington/estate-sales',
        source_name: 'EstateSales.net DFW',
        source_hint: 'Estate sale aggregator — listings have dates, addresses, photos, and company names',
        max_pages: 1,
      },
      discovery_method: 'manual_admin',
      confidence: 1.0,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true,
    },
    {
      name: 'GarageSaleFinder DFW',
      source_type: 'ai_extract',
      config: {
        url: 'https://www.garagesalefinder.com/yardsales/TX/Dallas',
        source_name: 'GarageSaleFinder Dallas',
        source_hint: 'Garage sale directory — listings have addresses, dates, descriptions',
        max_pages: 1,
      },
      discovery_method: 'manual_admin',
      confidence: 0.9,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true,
    },
    {
      name: 'GSALR Dallas',
      source_type: 'ai_extract',
      config: {
        url: 'https://gsalr.com/garage-sales/city/dallas-tx.html',
        source_name: 'GSALR Dallas',
        source_hint: 'Garage sale listing aggregator — community-posted sales with dates and addresses',
        max_pages: 1,
      },
      discovery_method: 'manual_admin',
      confidence: 0.85,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true,
    },
    {
      name: 'YardSaleSearch DFW',
      source_type: 'ai_extract',
      config: {
        url: 'https://www.yardsalesearch.com/garage-sales/75201',
        source_name: 'YardSaleSearch DFW',
        source_hint: 'Yard sale map and search — community-posted with addresses and dates',
        max_pages: 1,
      },
      discovery_method: 'manual_admin',
      confidence: 0.8,
      scrape_frequency_hours: 24,
      is_active: true,
      is_approved: true,
    },
  ]

  for (const source of newSources) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('fliply_sources')
      .select('id')
      .eq('name', source.name)
      .limit(1)

    if (existing?.length) {
      results.push(`SKIP: ${source.name} already exists`)
      continue
    }

    const { error } = await supabase.from('fliply_sources').insert({
      market_id: marketId,
      ...source,
    })

    results.push(error
      ? `FAIL: ${source.name} — ${error.message}`
      : `OK: ${source.name}`)
  }

  return NextResponse.json({ market_id: marketId, results })
}
