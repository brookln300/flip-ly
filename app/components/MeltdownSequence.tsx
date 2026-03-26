'use client'

import { useState, useEffect } from 'react'

type Phase = 'flash' | 'glitch' | 'bsod' | 'reveal' | 'done'

export default function MeltdownSequence({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    if (!active) return

    // Check if already triggered this session
    if (sessionStorage.getItem('fliply-melted')) {
      onComplete()
      return
    }
    sessionStorage.setItem('fliply-melted', 'true')

    // Phase sequence
    setPhase('flash')
    setTimeout(() => setPhase('glitch'), 800)
    setTimeout(() => setPhase('bsod'), 2000)
    setTimeout(() => setPhase('reveal'), 5000)
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 8000)
  }, [active, onComplete])

  if (!phase || phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[300]" onClick={() => {
      if (phase === 'bsod' || phase === 'reveal') {
        setPhase('done')
        onComplete()
      }
    }}>
      {/* PHASE 1: Flash — white → red → lime */}
      {phase === 'flash' && (
        <div className="fixed inset-0" style={{
          animation: 'meltdownFlash 0.8s ease-out',
          background: 'white',
        }} />
      )}

      {/* PHASE 2: Glitch intensify */}
      {phase === 'glitch' && (
        <div className="fixed inset-0 flex items-center justify-center" style={{
          background: '#000',
        }}>
          <div className="text-center jitter">
            <p className="text-4xl md:text-6xl font-bold mb-4" style={{
              fontFamily: '"Comic Sans MS", cursive',
              color: 'var(--hotpink)',
              textShadow: '0 0 20px var(--hotpink), 4px 4px 0 var(--lime), -4px -4px 0 var(--neon-orange)',
            }}>
              ⚠️ SYSTEM MELTDOWN ⚠️
            </p>
            <p className="text-xl" style={{
              fontFamily: '"Courier New", monospace',
              color: 'var(--neon-orange)',
              textShadow: '0 0 10px var(--neon-orange)',
            }}>
              Y2K BUG HAS BEEN ACTIVATED
            </p>
            <p className="text-sm mt-4 blink" style={{ color: 'var(--mustard)' }}>
              ALL DATA WILL BE CORRUPTED IN 3... 2... 1...
            </p>

            {/* Confetti: price tags and floppy disks */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className="absolute text-2xl" style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animation: `confettiFall ${1 + Math.random() * 2}s linear ${Math.random() * 1}s forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}>
                  {['💾', '🏷️', '💰', '🦞', '📀', '💣', '🔥', '⚡'][Math.floor(Math.random() * 8)]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: BSOD */}
      {phase === 'bsod' && (
        <div className="fixed inset-0 flex items-start p-8 md:p-16 cursor-pointer" style={{
          background: '#0000AA',
          fontFamily: '"Lucida Console", "Courier New", monospace',
          fontSize: '14px',
          color: '#AAAAAA',
        }}>
          <div className="max-w-2xl">
            <p className="mb-6" style={{ color: '#fff', background: '#AA0000', display: 'inline-block', padding: '2px 12px' }}>
              Windows
            </p>
            <p className="mb-4" style={{ color: '#fff' }}>
              A fatal exception Y2K has occurred at 1999:DEC31:23:59:59
              in VxD FLIPLY(01). The millennium bug has consumed all garage sale data.
            </p>
            <p className="mb-4">
              * Press any key to accept that the internet peaked in 1999
            </p>
            <p className="mb-4">
              * Or just click anywhere, this is fake
            </p>
            <p className="mb-6" style={{ color: '#fff' }}>
              STOP: 0xY2K00000 (MILLENNIUM_BUG_CRITICAL)
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              BARGAIN.SYS — Address 0xDEADDEAL — DateStamp 19991231
            </p>
            <p className="mt-4 blink" style={{ color: '#fff' }}>
              Click anywhere to continue_█
            </p>
          </div>
        </div>
      )}

      {/* PHASE 4: The reveal — "Just kidding" */}
      {phase === 'reveal' && (
        <div className="fixed inset-0 flex items-center justify-center cursor-pointer" style={{
          background: '#000',
        }}>
          <div className="text-center px-8">
            <p className="text-6xl mb-6">🦞</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{
              fontFamily: '"Comic Sans MS", cursive',
              color: 'var(--lime)',
              textShadow: '0 0 20px var(--lime)',
            }}>
              JUST KIDDING.
            </h2>
            <p className="text-xl mb-4" style={{
              fontFamily: '"Courier New", monospace',
              color: 'var(--mustard)',
            }}>
              The world didn&apos;t end. But this website is still here.
            </p>
            <p className="text-base mb-6" style={{ color: 'var(--hotpink)' }}>
              Sign up anyway. You&apos;ve earned it.
            </p>
            <p className="text-xs blink" style={{ color: '#555' }}>
              (click anywhere to return to the chaos)
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes meltdownFlash {
          0% { background: white; }
          25% { background: red; }
          50% { background: #0FFF50; }
          75% { background: #FF10F0; }
          100% { background: black; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
