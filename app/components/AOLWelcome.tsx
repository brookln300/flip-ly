'use client'

import { useState, useEffect } from 'react'

export default function AOLWelcome() {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'welcome' | 'mail' | 'done'>('idle')

  // Trigger once after 6 seconds (after modem screech would finish)
  useEffect(() => {
    const t = setTimeout(() => setPhase('connecting'), 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'connecting') {
      setTimeout(() => setPhase('welcome'), 2500)
    }
    if (phase === 'welcome') {
      setTimeout(() => setPhase('mail'), 2000)
    }
    if (phase === 'mail') {
      setTimeout(() => setPhase('done'), 4000)
    }
  }, [phase])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none">
      {/* Connection phase */}
      {phase === 'connecting' && (
        <div className="win98-window pointer-events-auto" style={{ width: '340px', transform: 'rotate(-1deg)' }}>
          <div className="win98-titlebar" style={{ background: 'linear-gradient(90deg, #000080, #4040c0)' }}>
            <div className="flex items-center gap-2">
              <span>📡</span>
              <span className="win98-titlebar-text">AOL 5.0 — Connecting</span>
            </div>
          </div>
          <div className="win98-body text-center py-6">
            <div className="text-4xl mb-3">🌐</div>
            <p className="text-sm font-bold mb-2" style={{ fontFamily: 'Tahoma, sans-serif' }}>
              Connecting to AOL...
            </p>
            <div className="mx-auto" style={{ width: '200px', height: '16px', background: '#ddd', border: '1px inset #999' }}>
              <div className="h-full" style={{
                width: '100%',
                background: 'linear-gradient(90deg, #000080, #4040c0)',
                animation: 'shimmer 1s ease-in-out infinite',
              }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#666' }}>
              Dialing access number... 📞
            </p>
          </div>
        </div>
      )}

      {/* Welcome phase */}
      {phase === 'welcome' && (
        <div className="text-center pointer-events-auto" style={{
          animation: 'fallIn 0.5s ease-out',
        }}>
          <div className="inline-block px-12 py-10 rounded-lg" style={{
            background: 'rgba(0, 0, 128, 0.95)',
            border: '4px solid #4040c0',
            boxShadow: '0 0 60px rgba(0, 0, 128, 0.5), 0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <p className="text-5xl mb-4">📬</p>
            <p className="text-3xl font-bold mb-2" style={{
              color: '#FFB81C',
              fontFamily: '"Comic Sans MS", cursive',
              textShadow: '2px 2px 0 #000',
            }}>
              Welcome!
            </p>
            <p className="text-lg" style={{
              color: '#fff',
              fontFamily: 'Tahoma, sans-serif',
            }}>
              Connected to flip-ly.net
            </p>
          </div>
        </div>
      )}

      {/* You've Got Mail! phase */}
      {phase === 'mail' && (
        <div className="text-center pointer-events-auto" style={{
          animation: 'fallIn 0.3s ease-out',
        }}>
          <div className="inline-block px-16 py-12 rounded-lg" style={{
            background: 'rgba(0, 0, 128, 0.95)',
            border: '4px solid #FFB81C',
            boxShadow: '0 0 80px rgba(255, 184, 28, 0.3), 0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <p className="text-6xl mb-4 blink">📧</p>
            <p className="text-4xl font-bold mb-3" style={{
              color: '#FFB81C',
              fontFamily: '"Comic Sans MS", cursive',
              textShadow: '3px 3px 0 #000',
            }}>
              You&apos;ve Got Deals!
            </p>
            <p className="text-base" style={{
              color: '#ccc',
              fontFamily: 'Tahoma, sans-serif',
            }}>
              6 new garage sales found near you
            </p>
            <p className="text-xs mt-3" style={{ color: '#888' }}>
              (this message will self-destruct in 3 seconds)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
