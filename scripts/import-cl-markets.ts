/**
 * One-time import: Craigslist markets → fliply_markets
 *
 * Fetches all US areas from CL reference API and inserts them as markets.
 * Each market gets: cl_subdomain, cl_area_id, state, display_name, lat/lng.
 * All start as is_active = false (activated on first user signup).
 *
 * Run: npx tsx scripts/import-cl-markets.ts
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (no dotenv dependency needed)
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) continue
  const key = trimmed.slice(0, eqIndex).trim()
  const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[key]) process.env[key] = val
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map CL Region codes to full state names for display
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

interface CLArea {
  Abbreviation: string
  AreaID: number
  Country: string
  Description: string
  Hostname: string
  Latitude: number
  Longitude: number
  Region: string
  ShortDescription: string
  SubAreas: { Abbreviation: string; Description: string; SubAreaID: number }[]
}

async function main() {
  console.log('Fetching CL reference areas...')
  const res = await fetch('https://reference.craigslist.org/Areas')
  const areas: CLArea[] = await res.json()

  // Filter US only
  const usAreas = areas.filter(a => a.Country === 'US' && STATE_NAMES[a.Region])
  console.log(`Found ${usAreas.length} US markets (${areas.length} total worldwide)`)

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const area of usAreas) {
    const state = area.Region
    const slug = `${area.Hostname}-${state.toLowerCase()}`

    const { error } = await supabase.from('fliply_markets').upsert({
      slug,
      name: `${area.Description}`,
      display_name: area.Description,
      state,
      cl_subdomain: area.Hostname,
      cl_area_id: area.AreaID,
      center_lat: area.Latitude,
      center_lng: area.Longitude,
      radius_miles: 30,
      is_active: false,
      user_count: 0,
    }, { onConflict: 'slug' })

    if (error) {
      console.error(`  ✗ ${area.Hostname} (${state}): ${error.message}`)
      errors++
    } else {
      inserted++
    }
  }

  console.log(`\nDone:`)
  console.log(`  ✓ ${inserted} markets inserted/updated`)
  console.log(`  ⊘ ${skipped} skipped (already exist)`)
  console.log(`  ✗ ${errors} errors`)

  // Verify Dallas exists (our current market)
  const { data: dallas } = await supabase
    .from('fliply_markets')
    .select('id, slug, cl_subdomain, state, display_name')
    .eq('cl_subdomain', 'dallas')
    .single()

  if (dallas) {
    console.log(`\n✓ Dallas market confirmed: ${dallas.slug} (${dallas.id})`)
    console.log(`  Use this ID to backfill existing users.`)
  } else {
    console.log(`\n⚠ Dallas market not found — check import!`)
  }
}

main().catch(console.error)
