/**
 * Logic regression test for the FB→Telegram pipeline.  Run: `npm run test:fb`
 *
 * Imports the REAL pure functions (contentHash, haversineMiles) and mirrors the
 * client-side filter + server decision logic that lives in browser/route files
 * that can't be imported standalone. No secrets, no network, no DB.
 */
import { contentHash } from '../app/lib/fb-free/hash'
import { haversineMiles } from '../app/lib/fb-free/geo-math'

let pass = 0
let fail = 0
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}  ${detail}`)
  }
}
const approx = (a: number, b: number, tol: number): boolean => Math.abs(a - b) <= tol

console.log('\n[1] contentHash — dedupe key (REAL source)')
{
  const a = contentHash('123', 'Jane Doe', 'Free sofa, good condition')
  const b = contentHash('123', 'Jane Doe', '  free   SOFA,   good CONDITION  ')
  const c = contentHash('999', 'Jane Doe', 'Free sofa, good condition')
  const d = contentHash('123', 'John', 'Free sofa, good condition')
  check('same post -> same hash', a === contentHash('123', 'Jane Doe', 'Free sofa, good condition'))
  check('whitespace + case normalized', a === b)
  check('different group -> different hash', a !== c)
  check('different author -> different hash', a !== d)
  check('sha256 hex shape', /^[0-9a-f]{64}$/.test(a))
}

console.log('\n[2] haversineMiles — distance math (REAL source)')
{
  const d = haversineMiles(40.7128, -74.006, 34.0522, -118.2437)
  check('same point = 0', haversineMiles(40.7128, -74.006, 40.7128, -74.006) === 0)
  check('NYC->LA ~= 2445mi (+/-30)', approx(d, 2445, 30), `got ${d.toFixed(0)}`)
  check('1deg lat ~= 69mi (+/-2)', approx(haversineMiles(32, -96, 33, -96), 69, 2))
  check('symmetric', approx(d, haversineMiles(34.0522, -118.2437, 40.7128, -74.006), 0.01))
}

// ── Mirrors extension/content.js filter logic ──
const FREE_RE = /\b(free|curb alert|giving away|gratis|no charge|free to (a )?good home)\b/i
const parseKeywords = (raw: string): string[] =>
  String(raw || '').split(/[\n,]/).map((s) => s.trim().toLowerCase()).filter(Boolean)
interface FilterSettings { freeOnly?: boolean; includeKeywords?: string; excludeKeywords?: string }
function passesFilters(text: string, s: FilterSettings): boolean {
  const lower = text.toLowerCase()
  if (s.freeOnly && !FREE_RE.test(text)) return false
  const include = parseKeywords(s.includeKeywords || '')
  if (include.length && !include.some((k) => lower.includes(k))) return false
  const exclude = parseKeywords(s.excludeKeywords || '')
  if (exclude.length && exclude.some((k) => lower.includes(k))) return false
  return true
}

console.log('\n[3] free-item heuristic (mirrors content.js)')
{
  check('"Free sofa" matches', FREE_RE.test('Free sofa on the curb'))
  check('"CURB ALERT" matches', FREE_RE.test('CURB ALERT: boxes'))
  check('"giving away" matches', FREE_RE.test('giving away a lamp'))
  check('"free to a good home" matches', FREE_RE.test('kittens free to a good home'))
  check('"$5" does NOT match', !FREE_RE.test('bookshelf for $5 firm'))
  check('"freezer" does NOT false-match', !FREE_RE.test('freezer for sale'))
}

console.log('\n[4] keyword include/exclude (mirrors content.js)')
{
  check('freeOnly drops for-sale', passesFilters('IKEA shelf $15', { freeOnly: true }) === false)
  check('freeOnly keeps free', passesFilters('Free shelf, curb pickup', { freeOnly: true }) === true)
  check('include keeps match', passesFilters('Free sofa', { includeKeywords: 'sofa, couch' }) === true)
  check('include drops non-match', passesFilters('Free lamp', { includeKeywords: 'sofa, couch' }) === false)
  check('exclude drops banned', passesFilters('Free sofa SOLD', { excludeKeywords: 'sold, pending' }) === false)
  check('exclude keeps clean', passesFilters('Free sofa available', { excludeKeywords: 'sold, pending' }) === true)
  check('combined include+exclude', passesFilters('Free sofa, pending pickup', { includeKeywords: 'sofa', excludeKeywords: 'pending' }) === false)
  check('no filters -> pass', passesFilters('anything', {}) === true)
}

// ── Mirrors ingest route validation ──
console.log('\n[5] ingest home_zip / radius_mi validation (mirrors route)')
{
  const zipOk = (z: unknown): string | null => (typeof z === 'string' && /^\d{5}$/.test(z) ? z : null)
  const radOk = (r: unknown): number | null => (Number.isFinite(r) ? Math.round(r as number) : null)
  check('valid zip kept', zipOk('75208') === '75208')
  check('4-digit rejected', zipOk('7520') === null)
  check('zip+4 rejected', zipOk('75208-1234') === null)
  check('numeric rejected', zipOk(75208) === null)
  check('finite radius rounded', radOk(24.6) === 25)
  check('NaN -> null', radOk(NaN) === null)
  check('undefined -> null', radOk(undefined) === null)
}

// ── Mirrors fb-free-digest distance decision ──
console.log('\n[6] distance soft-filter decision (mirrors cron)')
{
  function decide(isFree: boolean, homeZip: string | null, radius: number | null, distance: number | null): string {
    let status = isFree ? 'ready' : 'rejected'
    if (isFree && homeZip && radius && distance !== null && distance > radius) status = 'rejected'
    return status
  }
  check('within radius -> ready', decide(true, '75208', 25, 10) === 'ready')
  check('beyond radius -> rejected', decide(true, '75208', 25, 40) === 'rejected')
  check('no home zip -> ready (soft)', decide(true, null, 25, 40) === 'ready')
  check('no distance -> ready (soft)', decide(true, '75208', 25, null) === 'ready')
  check('not free -> rejected', decide(false, '75208', 25, 5) === 'rejected')
}

console.log(`\n---- ${pass} passed, ${fail} failed ----\n`)
process.exit(fail === 0 ? 0 : 1)
