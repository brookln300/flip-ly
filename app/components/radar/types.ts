/**
 * Deal Radar — row shape for the `deal_listings` table (FB groups /
 * Craigslist ingestion pipeline). Kept as a shared type so the /radar
 * board and the home-deck card stay in lockstep.
 */
export type DealListing = {
  id: string
  source: string
  /** FB group id for fb_group rows, search id for craigslist rows. */
  source_ref: string | null
  external_url: string | null
  title: string | null
  price_listed: number | null
  is_free: boolean | null
  location_text: string | null
  body: string | null
  image_url: string | null
  lat: number | null
  lng: number | null
  gone_at: string | null
  posted_at: string | null
  ingested_at: string | null
  status: string
  score: number | null
  category: string | null
  est_value_low: number | null
  est_value_high: number | null
  flip_type: string | null
  reasoning: string | null
  suggested_reply: string | null
  /** Family verdict: 1 = good find, -1 = bad call, null/0 = no verdict yet. */
  outcome_feedback: number | null
}

/** Columns fetched for radar surfaces — one place to keep them in sync. */
export const DEAL_LISTING_COLUMNS =
  'id, source, source_ref, external_url, title, price_listed, is_free, location_text, body, image_url, lat, lng, gone_at, posted_at, ingested_at, status, score, category, est_value_low, est_value_high, flip_type, reasoning, suggested_reply, outcome_feedback'

export function fmtPrice(l: Pick<DealListing, 'price_listed' | 'is_free'>): string {
  if (l.is_free) return 'FREE'
  if (l.price_listed == null) return '—'
  return `$${Math.round(l.price_listed).toLocaleString('en-US')}`
}

export function fmtEstRange(l: Pick<DealListing, 'est_value_low' | 'est_value_high'>): string | null {
  if (l.est_value_low == null && l.est_value_high == null) return null
  const lo = l.est_value_low != null ? `$${Math.round(l.est_value_low).toLocaleString('en-US')}` : '?'
  const hi = l.est_value_high != null ? `$${Math.round(l.est_value_high).toLocaleString('en-US')}` : '?'
  return `${lo}–${hi}`
}

export function sourceLabel(source: string): string {
  if (source === 'fb_group') return 'FB group'
  if (source === 'craigslist') return 'Craigslist'
  return source.replace(/_/g, ' ')
}

export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/** Terse forms for the dense feed rows: "fb"/"cl", "14m"/"3h"/"2d". */
export function sourceShort(source: string): string {
  if (source === 'fb_group') return 'fb'
  if (source === 'craigslist') return 'cl'
  return source.slice(0, 2)
}

/**
 * Exact post time, X-style: "10:42 pm · Aug 16" (year appended when not
 * current). Pinned to America/Chicago on both server and client so SSR
 * hydration matches and times read correctly for the DFW family.
 */
export function fmtPostTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const time = d
    .toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' })
    .toLowerCase()
  const sameYear =
    d.toLocaleString('en-US', { timeZone: 'America/Chicago', year: 'numeric' }) ===
    new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', year: 'numeric' })
  const date = d.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  return `${time} · ${date}`
}

export function timeAgoShort(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/**
 * Geo helpers — HOME is the family base (9309 Sterling Gate Dr, McKinney
 * 75072). Distance renders when the pipeline geocoded the listing; the map
 * link falls back to a street-address match in the title/body/location when
 * there are no coordinates.
 */
export const HOME = { lat: 33.1977446, lng: -96.7375739 }
export const HOME_ADDR = '9309 Sterling Gate Dr, McKinney, TX 75072'

export function milesFromHome(l: Pick<DealListing, 'lat' | 'lng'>): number | null {
  if (l.lat == null || l.lng == null) return null
  const R = 3958.8
  const t = (x: number) => (x * Math.PI) / 180
  const dLat = t(l.lat - HOME.lat)
  const dLng = t(l.lng - HOME.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(t(HOME.lat)) * Math.cos(t(l.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10
}

/** Street-address-looking fragment in free text ("123 Maple St", "4508 Ridge Rd"). */
const ADDR_RE =
  /\b\d{3,5}\s+[A-Za-z][A-Za-z.]*(?:\s+[A-Za-z][A-Za-z.]*){0,3}\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|pkwy|parkway|cir|circle|way|trl|trail|pl|place|loop)\b\.?/i

export function extractAddress(l: Pick<DealListing, 'title' | 'body' | 'location_text'>): string | null {
  for (const s of [l.location_text, l.title, l.body]) {
    const m = s?.match(ADDR_RE)
    if (m) return m[0]
  }
  return null
}

/** Directions from home to the listing — coordinates first, address fallback. */
export function mapsUrl(l: Pick<DealListing, 'lat' | 'lng' | 'title' | 'body' | 'location_text'>): string | null {
  const dest =
    l.lat != null && l.lng != null
      ? `${l.lat},${l.lng}`
      : (() => {
          const a = extractAddress(l)
          return a ? `${a}, TX` : null
        })()
  if (!dest) return null
  return `https://www.google.com/maps/dir/${encodeURIComponent(HOME_ADDR)}/${encodeURIComponent(dest)}`
}

/**
 * Claims live as a stamp appended to `reasoning` (no schema change):
 * "[claimed by Keith @ 2026-08-15T14:03:00.000Z]". Parse it back out
 * for display; strip it when showing the scorer's reasoning itself.
 */
const CLAIM_RE = /\[claimed by ([^\]]+?) @ ([^\]]+)\]/

export function parseClaim(reasoning: string | null): { name: string; at: string } | null {
  if (!reasoning) return null
  const m = reasoning.match(CLAIM_RE)
  return m ? { name: m[1], at: m[2] } : null
}

export function stripClaim(reasoning: string | null): string {
  return (reasoning || '').replace(CLAIM_RE, '').trim()
}
