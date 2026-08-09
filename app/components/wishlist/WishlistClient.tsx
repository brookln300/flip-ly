'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Pause, Play, Trash2 } from 'lucide-react'
import { useSignup } from '../SignupContext'
import EmberButton from '../ui/EmberButton'
import { timeAgo } from '../board/types'

/**
 * Family wishlist — client side of /wishlist. Every wish is a row in the
 * deal pipeline's grail_list, so the radar's scorer can match against it.
 * Add a wish, pause it, or take your own back off the hunt.
 */
export type Wish = {
  id: string
  name: string
  match_terms: string[]
  category: string | null
  max_price: number | null
  active: boolean
  alert_route: string | null
  requested_by: string | null
  notes: string | null
  created_at: string | null
}

const INPUT =
  'w-full rounded-xl border border-white/[0.1] bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-50 ' +
  'placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/40'

export default function WishlistClient({
  initialWishes,
  initialNames,
}: {
  initialWishes: Wish[]
  initialNames: Record<string, string>
}) {
  const { openSignup, loggedInUser } = useSignup()
  const me = loggedInUser?.email?.toLowerCase()

  const [wishes, setWishes] = useState<Wish[]>(initialWishes)
  const [names, setNames] = useState<Record<string, string>>(initialNames)
  const [name, setName] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const refetch = useCallback(async () => {
    try {
      const r = await fetch('/api/hub/wishlist')
      const j = await r.json()
      if (j.wishes) { setWishes(j.wishes); setNames(j.names || {}) }
    } catch { /* keep what we have */ }
  }, [])

  const gate = (r: Response) => {
    if (r.status === 401) { openSignup(); return true }
    return false
  }

  const who = (email: string | null) => (email ? names[email] || email.split('@')[0] : 'the pipeline')

  const add = async () => {
    setErr('')
    if (!name.trim()) { setErr('What are you hunting for?'); return }
    setSaving(true)
    try {
      const price = maxPrice.trim() ? Number(maxPrice) : null
      const r = await fetch('/api/hub/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, max_price: price != null && !Number.isNaN(price) ? price : undefined, notes }),
      })
      if (gate(r)) return
      if (!r.ok) { setErr('Could not save — try again.'); return }
      setName(''); setMaxPrice(''); setNotes('')
      await refetch()
    } finally { setSaving(false) }
  }

  const toggleActive = async (w: Wish) => {
    setWishes(prev => prev.map(x => (x.id === w.id ? { ...x, active: !w.active } : x)))
    const r = await fetch('/api/hub/wishlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: w.id, active: !w.active }),
    })
    if (gate(r) || !r.ok) refetch()
  }

  const remove = async (w: Wish) => {
    if (!confirm('Call off the hunt for this one?')) return
    setWishes(prev => prev.filter(x => x.id !== w.id))
    const r = await fetch(`/api/hub/wishlist?id=${w.id}`, { method: 'DELETE' })
    if (gate(r) || !r.ok) refetch()
  }

  return (
    <div>
      {/* Add a wish */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-6 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <div className="mb-2 grid grid-cols-[1fr_7rem] gap-2">
          <input
            className={INPUT}
            placeholder="What are you hunting? (kayak, PS5, mid-century dresser…)"
            value={name}
            maxLength={140}
            onChange={e => setName(e.target.value)}
          />
          <input
            className={INPUT}
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="Max $"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            aria-label="Max price"
          />
        </div>
        <input
          className={INPUT}
          placeholder="Notes (optional — color, size, condition…)"
          value={notes}
          maxLength={500}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-end">
          <EmberButton onClick={add} className="!px-5 !py-2 !text-sm">
            {saving ? 'Adding…' : 'Start the hunt'}
          </EmberButton>
        </div>
        {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
      </motion.div>

      {/* The hunt list */}
      {wishes.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 px-6 py-16 text-center backdrop-blur-md">
          <Gift className="mx-auto mb-4 h-10 w-10 text-amber-400/70" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-slate-50">Nothing on the hunt yet.</p>
          <p className="mt-2 text-sm text-slate-400">Add the first wish and the radar starts watching for it.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wishes.map((w, i) => (
            <motion.article
              key={w.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
              className={`rounded-2xl border bg-slate-900/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all ${
                w.active ? 'border-white/[0.08] hover:border-white/[0.14]' : 'border-white/[0.05] opacity-55'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold leading-snug text-slate-50">
                    {w.name}
                    {!w.active && <span className="ml-2 text-xs font-medium text-slate-500">paused</span>}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span>for {who(w.requested_by)}</span>
                    {w.max_price != null && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          up to <span className="font-data font-semibold text-slate-300">${Math.round(w.max_price).toLocaleString('en-US')}</span>
                        </span>
                      </>
                    )}
                    {w.created_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{timeAgo(w.created_at)}</span>
                      </>
                    )}
                  </div>
                  {w.notes && <p className="mt-1.5 text-[13px] italic leading-relaxed text-slate-400">{w.notes}</p>}
                  {w.match_terms?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.match_terms.map(t => (
                        <span key={t} className="rounded-md border border-white/[0.07] bg-slate-950/50 px-1.5 py-0.5 font-data text-[10px] text-slate-500">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleActive(w)}
                    aria-label={w.active ? 'Pause this wish' : 'Resume this wish'}
                    title={w.active ? 'Pause — radar stops watching' : 'Resume the hunt'}
                    className="rounded-lg border border-white/[0.08] p-2 text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
                  >
                    {w.active ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                  </button>
                  {me && w.requested_by === me && (
                    <button
                      onClick={() => remove(w)}
                      aria-label="Delete wish"
                      className="rounded-lg border border-white/[0.08] p-2 text-slate-500 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
