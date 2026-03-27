export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(req: NextRequest) {
  const name = new URL(req.url).searchParams.get('name') || 'EstateSales.net DFW'

  const { data, error } = await supabase
    .from('fliply_sources')
    .update({
      last_scraped_at: null,
      consecutive_failures: 0,
      last_error: null,
      is_active: true,
      is_approved: true,
      config: {
        url: 'https://www.estatesales.net/TX/Dallas-Fort-Worth-Arlington',
        source_name: 'EstateSales.net DFW',
        source_hint: 'Estate sale aggregator with dates, addresses, photos, company names',
        max_pages: 1,
      },
    })
    .eq('name', name)
    .select()

  return NextResponse.json({ updated: data, error: error?.message })
}
