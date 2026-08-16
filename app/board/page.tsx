import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import BoardClient from '../components/board/BoardClient'
import { BoardPost } from '../components/board/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'board — flip-ly', robots: { index: false, follow: false } }

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
      <ZenShell active="Board">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">board</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            the family bulletin — deal finds, plans, wins. pin the important stuff so it stays on top.
          </p>
        </header>
        <BoardClient initialPosts={posts} />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
