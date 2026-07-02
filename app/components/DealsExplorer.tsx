'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const CATEGORIES = [
  'electronics', 'tools', 'collectibles', 'furniture', 'vintage', 'musical',
  'automotive', 'sports', 'kitchen', 'outdoor', 'home-decor', 'books', 'kids', 'clothing', 'free',
]
const SORTS = [
  { v: 'score', label: 'Best score' },
  { v: 'margin', label: 'Best margin (eBay comps)' },
  { v: 'newest', label: 'Newest' },
  { v: 'price_low', label: 'Price: low to high' },
  { v: 'price_high', label: 'Price: high to low' },
]
const PAGE = 40

function scoreColor(s: number | null) {
  if (s == null) return 'var(--text-muted)'
  if (s >= 8) return 'var(--accent-green)'
  if (s >= 6) return 'var(--accent-amber)'
  return 'var(--text-muted)'
}
function scoreBg(s: number | null) {
  if (s != null && s >= 8) return 'rgba(22,163,74,0.1)'
  if (s != null && s >= 6) return 'rgba(217,119,6,0.1)'
  return 'var(--bg-surface)'
}

interface Deal {
  id: string; title: string; price: string; score: number | null; reason: string | null
  tags: string[]; city: string | null; event_type: string | null; source_url: string | null
  resale_flag: boolean; margin_pct: number | null; comp_median_cents: number | null
}

export default function DealsExplorer() {
  const [q, setQ] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [sort, setSort] = useState('score')
  const [deals, setDeals] = useState<Deal[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildUrl = useCallback((off: number) => {
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (tags.length) p.set('tags', tags.join(','))
    if (priceMin) p.set('price_min', priceMin)
    if (priceMax) p.set('price_max', priceMax)
    if (scoreMin) p.set('score_min', scoreMin)
    if (scoreMax) p.set('score_max', scoreMax)
    p.set('sort', sort)
    p.set('limit', String(PAGE))
    p.set('offset', String(off))
    return `/api/deals?${p.toString()}`
  }, [q, tags, priceMin, priceMax, scoreMin, scoreMax, sort])

  const load = useCallback(async (off: number, append: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(off))
      const json = await res.json()
      setTotal(json.total || 0)
      setOffset(off)
      setDeals(prev => append ? [...prev, ...(json.results || [])] : (json.results || []))
    } catch {
      if (!append) setDeals([])
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => load(0, false), 300)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tags, priceMin, priceMax, scoreMin, scoreMax, sort])

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const clearAll = () => { setQ(''); setTags([]); setPriceMin(''); setPriceMax(''); setScoreMin(''); setScoreMax(''); setSort('score') }
  const hasFilters = q || tags.length || priceMin || priceMax || scoreMin || scoreMax

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px',
    padding: '8px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%',
  }
  const scoreOpts = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

  return (
    <div>
      {/* Filter panel */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search title or description — e.g. dewalt, oled, vintage amp"
          style={{ ...inputStyle, marginBottom: '12px' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {CATEGORIES.map(c => {
            const on = tags.includes(c)
            return (
              <button key={c} onClick={() => toggleTag(c)} style={{
                padding: '5px 11px', fontSize: '12px', borderRadius: '999px', cursor: 'pointer',
                border: on ? '1px solid var(--accent-green)' : '1px solid var(--border-default)',
                background: on ? 'rgba(22,163,74,0.1)' : 'transparent',
                color: on ? 'var(--accent-green)' : 'var(--text-secondary)',
                fontWeight: on ? 600 : 400, textTransform: 'capitalize',
              }}>{c.replace('-', ' ')}</button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min price $
            <input type="number" inputMode="numeric" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0" style={{ ...inputStyle, marginTop: '4px' }} />
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max price $
            <input type="number" inputMode="numeric" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="any" style={{ ...inputStyle, marginTop: '4px' }} />
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min score
            <select value={scoreMin} onChange={e => setScoreMin(e.target.value)} style={{ ...inputStyle, marginTop: '4px' }}>
              {scoreOpts.map(o => <option key={o} value={o}>{o === '' ? 'any' : o}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max score
            <select value={scoreMax} onChange={e => setScoreMax(e.target.value)} style={{ ...inputStyle, marginTop: '4px' }}>
              {scoreOpts.map(o => <option key={o} value={o}>{o === '' ? 'any' : o}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle, marginTop: '4px' }}>
              {SORTS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Result header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {loading && deals.length === 0 ? 'Loading…' : `${total.toLocaleString()} deal${total === 1 ? '' : 's'}`}
        </span>
        {hasFilters && (
          <button onClick={clearAll} style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
        )}
      </div>

      {/* Results */}
      {deals.length === 0 && !loading ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No deals match these filters. Loosen them and try again.
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
          {deals.map((d, i) => {
            const tag = d.tags[0] || d.event_type || 'listing'
            const inner = (
              <div style={{ display: 'flex', gap: '12px', padding: '13px 15px', alignItems: 'flex-start', borderBottom: i === deals.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                <div style={{ minWidth: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, background: scoreBg(d.score), border: `1px solid ${d.score != null && d.score >= 8 ? 'rgba(22,163,74,0.2)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: scoreColor(d.score) }}>{d.score ?? '—'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {d.title}
                    {d.resale_flag && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(22,163,74,0.08)', borderRadius: '4px', padding: '1px 5px', verticalAlign: 'middle' }}>flip</span>}
                    {d.margin_pct != null && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, color: d.margin_pct >= 40 ? 'var(--accent-green)' : 'var(--text-muted)', background: d.margin_pct >= 40 ? 'rgba(22,163,74,0.08)' : 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1px 5px', verticalAlign: 'middle' }}>{d.margin_pct}% margin</span>}
                  </div>
                  {d.reason && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '3px' }}>{d.reason}</div>}
                  {d.city && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{d.city}</div>}
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{d.price}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tag}</div>
                  {d.comp_median_cents != null && <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>≈${Math.round(d.comp_median_cents / 100).toLocaleString()} sold</div>}
                  {d.source_url && <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '4px' }}>view ↗</div>}
                </div>
              </div>
            )
            return d.source_url
              ? <a key={d.id} href={d.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
              : <div key={d.id}>{inner}</div>
          })}
        </div>
      )}

      {deals.length < total && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => load(offset + PAGE, true)} disabled={loading} style={{
            padding: '9px 20px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px',
          }}>{loading ? 'Loading…' : `Load more (${(total - deals.length).toLocaleString()} left)`}</button>
        </div>
      )}
    </div>
  )
}
