import { MessageCircle, Pin, StickyNote } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import GlassCard from '../ui/GlassCard'
import SectionHeader from '../ui/SectionHeader'
import { BoardPost, CATEGORY_TONES, timeAgo } from './types'

/**
 * Home-deck Board card — the top of the wall (pinned first, then newest).
 * Owns its own fetch like RadarHomeCard so the page's existing queries
 * stay untouched. Server component.
 */
async function getLatest(): Promise<BoardPost[]> {
  const { data: posts, error } = await supabase
    .from('fliply_board_posts')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)
  if (error || !posts) return []

  const counts: Record<string, number> = {}
  if (posts.length > 0) {
    const { data: reps } = await supabase
      .from('fliply_board_replies')
      .select('post_id')
      .in('post_id', posts.map(p => p.id))
    for (const r of reps || []) counts[r.post_id] = (counts[r.post_id] || 0) + 1
  }
  return posts.map(p => ({ ...p, reply_count: counts[p.id] || 0 })) as BoardPost[]
}

export default async function BoardHomeCard({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const posts = await getLatest()

  return (
    <GlassCard className={`flex flex-col p-5 ${className}`} delay={delay}>
      <SectionHeader
        icon={<StickyNote className="h-4 w-4" />}
        title="The Board"
        action="Open board"
        actionHref="/board"
      />

      {posts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <StickyNote className="mb-3 h-7 w-7 text-amber-400/60" aria-hidden="true" />
          <p className="text-sm text-slate-400">
            The board is bare — <a href="/board" className="text-amber-300 no-underline hover:underline">pin up the first note</a>.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {posts.map(p => (
            <li key={p.id}>
              <a
                href="/board"
                className="block rounded-xl border border-white/[0.06] bg-slate-950/40 px-3.5 py-2.5 no-underline transition-colors hover:border-amber-400/30"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {p.pinned && <Pin className="h-3 w-3 text-amber-400" aria-hidden="true" />}
                  <span className="font-medium text-slate-400">{p.author_name || p.author_email.split('@')[0]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeAgo(p.created_at)}</span>
                  <span className={`ml-auto rounded-full border px-2 py-px text-[10px] font-medium capitalize ${CATEGORY_TONES[p.category]}`}>
                    {p.category}
                  </span>
                </div>
                <div className="mt-1 truncate text-[13.5px] font-medium text-slate-50">
                  {p.title || p.body}
                </div>
                {p.reply_count > 0 && (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <MessageCircle className="h-3 w-3" aria-hidden="true" />
                    {p.reply_count} {p.reply_count === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}
