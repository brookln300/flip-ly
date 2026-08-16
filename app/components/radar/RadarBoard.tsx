'use client'

import { useMemo, useState } from 'react'
import FeedRow from '../zen/FeedRow'
import { DealListing, sourceLabel } from './types'

/**
 * Deal Radar deep view — client side of /radar. Same compact FeedRow as
 * the home feed (reply / claim / open), plus bracket-style filters and
 * the [good]/[bad] verdicts that calibrate the scorer.
 */
type Filter =
  | { kind: 'all' }
  | { kind: 'free' }
  | { kind: 'under50' }
  | { kind: 'source'; value: string }
  | { kind: 'category'; value: string }

function filterKey(f: Filter): string {
  return 'value' in f ? `${f.kind}:${f.value}` : f.kind
}

export default function RadarBoard({ listings }: { listings: DealListing[] }) {
  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  // Optimistic per-row overrides of outcome_feedback (server value is the fallback).
  const [feedback, setFeedback] = useState<Record<string, number>>({})

  const verdictOf = (l: DealListing): number => feedback[l.id] ?? l.outcome_feedback ?? 0

  const sendVerdict = async (l: DealListing, value: 1 | -1) => {
    const current = verdictOf(l)
    const next = current === value ? 0 : value // tap active again to clear
    setFeedback(prev => ({ ...prev, [l.id]: next }))
    try {
      const res = await fetch('/api/hub/radar-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id, value: next }),
      })
      if (!res.ok) throw new Error('feedback failed')
    } catch {
      setFeedback(prev => ({ ...prev, [l.id]: current })) // revert on error
    }
  }

  const sources = useMemo(() => Array.from(new Set(listings.map(l => l.source))).sort(), [listings])
  const categories = useMemo(
    () => Array.from(new Set(listings.map(l => l.category).filter((c): c is string => !!c))).sort(),
    [listings]
  )

  const visible = useMemo(() => {
    switch (filter.kind) {
      case 'free':
        return listings.filter(l => l.is_free)
      case 'under50':
        return listings.filter(l => l.is_free || (l.price_listed != null && l.price_listed < 50))
      case 'source':
        return listings.filter(l => l.source === filter.value)
      case 'category':
        return listings.filter(l => l.category === filter.value)
      default:
        return listings
    }
  }, [listings, filter])

  const chips: { label: string; f: Filter }[] = [
    { label: 'all', f: { kind: 'all' } },
    { label: 'free', f: { kind: 'free' } },
    { label: 'under $50', f: { kind: 'under50' } },
    ...sources.map(s => ({ label: sourceLabel(s).toLowerCase(), f: { kind: 'source', value: s } as Filter })),
    ...categories.map(c => ({ label: c.toLowerCase(), f: { kind: 'category', value: c } as Filter })),
  ]

  return (
    <div>
      {/* bracket filters */}
      <div className="mb-3 flex flex-wrap gap-x-2 gap-y-1 text-[12.5px]">
        {chips.map(({ label, f }) => {
          const active = filterKey(f) === filterKey(filter)
          return (
            <button
              key={filterKey(f)}
              onClick={() => setFilter(f)}
              className={active ? 'text-zen-accent' : 'text-zen-muted hover:text-zen-text hover:underline'}
            >
              [{label}]
            </button>
          )
        })}
      </div>

      <div className="border border-zen-line">
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-zen-muted">
            the radar is watching — nothing scored here yet.
          </p>
        ) : (
          visible.map(l => (
            <FeedRow
              key={l.id}
              listing={l}
              verdict={verdictOf(l)}
              onVerdict={v => sendVerdict(l, v)}
            />
          ))
        )}
      </div>
    </div>
  )
}
