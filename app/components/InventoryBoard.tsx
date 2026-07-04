'use client'

import { useState, useEffect, useCallback } from 'react'

const $ = (c: number | null | undefined) => c == null ? '—' : `$${Math.round(c / 100).toLocaleString()}`
const STATUS = ['bought', 'listed', 'sold', 'passed']
const STATUS_COLOR: Record<string, string> = { bought: 'var(--accent-amber)', listed: 'var(--accent-green)', sold: 'var(--text-muted)', passed: 'var(--text-dim)' }

interface Item {
  id: string; title: string; category: string | null; status: string
  bought_cents: number | null; comp_cents: number | null; listed_cents: number | null
  sold_cents: number | null; fees_cents: number | null; sold_at: string | null; bought_at: string | null
  ebay_draft: { title: string; price_cents: number | null; description: string } | null
  fliply_listings?: { source_url: string | null } | null
}

export default function InventoryBoard() {
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newCost, setNewCost] = useState('')
  const [drafts, setDrafts] = useState<Record<string, any>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/api/inventory'); const j = await r.json(); setItems(j.items || []); setStats(j.stats) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const patch = async (id: string, body: any) => { await fetch(`/api/inventory/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); load() }
  const del = async (id: string) => { await fetch(`/api/inventory/${id}`, { method: 'DELETE' }); load() }
  const addManual = async () => {
    if (!newTitle.trim()) return
    await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle.trim(), bought_cents: newCost ? Math.round(parseFloat(newCost) * 100) : null }) })
    setNewTitle(''); setNewCost(''); load()
  }
  const genDraft = async (id: string) => { const r = await fetch(`/api/inventory/${id}/ebay-draft`, { method: 'POST' }); const j = await r.json(); setDrafts(p => ({ ...p, [id]: j.draft })); load() }

  const btn: React.CSSProperties = { padding: '4px 9px', fontSize: '11px', fontWeight: 600, borderRadius: '5px', cursor: 'pointer', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }
  const inp: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '5px', padding: '4px 7px', fontSize: '12px', color: 'var(--text-primary)', width: '72px' }

  return (
    <div>
      {/* Rollup */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {[
            ['In inventory', String(stats.active_count), null],
            ['Invested', $(stats.invested_cents), null],
            ['Est. value', $(stats.comp_value_cents), null],
            ['Sold', String(stats.sold_count), null],
            ['Net profit', $(stats.net_profit_cents), (stats.net_profit_cents || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-amber)'],
            ['ROI', `${stats.roi_pct}%`, null],
            ['Avg flip', stats.avg_flip_days != null ? `${stats.avg_flip_days}d` : '—', null],
          ].map(([label, val, color]) => (
            <div key={label as string} style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: (color as string) || 'var(--text-primary)' }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add manual */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add a purchase (off-feed too) — item name" style={{ ...inp, flex: 1, minWidth: '180px', width: 'auto' }} />
        <input value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="paid $" inputMode="decimal" style={inp} />
        <button style={{ ...btn, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={addManual}>Add</button>
      </div>

      {loading && items.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
        : items.length === 0 ? <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No items yet. Add a purchase above, or hit "Bought" on a deal.</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(it => {
                const profit = it.sold_cents != null ? (it.sold_cents - (it.bought_cents || 0) - (it.fees_cents || 0)) : null
                const draft = drafts[it.id] || it.ebay_draft
                return (
                  <div key={it.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{it.title}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: STATUS_COLOR[it.status] }}>{it.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', margin: '8px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <label>paid <input defaultValue={it.bought_cents ? it.bought_cents / 100 : ''} onBlur={e => patch(it.id, { bought_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} style={inp} /></label>
                      <span style={{ color: 'var(--text-dim)' }}>comp {$(it.comp_cents)}</span>
                      <label>list <input defaultValue={it.listed_cents ? it.listed_cents / 100 : ''} onBlur={e => patch(it.id, { listed_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} style={inp} /></label>
                      <label>sold <input defaultValue={it.sold_cents ? it.sold_cents / 100 : ''} onBlur={e => patch(it.id, { sold_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} style={inp} /></label>
                      <label>fees <input defaultValue={it.fees_cents ? it.fees_cents / 100 : ''} onBlur={e => patch(it.id, { fees_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} style={inp} /></label>
                      {profit != null && <span style={{ fontWeight: 700, color: profit >= 0 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>profit {$(profit)}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {STATUS.map(s => it.status !== s && (
                        <button key={s} style={btn} onClick={() => patch(it.id, { status: s })}>{s === 'sold' ? 'Mark sold' : s === 'listed' ? 'Mark listed' : `→ ${s}`}</button>
                      ))}
                      <button style={{ ...btn, borderColor: 'var(--border-strong)' }} onClick={() => genDraft(it.id)}>{draft ? 'eBay draft ✓' : 'Make eBay draft'}</button>
                      <a href="https://www.ebay.com/sl/sell" target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: 'none' }}>Open eBay ↗</a>
                      <button style={{ ...btn, color: 'var(--text-dim)', marginLeft: 'auto' }} onClick={() => del(it.id)}>Delete</button>
                    </div>
                    {draft && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>eBay draft — list at {$(draft.price_cents)}</div>
                        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{draft.title}{'\n\n'}{draft.description}</div>
                        <button style={{ ...btn, marginTop: '8px' }} onClick={() => navigator.clipboard?.writeText(`${draft.title}\n\n${draft.description}`)}>Copy for eBay</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}
