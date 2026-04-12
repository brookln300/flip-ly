/**
 * Test script: Scrape DFW item categories (Electronics, Tools, Furniture, Collectibles)
 * Run: npx tsx scripts/test-item-scrape.ts
 */
import { readFileSync } from 'fs'

// Load env vars BEFORE any other imports (supabase reads env at import time)
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.substring(0, eqIdx)
  const value = trimmed.substring(eqIdx + 1)
  process.env[key] = value
}

async function main() {
  // Dynamic import AFTER env vars are set
  const { scrapeCraigslist } = await import('../app/lib/scrapers/craigslist')

  const MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
  const sources = [
    { id: 'fc8772bb-8f45-43ba-8481-59b3f0c843eb', path: 'ela', label: 'Electronics' },
    { id: 'e091be4d-cb81-4ffe-95fa-b0381389363d', path: 'tla', label: 'Tools' },
    { id: '48e7559b-a168-4aa1-b818-3804a88e7fce', path: 'fua', label: 'Furniture' },
    { id: '242fa5e2-5e61-4bd7-b89d-063c6a400c75', path: 'cba', label: 'Collectibles' },
  ]

  let totalInserted = 0
  let totalSkipped = 0

  for (const src of sources) {
    console.log(`\n=== Scraping ${src.label} (${src.path}) ===`)
    const start = Date.now()

    const result = await scrapeCraigslist(src.id, MARKET_ID, {
      hostname: 'dallas',
      area_id: 21,
      rss_url: '',
      search_path: src.path,
    })

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`  Inserted: ${result.inserted}`)
    console.log(`  Skipped:  ${result.skipped}`)
    console.log(`  Errors:   ${result.errors.length}`)
    console.log(`  Time:     ${elapsed}s`)

    if (result.errors.length > 0) {
      result.errors.slice(0, 3).forEach(e => console.log(`  > ${e}`))
    }

    totalInserted += result.inserted
    totalSkipped += result.skipped
  }

  console.log(`\n=== TOTAL ===`)
  console.log(`Inserted: ${totalInserted}`)
  console.log(`Skipped:  ${totalSkipped}`)
  process.exit(0)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
