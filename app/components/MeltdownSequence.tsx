'use client'

import { useState, useEffect } from 'react'

type Phase = 'flash' | 'reveal' | 'done'

export default function MeltdownSequence({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    if (!active) return

    // Once per session
    if (sessionStorage.getItem('fliply-melted')) {
      onComplete()
      return
    }
    sessionStorage.setItem('fliply-melted', 'true')

    setPhase('flash')
    setTimeout(() => setPhase('reveal'), 600)
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 5000)
  }, [active, onComplete])

  if (!phase || phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[300]" onClick={() => {
      setPhase('done')
      onComplete()
    }}>
      {/* Brief flash */}
      {phase === 'flash' && (
        <div className="fixed inset-0" style={{
          animation: 'meltdownFlash 0.6s ease-out',
          background: '#000',
        }} />
      )}

      {/* The reveal */}
      {phase === 'reveal' && (
        <div className="fixed inset-0 flex items-center justify-center cursor-pointer" style={{
          background: '#000',
        }}>
          <div className="text-center px-8">
            <p className="text-5xl mb-6">🦞</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: 'var(--lime)',
            }}>
              Deals just dropped.
            </h2>
            <p className="text-base mb-4" style={{
              fontFamily: 'system-ui, sans-serif',
              color: '#888',
            }}>
              New listings are live. Go find something good.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--hotpink)', fontWeight: 600 }}>
              Sign up to get them in your inbox every Thursday.
            </p>
            <p className="text-xs" style={{ color: '#333' }}>
              click anywhere to continue
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes meltdownFlash {
          0% { background: white; }
          50% { background: var(--lime); }
          100% { background: black; }
        }
      `}</style>
    </div>
  )
}
