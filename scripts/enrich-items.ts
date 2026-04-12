/**
 * Enrich the new DFW item listings through the AI pipeline
 * Run: npx tsx scripts/enrich-items.ts
 */
import { readFileSync } from 'fs'

// Load env vars before any imports that use them
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  process.env[t.substring(0, eq)] = t.substring(eq + 1)
}

async function main() {
  const { enrichAllPending } = await import('../app/lib/ai/enrich-listing')

  let round = 1
  let totalEnriched = 0
  let totalFastClassified = 0

  while (round <= 4) {
    console.log(`\n=== Enrichment Round ${round} ===`)
    const start = Date.now()
    const result = await enrichAllPending({ maxListings: 500, batchSize: 10, concurrency: 3 })
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    console.log(`  Enriched:        ${result.enriched}`)
    console.log(`  Fast-classified: ${result.fastClassified}`)
    console.log(`  Batches:         ${result.batches}`)
    console.log(`  Time:            ${elapsed}s`)

    totalEnriched += result.enriched
    totalFastClassified += result.fastClassified

    if (result.enriched === 0 && result.fastClassified === 0) {
      console.log('\nNo more items to enrich. Done!')
      break
    }

    round++
  }

  console.log(`\n=== ENRICHMENT COMPLETE ===`)
  console.log(`Total enriched:        ${totalEnriched}`)
  console.log(`Total fast-classified: ${totalFastClassified}`)
  process.exit(0)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
