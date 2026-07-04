'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSignup } from './SignupContext'

/** Family calendar — upcoming gatherings, one-tap RSVP, add from site or Telegram. */
interface Ev { id: string; title: string; emoji: string | null; starts_at: string; location: string | null; notes: string | null; rsvps: Record<string, string>; created_by: string | null }

export default function CalendarBoard() {
  const { openSignup, loggedInUser } = useSignup()
  const [events, setEvents] = useState<Ev[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('')
  const [when, setWhen] = useState('')
  const [where, setWhere] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch('/api/hub/events'); const j = await r.json(); setEvents(j.events || []) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const add = async () => {
    setErr('')
    if (!title.trim() || !when) { setErr('Give it a name and a date.'); return }
    const r = await fetch('/api/hub/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, emoji, starts_at: new Date(when).toISOString(), location: where }) })
    if (r.status === 401) { openSignup(); return }
    if (!r.ok) { setErr('Could not save — try again.'); return }
    setTitle(''); setEmoji(''); setWhen(''); setWhere(''); load()
  }

  const rsvp = async (id: string, v: string) => {
    const r = await fetch('/api/hub/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, rsvp: v }) })
    if (r.status === 401) { openSignup(); return }
    load()
  }

  const inp: React.CSSProperties = { background: 'rgba(255,246,236,0.06)', border: '1px solid rgba(255,246,236,0.14)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: '#FFF6EC' }
  const chip = (on: boolean): React.CSSProperties => ({ padding: '6px 13px', fontSize: '13px', fontWeight: 600, borderRadius: '999px', cursor: 'pointer', border: `1px solid ${on ? '#FFD166' : 'rgba(255,246,236,0.16)'}`, background: on ? 'rgba(255,209,102,0.14)' : 'transparent', color: on ? '#FFD166' : '#DCD3C6' })

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  const me = loggedInUser?.email?.toLowerCase()

  return (
    <div>
      <div style={{ borderRadius: '16px', padding: '16px', background: 'rgba(255,246,236,0.055)', border: '1px solid rgba(255,246,236,0.1)', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFF6EC', marginBottom: '10px' }}>Plan something ✨</div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: '8px', marginBottom: '8px' }}>
          <input style={inp} placeholder="🎉" value={emoji} onChange={e => setEmoji(e.target.value)} aria-label="Event emoji" />
          <input style={inp} placeholder="What's happening? (Sunday dinner, Ava's game…)" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <input type="datetime-local" style={inp} value={when} onChange={e => setWhen(e.target.value)} aria-label="When" />
          <input style={inp} placeholder="Where?" value={where} onChange={e => setWhere(e.target.value)} />
        </div>
        {err && <div style={{ fontSize: '12px', color: '#F0997B', marginBottom: '8px' }}>{err}</div>}
        <button onClick={add} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer', color: '#16213E', background: 'linear-gradient(120deg, #FFD166, #F4A259)' }}>Add to the calendar</button>
      </div>

      {loading && events.length === 0 ? <div style={{ color: '#C9BFB2' }}>Loading…</div>
        : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', borderRadius: '16px', background: 'rgba(255,246,236,0.04)', border: '1px solid rgba(255,246,236,0.08)', color: '#C9BFB2', fontSize: '14px' }}>
            Nothing planned yet. Be the first — add a gathering above. 🏮
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map(ev => {
              const yes = Object.entries(ev.rsvps || {}).filter(([, v]) => v === 'yes').map(([k]) => k.split('@')[0])
              const mine = me ? (ev.rsvps || {})[me] : undefined
              return (
                <div key={ev.id} style={{ borderRadius: '16px', padding: '16px 18px', background: 'rgba(255,246,236,0.055)', border: '1px solid rgba(255,246,236,0.1)' }}>
                  <div style={{ fontFamily: 'var(--font-display), serif', fontSize: '18px', fontWeight: 600, color: '#FFF6EC' }}>{ev.emoji ? `${ev.emoji} ` : ''}{ev.title}</div>
                  <div style={{ fontSize: '13px', color: '#FFD166', marginTop: '4px' }}>{fmt(ev.starts_at)}</div>
                  {ev.location && <div style={{ fontSize: '13px', color: '#C9BFB2', marginTop: '2px' }}>📍 {ev.location}</div>}
                  <div style={{ display: 'flex', gap: '7px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button style={chip(mine === 'yes')} onClick={() => rsvp(ev.id, 'yes')}>I&apos;m in 🙌</button>
                    <button style={chip(mine === 'maybe')} onClick={() => rsvp(ev.id, 'maybe')}>Maybe</button>
                    <button style={chip(mine === 'no')} onClick={() => rsvp(ev.id, 'no')}>Can&apos;t 😢</button>
                    {yes.length > 0 && <span style={{ fontSize: '12px', color: '#84A98C', marginLeft: '4px' }}>coming: {yes.join(', ')}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
