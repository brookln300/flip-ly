import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * One-time migration: Update existing source configs for new scraper format.
 * - Craigslist: add area_id for SAPI
 * - Eventbrite: add city_slug for LD+JSON scraping
 *
 * DELETE THIS ENDPOINT after running once.
 */
export async function GET(req: NextRequest) {
  const results: string[] = []

  // Update all Craigslist sources: add area_id based on hostname
  const { data: clSources } = await supabase
    .from('fliply_sources')
    .select('id, name, config')
    .eq('source_type', 'craigslist_rss')

  if (clSources) {
    for (const source of clSources) {
      const config = source.config as any
      const hostname = config?.hostname || 'dallas'

      // Look up area_id
      const areaId = await lookupAreaId(hostname)
      if (areaId) {
        const newConfig = { ...config, area_id: areaId }
        const { error } = await supabase
          .from('fliply_sources')
          .update({ config: newConfig })
          .eq('id', source.id)

        results.push(error
          ? `FAIL: ${source.name} — ${error.message}`
          : `OK: ${source.name} — area_id=${areaId}`)
      } else {
        results.push(`SKIP: ${source.name} — no area_id for "${hostname}"`)
      }
    }
  }

  // Update all Eventbrite sources: add city_slug
  const { data: ebSources } = await supabase
    .from('fliply_sources')
    .select('id, name, config')
    .eq('source_type', 'eventbrite_api')

  if (ebSources) {
    for (const source of ebSources) {
      const config = source.config as any
      // For DFW area, the slug is tx--dallas
      const citySlug = 'tx--dallas'
      const newConfig = { ...config, city_slug: citySlug }
      const { error } = await supabase
        .from('fliply_sources')
        .update({ config: newConfig })
        .eq('id', source.id)

      results.push(error
        ? `FAIL: ${source.name} — ${error.message}`
        : `OK: ${source.name} — city_slug=${citySlug}`)
    }
  }

  // Also reset consecutive_failures so they get scraped immediately
  await supabase
    .from('fliply_sources')
    .update({
      consecutive_failures: 0,
      last_error: null,
      last_scraped_at: null, // Force rescrape
    })
    .in('source_type', ['craigslist_rss', 'eventbrite_api'])

  results.push('Reset failure counts and last_scraped_at for all CL+EB sources')

  return NextResponse.json({ results })
}

async function lookupAreaId(hostname: string): Promise<number | null> {
  try {
    const res = await fetch('https://reference.craigslist.org/Areas', {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const areas = await res.json()
    const match = areas.find((a: any) =>
      a.Hostname?.toLowerCase() === hostname.toLowerCase()
    )
    return match?.AreaID || null
  } catch {
    return null
  }
}
