'use client'

import { useEffect } from 'react'

const NEON_COLORS = [
  '#FF10F0', // neon pink
  '#0FFF50', // neon green
  '#00FFFF', // cyan
  '#FFB81C', // amber
  '#FF3131', // red
  '#FFFFFF', // white
  '#BF5FFF', // purple
  '#00BFFF', // deep sky blue
  '#FFFF00', // yellow
]

const SPARKLE_CHARS = ['✦', '★', '✶', '✸', '✺', '⋆', '✷', '✹']

export default function SparkleTrail() {
  useEffect(() => {
    let lastSpawn = 0

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      // Throttle: max 1 sparkle per 50ms
      if (now - lastSpawn < 50) return
      lastSpawn = now

      const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
      const char  = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)]
      const size  = Math.random() * 14 + 10  // 10–24px
      const angle = Math.random() * 360       // random initial rotation

      // Drift direction — random spread around cursor
      const driftX = (Math.random() - 0.5) * 30  // ±15px horizontal
      const driftY = Math.random() * 20 + 10       // 10–30px downward

      const el = document.createElement('span')
      el.textContent = char
      el.setAttribute('aria-hidden', 'true')

      Object.assign(el.style, {
        position:      'fixed',
        left:          `${e.clientX}px`,
        top:           `${e.clientY}px`,
        fontSize:      `${size}px`,
        color:         color,
        textShadow:    `0 0 6px ${color}, 0 0 12px ${color}`,
        pointerEvents: 'none',
        zIndex:        '99998',
        userSelect:    'none',
        transform:     `translate(-50%, -50%) rotate(${angle}deg) scale(0)`,
        transition:    'none',
        willChange:    'transform, opacity',
        lineHeight:    '1',
        fontStyle:     'normal',
      })

      document.body.appendChild(el)

      // Force reflow so the starting transform is applied before animation
      el.getBoundingClientRect()

      // Animate: pop in, then drift + fade out
      el.animate(
        [
          {
            transform: `translate(-50%, -50%) rotate(${angle}deg) scale(0)`,
            opacity: 1,
          },
          {
            transform: `translate(calc(-50% + ${driftX * 0.3}px), calc(-50% - 4px)) rotate(${angle + 30}deg) scale(1.2)`,
            opacity: 1,
            offset: 0.15,
          },
          {
            transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${angle + 90}deg) scale(0.4)`,
            opacity: 0,
          },
        ],
        {
          duration: 600,
          easing: 'ease-out',
          fill: 'forwards',
        }
      ).finished.then(() => {
        el.remove()
      }).catch(() => {
        // Element may already be removed (e.g. fast navigation)
        try { el.remove() } catch { /* noop */ }
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return null
}
