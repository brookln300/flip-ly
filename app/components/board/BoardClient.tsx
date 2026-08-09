'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Pin, Send, Trash2 } from 'lucide-react'
import { useSignup } from '../SignupContext'
import EmberButton from '../ui/EmberButton'
import { BoardCategory, BoardPost, BoardReply, CATEGORIES, CATEGORY_TONES, timeAgo } from './types'

/**
 * The Board — client side of /board. Composer up top, then the wall:
 * pinned notes first, expand a card in place for its reply thread.
 * Anyone can pin (we trust each other); you can delete your own.
 */
const INPUT =
  'w-full rounded-xl border border-white/[0.1] bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-50 ' +
  'placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/40'

export default function BoardClient({ initialPosts }: { initialPosts: BoardPost[] }) {
  const { openSignup, loggedInUser } = useSignup()
  const me = loggedInUser?.email?.toLowerCase()

  const [posts, setPosts] = useState<BoardPost[]>(initialPosts)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<BoardCategory>('general')
  const [posting, setPosting] = useState(false)
  const [err, setErr] = useState('')

  const [expanded, setExpanded] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, BoardReply[]>>({})
  const [replyText, setReplyText] = useState('')

  const refetch = useCallback(async () => {
    try {
      const r = await fetch('/api/hub/board')
      const j = await r.json()
      if (j.posts) setPosts(j.posts)
    } catch { /* keep what we have */ }
  }, [])

  const loadReplies = useCallback(async (postId: string) => {
    try {
      const r = await fetch(`/api/hub/board?post=${postId}`)
      const j = await r.json()
      setReplies(prev => ({ ...prev, [postId]: j.replies || [] }))
    } catch { /* thread just shows empty */ }
  }, [])

  const gate = (r: Response) => {
    if (r.status === 401) { openSignup(); return true }
    return false
  }

  const post = async () => {
    setErr('')
    if (!body.trim()) { setErr('Say something first.'); return }
    setPosting(true)
    try {
      const r = await fetch('/api/hub/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      })
      if (gate(r)) return
      if (!r.ok) { setErr('Could not post — try again.'); return }
      setTitle(''); setBody(''); setCategory('general')
      await refetch()
    } finally { setPosting(false) }
  }

  const toggleExpand = (p: BoardPost) => {
    if (expanded === p.id) { setExpanded(null); return }
    setExpanded(p.id)
    setReplyText('')
    if (!replies[p.id]) loadReplies(p.id)
  }

  const togglePin = async (p: BoardPost) => {
    const r = await fetch(`/api/hub/board/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !p.pinned }),
    })
    if (gate(r)) return
    refetch()
  }

  const deletePost = async (p: BoardPost) => {
    if (!confirm('Take this note off the board?')) return
    const r = await fetch(`/api/hub/board/${p.id}`, { method: 'DELETE' })
    if (gate(r)) return
    if (expanded === p.id) setExpanded(null)
    refetch()
  }

  const sendReply = async (postId: string) => {
    if (!replyText.trim()) return
    const r = await fetch('/api/hub/board/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, body: replyText }),
    })
    if (gate(r)) return
    if (!r.ok) return
    setReplyText('')
    loadReplies(postId)
    refetch() // reply count
  }

  const deleteReply = async (reply: BoardReply) => {
    if (!confirm('Delete this reply?')) return
    const r = await fetch(`/api/hub/board/reply?id=${reply.id}`, { method: 'DELETE' })
    if (gate(r)) return
    loadReplies(reply.post_id)
    refetch()
  }

  return (
    <div>
      {/* Composer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-6 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <input
          className={`${INPUT} mb-2`}
          placeholder="Title (optional)"
          value={title}
          maxLength={140}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className={`${INPUT} min-h-[84px] resize-y`}
          placeholder="Pin something up — a find, a plan, a win…"
          value={body}
          maxLength={4000}
          onChange={e => setBody(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  category === c.value
                    ? CATEGORY_TONES[c.value]
                    : 'border-white/[0.08] bg-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <EmberButton onClick={post} className="!px-5 !py-2 !text-sm">
            {posting ? 'Posting…' : 'Post it'}
          </EmberButton>
        </div>
        {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
      </motion.div>

      {/* The wall */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 px-6 py-16 text-center backdrop-blur-md">
          <Pin className="mx-auto mb-4 h-10 w-10 text-amber-400/70" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-slate-50">The board is bare.</p>
          <p className="mt-2 text-sm text-slate-400">Pin up the first note — deal finds, plans, bragging rights all welcome.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p, i) => {
            const open = expanded === p.id
            const thread = replies[p.id]
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
                className={`rounded-2xl border bg-slate-900/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors ${
                  p.pinned ? 'border-amber-400/25' : 'border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                {/* Byline row */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {p.pinned && <Pin className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />}
                  <span className="font-medium text-slate-300">{p.author_name || p.author_email.split('@')[0]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeAgo(p.created_at)}</span>
                  <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${CATEGORY_TONES[p.category]}`}>
                    {p.category}
                  </span>
                </div>

                {p.title && (
                  <h2 className="mt-2 font-display text-[17px] font-semibold text-slate-50">{p.title}</h2>
                )}
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{p.body}</p>

                {/* Actions */}
                <div className="mt-3.5 flex items-center gap-1 text-xs">
                  <button
                    onClick={() => toggleExpand(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-amber-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.reply_count > 0 ? `${p.reply_count} ${p.reply_count === 1 ? 'reply' : 'replies'}` : 'Reply'}
                  </button>
                  <button
                    onClick={() => togglePin(p)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors hover:bg-white/[0.05] ${
                      p.pinned ? 'text-amber-300' : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  {me === p.author_email && (
                    <button
                      onClick={() => deletePost(p)}
                      aria-label="Delete post"
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Thread */}
                {open && (
                  <div className="mt-3 border-t border-white/[0.06] pt-3">
                    {thread === undefined ? (
                      <p className="py-2 text-xs text-slate-500">Loading thread…</p>
                    ) : thread.length === 0 ? (
                      <p className="py-1 text-xs text-slate-500">No replies yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {thread.map(rp => (
                          <li key={rp.id} className="rounded-xl border border-white/[0.06] bg-slate-950/40 px-3.5 py-2.5">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-400">{rp.author_name || rp.author_email.split('@')[0]}</span>
                              <span aria-hidden="true">·</span>
                              <span>{timeAgo(rp.created_at)}</span>
                              {me === rp.author_email && (
                                <button
                                  onClick={() => deleteReply(rp)}
                                  aria-label="Delete reply"
                                  className="ml-auto text-slate-600 transition-colors hover:text-rose-300"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">{rp.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form
                      className="mt-3 flex items-center gap-2"
                      onSubmit={e => { e.preventDefault(); sendReply(p.id) }}
                    >
                      <input
                        className={INPUT}
                        placeholder="Write a reply…"
                        value={replyText}
                        maxLength={2000}
                        onChange={e => setReplyText(e.target.value)}
                      />
                      <button
                        type="submit"
                        aria-label="Send reply"
                        className="shrink-0 rounded-xl border border-white/[0.1] p-2.5 text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
