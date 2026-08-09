import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import BoardClient from '../components/board/BoardClient'
import { BoardPost } from '../components/board/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'The Board — The Hearth', robots: { index: false, follow: false } }

/**
 * The Board — the family bulletin. Server component fetches the wall
 * (pinned first, newest first) with reply counts; the client handles
 * posting, threads, pins, and deletes.
 */
async function getPosts(): Promise<BoardPost[]> {
  const { data: posts, error } = await supabase
    .from('fliply_board_posts')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)
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

export default async function BoardPage() {
  const posts = await getPosts()

  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Board" />
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              The <span className="text-ember">Board</span>
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
              The family bulletin — deal finds, plans, wins, whatever needs saying.
              Pin the important stuff so it stays on top.
            </p>
          </header>
          <BoardClient initialPosts={posts} />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
