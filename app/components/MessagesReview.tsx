'use client'

import { useState, useEffect, useCallback } from 'react'

interface Msg {
  id: string; listing_id: string | null; status: string; channel: string | null
  to_addr: string | null; subject: string | null; body: string; offer_cents: number | null
  created_at: string; sent_at: string | null
  fliply_listings?: { title: string; price_text: string | null; source_url: string | null; city: string | null } | null
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--accent-amber)', approved: 'var(--accent-green)', sent: 'var(--text-muted)', replied: 'var(--accent-green)', archived: 'var(--text-dim)',
}

export default function MessagesReview() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/api/messages'); const j = await r.json(); setMsgs(j.messages || []) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const patch = async (id: string, body: any) => {
    await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    load()
  }

  const btn: React.CSSProperties = { padding: '5px 11px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }

  if (loading && msgs.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
  if (msgs.length === 0) return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No drafts yet. Hit the ✉ button on a deal to draft an inquiry.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {msgs.map(m => {
        const bodyVal = edit[m.id] ?? m.body
        const listing = m.fliply_listings
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1${m.to_addr ? `&to=${encodeURIComponent(m.to_addr)}` : ''}&su=${encodeURIComponent(m.subject || '')}&body=${encodeURIComponent(bodyVal)}`
        return (
          <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{listing?.title || m.subject || 'Message'}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: STATUS_COLOR[m.status] || 'var(--text-muted)' }}>{m.status}</span>
            </div>
            {listing && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{listing.price_text} · {listing.city}{m.offer_cents ? ` · offering $${Math.round(m.offer_cents / 100).toLocaleString()}` : ''}</div>}
            <input
              defaultValue={m.to_addr || ''} placeholder="Seller email (paste to enable auto-send; blank = send manually from the listing)" onBlur={e => patch(m.id, { to_addr: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-primary)', marginBottom: '8px' }}
            />
            <input
              defaultValue={m.subject || ''} onBlur={e => patch(m.id, { subject: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}
            />
            <textarea
              value={bodyVal} onChange={e => setEdit(p => ({ ...p, [m.id]: e.target.value }))}
              rows={7}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '9px 11px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '7px', marginTop: '10px', flexWrap: 'wrap' }}>
              {edit[m.id] != null && edit[m.id] !== m.body && (
                <button style={btn} onClick={() => patch(m.id, { body: edit[m.id] })}>Save edits</button>
              )}
              {m.status === 'draft' && (
                <button style={{ ...btn, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={() => patch(m.id, { body: bodyVal, status: 'approved' })}>Approve</button>
              )}
              <button style={btn} onClick={() => navigator.clipboard?.writeText(bodyVal)}>Copy message</button>
              {listing?.source_url && <a href={listing.source_url} target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: 'none' }}>Open listing to reply ↗</a>}
              {m.to_addr && <a href={gmail} target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: 'none' }}>Open in Gmail ↗</a>}
              {(m.status === 'approved') && (
                <button style={{ ...btn, borderColor: 'var(--border-strong)' }} onClick={() => patch(m.id, { status: 'sent' })}>Mark sent</button>
              )}
              {m.status !== 'archived' && <button style={{ ...btn, color: 'var(--text-dim)' }} onClick={() => patch(m.id, { status: 'archived' })}>Archive</button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
