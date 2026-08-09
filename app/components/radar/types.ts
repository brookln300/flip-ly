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
