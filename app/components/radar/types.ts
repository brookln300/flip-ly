/**
 * Deal Radar — row shape for the `deal_listings` table (FB groups /
 * Craigslist ingestion pipeline). Kept as a shared type so the /radar
 * board and the home-deck card stay in lockstep.
 */
export type DealListing = {
  id: string
  source: string
  external_url: string | null
  title: string | null
  price_listed: number | null
  is_free: boolean | null
  location_text: string | null
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
  'id, source, external_url, title, price_listed, is_free, location_text, posted_at, ingested_at, status, score, category, est_value_low, est_value_high, flip_type, reasoning, suggested_reply, outcome_feedback'

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
