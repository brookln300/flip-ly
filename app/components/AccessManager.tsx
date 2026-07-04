'use client'

import { useState, useEffect, useCallback } from 'react'

interface Member { email: string; role: string; label: string | null }

export default function AccessManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [me, setMe] = useState('')
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading')
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/allowlist')
    if (r.status === 403) { setStatus('denied'); return }
    const j = await r.json(); setMembers(j.members || []); setMe(j.me || ''); setStatus('ok')
  }, [])
  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!email.trim()) return
    await fetch('/api/admin/allowlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, label }) })
    setEmail(''); setLabel(''); load()
  }
  const remove = async (e: string) => { await fetch(`/api/admin/allowlist?email=${encodeURIComponent(e)}`, { method: 'DELETE' }); load() }

  const btn: React.CSSProperties = { padding: '7px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '7px', cursor: 'pointer', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }
  const inp: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '7px', padding: '9px 11px', fontSize: '14px', color: 'var(--text-primary)' }

  if (status === 'loading') return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
  if (status === 'denied') return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '28px', textAlign: 'center' }}>
      <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>Admins only</p>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sign in with your admin email to manage family access.</p>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="family member email" style={{ ...inp, flex: 1, minWidth: '200px' }} />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="name (optional)" style={{ ...inp, width: '160px' }} />
        <button style={{ ...btn, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={add}>Add access</button>
      </div>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
        {members.map((m, i) => (
          <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{m.label || m.email}</div>
              {m.label && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.email}</div>}
            </div>
            {m.role === 'admin' && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>admin</span>}
            {m.email !== me && <button style={{ ...btn, padding: '4px 10px', fontSize: '12px', color: 'var(--text-dim)' }} onClick={() => remove(m.email)}>Remove</button>}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Added people can sign in at fliply.net with that email. Removing them blocks new logins.</p>
    </div>
  )
}
