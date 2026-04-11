import Redis from 'ioredis'

// ── Connection ──
// Uses REDIS_URL env var in production, falls back to localhost for dev.
// Docker redis is at localhost:6379 (docker-dev stack).
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 5) return null // stop retrying after 5 attempts
    return Math.min(times * 200, 2000)
  },
})

redis.on('error', (err) => {
  console.warn('[Redis] Connection error (falling back to Supabase):', err.message)
})

export default redis

// ── Key Prefixes ──
// Namespaced to avoid collisions if Redis is shared across projects.
const PREFIX = 'fliply:'

// ============================================================
// RATE LIMITING — replaces Supabase COUNT + INSERT per search
// ============================================================

/**
 * Increment today's search count for a user/IP.
 * Returns the new count after increment.
 * Key auto-expires at midnight UTC.
 */
export async function incrementSearchCount(identifier: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const key = `${PREFIX}ratelimit:${identifier}:${today}`
  const count = await redis.incr(key)
  if (count === 1) {
    // First search today — set TTL to expire at end of day (max 24h)
    const secondsUntilMidnight = getSecondsUntilMidnight()
    await redis.expire(key, secondsUntilMidnight)
  }
  return count
}

/**
 * Get today's search count without incrementing.
 */
export async function getSearchCount(identifier: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const key = `${PREFIX}ratelimit:${identifier}:${today}`
  const val = await redis.get(key)
  return val ? parseInt(val, 10) : 0
}

// ============================================================
// PAYWALL NUDGE — track weekly limit-hits for conversion emails
// ============================================================

/**
 * Record that a user hit the daily search limit.
 * Tracks per-week to trigger conversion nudge email.
 * Returns the number of times they've hit the wall this week.
 */
export async function recordLimitHit(identifier: string): Promise<number> {
  const week = getISOWeek()
  const key = `${PREFIX}limithits:${identifier}:${week}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 7 * 24 * 60 * 60) // 7 days
  }
  return count
}

/**
 * Get the number of times a user hit the limit this week.
 */
export async function getLimitHits(identifier: string): Promise<number> {
  const week = getISOWeek()
  const key = `${PREFIX}limithits:${identifier}:${week}`
  const val = await redis.get(key)
  return val ? parseInt(val, 10) : 0
}

// ============================================================
// SESSION / TIER CACHE — avoid repeated Supabase user lookups
// ============================================================

interface CachedUserTier {
  userId: string
  email: string
  isPremium: boolean
  tier: string
  marketId: string | null
  marketSlug: string | null
}

const SESSION_TTL = 900 // 15 minutes

/**
 * Get cached user tier info. Returns null on miss.
 */
export async function getCachedUserTier(userId: string): Promise<CachedUserTier | null> {
  const key = `${PREFIX}session:${userId}`
  const data = await redis.get(key)
  if (!data) return null
  try {
    return JSON.parse(data) as CachedUserTier
  } catch {
    return null
  }
}

/**
 * Cache user tier info for 15 minutes.
 */
export async function setCachedUserTier(data: CachedUserTier): Promise<void> {
  const key = `${PREFIX}session:${data.userId}`
  await redis.set(key, JSON.stringify(data), 'EX', SESSION_TTL)
}

/**
 * Invalidate user tier cache (on tier change, market change, etc.)
 */
export async function invalidateUserTier(userId: string): Promise<void> {
  const key = `${PREFIX}session:${userId}`
  await redis.del(key)
}

// ============================================================
// FOUNDING MEMBER COUNTDOWN
// ============================================================

const FOUNDING_DEADLINE_KEY = `${PREFIX}founding:deadline`
const FOUNDING_SLOTS_KEY = `${PREFIX}founding:slots_remaining`

/**
 * Initialize founding member countdown.
 * Call once to seed the values.
 */
export async function initFoundingCountdown(deadline: string, totalSlots: number): Promise<void> {
  const exists = await redis.exists(FOUNDING_SLOTS_KEY)
  if (!exists) {
    await redis.set(FOUNDING_DEADLINE_KEY, deadline)
    await redis.set(FOUNDING_SLOTS_KEY, totalSlots.toString())
  }
}

/**
 * Decrement founding member slots (call on Pro signup).
 * Returns remaining slots.
 * Uses a Lua script for atomic check-and-decrement to prevent going negative.
 */
export async function claimFoundingSlot(): Promise<number> {
  const script = `
    local current = tonumber(redis.call('GET', KEYS[1]))
    if current and current > 0 then
      return redis.call('DECR', KEYS[1])
    else
      return 0
    end
  `
  const remaining = await redis.eval(script, 1, FOUNDING_SLOTS_KEY) as number
  return Math.max(0, remaining)
}

/**
 * Idempotency guard for founding slot claims.
 * Returns true if this is the first time this session is being processed.
 * Returns false if already processed (duplicate webhook).
 */
export async function tryClaimFoundingSlot(sessionId: string): Promise<{ firstClaim: boolean; remaining: number }> {
  const guardKey = `${PREFIX}founding:claimed:${sessionId}`
  // SET NX with 48h expiry — only succeeds on first attempt
  const isNew = await redis.set(guardKey, '1', 'EX', 172800, 'NX')
  if (!isNew) {
    // Already processed this session
    const slots = await redis.get(FOUNDING_SLOTS_KEY)
    return { firstClaim: false, remaining: Math.max(0, parseInt(slots || '0', 10)) }
  }
  // First time — actually claim the slot
  const remaining = await claimFoundingSlot()
  return { firstClaim: true, remaining }
}

/**
 * Get current founding countdown state.
 */
export async function getFoundingCountdown(): Promise<{
  deadline: string | null
  slotsRemaining: number
  active: boolean
}> {
  const [deadline, slots] = await Promise.all([
    redis.get(FOUNDING_DEADLINE_KEY),
    redis.get(FOUNDING_SLOTS_KEY),
  ])
  const slotsRemaining = slots ? Math.max(0, parseInt(slots, 10)) : 0
  const active = deadline ? new Date(deadline) > new Date() && slotsRemaining > 0 : false
  return { deadline, slotsRemaining, active }
}

// ============================================================
// MARKET SLUG CACHE — avoid repeated slug-to-ID lookups
// ============================================================

const MARKET_CACHE_KEY = `${PREFIX}markets:slug_to_id`
const MARKET_TTL = 3600 // 1 hour

/**
 * Get market ID from slug via Redis hash. Returns null on miss.
 */
export async function getMarketId(slug: string): Promise<string | null> {
  return redis.hget(MARKET_CACHE_KEY, slug)
}

/**
 * Cache a market slug-to-ID mapping.
 */
export async function setMarketId(slug: string, id: string): Promise<void> {
  await redis.hset(MARKET_CACHE_KEY, slug, id)
  // Refresh TTL on the entire hash
  await redis.expire(MARKET_CACHE_KEY, MARKET_TTL)
}

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Returns true if Redis is connected and responding.
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}

// ============================================================
// HELPERS
// ============================================================

function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000)
}

function getISOWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const oneJan = new Date(year, 0, 1)
  const weekNum = Math.ceil(((now.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7)
  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

// ============================================================
// SEARCH REPLAY — "Since You Last Searched" feature
// ============================================================

const REPLAY_TTL = 172800 // 48 hours

/**
 * Create a simple hash from a search query string.
 * Used to create consistent keys for search replay.
 */
export function hashQuery(query: string): string {
  // Simple hash — lowercase, trim, replace spaces
  const normalized = query.toLowerCase().trim().replace(/\s+/g, '_')
  // Create a short hash to avoid key length issues
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Store the listing IDs returned by a search query.
 * Used to diff against future results and find new matches.
 */
export async function storeSearchResults(
  userId: string,
  queryHash: string,
  listingIds: string[]
): Promise<void> {
  const key = `${PREFIX}searchresults:${userId}:${queryHash}`
  if (listingIds.length === 0) return
  const pipeline = redis.pipeline()
  pipeline.del(key)
  pipeline.sadd(key, ...listingIds)
  pipeline.expire(key, REPLAY_TTL)
  await pipeline.exec()
}

/**
 * Find new listing IDs that weren't in the previous result set.
 * Returns the IDs of newly matched listings.
 */
export async function getNewMatches(
  userId: string,
  queryHash: string,
  currentListingIds: string[]
): Promise<string[]> {
  const key = `${PREFIX}searchresults:${userId}:${queryHash}`
  const exists = await redis.exists(key)
  if (!exists) return [] // No previous results to compare

  // Create a temp set with current results
  const tempKey = `${PREFIX}searchresults:temp:${userId}:${queryHash}`
  const pipeline = redis.pipeline()
  pipeline.del(tempKey)
  if (currentListingIds.length > 0) {
    pipeline.sadd(tempKey, ...currentListingIds)
  }
  pipeline.expire(tempKey, 60) // temp key, short TTL
  await pipeline.exec()

  // SDIFF: items in current that are NOT in previous = new matches
  const newIds = await redis.sdiff(tempKey, key)
  await redis.del(tempKey)
  return newIds
}

/**
 * Record that a user made a search query (for replay frequency tracking).
 * Increments a counter per user+query combination.
 */
export async function recordSearchQuery(
  userId: string,
  queryHash: string,
  queryText: string
): Promise<void> {
  // Sorted set: score = search count, member = queryHash
  const countKey = `${PREFIX}searchfreq:${userId}`
  await redis.zincrby(countKey, 1, queryHash)
  // Store the actual query text mapped to hash
  const textKey = `${PREFIX}searchtext:${userId}`
  await redis.hset(textKey, queryHash, queryText)
  // Keep for 30 days
  await redis.expire(countKey, 30 * 24 * 60 * 60)
  await redis.expire(textKey, 30 * 24 * 60 * 60)
}

/**
 * Get a user's top N most-searched queries.
 * Returns [{queryHash, queryText, count}]
 */
export async function getTopSearches(
  userId: string,
  limit: number = 5
): Promise<Array<{ queryHash: string; queryText: string; count: number }>> {
  const countKey = `${PREFIX}searchfreq:${userId}`
  const textKey = `${PREFIX}searchtext:${userId}`

  // Get top queries by count (descending)
  const topHashes = await redis.zrevrange(countKey, 0, limit - 1, 'WITHSCORES')
  if (topHashes.length === 0) return []

  const results: Array<{ queryHash: string; queryText: string; count: number }> = []
  for (let i = 0; i < topHashes.length; i += 2) {
    const queryHash = topHashes[i]
    const count = parseInt(topHashes[i + 1], 10)
    const queryText = await redis.hget(textKey, queryHash) || queryHash
    results.push({ queryHash, queryText, count })
  }
  return results
}

// ============================================================
// PRICE BANDS — per-market, per-category price intelligence
// ============================================================

export interface PriceBand {
  tag: string
  count: number
  p25: number    // 25th percentile in cents
  median: number // 50th percentile in cents
  p75: number    // 75th percentile in cents
  min: number
  max: number
  updatedAt: string
}

const PRICE_BAND_TTL = 86400 // 24 hours

/**
 * Store computed price bands for a market+tag combination.
 */
export async function setPriceBand(marketId: string, tag: string, band: PriceBand): Promise<void> {
  const key = `${PREFIX}pricebands:${marketId}`
  await redis.hset(key, tag, JSON.stringify(band))
  await redis.expire(key, PRICE_BAND_TTL)
}

/**
 * Get price band for a specific market+tag. Returns null on miss.
 */
export async function getPriceBand(marketId: string, tag: string): Promise<PriceBand | null> {
  const key = `${PREFIX}pricebands:${marketId}`
  const data = await redis.hget(key, tag)
  if (!data) return null
  try {
    return JSON.parse(data) as PriceBand
  } catch {
    return null
  }
}

/**
 * Get all price bands for a market. Returns a map of tag -> PriceBand.
 */
export async function getAllPriceBands(marketId: string): Promise<Record<string, PriceBand>> {
  const key = `${PREFIX}pricebands:${marketId}`
  const all = await redis.hgetall(key)
  const result: Record<string, PriceBand> = {}
  for (const [tag, json] of Object.entries(all)) {
    try {
      result[tag] = JSON.parse(json) as PriceBand
    } catch {}
  }
  return result
}

/**
 * Determine where a price falls relative to a price band.
 * Returns: 'exceptional' (below p25), 'good' (p25-median), 'average' (median-p75), 'above' (above p75)
 */
export function getPricePosition(priceCents: number, band: PriceBand): {
  position: 'exceptional' | 'good' | 'average' | 'above'
  percentile: number
  vsMedian: number // percentage vs median (negative = below)
} {
  const vsMedian = band.median > 0
    ? Math.round(((priceCents - band.median) / band.median) * 100)
    : 0

  let position: 'exceptional' | 'good' | 'average' | 'above'
  let percentile: number

  if (priceCents <= band.p25) {
    position = 'exceptional'
    percentile = 25
  } else if (priceCents <= band.median) {
    position = 'good'
    percentile = 50
  } else if (priceCents <= band.p75) {
    position = 'average'
    percentile = 75
  } else {
    position = 'above'
    percentile = 90
  }

  return { position, percentile, vsMedian }
}

// ============================================================
// RESALE RADAR — high-flip-potential listings feed
// ============================================================

const RESALE_RADAR_TTL = 7200 // 2 hours (time-sensitive items)

/**
 * Cache the resale radar listings for a market.
 */
export async function setResaleRadar(marketId: string, listings: any[]): Promise<void> {
  const key = `${PREFIX}resale:${marketId}`
  await redis.set(key, JSON.stringify(listings), 'EX', RESALE_RADAR_TTL)
}

/**
 * Get cached resale radar listings for a market. Returns null on miss.
 */
export async function getResaleRadar(marketId: string): Promise<any[] | null> {
  const key = `${PREFIX}resale:${marketId}`
  const data = await redis.get(key)
  if (!data) return null
  try {
    return JSON.parse(data) as any[]
  } catch {
    return null
  }
}
