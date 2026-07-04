'use client'

import { useState, useEffect } from 'react'
import { useSignup } from './SignupContext'

/**
 * "Tend your lantern" — the immersive profile editor. Everything here changes
 * how YOU appear in the shared night sky: your flame's color and behavior,
 * your sigil, your status whisper, your story. Identity expressed in the
 * world, not buried in a settings page.
 */
const FLAMES = [
  { v: 'steady', label: 'Steady', desc: 'calm, constant glow' },
  { v: 'flicker', label: 'Flicker', desc: 'a lively campfire dance' },
  { v: 'sparkle', label: 'Sparkle', desc: 'pops of light, unpredictable' },
  { v: 'aurora', label: 'Aurora', desc: 'slow, dreamy breathing' },
]
const SIGILS = ['🏮', '⚾', '🎳', '🎨', '🎮', '🎣', '🧸', '🎸', '📚', '🌵', '🚗', '⭐', '🐾', '🧁', '🏈', '💎']

export default function LanternEditor() {
  const { openSignup } = useSignup()
  const [p, setP] = useState<any>(null)
  const [state, setState] = useState<'loading' | 'anon' | 'ready'>('loading')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/hub/profile').then(async r => {
      if (r.status === 401) { setState('anon'); return }
      const j = await r.json()
      setP(j.profile || {})
      setState('ready')
    }).catch(() => setState('anon'))
  }, [])

  const set = (k: string, v: any) => { setP((prev: any) => ({ ...prev, [k]: v })); setSaved(false) }
  const setFav = (k: string, v: string) => set('favorites', { ...(p?.favorites || {}), [k]: v })
  const setSize = (k: string, v: string) => set('sizes', { ...(p?.sizes || {}), [k]: v })

  const save = async () => {
    await fetch('/api/hub/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
    setSaved(true)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,246,236,0.06)', border: '1px solid rgba(255,246,236,0.14)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: '#FFF6EC' }
  const label: React.CSSProperties = { fontSize: '12px', color: '#C9BFB2', display: 'block', marginBottom: '5px' }
  const hue = p?.lantern_hue ?? 32

  if (state === 'loading') return <div style={{ color: '#C9BFB2' }}>Lighting…</div>
  if (state === 'anon') return (
    <div style={{ textAlign: 'center', padding: '38px 20px', borderRadius: '16px', background: 'rgba(255,246,236,0.05)', border: '1px solid rgba(255,246,236,0.1)' }}>
      <div style={{ fontSize: '30px', marginBottom: '10px' }}>🏮</div>
      <p style={{ fontSize: '16px', color: '#FFF6EC', marginBottom: '6px', fontFamily: 'var(--font-display), serif' }}>Your lantern is waiting</p>
      <p style={{ fontSize: '13px', color: '#C9BFB2', marginBottom: '16px' }}>Sign in and it lights up on the family hearth.</p>
      <button onClick={openSignup} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer', color: '#16213E', background: 'linear-gradient(120deg, #FFD166, #F4A259)' }}>Come in</button>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
      <div style={{ borderRadius: '16px', padding: '20px', background: 'radial-gradient(ellipse at 50% 70%, #2A2438 0%, #12172B 100%)', border: '1px solid rgba(255,246,236,0.1)', textAlign: 'center', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, hsla(${hue},85%,68%,0.85) 0%, hsla(${hue},85%,60%,0) 70%)`, animation: p?.flame_style === 'steady' ? undefined : 'hearthPulse 2.4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#FFF6EC' }} />
          {p?.sigil && <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', fontSize: '18px' }}>{p.sigil}</div>}
        </div>
        <div style={{ marginTop: '12px', fontFamily: 'var(--font-display), serif', fontSize: '18px', color: '#FFF6EC' }}>{p?.display_name || 'You'}</div>
        {p?.status_text && <div style={{ fontSize: '12px', color: '#C9BFB2', marginTop: '3px' }}>{p?.status_emoji ? `${p.status_emoji} ` : ''}{p.status_text}</div>}
        <style>{`@keyframes hearthPulse { 0%,100% { transform: scale(1); opacity: 0.85 } 50% { transform: scale(1.12); opacity: 1 } }`}</style>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
        <div><span style={label}>Your name on the hearth</span><input style={inp} value={p?.display_name || ''} onChange={e => set('display_name', e.target.value)} /></div>
        <div>
          <span style={label}>Flame color — drag to find yours</span>
          <input type="range" min={0} max={360} value={hue} onChange={e => set('lantern_hue', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: `hsl(${hue},85%,65%)` }} aria-label="Lantern flame color" />
        </div>
        <div>
          <span style={label}>Flame style</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FLAMES.map(f => (
              <button key={f.v} onClick={() => set('flame_style', f.v)} title={f.desc} style={{
                padding: '7px 12px', fontSize: '12.5px', borderRadius: '9px', cursor: 'pointer',
                border: `1px solid ${p?.flame_style === f.v ? `hsl(${hue},85%,65%)` : 'rgba(255,246,236,0.15)'}`,
                background: p?.flame_style === f.v ? 'rgba(255,246,236,0.1)' : 'transparent', color: '#FFF6EC',
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div>
          <span style={label}>Your sigil — the mark on your lantern</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {SIGILS.map(s => (
              <button key={s} onClick={() => set('sigil', s)} style={{ fontSize: '18px', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', border: p?.sigil === s ? `1px solid hsl(${hue},85%,65%)` : '1px solid transparent', background: p?.sigil === s ? 'rgba(255,246,236,0.1)' : 'transparent' }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: '8px' }}>
          <input style={inp} placeholder="👋" value={p?.status_emoji || ''} onChange={e => set('status_emoji', e.target.value)} aria-label="Status emoji" />
          <input style={inp} placeholder="what's your status? (on my way, at the lake…)" value={p?.status_text || ''} onChange={e => set('status_text', e.target.value)} />
        </div>
        <div><span style={label}>Birthday (fuels the gold flare 🎂)</span><input type="date" style={inp} value={p?.birthday || ''} onChange={e => set('birthday', e.target.value)} /></div>
        <div><span style={label}>Your story — who you are, in your words</span><textarea style={{ ...inp, resize: 'vertical' }} rows={3} value={p?.story || ''} onChange={e => set('story', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><span style={label}>Favorite food</span><input style={inp} value={p?.favorites?.food || ''} onChange={e => setFav('food', e.target.value)} /></div>
          <div><span style={label}>Favorite team/hobby</span><input style={inp} value={p?.favorites?.hobby || ''} onChange={e => setFav('hobby', e.target.value)} /></div>
          <div><span style={label}>Shirt size</span><input style={inp} value={p?.sizes?.shirt || ''} onChange={e => setSize('shirt', e.target.value)} /></div>
          <div><span style={label}>Shoe size</span><input style={inp} value={p?.sizes?.shoe || ''} onChange={e => setSize('shoe', e.target.value)} /></div>
        </div>
        <div><span style={label}>Allergies (so gatherings stay safe)</span><input style={inp} value={p?.allergies || ''} onChange={e => set('allergies', e.target.value)} /></div>
        <button onClick={save} style={{ padding: '12px', fontSize: '15px', fontWeight: 600, borderRadius: '11px', border: 'none', cursor: 'pointer', color: '#16213E', background: saved ? '#84A98C' : 'linear-gradient(120deg, #FFD166, #F4A259)' }}>
          {saved ? '✓ Your lantern is glowing' : 'Light it up'}
        </button>
      </div>
    </div>
  )
}
