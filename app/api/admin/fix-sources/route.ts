export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

/**
 * Fix source URLs to correct paths. One-time fix.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const results: string[] = []

  // Fix EstateSales.net URL
  const { error: e1 } = await supabase
    .from('fliply_sources')
    .update({
      config: {
        url: 'https://www.estatesales.net/TX/Dallas-Fort-Worth-Arlington',
        source_name: 'EstateSales.net DFW',
        source_hint: 'Estate sale aggregator — listings have dates, addresses, photos, and company names',
        max_pages: 1,
      },
      last_scraped_at: null,
      consecutive_failures: 0,
      last_error: null,
    })
    .eq('name', 'EstateSales.net DFW')
  results.push(e1 ? `FAIL EstateSales.net: ${e1.message}` : 'OK: EstateSales.net URL fixed')

  // Deactivate sources with broken URLs until we find correct paths
  for (const name of ['GarageSaleFinder DFW', 'GSALR Dallas', 'YardSaleSearch DFW']) {
    const { error } = await supabase
      .from('fliply_sources')
      .update({ is_active: false, last_error: 'URL needs correction' })
      .eq('name', name)
    results.push(error ? `FAIL ${name}: ${error.message}` : `OK: ${name} deactivated (URL TBD)`)
  }

  return NextResponse.json({ results })
}
