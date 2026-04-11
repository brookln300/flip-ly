'use client'

import { useState, lazy, Suspense } from 'react'

const FlipShell = lazy(() => import('./FlipShell'))

/**
 * ShellTrigger — wraps a hidden pixel that opens the FlipShell terminal.
 *
 * Two variants:
 *  - "modern" (main landing page): transparent 5px dot in footer area, faint green glow on hover
 *  - "retro" (90s page): disguised as part of the visitor counter, pixel hidden in the digit display
 *
 * The FlipShell component is lazy-loaded so it doesn't bloat the initial bundle.
 */
export default function ShellTrigger({ variant = 'modern' }: { variant?: 'modern' | 'retro' }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* The hidden pixel trigger */}
      {variant === 'modern' ? (
        <div
          onClick={() => setIsOpen(true)}
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '38%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'transparent',
            cursor: 'default',
            zIndex: 50,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(51, 255, 51, 0.15)'
            e.currentTarget.style.boxShadow = '0 0 4px rgba(51, 255, 51, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
          title=""
        />
      ) : (
        /* Retro variant: tiny pixel hidden near the visitor counter */
        <span
          onClick={() => setIsOpen(true)}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '3px',
            height: '3px',
            background: '#0FFF50',
            opacity: 0.08,
            borderRadius: '50%',
            cursor: 'default',
            verticalAlign: 'middle',
            marginLeft: '2px',
            transition: 'opacity 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.3' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.08' }}
        />
      )}

      {/* Lazy-loaded terminal overlay */}
      {isOpen && (
        <Suspense fallback={null}>
          <FlipShell isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
