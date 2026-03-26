'use client'

import { useState, useEffect } from 'react'

const MEME_SLIDES = [
  { text: 'DEAL WITH IT 😎', color: '#0FFF50' },
  { text: 'GARAGE SALE CAM', color: '#FF10F0' },
  { text: '🕺 Saturday 7 AM vibes', color: '#FFB81C' },
  { text: 'ur table is $5 bruh', color: '#9D4EDD' },
  { text: '📦 FREE STUFF (take it)', color: '#0FFF50' },
  { text: '*breathes in Craigslist*', color: '#FF6600' },
  { text: '🦞 G1TC# is watching u', color: '#FF10F0' },
  { text: 'THIS IS NOT A SCAM', color: '#FFB81C' },
]

export default function Webcam90s() {
  const [minimized, setMinimized] = useState(true) // start minimized — easter egg to find
  const [currentSlide, setCurrentSlide] = useState(0)
  const [timestamp, setTimestamp] = useState('')
  const [staticNoise, setStaticNoise] = useState(false)

  useEffect(() => {
    // Cycle slides
    const slideInterval = setInterval(() => {
      setStaticNoise(true)
      setTimeout(() => {
        setCurrentSlide(s => (s + 1) % MEME_SLIDES.length)
        setStaticNoise(false)
      }, 200)
    }, 4000)

    // Update timestamp
    const timeInterval = setInterval(() => {
      const now = new Date()
      setTimestamp(now.toLocaleTimeString('en-US', { hour12: false }))
    }, 1000)

    // Un-minimize after 20 seconds as a surprise
    const reveal = setTimeout(() => setMinimized(false), 20000)

    return () => { clearInterval(slideInterval); clearInterval(timeInterval); clearTimeout(reveal) }
  }, [])

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)} className="fixed bottom-20 left-4 z-[60] px-2 py-1 text-[9px]" style={{
        background: '#1a1a1a', border: '1px solid #333', color: '#555',
        fontFamily: 'monospace', cursor: 'pointer',
      }}>
        📷 cam
      </button>
    )
  }

  const slide = MEME_SLIDES[currentSlide]

  return (
    <div className="fixed bottom-24 left-3 z-[60]" style={{ width: '180px' }}>
      {/* Webcam housing */}
      <div style={{
        background: '#222', border: '2px solid #444',
        borderRadius: '4px', overflow: 'hidden',
        boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-0.5" style={{
          background: '#333', borderBottom: '1px solid #444',
        }}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: '#f00' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#888' }}>REC</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#666' }}>
            LIVE
          </span>
          <button onClick={() => setMinimized(true)} style={{
            background: 'none', border: 'none', color: '#666',
            fontSize: '10px', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* "Video" feed */}
        <div className="relative" style={{
          height: '100px',
          background: staticNoise
            ? 'repeating-conic-gradient(#222 0% 25%, #444 0% 50%) 50% / 4px 4px'
            : '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)',
          }} />

          {!staticNoise && (
            <p className="text-center px-2 relative z-10" style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: '14px',
              fontWeight: 700,
              color: slide.color,
              textShadow: `0 0 8px ${slide.color}`,
            }}>
              {slide.text}
            </p>
          )}

          {/* Timestamp overlay */}
          <div style={{
            position: 'absolute', bottom: '4px', right: '6px',
            fontFamily: 'monospace', fontSize: '9px', color: '#FF6600',
            textShadow: '1px 1px 0 #000',
          }}>
            {timestamp}
          </div>

          {/* Camera indicator */}
          <div style={{
            position: 'absolute', top: '4px', left: '6px',
            fontFamily: 'monospace', fontSize: '8px', color: '#f00',
          }}>
            <span className="blink">●</span> CAM 01
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 py-1 text-center" style={{
          background: '#1a1a1a', borderTop: '1px solid #333',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '7px', color: '#555' }}>
            FLIP-LY GARAGE SALE SURVEILLANCE™
          </span>
        </div>
      </div>
    </div>
  )
}
