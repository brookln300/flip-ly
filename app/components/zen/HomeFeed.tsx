'use client'

import { useMemo, useState } from 'react'
import FeedRow from './FeedRow'
import ZenSection from './ZenSection'
import { DealListing } from '../radar/types'

/**
 * Home page interactive middle: the quick bar (master alerts toggle for
 * admins, client-side feed search, tune link), the merged feed, and the
 * collapsed near-misses block. Everything else on / is server-rendered.
 */
export default function HomeFeed({
  rows,
  nearMisses,
  admin,
  alertsEnabled,
}: {
  rows: DealListing[]
  nearMisses: DealListing[]
  admin: boolean
  alertsEnabled: boolean
}) {
  const [q, setQ] = useState('')
  const [alerts, setAlerts] = useState(alertsEnabled)
  const [toggling, setToggling] = useState(false)

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

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter(l =>
      [l.title, l.category, l.location_text, l.flip_type]
        .some(v => v && v.toLowerCase().includes(t))
    )
  }, [rows, q])

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
        <a href="/settings" className="text-[12.5px] text-zen-muted no-underline hover:text-zen-accent hover:underline">
          tune ⚙
        </a>
      </div>

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
            {rows.length === 0 ? 'nothing scored yet — the radar is watching.' : 'no rows match that search.'}
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
