/**
 * Scrape Wave 2: Musical Instruments, Video Gaming, Sporting Goods, Photo+Video
 * Run: npx tsx scripts/scrape-wave2.ts
 */
import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  process.env[t.substring(0, eq)] = t.substring(eq + 1)
}

async function main() {
  const { scrapeCraigslist } = await import('../app/lib/scrapers/craigslist')

  const MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
  const sources = [
    { id: 'ef6354ae-1d80-45c0-9365-ab42fb81278c', path: 'msa', label: 'Musical Instruments' },
    { id: '42d83b97-4e1d-440d-8e4f-b661fb5179d9', path: 'vga', label: 'Video Gaming' },
    { id: 'c254a737-3b70-4c66-a231-0b362e982b47', path: 'sga', label: 'Sporting Goods' },
    { id: 'a74c7710-cfbd-4474-8e88-46780f105e11', path: 'pha', label: 'Photo & Video' },
  ]

  let totalInserted = 0
  let totalSkipped = 0

  for (const src of sources) {
    console.log(`\n=== Scraping ${src.label} (${src.path}) ===`)
    const start = Date.now()
    const result = await scrapeCraigslist(src.id, MARKET_ID, {
      hostname: 'dallas', area_id: 21, rss_url: '', search_path: src.path,
    })
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`  Inserted: ${result.inserted}`)
    console.log(`  Skipped:  ${result.skipped}`)
    console.log(`  Errors:   ${result.errors.length}`)
    console.log(`  Time:     ${elapsed}s`)
    if (result.errors.length > 0) result.errors.slice(0, 3).forEach(e => console.log(`  > ${e}`))
    totalInserted += result.inserted
    totalSkipped += result.skipped
  }

  console.log(`\n=== TOTAL ===`)
  console.log(`Inserted: ${totalInserted}`)
  console.log(`Skipped:  ${totalSkipped}`)
  process.exit(0)
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
