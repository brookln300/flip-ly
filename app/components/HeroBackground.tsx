'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const slides = [
  { src: '/hero-bg.png', label: 'Garage Sales' },
  { src: '/hero-bg-2.png', label: 'Estate Sales' },
  { src: '/hero-bg-3.png', label: 'Flea Markets' },
]

const CYCLE_MS = 6000

export default function HeroBackground() {
  const [active, setActive] = useState(0)
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set([0]))
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const rafRef = useRef<number>(0)

  // Auto-cycle slides
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % slides.length
        setLoadedSlides(s => new Set(s).add(next))
        return next
      })
    }, CYCLE_MS)
    return () => clearInterval(timerRef.current)
  }, [])

  // Preload next slide 2s before transition
  useEffect(() => {
    const nextIdx = (active + 1) % slides.length
    const preloadTimer = setTimeout(() => {
      setLoadedSlides(s => new Set(s).add(nextIdx))
    }, CYCLE_MS - 2000)
    return () => clearTimeout(preloadTimer)
  }, [active])

  // Hover parallax — throttled with rAF
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    if (rafRef.current) return // skip if a frame is already pending
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      setOffset({ x: x * -12, y: y * -8 })
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}
    >
      {slides.map((slide, i) => (
        loadedSlides.has(i) ? (
          <div
            key={slide.src}
            style={{
              position: 'absolute',
              inset: '-20px',
              backgroundImage: `url(${slide.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
              opacity: i === active ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out, transform 0.4s ease-out',
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              willChange: 'opacity, transform',
            }}
          />
        ) : <div key={slide.src} style={{ position: 'absolute', inset: '-20px' }} />
      ))}

      {/* Gradient overlay for text readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'var(--hero-gradient)',
      }} />
      {/* Mobile overlay — stronger for readability */}
      <div className="hero-mobile-overlay" style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'var(--hero-mobile-overlay)',
        display: 'none',
      }} />

      {/* Slide indicator dots + label */}
      <div style={{
        position: 'absolute', bottom: '20px', right: '24px', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          letterSpacing: '0.04em',
          transition: 'opacity 0.4s',
        }}>
          {slides[active].label}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActive(i)
                setLoadedSlides(s => new Set(s).add(i))
                clearInterval(timerRef.current)
                timerRef.current = setInterval(() => setActive(prev => (prev + 1) % slides.length), CYCLE_MS)
              }}
              aria-label={`Show ${slides[i].label}`}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                minHeight: 'auto',
              }}
            >
              <span style={{
                width: i === active ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                display: 'block',
              }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
