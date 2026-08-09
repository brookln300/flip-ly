/**
 * The Board — row shapes for fliply_board_posts / _replies, shared by the
 * /board page, its client, and the home-deck card so they stay in lockstep.
 */
export type BoardCategory = 'general' | 'deals' | 'plans' | 'wins'

export type BoardPost = {
  id: string
  author_email: string
  author_name: string | null
  title: string | null
  body: string
  category: BoardCategory
  pinned: boolean
  created_at: string
  reply_count: number
}

export type BoardReply = {
  id: string
  post_id: string
  author_email: string
  author_name: string | null
  body: string
  created_at: string
}

export const CATEGORIES: { value: BoardCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'deals', label: 'Deals' },
  { value: 'plans', label: 'Plans' },
  { value: 'wins', label: 'Wins' },
]

/** Subtle per-category tint — chip on cards, and the composer's selector. */
export const CATEGORY_TONES: Record<BoardCategory, string> = {
  general: 'border-slate-400/25 bg-slate-500/15 text-slate-300',
  deals: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300',
  plans: 'border-sky-400/25 bg-sky-500/15 text-sky-300',
  wins: 'border-amber-400/25 bg-amber-500/15 text-amber-300',
}

export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
