'use client'

import { useRef, useState } from 'react'
import { Bell, BellOff, Check, Filter, Lock, Plus, Satellite, X } from 'lucide-react'
import { useSignup } from '../SignupContext'
import GlassCard from '../ui/GlassCard'
import SectionHeader from '../ui/SectionHeader'
import EmberButton from '../ui/EmberButton'
import {
  MonitoredGroup,
  MonitoredSearch,
  PipelineFilters,
  PipelineSettings,
} from './types'

/**
 * Pipeline settings — client side of /settings. Every control writes straight
 * to the tables the live n8n workflows read, so each change saves on the spot:
 * optimistic flip, a small ✓ flash on success, revert + toast on failure.
 * Non-admin family get the same view read-only.
 */
const INPUT =
  'rounded-xl border border-white/[0.1] bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-50 ' +
  'placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const scoreBand = (v: number) =>
  v >= 90 ? 'grails only' : v >= 75 ? 'only strong finds' : v >= 65 ? 'balanced' : 'chatty'

/* ── Small in-page primitives ─────────────────────────────────────────── */

function Toggle({
  on,
  onClick,
  disabled,
  big = false,
  label,
}: {
  on: boolean
  onClick: () => void
  disabled?: boolean
  big?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative shrink-0 rounded-full border-0 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        big ? 'h-8 w-14' : 'h-6 w-11'
      } ${
        on
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.45)]'
          : 'bg-slate-700/80'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
          big ? 'h-6 w-6' : 'h-4 w-4'
        } ${on ? (big ? 'left-[26px]' : 'left-[22px]') : 'left-1'}`}
      />
    </button>
  )
}

/** Numeric text input that only commits on blur / Enter (raw string out). */
function CommitInput({
  value,
  onCommit,
  placeholder,
  disabled,
  className = '',
  ariaLabel,
  prefix,
}: {
  value: string
  onCommit: (raw: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel: string
  prefix?: string
}) {
  const [v, setV] = useState(value)
  const [synced, setSynced] = useState(value)
  // Re-sync from props after a revert or external change.
  if (value !== synced) {
    setSynced(value)
    setV(value)
  }
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      {prefix && (
        <span aria-hidden="true" className="pointer-events-none absolute left-3 text-sm text-slate-500">
          {prefix}
        </span>
      )}
      <input
        className={`${INPUT} w-full ${prefix ? '!pl-7' : ''}`}
        type="text"
        inputMode="numeric"
        value={v}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={e => setV(e.target.value)}
        onBlur={() => {
          if (v !== value) {
            onCommit(v)
            // Snap back to the stored value; if the commit was accepted the
            // prop changes and the sync above catches it on the next render.
            setV(value)
            setSynced(value)
          }
        }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
    </span>
  )
}

function ChipInput({
  words,
  onChange,
  placeholder,
  disabled,
  label,
}: {
  words: string[]
  onChange: (next: string[]) => void
  placeholder: string
  disabled?: boolean
  label: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const w = draft.trim().toLowerCase()
    setDraft('')
    if (!w || words.includes(w) || words.length >= 20) return
    onChange([...words, w])
  }
  return (
    <div>
      {words.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {words.map(w => (
            <span
              key={w}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-950/50 py-1 pl-2.5 pr-1 text-xs text-slate-300"
            >
              {w}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(words.filter(x => x !== w))}
                  aria-label={`Remove ${w}`}
                  className="rounded-md p-0.5 text-slate-500 transition-colors hover:text-rose-300"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!disabled && (
        <div className="flex gap-2">
          <input
            className={`${INPUT} min-w-0 flex-1`}
            value={draft}
            placeholder={placeholder}
            aria-label={label}
            maxLength={40}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          />
          <button
            type="button"
            onClick={add}
            aria-label={`Add to ${label}`}
            className="rounded-xl border border-white/[0.1] px-3 text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

function SavedTick({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
      <Check className="h-3 w-3" aria-hidden="true" /> saved
    </span>
  )
}

/* ── The page ─────────────────────────────────────────────────────────── */

export default function SettingsClient({
  signedIn,
  admin,
  initialSettings,
  initialSearches,
  initialGroups,
}: {
  signedIn: boolean
  admin: boolean
  initialSettings: PipelineSettings
  initialSearches: MonitoredSearch[]
  initialGroups: MonitoredGroup[]
}) {
  const { openSignup } = useSignup()

  const [s, setS] = useState(initialSettings)
  const [searches, setSearches] = useState(initialSearches)
  const [groups, setGroups] = useState(initialGroups)
  const [flash, setFlash] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [addErr, setAddErr] = useState('')
  const [adding, setAdding] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [addGroupErr, setAddGroupErr] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const scoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedScore = useRef(initialSettings.global_min_alert_score)

  /** PATCH one change: flash a ✓ by `key` on success, revert + toast on error. */
  const patch = async (key: string, body: object, revert: () => void): Promise<boolean> => {
    try {
      const r = await fetch('/api/hub/pipeline-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        throw new Error(j?.error || 'save failed')
      }
      setFlash(f => ({ ...f, [key]: true }))
      setTimeout(() => setFlash(f => ({ ...f, [key]: false })), 1600)
      return true
    } catch (e) {
      revert()
      setToast(e instanceof Error && e.message !== 'save failed'
        ? `Not saved — ${e.message}`
        : 'Could not save — the pipeline kept its old setting.')
      setTimeout(() => setToast(''), 4000)
      return false
    }
  }

  if (!signedIn) {
    return (
      <GlassCard className="px-6 py-16 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-amber-400/70" aria-hidden="true" />
        <p className="font-display text-lg font-semibold text-slate-50">The pipeline&apos;s controls live behind the door.</p>
        <p className="mb-6 mt-2 text-sm text-slate-400">Sign in to see how the Deal Radar is tuned.</p>
        <EmberButton onClick={openSignup}>Come in</EmberButton>
      </GlassCard>
    )
  }

  const ro = !admin // read-only for non-admin family

  /* — Alerts — */
  const toggleAlerts = () => {
    const next = !s.alerts_enabled
    setS(p => ({ ...p, alerts_enabled: next }))
    patch('alerts', { setting: 'alerts_enabled', value: next },
      () => setS(p => ({ ...p, alerts_enabled: !next })))
  }

  const changeScore = (v: number) => {
    setS(p => ({ ...p, global_min_alert_score: v }))
    if (scoreTimer.current) clearTimeout(scoreTimer.current)
    scoreTimer.current = setTimeout(() => {
      const before = savedScore.current
      patch('score', { setting: 'global_min_alert_score', value: v },
        () => setS(p => ({ ...p, global_min_alert_score: before })))
        .then(ok => { if (ok) savedScore.current = v })
    }, 450)
  }

  const setQuiet = (field: 'start' | 'end', val: string) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(val)) return
    const before = s.quiet_hours
    if (before[field] === val) return
    const next = { ...before, [field]: val }
    setS(p => ({ ...p, quiet_hours: next }))
    patch('quiet', { setting: 'quiet_hours', value: { start: next.start, end: next.end } },
      () => setS(p => ({ ...p, quiet_hours: before })))
  }

  /* — Filters — */
  const saveFilters = (key: string, partial: Partial<PipelineFilters>) => {
    const before = s.pipeline_filters
    setS(p => ({ ...p, pipeline_filters: { ...p.pipeline_filters, ...partial } }))
    patch(key, { setting: 'pipeline_filters', value: partial },
      () => setS(p => ({ ...p, pipeline_filters: before })))
  }

  const commitMoney = (key: 'max_price' | 'min_profit') => (raw: string) => {
    const t = raw.trim()
    const n = t === '' ? null : Math.round(Number(t))
    if (n !== null && (!Number.isFinite(n) || n < 0)) {
      setToast('Enter a dollar amount, or leave it empty for off.')
      setTimeout(() => setToast(''), 3500)
      return
    }
    saveFilters(key, key === 'max_price' ? { max_price: n } : { min_profit: n })
  }

  const commitFlood = (raw: string) => {
    const n = Math.round(Number(raw.trim()))
    if (!Number.isFinite(n) || n < 1 || n > 24) {
      setToast('Flood guard takes 1 to 24 alerts per hour.')
      setTimeout(() => setToast(''), 3500)
      return
    }
    saveFilters('flood', { max_alerts_per_hour: n })
  }

  /* — Sources — */
  const toggleSearch = (row: MonitoredSearch) => {
    setSearches(prev => prev.map(x => (x.id === row.id ? { ...x, active: !row.active } : x)))
    patch(`search-${row.id}`, { search_id: row.id, active: !row.active },
      () => setSearches(prev => prev.map(x => (x.id === row.id ? { ...x, active: row.active } : x))))
  }

  const toggleGroup = (row: MonitoredGroup) => {
    setGroups(prev => prev.map(x => (x.id === row.id ? { ...x, active: !row.active } : x)))
    patch(`group-${row.id}`, { group_id: row.id, active: !row.active },
      () => setGroups(prev => prev.map(x => (x.id === row.id ? { ...x, active: row.active } : x))))
  }

  const commitOverride = (kind: 'search' | 'group', row: { id: string; min_alert_score: number | null }) => (raw: string) => {
    const t = raw.trim()
    const value = t === '' ? null : Math.round(Number(t))
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) {
      setToast('Override takes a score 0-100, or empty for the global bar.')
      setTimeout(() => setToast(''), 3500)
      return
    }
    const before = row.min_alert_score
    if (kind === 'search') {
      setSearches(prev => prev.map(x => (x.id === row.id ? { ...x, min_alert_score: value } : x)))
      patch(`search-min-${row.id}`, { search_id: row.id, min_alert_score: value },
        () => setSearches(prev => prev.map(x => (x.id === row.id ? { ...x, min_alert_score: before } : x))))
    } else {
      setGroups(prev => prev.map(x => (x.id === row.id ? { ...x, min_alert_score: value } : x)))
      patch(`group-min-${row.id}`, { group_id: row.id, min_alert_score: value },
        () => setGroups(prev => prev.map(x => (x.id === row.id ? { ...x, min_alert_score: before } : x))))
    }
  }

  const addSearch = async () => {
    setAddErr('')
    const label = newLabel.trim()
    const url = newUrl.trim()
    if (!label) { setAddErr('Give the search a label.'); return }
    if (!url.includes('craigslist.org/search/')) {
      setAddErr('Paste the full Craigslist search URL (it contains craigslist.org/search/).')
      return
    }
    setAdding(true)
    try {
      const r = await fetch('/api/hub/pipeline-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_search: { label, url } }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.search) { setAddErr(j?.error || 'Could not add — try again.'); return }
      setSearches(prev => [...prev, j.search].sort((a, b) => a.label.localeCompare(b.label)))
      setNewLabel(''); setNewUrl('')
    } finally { setAdding(false) }
  }

  const SLUG_ERR =
    'Open any post in the group and copy the NUMERIC id from its permalink (facebook.com/groups/<numbers>/posts/…)'

  /** Bare digits pass through; facebook.com/groups/<digits> URLs get the id pulled out. */
  const extractGroupId = (raw: string): { id?: string; err: string } => {
    const t = raw.trim()
    if (/^\d+$/.test(t)) {
      return t.length >= 6 ? { id: t, err: '' } : { err: 'Group ids are at least 6 digits.' }
    }
    const m = t.match(/facebook\.com\/groups\/([^/?#]+)/i)
    if (!m) return { err: 'Paste the group URL (facebook.com/groups/…) or its numeric id.' }
    if (!/^\d{6,}$/.test(m[1])) return { err: SLUG_ERR }
    return { id: m[1], err: '' }
  }

  const addGroup = async () => {
    setAddGroupErr('')
    const name = newGroupName.trim()
    if (!name) { setAddGroupErr('Give the group a name.'); return }
    const { id, err } = extractGroupId(newGroupId)
    if (!id) { setAddGroupErr(err); return }
    setAddingGroup(true)
    try {
      const r = await fetch('/api/hub/pipeline-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_group: { name, fb_group_id: id } }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.group) { setAddGroupErr(j?.error || 'Could not add — try again.'); return }
      setGroups(prev => [...prev, j.group].sort((a, b) => a.name.localeCompare(b.name)))
      setNewGroupName(''); setNewGroupId('')
    } finally { setAddingGroup(false) }
  }

  const f = s.pipeline_filters
  const rowCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
      active ? 'border-white/[0.07] bg-slate-950/30' : 'border-white/[0.04] bg-slate-950/20 opacity-55'
    }`

  return (
    <div className="flex flex-col gap-5">
      {ro && (
        <GlassCard className="flex items-center gap-3 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden="true" />
          <p className="text-[13px] leading-relaxed text-slate-300">
            You&apos;re looking at the live pipeline, read-only. Ask Keith for the keys 🔑 if something needs changing.
          </p>
        </GlassCard>
      )}

      {/* ── 1 · Alerts ─────────────────────────────────────────────────── */}
      <GlassCard className="p-5" delay={0.05}>
        <SectionHeader icon={s.alerts_enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />} title="Alerts" />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-50">
              {s.alerts_enabled ? 'Alerts are live' : 'All alerts paused'}
              <SavedTick show={!!flash.alerts} />
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {s.alerts_enabled
                ? 'The pipeline pings the family when a find clears the bar.'
                : 'Nothing pings anyone until this comes back on.'}
            </p>
          </div>
          <Toggle
            big
            on={s.alerts_enabled}
            onClick={toggleAlerts}
            disabled={ro}
            label={s.alerts_enabled ? 'Pause all alerts' : 'Resume alerts'}
          />
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="threshold" className="text-[13px] font-medium text-slate-300">
              Alert threshold <SavedTick show={!!flash.score} />
            </label>
            <span className="whitespace-nowrap">
              <span className="font-data text-lg font-semibold text-amber-300">{s.global_min_alert_score}</span>
              <span className="ml-1.5 text-xs text-slate-500">· {scoreBand(s.global_min_alert_score)}</span>
            </span>
          </div>
          <input
            id="threshold"
            type="range"
            min={50}
            max={95}
            step={1}
            value={s.global_min_alert_score}
            disabled={ro}
            onChange={e => changeScore(Number(e.target.value))}
            className="mt-2 w-full accent-amber-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>50 · chatty</span>
            <span>95 · grails only</span>
          </div>
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-300">
              Quiet hours <SavedTick show={!!flash.quiet} />
            </span>
            <span className="text-xs text-slate-500">Central time</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="time"
              value={s.quiet_hours.start}
              disabled={ro}
              aria-label="Quiet hours start"
              onChange={e => setQuiet('start', e.target.value)}
              className={`${INPUT} [color-scheme:dark]`}
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="time"
              value={s.quiet_hours.end}
              disabled={ro}
              aria-label="Quiet hours end"
              onChange={e => setQuiet('end', e.target.value)}
              className={`${INPUT} [color-scheme:dark]`}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">No pings while the house sleeps.</p>
        </div>
      </GlassCard>

      {/* ── 2 · Sources ────────────────────────────────────────────────── */}
      <GlassCard className="p-5" delay={0.1}>
        <SectionHeader icon={<Satellite className="h-4 w-4" />} title="Sources" />

        <p className="mb-2 mt-4 text-[13px] font-medium text-slate-300">Craigslist searches</p>
        <div className="flex flex-col gap-2">
          {searches.length === 0 && <p className="text-xs text-slate-500">No searches yet.</p>}
          {searches.map(row => (
            <div key={row.id} className={rowCls(row.active)}>
              <Toggle
                on={row.active}
                onClick={() => toggleSearch(row)}
                disabled={ro}
                label={`${row.active ? 'Pause' : 'Resume'} ${row.label}`}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200" title={row.notes || row.url}>
                {row.label}
                <SavedTick show={!!flash[`search-${row.id}`] || !!flash[`search-min-${row.id}`]} />
              </span>
              <CommitInput
                value={row.min_alert_score == null ? '' : String(row.min_alert_score)}
                onCommit={commitOverride('search', row)}
                placeholder="global"
                disabled={ro}
                ariaLabel={`Minimum alert score for ${row.label}`}
                className="w-[4.6rem]"
              />
            </div>
          ))}
        </div>

        <p className="mb-2 mt-5 text-[13px] font-medium text-slate-300">Facebook groups</p>
        <div className="flex flex-col gap-2">
          {groups.length === 0 && <p className="text-xs text-slate-500">No groups yet.</p>}
          {groups.map(row => (
            <div key={row.id} className={rowCls(row.active)}>
              <Toggle
                on={row.active}
                onClick={() => toggleGroup(row)}
                disabled={ro}
                label={`${row.active ? 'Pause' : 'Resume'} ${row.name}`}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                {row.name}
                <SavedTick show={!!flash[`group-${row.id}`] || !!flash[`group-min-${row.id}`]} />
              </span>
              <CommitInput
                value={row.min_alert_score == null ? '' : String(row.min_alert_score)}
                onCommit={commitOverride('group', row)}
                placeholder="global"
                disabled={ro}
                ariaLabel={`Minimum alert score for ${row.name}`}
                className="w-[4.6rem]"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          The small box raises or lowers the alert bar for one source — empty means the global threshold.
        </p>

        {!ro && (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[13px] font-medium text-slate-300">Add a Craigslist search</p>
            <div className="flex flex-col gap-2">
              <input
                className={`${INPUT} w-full`}
                placeholder="Label (e.g. Free stuff — north side)"
                value={newLabel}
                maxLength={80}
                onChange={e => setNewLabel(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className={`${INPUT} min-w-0 flex-1`}
                  placeholder="https://…craigslist.org/search/…"
                  value={newUrl}
                  inputMode="url"
                  onChange={e => setNewUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSearch() }}
                />
                <EmberButton onClick={addSearch} className="!px-4 !py-2 !text-sm">
                  {adding ? 'Adding…' : 'Watch it'}
                </EmberButton>
              </div>
            </div>
            {addErr && <p className="mt-2 text-xs text-rose-300">{addErr}</p>}
            <p className="mt-2 text-[11px] text-slate-500">Polling begins within 7 minutes.</p>
          </div>
        )}

        {!ro && (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[13px] font-medium text-slate-300">Add a Facebook group</p>
            <div className="flex flex-col gap-2">
              <input
                className={`${INPUT} w-full`}
                placeholder="Name (e.g. Buy Nothing — west side)"
                value={newGroupName}
                maxLength={80}
                onChange={e => setNewGroupName(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className={`${INPUT} min-w-0 flex-1`}
                  placeholder="https://facebook.com/groups/… or numeric id"
                  value={newGroupId}
                  inputMode="url"
                  onChange={e => setNewGroupId(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addGroup() }}
                />
                <EmberButton onClick={addGroup} className="!px-4 !py-2 !text-sm">
                  {addingGroup ? 'Adding…' : 'Watch it'}
                </EmberButton>
              </div>
            </div>
            {addGroupErr && <p className="mt-2 text-xs text-rose-300">{addGroupErr}</p>}
            <p className="mt-2 text-[11px] text-slate-500">
              ⚠️ Keith&apos;s Facebook account must be a MEMBER of the group before the radar can read it.
              New groups quietly index their backlog on the first pass — alerts start with the next new post.
              Polling begins within ~15 minutes.
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── 3 · Filters ────────────────────────────────────────────────── */}
      <GlassCard className="p-5" delay={0.15}>
        <SectionHeader icon={<Filter className="h-4 w-4" />} title="Filters" />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[13px] font-medium text-slate-300">
              Cost ceiling <SavedTick show={!!flash.max_price} />
            </label>
            <CommitInput
              value={f.max_price == null ? '' : String(f.max_price)}
              onCommit={commitMoney('max_price')}
              placeholder="off"
              prefix="$"
              disabled={ro}
              ariaLabel="Cost ceiling in dollars"
              className="mt-1.5 w-full"
            />
            <p className="mt-1 text-[11px] text-slate-500">Skip anything priced above this. Empty = off.</p>
          </div>
          <div>
            <label className="text-[13px] font-medium text-slate-300">
              Min profit spread <SavedTick show={!!flash.min_profit} />
            </label>
            <CommitInput
              value={f.min_profit == null ? '' : String(f.min_profit)}
              onCommit={commitMoney('min_profit')}
              placeholder="off"
              prefix="$"
              disabled={ro}
              ariaLabel="Minimum profit spread in dollars"
              className="mt-1.5 w-full"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Alert only when estimated resale minus price ≥ this. Empty = off.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
          <div>
            <p className="text-[13px] font-medium text-slate-300">
              Free finds only <SavedTick show={!!flash.free_only} />
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Only $0 listings make it through.</p>
          </div>
          <Toggle
            on={f.free_only}
            onClick={() => saveFilters('free_only', { free_only: !f.free_only })}
            disabled={ro}
            label="Free finds only"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
          <div>
            <label htmlFor="radius" className="text-[13px] font-medium text-slate-300">
              Radius <SavedTick show={!!flash.radius} />
            </label>
            <select
              id="radius"
              value={f.radius_miles}
              disabled={ro}
              onChange={e => saveFilters('radius', { radius_miles: Number(e.target.value) })}
              className={`${INPUT} mt-1.5 w-full appearance-none`}
            >
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={40}>40 miles</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-medium text-slate-300">
              Flood guard <SavedTick show={!!flash.flood} />
            </label>
            <CommitInput
              value={String(f.max_alerts_per_hour)}
              onCommit={commitFlood}
              disabled={ro}
              ariaLabel="Maximum alerts per hour"
              className="mt-1.5 w-full"
            />
            <p className="mt-1 text-[11px] text-slate-500">Max alerts per hour (1-24).</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="mb-1.5 text-[13px] font-medium text-slate-300">
            Blacklist words <SavedTick show={!!flash.blacklist} />
          </p>
          <ChipInput
            words={f.blacklist}
            onChange={next => saveFilters('blacklist', { blacklist: next })}
            placeholder="broken, parts, scam…"
            disabled={ro}
            label="blacklist words"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">Listings containing any of these never alert.</p>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="mb-1.5 text-[13px] font-medium text-slate-300">
            Muted categories <SavedTick show={!!flash.muted} />
          </p>
          <ChipInput
            words={f.muted_categories}
            onChange={next => saveFilters('muted', { muted_categories: next })}
            placeholder="clothing, baby gear…"
            disabled={ro}
            label="muted categories"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">Whole categories the scorer should ignore.</p>
        </div>
      </GlassCard>

      <p className="text-center text-xs text-slate-500">
        Admin keys are handed out on the{' '}
        <a href="/admin/access" className="text-slate-400 underline transition-colors hover:text-amber-300">
          Family access
        </a>{' '}
        page.
      </p>

      {toast && (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-[95] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-rose-400/30 bg-slate-900/95 px-4 py-2.5 text-center text-[13px] text-rose-200 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
