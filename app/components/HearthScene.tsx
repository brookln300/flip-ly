'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The Hearth — the hub's signature living scene (Canvas 2D, phone-first).
 * A warm hearth at center = the family. Lanterns drift around it, one per
 * member, clustered by household: hue/flame/sigil are each person's own
 * "touch" (from their profile), glow follows real activity, birthdays flare
 * gold, statuses whisper under names. Tap a lantern → their card in /family.
 * prefers-reduced-motion → a single beautiful still. WebGL is the earned
 * upgrade later; the wow here is liveness, not geometry.
 */
export interface LanternMember {
  email: string
  display_name: string | null
  sigil: string | null
  lantern_hue: number | null
  flame_style: string | null
  status_text: string | null
  status_emoji: string | null
  household: string | null
  activity: number
  isBirthday: boolean
}

export default function HearthScene({ members }: { members: LanternMember[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<any[]>([])
  const [hovered, setHovered] = useState<LanternMember | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0, H = 0, raf = 0

    const households = Array.from(new Set(members.map(m => m.household || 'family')))
    const nodes = members.map((m, i) => {
      const ci = households.indexOf(m.household || 'family')
      const cx = households.length === 1 ? 0.5 : 0.18 + (ci / Math.max(1, households.length - 1)) * 0.64
      return {
        m, hue: m.lantern_hue ?? 32,
        bx: cx + (Math.random() - 0.5) * 0.2,
        by: 0.3 + (Math.random() - 0.5) * 0.22 + (i % 3) * 0.05,
        ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.4,
        px: 0, py: 0, ci,
      }
    })
    nodesRef.current = nodes

    function size() {
      W = wrap!.clientWidth; H = wrap!.clientHeight
      canvas!.width = W * dpr; canvas!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    const onResize = () => size()
    window.addEventListener('resize', onResize)

    function flameJitter(style: string | null, t: number, ph: number) {
      if (reduced) return 0
      if (style === 'flicker') return Math.sin(t / 90 + ph) * 2.5 + Math.sin(t / 37 + ph * 2) * 1.5
      if (style === 'sparkle') return Math.random() < 0.06 ? 6 : 0
      if (style === 'aurora') return Math.sin(t / 600 + ph) * 4
      return Math.sin(t / 800 + ph) * 1.2
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H)
      const hx = W * 0.5, hy = H * 0.76
      const pulse = reduced ? 1 : 1 + 0.06 * Math.sin(t / 900)
      const g = ctx!.createRadialGradient(hx, hy, 0, hx, hy, Math.min(W, 340) * 0.45 * pulse)
      g.addColorStop(0, 'rgba(255,209,102,0.8)'); g.addColorStop(0.25, 'rgba(244,162,89,0.45)')
      g.addColorStop(0.6, 'rgba(231,111,81,0.16)'); g.addColorStop(1, 'rgba(231,111,81,0)')
      ctx!.fillStyle = g
      ctx!.beginPath(); ctx!.arc(hx, hy, Math.min(W, 340) * 0.45 * pulse, 0, 6.29); ctx!.fill()
      ctx!.fillStyle = '#FFF1D6'
      ctx!.beginPath(); ctx!.arc(hx, hy, 9 + (reduced ? 0 : 2 * Math.sin(t / 500)), 0, 6.29); ctx!.fill()

      if (!reduced) {
        for (let e = 0; e < 6; e++) {
          const et = ((t / 38) + e * 71) % (H * 0.55)
          const ex = hx + Math.sin((t / 700) + e * 2.1) * (12 + e * 8), ey = hy - 26 - et
          ctx!.fillStyle = `rgba(255,209,102,${Math.max(0, 1 - et / (H * 0.55)) * 0.45})`
          ctx!.beginPath(); ctx!.arc(ex, ey, 1.5, 0, 6.29); ctx!.fill()
        }
      }

      ctx!.lineWidth = 1
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
        if (nodes[a].ci === nodes[b].ci) {
          ctx!.strokeStyle = 'rgba(255,214,166,0.10)'
          ctx!.beginPath(); ctx!.moveTo(nodes[a].px, nodes[a].py); ctx!.lineTo(nodes[b].px, nodes[b].py); ctx!.stroke()
        }
      }

      for (const n of nodes) {
        const dx = reduced ? 0 : Math.sin(t / 1400 * n.sp + n.ph) * 11
        const dy = reduced ? 0 : Math.cos(t / 1700 * n.sp + n.ph) * 8
        n.px = n.bx * W + dx; n.py = n.by * H + dy
        const act = n.m.activity
        const jit = flameJitter(n.m.flame_style, t, n.ph)
        const glowR = 15 + act * 15 + (n.m.isBirthday && !reduced ? 6 * Math.sin(t / 300) : 0) + jit
        const hue = n.m.isBirthday ? 45 : n.hue
        const gg = ctx!.createRadialGradient(n.px, n.py, 0, n.px, n.py, Math.max(8, glowR))
        gg.addColorStop(0, `hsla(${hue}, 85%, 68%, 0.9)`)
        gg.addColorStop(1, `hsla(${hue}, 85%, 60%, 0)`)
        ctx!.fillStyle = gg
        ctx!.beginPath(); ctx!.arc(n.px, n.py, Math.max(8, glowR), 0, 6.29); ctx!.fill()
        ctx!.globalAlpha = 0.35 + act * 0.65
        ctx!.fillStyle = n.m.isBirthday ? '#FFE9B0' : '#FFF6EC'
        ctx!.beginPath(); ctx!.arc(n.px, n.py, 4, 0, 6.29); ctx!.fill()
        ctx!.globalAlpha = 1
        if (n.m.isBirthday) {
          ctx!.strokeStyle = 'rgba(255,209,102,0.75)'
          for (let r = 0; r < 4; r++) {
            const an = r * 1.57 + (reduced ? 0.4 : t / 1200)
            ctx!.beginPath()
            ctx!.moveTo(n.px + Math.cos(an) * 9, n.py + Math.sin(an) * 9)
            ctx!.lineTo(n.px + Math.cos(an) * 15, n.py + Math.sin(an) * 15)
            ctx!.stroke()
          }
        }
        if (n.m.sigil) { ctx!.font = '11px system-ui'; ctx!.textAlign = 'center'; ctx!.fillText(n.m.sigil, n.px, n.py - 12) }
        ctx!.fillStyle = 'rgba(255,246,236,0.75)'; ctx!.font = '11.5px system-ui'; ctx!.textAlign = 'center'
        ctx!.fillText(n.m.display_name || n.m.email.split('@')[0], n.px, n.py + 22)
        if (n.m.status_emoji) { ctx!.font = '10px system-ui'; ctx!.fillText(n.m.status_emoji, n.px, n.py + 35) }
      }
    }

    if (reduced) { for (const n of nodes) { n.px = n.bx * W; n.py = n.by * H } ; draw(0) }
    else { const loop = (ts: number) => { draw(ts); raf = requestAnimationFrame(loop) }; raf = requestAnimationFrame(loop) }

    const pick = (x: number, y: number) => {
      const r = canvas!.getBoundingClientRect()
      const cx = x - r.left, cy = y - r.top
      let best: any = null, bd = 32
      for (const n of nodes) { const d = Math.hypot(n.px - cx, n.py - cy); if (d < bd) { bd = d; best = n } }
      return best
    }
    const onMove = (e: MouseEvent) => setHovered(pick(e.clientX, e.clientY)?.m || null)
    const onClick = (e: MouseEvent) => { const hit = pick(e.clientX, e.clientY); if (hit) window.location.href = `/family#${encodeURIComponent(hit.m.email)}` }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [members])

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: 'min(58vh, 470px)', minHeight: '320px', borderRadius: '18px', overflow: 'hidden', background: 'radial-gradient(ellipse 90% 70% at 50% 80%, #2A2438 0%, #1B2138 45%, #12172B 100%)', border: '1px solid rgba(255,246,236,0.08)' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} role="img" aria-label="The family hearth: a warm glow surrounded by one drifting lantern per family member. Tap a lantern to visit that person." />
      {hovered && (
        <div style={{ position: 'absolute', top: '14px', right: '14px', maxWidth: '240px', padding: '10px 13px', borderRadius: '12px', background: 'rgba(18,23,43,0.85)', border: '1px solid rgba(255,246,236,0.14)', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFF6EC' }}>{hovered.sigil ? `${hovered.sigil} ` : ''}{hovered.display_name || hovered.email.split('@')[0]}{hovered.isBirthday ? ' 🎂' : ''}</div>
          {hovered.status_text && <div style={{ fontSize: '12px', color: '#C9BFB2', marginTop: '3px' }}>{hovered.status_emoji ? `${hovered.status_emoji} ` : ''}{hovered.status_text}</div>}
          <div style={{ fontSize: '11px', color: 'rgba(201,191,178,0.7)', marginTop: '4px' }}>tap to visit</div>
        </div>
      )}
    </div>
  )
}
