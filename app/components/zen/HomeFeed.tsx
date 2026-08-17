'use client'

import { useMemo, useState } from 'react'
import FeedRow from './FeedRow'
import ZenSection from './ZenSection'
import { DealListing } from '../radar/types'

/**
 * Home page interactive middle: the quick bar (master alerts toggle for
 * admins, client-side feed search, tune link), the filter bar, the merged
 * feed, and the collapsed near-misses block. Everything else on / is
 * server-rendered.
 *
 * Filters are pure client-side over the 200 most recent scored rows:
 * source (all/fb/cl), specific FB group, min score, free-only, max price,
 * date window (pinned to a rolling clock, "today" = last 24h), and sort
 * (newest / score / price). All compose with the search box.
 */
type FbGroup = { id: string; name: string }

const SCORE_STOPS = [0, 45, 65, 75, 90] as const
const DATE_STOPS = [
  { key: 'any', label: 'any time', hours: 0 },
  { key: '24h', label: 'last 24h', hours: 24 },
  { key: '2d', label: '2 days', hours: 48 },
  { key: '7d', label: 'week', hours: 168 },
] as const
type SortKey = 'newest' | 'score' | 'price'

export default function HomeFeed({
  rows,
  nearMisses,
  fbGroups = [],
  admin,
  alertsEnabled,
}: {
  rows: DealListing[]
  nearMisses: DealListing[]
  fbGroups?: FbGroup[]
  admin: boolean
  alertsEnabled: boolean
}) {
  const [q, setQ] = useState('')
  const [alerts, setAlerts] = useState(alertsEnabled)
  const [toggling, setToggling] = useState(false)

  // filter state
  const [showFilters, setShowFilters] = useState(false)
  const [source, setSource] = useState<'all' | 'fb_group' | 'craigslist'>('all')
  const [group, setGroup] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [freeOnly, setFreeOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')
  const [dateKey, setDateKey] = useState<(typeof DATE_STOPS)[number]['key']>('any')
  const [sort, setSort] = useState<SortKey>('newest')

  const toggleAlerts = async () => {
    if (!admin || toggling) return
    const next = !alerts
    setAlerts(next)
    setToggling(true)
    try {
      const res = await fetch('/api/hub/pipeline-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting: 'alerts_enabled', value: next }),
      })
      if (!res.ok) setAlerts(!next) // revert on failure
    } catch {
      setAlerts(!next)
    } finally {
      setToggling(false)
    }
  }

  const activeCount =
    (source !== 'all' ? 1 : 0) +
    (group !== 'all' ? 1 : 0) +
    (minScore > 0 ? 1 : 0) +
    (freeOnly ? 1 : 0) +
    (maxPrice.trim() !== '' ? 1 : 0) +
    (dateKey !== 'any' ? 1 : 0)

  const clearFilters = () => {
    setSource('all')
    setGroup('all')
    setMinScore(0)
    setFreeOnly(false)
    setMaxPrice('')
    setDateKey('any')
    setSort('newest')
  }

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase()
    const maxP = maxPrice.trim() === '' ? null : Number(maxPrice)
    const hours = DATE_STOPS.find(d => d.key === dateKey)?.hours || 0
    const cutoff = hours > 0 ? Date.now() - hours * 3600_000 : null

    let out = rows.filter(l => {
      if (source !== 'all' && l.source !== source) return false
      if (group !== 'all' && String(l.source_ref) !== group) return false
      if (minScore > 0 && (l.score == null || l.score < minScore)) return false
      if (freeOnly && !l.is_free) return false
      if (maxP != null && !Number.isNaN(maxP)) {
        // free rows always satisfy a price ceiling
        if (!l.is_free && (l.price_listed == null || l.price_listed > maxP)) return false
      }
      if (cutoff != null) {
        const when = l.posted_at || l.ingested_at
        if (!when || new Date(when).getTime() < cutoff) return false
      }
      if (t) {
        const hit = [l.title, l.category, l.location_text, l.flip_type]
          .some(v => v && v.toLowerCase().includes(t))
        if (!hit) return false
      }
      return true
    })

    if (sort === 'score') {
      out = [...out].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    } else if (sort === 'price') {
      const p = (l: DealListing) => (l.is_free ? 0 : l.price_listed ?? Number.MAX_SAFE_INTEGER)
      out = [...out].sort((a, b) => p(a) - p(b))
    }
    return out
  }, [rows, q, source, group, minScore, freeOnly, maxPrice, dateKey, sort])

  const seg = (active: boolean) =>
    `px-2 py-0.5 text-[12px] transition-colors ${
      active ? 'bg-zen-accent/10 text-zen-accent' : 'text-zen-muted hover:text-zen-text'
    }`
  const selectCls =
    'border border-zen-line bg-transparent px-1.5 py-0.5 text-[12px] text-zen-text outline-none focus:border-zen-accent/50 [&>option]:bg-zen-panel'
  const label = 'text-[11px] uppercase tracking-wide text-zen-muted'

  return (
    <>
      {/* quick bar */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-zen-line px-3 py-1.5">
        <button
          onClick={toggleAlerts}
          disabled={!admin || toggling}
          title={admin ? 'master alerts toggle — steers the live pipeline' : 'admin only'}
          className={`text-[12.5px] ${
            admin ? 'cursor-pointer hover:underline' : 'cursor-default'
          } ${alerts ? 'text-zen-accent' : 'text-amber-400'}`}
        >
          alerts: {alerts ? 'on' : 'OFF'}{admin ? '' : ' (read-only)'}
        </button>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="search the feed…"
          aria-label="Search the feed"
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-0.5 text-[13px] text-zen-text outline-none placeholder:text-zen-muted"
        />
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`text-[12.5px] ${showFilters || activeCount ? 'text-zen-accent' : 'text-zen-muted hover:text-zen-text'}`}
        >
          filters{activeCount ? ` (${activeCount})` : ''} {showFilters ? '▴' : '▾'}
        </button>
        <a href="/settings" className="text-[12.5px] text-zen-muted no-underline hover:text-zen-accent hover:underline">
          tune ⚙
        </a>
      </div>

      {/* filter bar */}
      {showFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-zen-line px-3 py-2">
          {/* source */}
          <span className="flex items-center gap-1.5">
            <span className={label}>source</span>
            <span className="flex border border-zen-line">
              <button onClick={() => { setSource('all'); setGroup('all') }} className={seg(source === 'all')}>all</button>
              <button onClick={() => setSource('fb_group')} className={seg(source === 'fb_group')}>fb</button>
              <button onClick={() => { setSource('craigslist'); setGroup('all') }} className={seg(source === 'craigslist')}>cl</button>
            </span>
          </span>

          {/* specific FB group */}
          {fbGroups.length > 0 && source !== 'craigslist' && (
            <span className="flex items-center gap-1.5">
              <span className={label}>group</span>
              <select
                value={group}
                onChange={e => {
                  setGroup(e.target.value)
                  if (e.target.value !== 'all') setSource('fb_group')
                }}
                className={selectCls}
              >
                <option value="all">all groups</option>
                {fbGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </span>
          )}

          {/* score */}
          <span className="flex items-center gap-1.5">
            <span className={label}>score</span>
            <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} className={selectCls}>
              {SCORE_STOPS.map(s => (
                <option key={s} value={s}>{s === 0 ? 'any' : `${s}+`}</option>
              ))}
            </select>
          </span>

          {/* price */}
          <span className="flex items-center gap-1.5">
            <span className={label}>price</span>
            <button onClick={() => setFreeOnly(f => !f)} className={`border border-zen-line ${seg(freeOnly)}`}>
              free only
            </button>
            <span className="text-[12px] text-zen-muted">≤ $</span>
            <input
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="any"
              inputMode="numeric"
              className="w-14 border border-zen-line bg-transparent px-1.5 py-0.5 font-data text-[12px] text-zen-text outline-none placeholder:text-zen-muted focus:border-zen-accent/50"
            />
          </span>

          {/* date window */}
          <span className="flex items-center gap-1.5">
            <span className={label}>posted</span>
            <select
              value={dateKey}
              onChange={e => setDateKey(e.target.value as typeof dateKey)}
              className={selectCls}
            >
              {DATE_STOPS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </span>

          {/* sort */}
          <span className="flex items-center gap-1.5">
            <span className={label}>sort</span>
            <span className="flex border border-zen-line">
              <button onClick={() => setSort('newest')} className={seg(sort === 'newest')}>newest</button>
              <button onClick={() => setSort('score')} className={seg(sort === 'score')}>score</button>
              <button onClick={() => setSort('price')} className={seg(sort === 'price')}>price</button>
            </span>
          </span>

          {(activeCount > 0 || sort !== 'newest') && (
            <button onClick={clearFilters} className="ml-auto text-[12px] text-zen-muted hover:text-zen-accent">
              [clear all]
            </button>
          )}
        </div>
      )}

      {/* the feed */}
      <ZenSection
        label={`the feed · ${visible.length} of ${rows.length}`}
        action="deep view →"
        actionHref="/radar"
        flush
        className="mb-3"
      >
        {visible.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-zen-muted">
            {rows.length === 0
              ? 'nothing scored yet — the radar is watching.'
              : activeCount > 0 || q
                ? 'nothing matches those filters.'
                : 'no rows match that search.'}
          </p>
        ) : (
          visible.map(l => <FeedRow key={l.id} listing={l} />)
        )}
      </ZenSection>

      {/* near misses */}
      <details className="mb-3 border border-zen-line">
        <summary className="cursor-pointer select-none bg-zen-panel px-3 py-1.5 text-[12px] font-semibold lowercase tracking-wide text-zen-muted hover:text-zen-text">
          near misses (65–74, last two days) · {nearMisses.length}
        </summary>
        {nearMisses.length === 0 ? (
          <p className="px-3 py-3 text-[13px] text-zen-muted">none — clean cutoff.</p>
        ) : (
          <div className="border-t border-zen-line">
            {nearMisses.map(l => <FeedRow key={l.id} listing={l} canClaim={false} />)}
          </div>
        )}
      </details>
    </>
  )
}
