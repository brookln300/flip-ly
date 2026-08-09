'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, ListChecks, Plus, X } from 'lucide-react'
import { useSignup } from '../SignupContext'

/**
 * Shared checklists — client side of /lists. One chip per list, add on
 * Enter, tap to check off (records who), open items on top with the done
 * pile collapsed underneath. Optimistic everywhere; refetch on error.
 */
export type HubList = { id: string; name: string; emoji: string | null; created_by: string | null; created_at: string }
export type ListItem = { id: string; list_id: string; text: string; done: boolean; added_by: string | null; done_by: string | null; created_at: string }

const INPUT =
  'w-full rounded-xl border border-white/[0.1] bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-50 ' +
  'placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/40'

export default function ListsClient({
  initialLists,
  initialItems,
  initialNames,
}: {
  initialLists: HubList[]
  initialItems: ListItem[]
  initialNames: Record<string, string>
}) {
  const { openSignup, loggedInUser } = useSignup()
  const me = loggedInUser?.email?.toLowerCase()

  const [lists, setLists] = useState<HubList[]>(initialLists)
  const [items, setItems] = useState<ListItem[]>(initialItems)
  const [names, setNames] = useState<Record<string, string>>(initialNames)
  const [activeId, setActiveId] = useState<string | null>(initialLists[0]?.id ?? null)
  const [newText, setNewText] = useState('')
  const [doneOpen, setDoneOpen] = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListEmoji, setNewListEmoji] = useState('')
  const [err, setErr] = useState('')

  const refetch = useCallback(async () => {
    try {
      const r = await fetch('/api/hub/lists')
      const j = await r.json()
      if (j.lists) { setLists(j.lists); setItems(j.items || []); setNames(j.names || {}) }
    } catch { /* keep what we have */ }
  }, [])

  const gate = (r: Response) => {
    if (r.status === 401) { openSignup(); return true }
    return false
  }

  const who = (email: string | null) => (email ? names[email] || email.split('@')[0] : '')

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const text = newText.trim()
    if (!text || !activeId) return
    const temp: ListItem = {
      id: `tmp-${Date.now()}`, list_id: activeId, text, done: false,
      added_by: me || null, done_by: null, created_at: new Date().toISOString(),
    }
    setItems(prev => [...prev, temp])
    setNewText('')
    const r = await fetch('/api/hub/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_id: activeId, text }),
    })
    if (gate(r)) { setItems(prev => prev.filter(i => i.id !== temp.id)); return }
    if (!r.ok) { setErr('Could not add — try again.'); refetch(); return }
    const j = await r.json()
    if (j.item) setItems(prev => prev.map(i => (i.id === temp.id ? j.item : i)))
  }

  const toggle = async (item: ListItem) => {
    if (item.id.startsWith('tmp-')) return
    const done = !item.done
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, done, done_by: done ? me || null : null } : i)))
    const r = await fetch('/api/hub/lists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, done }),
    })
    if (gate(r) || !r.ok) refetch()
  }

  const remove = async (item: ListItem) => {
    if (item.id.startsWith('tmp-')) return
    setItems(prev => prev.filter(i => i.id !== item.id))
    const r = await fetch(`/api/hub/lists?id=${item.id}`, { method: 'DELETE' })
    if (gate(r) || !r.ok) refetch()
  }

  const clearDone = async () => {
    if (!activeId) return
    setItems(prev => prev.filter(i => !(i.list_id === activeId && i.done)))
    const r = await fetch(`/api/hub/lists?list_id=${activeId}&done=1`, { method: 'DELETE' })
    if (gate(r) || !r.ok) refetch()
  }

  const createList = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const name = newListName.trim()
    if (!name) return
    const r = await fetch('/api/hub/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji: newListEmoji }),
    })
    if (gate(r)) return
    if (!r.ok) { setErr(r.status === 409 ? 'That list already exists.' : 'Could not create — try again.'); return }
    const j = await r.json()
    setNewListName(''); setNewListEmoji(''); setShowNewList(false)
    await refetch()
    if (j.list?.id) setActiveId(j.list.id)
  }

  const open = items.filter(i => i.list_id === activeId && !i.done)
  const done = items.filter(i => i.list_id === activeId && i.done)

  return (
    <div>
      {/* List chips */}
      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {lists.map(l => {
          const openCount = items.filter(i => i.list_id === l.id && !i.done).length
          const active = l.id === activeId
          return (
            <button
              key={l.id}
              onClick={() => { setActiveId(l.id); setDoneOpen(false) }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? 'border-orange-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200'
                  : 'border-white/[0.08] bg-slate-900/60 text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
              }`}
            >
              {l.emoji ? `${l.emoji} ` : ''}{l.name}
              {openCount > 0 && <span className="ml-1.5 font-data text-xs opacity-70">{openCount}</span>}
            </button>
          )
        })}
        <button
          onClick={() => setShowNewList(v => !v)}
          className="shrink-0 rounded-full border border-dashed border-white/[0.16] px-3.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-amber-400/40 hover:text-amber-300"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          New list
        </button>
      </div>

      {/* New-list mini form */}
      {showNewList && (
        <form onSubmit={createList} className="mb-5 flex items-center gap-2">
          <input
            className={`${INPUT} !w-16 text-center`}
            placeholder="🛒"
            value={newListEmoji}
            maxLength={4}
            onChange={e => setNewListEmoji(e.target.value)}
            aria-label="List emoji"
          />
          <input
            className={INPUT}
            placeholder="List name (Target run, Camping trip…)"
            value={newListName}
            maxLength={60}
            onChange={e => setNewListName(e.target.value)}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-amber-400/40 hover:text-amber-300"
          >
            Create
          </button>
        </form>
      )}
      {err && <p className="mb-4 text-xs text-rose-300">{err}</p>}

      {lists.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 px-6 py-16 text-center backdrop-blur-md">
          <ListChecks className="mx-auto mb-4 h-10 w-10 text-amber-400/70" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-slate-50">No lists yet.</p>
          <p className="mt-2 text-sm text-slate-400">Start one above — groceries, errands, the works.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          {/* Add item */}
          <form onSubmit={addItem} className="mb-4 flex items-center gap-2">
            <input
              className={INPUT}
              placeholder="Add an item — Enter to save"
              value={newText}
              maxLength={200}
              onChange={e => setNewText(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Add item"
              className="shrink-0 rounded-xl border border-white/[0.1] p-2.5 text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {/* Open items */}
          {open.length === 0 && done.length === 0 && (
            <p className="px-1 py-6 text-center text-sm text-slate-500">Nothing on this list — add the first item.</p>
          )}
          {open.length === 0 && done.length > 0 && (
            <p className="px-1 py-4 text-center text-sm text-emerald-300/80">All done here. 🎉</p>
          )}
          <ul className="flex flex-col gap-1.5">
            {open.map(item => (
              <li key={item.id} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-2.5">
                <button
                  onClick={() => toggle(item)}
                  aria-label={`Check off ${item.text}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/[0.2] transition-colors hover:border-amber-400/60"
                />
                <span className="min-w-0 flex-1 text-sm text-slate-100">{item.text}</span>
                {(item.done || (me && item.added_by === me)) && (
                  <button
                    onClick={() => remove(item)}
                    aria-label={`Remove ${item.text}`}
                    className="shrink-0 text-slate-600 transition-colors hover:text-rose-300"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Done pile — collapsed by default */}
          {done.length > 0 && (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDoneOpen(v => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
                >
                  {doneOpen ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                  Done ({done.length})
                </button>
                <button
                  onClick={clearDone}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-rose-300"
                >
                  Clear done
                </button>
              </div>
              {doneOpen && (
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {done.map(item => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-slate-950/25 px-3 py-2.5 opacity-70">
                      <button
                        onClick={() => toggle(item)}
                        aria-label={`Uncheck ${item.text}`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 transition-colors hover:border-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-0 flex-1 text-sm text-slate-400 line-through">{item.text}</span>
                      {item.done_by && <span className="shrink-0 text-[11px] text-slate-600">✓ {who(item.done_by)}</span>}
                      <button
                        onClick={() => remove(item)}
                        aria-label={`Remove ${item.text}`}
                        className="shrink-0 text-slate-600 transition-colors hover:text-rose-300"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
