'use client'

import { useState, useEffect, useCallback } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Y2K panic warnings
const PANIC_MESSAGES = [
  '⚠️ Y2K BUG DETECTED IN SECTOR 7',
  '🚨 MILLENNIUM BUG INCOMING!',
  '💾 SYSTEM CLOCK MALFUNCTION',
  '⚡ THE COMPUTERS ARE TAKING OVER!',
  '🔥 flip-ly.net will survive... maybe',
  '📡 SATELLITE LINK LOST (just kidding)',
  '💣 CRITICAL: Date overflow imminent',
  '🦞 LOBSTER CONTAINMENT BREACH',
]

const HEADLINES = [
  '"Y2K Chaos Predicted!" — NY Times',
  '"Millions Stockpile Canned Goods" — CNN',
  '"Is Your Toaster Y2K Compliant?" — Wired',
  'GARAGE SALE: $5 VINTAGE LAMP',
  '"Banks May Lose All Records" — WSJ',
  'ESTATE SALE: EVERYTHING MUST GO',
  '"Internet Could Collapse at Midnight"',
  'YARD SALE: SAT 7AM NO EARLY BIRDS',
]

export default function Y2KCountdown({ onMeltdown }: { onMeltdown: () => void }) {
  // Count down to a time 2-3 minutes from page load (so users actually see the meltdown)
  const [targetTime] = useState(() => Date.now() + (2 * 60 + 30) * 1000) // 2.5 minutes
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 2, seconds: 30 })
  const [paused, setPaused] = useState(false)
  const [melted, setMelted] = useState(false)
  const [panicMsg, setPanicMsg] = useState('')
  const [headline, setHeadline] = useState('')
  const [showPanic, setShowPanic] = useState(false)
  const [showHeadline, setShowHeadline] = useState(false)

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
        days: 0,
        hours: 0,
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [paused, melted, targetTime, onMeltdown])

  // Random panic messages
  useEffect(() => {
    if (melted) return
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setPanicMsg(PANIC_MESSAGES[Math.floor(Math.random() * PANIC_MESSAGES.length)])
        setShowPanic(true)
        setTimeout(() => setShowPanic(false), 3000)
      }
    }, 8000)
    // First panic after 5 seconds
    const first = setTimeout(() => {
      setPanicMsg(PANIC_MESSAGES[0])
      setShowPanic(true)
      setTimeout(() => setShowPanic(false), 3000)
    }, 5000)
    return () => { clearInterval(interval); clearTimeout(first) }
  }, [melted])

  // Floating headlines
  useEffect(() => {
    if (melted) return
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)])
        setShowHeadline(true)
        setTimeout(() => setShowHeadline(false), 4000)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [melted])

  if (melted) return null

  return (
    <>
      {/* Main countdown display */}
      <div className="text-center py-6 px-4 relative" style={{
        background: 'linear-gradient(180deg, rgba(255,0,0,0.08), transparent)',
        borderBottom: '3px solid var(--neon-orange)',
      }}>
        <p className="text-xs mb-2 blink" style={{
          color: 'var(--neon-orange)',
          fontFamily: '"Comic Sans MS", cursive',
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}>
          ⚠ Y2K TOTAL WEBSITE MELTDOWN IN ⚠
        </p>

        {/* Big countdown numbers */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[
            { v: timeLeft.minutes, l: 'MIN' },
            { v: timeLeft.seconds, l: 'SEC' },
          ].map((block, i) => (
            <div key={block.l} className="flex items-center gap-2">
              {i > 0 && <span className="text-3xl font-bold blink" style={{ color: 'var(--neon-orange)' }}>:</span>}
              <div className="text-center">
                <div className="px-4 py-2" style={{
                  background: '#000',
                  border: '3px ridge var(--neon-orange)',
                  boxShadow: '0 0 12px rgba(255, 102, 0, 0.3), inset 0 0 8px rgba(255, 0, 0, 0.1)',
                  minWidth: '70px',
                }}>
                  <span className="text-4xl font-bold" style={{
                    fontFamily: '"Comic Sans MS", cursive',
                    color: timeLeft.minutes === 0 && timeLeft.seconds < 30 ? 'var(--hotpink)' : 'var(--neon-orange)',
                    textShadow: `0 0 10px ${timeLeft.minutes === 0 && timeLeft.seconds < 30 ? 'var(--hotpink)' : 'var(--neon-orange)'}`,
                    animation: timeLeft.minutes === 0 && timeLeft.seconds < 10 ? 'blink 0.5s step-end infinite' : 'none',
                  }}>
                    {String(block.v).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[9px] mt-1 block" style={{
                  color: '#666', fontFamily: 'monospace', letterSpacing: '2px',
                }}>
                  {block.l}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs mb-3" style={{ color: '#555', fontFamily: 'monospace' }}>
          {timeLeft.minutes === 0 && timeLeft.seconds < 30
            ? '🚨 CRITICAL: MELTDOWN IMMINENT 🚨'
            : 'counting down to total chaos since 1999'
          }
        </p>

        {/* Stop the Countdown button */}
        <button
          onClick={() => setPaused(!paused)}
          className="px-4 py-1.5 text-[10px] font-bold"
          style={{
            background: paused ? 'var(--lime)' : '#222',
            color: paused ? '#000' : '#888',
            border: `1px solid ${paused ? 'var(--lime)' : '#444'}`,
            fontFamily: 'Tahoma, sans-serif',
            cursor: 'pointer',
          }}
        >
          {paused ? '▶ RESUME COUNTDOWN' : '⏸ STOP THE COUNTDOWN'}
        </button>
        {paused && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--lime)' }}>
            You stopped the countdown. The chaos waits for no one.
          </p>
        )}
      </div>

      {/* Y2K panic banner — random popup */}
      {showPanic && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[45] px-6 py-3 fall-in" style={{
          background: 'rgba(255, 0, 0, 0.9)',
          border: '3px solid var(--mustard)',
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.4)',
          fontFamily: '"Comic Sans MS", cursive',
          maxWidth: '90vw',
        }}>
          <p className="text-sm font-bold text-center" style={{ color: '#fff' }}>
            {panicMsg}
          </p>
        </div>
      )}

      {/* Floating newspaper headline */}
      {showHeadline && (
        <div className="fixed z-[35] fall-in" style={{
          top: `${Math.random() * 40 + 20}%`,
          left: `${Math.random() * 50 + 10}%`,
          background: '#FFFFF0',
          border: '1px solid #999',
          padding: '6px 12px',
          transform: `rotate(${Math.random() * 8 - 4}deg)`,
          boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
          maxWidth: '250px',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontFamily: '"Times New Roman", serif',
            fontSize: '11px',
            color: '#333',
            fontStyle: 'italic',
          }}>
            {headline}
          </p>
        </div>
      )}
    </>
  )
}
