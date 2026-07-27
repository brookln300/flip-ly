/**
 * Shared types for the Facebook "free stuff" groups → Telegram pipeline.
 * See docs/planning/FB-GROUPS-TO-TELEGRAM.md for the full architecture.
 */

/** A post as captured by the browser extension and sent to the ingest endpoint. */
export interface RawFbPost {
  group_id?: string
  group_name?: string
  post_url?: string
  author_name?: string
  raw_text: string
  image_urls?: string[]
  /** ISO timestamp; defaults to server time if omitted. */
  captured_at?: string
  /** User's home ZIP (from extension settings) for distance filtering. */
  home_zip?: string
  /** Max distance in miles the user wants (from extension settings). */
  radius_mi?: number
}

/** One row as stored in fb_free_posts. */
export interface FbFreePost extends RawFbPost {
  id: string
  content_hash: string
  captured_at: string
  is_free: boolean | null
  item_summary: string | null
  location_hint: string | null
  pickup_note: string | null
  ai_reason: string | null
  home_zip: string | null
  radius_mi: number | null
  location_zip: string | null
  distance_mi: number | null
  status: 'pending' | 'ready' | 'sent' | 'rejected'
  tg_message_id: number | null
  processed_at: string | null
  sent_at: string | null
}

/** Haiku's verdict for a single post in a classify batch. */
export interface FbClassification {
  index: number
  is_free: boolean
  item_summary: string | null
  location_hint: string | null
  pickup_note: string | null
  /** 5-digit US ZIP parsed from the post text, or null if none present. */
  location_zip: string | null
  reason: string
}
