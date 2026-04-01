'use client'

import { useState, useEffect } from 'react'

interface TimeLeft {
  minutes: number
  seconds: number
}

// Playful deal-hunt messages
const DEAL_TIPS = [
  'Pro tip: The best deals go before 8 AM',
  'Estate sales > garage sales for margins',
  'Always check the back table first',
  'Mid-century furniture = instant profit',
  'Never lowball at the first hour',
  'Facebook Marketplace moves fast — we move faster',
  'Thursday noon. Your inbox. Be ready.',
  'The early bird gets the $3 lamp',
]

export default function Y2KCountdown({ onMeltdown }: { onMeltdown: () => void }) {
  const [targetTime] = useState(() => Date.now() + (2 * 60 + 30) * 1000)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ minutes: 2, seconds: 30 })
  const [paused, setPaused] = useState(false)
  const [melted, setMelted] = useState(false)
  const [tip, setTip] = useState('')
  const [showTip, setShowTip] = useState(false)

  // Countdown logic
  useEffect(() => {
    if (paused || melted) return
    const interval = setInterval(() => {
      const diff = Math.max(0, targetTime - Date.now())
      if (diff <= 0) {
        setMelted(true)
        onMeltdown()
        clearInterval(interval)
        return
      }
      setTimeLeft({
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [paused, melted, targetTime, onMeltdown])

  // Random deal tips
  useEffect(() => {
    if (melted) return
    const interval = setInterval(() => {
      setTip(DEAL_TIPS[Math.floor(Math.random() * DEAL_TIPS.length)])
      setShowTip(true)
      setTimeout(() => setShowTip(false), 4000)
    }, 12000)
    const first = setTimeout(() => {
      setTip(DEAL_TIPS[0])
      setShowTip(true)
      setTimeout(() => setShowTip(false), 4000)
    }, 6000)
    return () => { clearInterval(interval); clearTimeout(first) }
  }, [melted])

  if (melted) return null

  const urgent = timeLeft.minutes === 0 && timeLeft.seconds < 30

  return (
    <>
      {/* Countdown bar */}
      <div className="text-center py-4 px-4" style={{
        background: urgent ? 'rgba(255,16,240,0.05)' : 'rgba(0,255,80,0.03)',
        borderBottom: `1px solid ${urgent ? 'var(--hotpink)' : '#222'}`,
      }}>
        <p className="text-xs mb-2" style={{
          color: urgent ? 'var(--hotpink)' : '#666',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {urgent ? 'Deals dropping soon' : 'Next deal drop in'}
        </p>

        {/* Countdown numbers */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {[
            { v: timeLeft.minutes, l: 'MIN' },
            { v: timeLeft.seconds, l: 'SEC' },
          ].map((block, i) => (
            <div key={block.l} className="flex items-center gap-3">
              {i > 0 && <span className="text-2xl font-bold" style={{ color: urgent ? 'var(--hotpink)' : '#333' }}>:</span>}
              <div className="text-center">
                <div className="px-4 py-2" style={{
                  background: '#0a0a0a',
                  border: `1px solid ${urgent ? 'var(--hotpink)' : '#333'}`,
                  borderRadius: '6px',
                  minWidth: '64px',
                }}>
                  <span className="text-3xl font-bold" style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: urgent ? 'var(--hotpink)' : 'var(--lime)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {String(block.v).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[9px] mt-1 block" style={{
                  color: '#555', fontFamily: 'system-ui, sans-serif', letterSpacing: '2px',
                }}>
                  {block.l}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPaused(!paused)}
          className="px-3 py-1 text-[10px] font-medium"
          style={{
            background: 'transparent',
            color: paused ? 'var(--lime)' : '#555',
            border: `1px solid ${paused ? 'var(--lime)' : '#333'}`,
            borderRadius: '4px',
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
          }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Floating deal tip */}
      {showTip && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[45] px-5 py-2.5 fall-in" style={{
          background: '#111',
          border: '1px solid var(--lime)',
          borderRadius: '6px',
          maxWidth: '90vw',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <p className="text-xs font-medium text-center" style={{
            color: 'var(--lime)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            💡 {tip}
          </p>
        </div>
      )}
    </>
  )
}
