'use client'

import { useState, useEffect } from 'react'

const CHANNELS = [
  {
    num: 3,
    name: 'QVC HOME',
    content: (
      <div className="text-center py-4">
        <p className="text-xl font-bold mb-2" style={{ color: '#FFB81C', fontFamily: '"Comic Sans MS", cursive' }}>
          ✨ INCREDIBLE VALUE ✨
        </p>
        <p className="text-sm mb-1" style={{ color: '#fff' }}>GENUINE FAUX-LEATHER COUCH</p>
        <p className="text-2xl font-bold blink" style={{ color: '#0FFF50' }}>ONLY $19.99!!!</p>
        <p className="text-xs mt-2" style={{ color: '#888' }}>Was $499.99 | Savings: $480.00</p>
        <p className="text-xs mt-1 blink" style={{ color: '#FF10F0' }}>🔥 ONLY 3 LEFT! CALL NOW!</p>
        <p className="text-lg mt-3" style={{ color: '#FFB81C', fontFamily: 'monospace' }}>
          1-800-FLIP-LY
        </p>
      </div>
    ),
  },
  {
    num: 7,
    name: 'INFOMERCIAL',
    content: (
      <div className="text-center py-4">
        <p className="text-xs mb-2" style={{ color: '#888' }}>PAID ADVERTISEMENT</p>
        <p className="text-lg font-bold mb-2" style={{ color: '#fff', fontFamily: '"Comic Sans MS", cursive' }}>
          &ldquo;I MADE $10,000 FLIPPING<br />GARAGE SALE FINDS!&rdquo;
        </p>
        <p className="text-sm" style={{ color: '#FFB81C' }}>— Real* Person, Dallas TX</p>
        <p className="text-[9px] mt-1" style={{ color: '#555' }}>*results not typical</p>
        <div className="mt-3 py-2 px-4 inline-block" style={{ background: '#FF6600', border: '2px solid #fff' }}>
          <p className="text-sm font-bold" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            ORDER NOW: flip-ly.net
          </p>
        </div>
      </div>
    ),
  },
  {
    num: 13,
    name: 'STATIC',
    content: (
      <div className="flex items-center justify-center py-8" style={{
        background: 'repeating-conic-gradient(#333 0% 25%, #666 0% 50%) 50% / 4px 4px',
        minHeight: '120px',
      }}>
        <p className="text-sm px-3 py-1" style={{
          background: '#000', color: '#888', fontFamily: 'monospace',
        }}>
          NO SIGNAL
        </p>
      </div>
    ),
  },
  {
    num: 22,
    name: 'LATE NITE',
    content: (
      <div className="text-center py-4">
        <p className="text-xs mb-2" style={{ color: '#888' }}>3:47 AM</p>
        <p className="text-base font-bold mb-2" style={{ color: '#FF10F0', fontFamily: '"Comic Sans MS", cursive' }}>
          🔪 GINSU KNIVES 🔪
        </p>
        <p className="text-sm mb-2" style={{ color: '#fff' }}>
          But WAIT — there&apos;s MORE!
        </p>
        <p className="text-sm" style={{ color: '#FFB81C' }}>
          Order in the next 15 minutes and get<br />
          a FREE garage sale listing on flip-ly.net!
        </p>
        <p className="text-xs mt-3 blink" style={{ color: '#0FFF50' }}>
          📞 OPERATORS ARE STANDING BY 📞
        </p>
      </div>
    ),
  },
  {
    num: 42,
    name: 'TEST PATTERN',
    content: (
      <div className="py-2">
        <div className="flex h-16">
          {['#fff', '#FFB81C', '#0FFF50', '#00BFFF', '#FF10F0', '#FF6600', '#f00'].map(c => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div className="text-center py-2" style={{ background: '#000' }}>
          <p className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>
            FLIP-LY BROADCASTING SYSTEM
          </p>
          <p className="text-[10px]" style={{ color: '#555' }}>
            Normal programming will resume after you sign up
          </p>
        </div>
      </div>
    ),
  },
]

export default function CRTtv() {
  const [channel, setChannel] = useState(0)
  const [power, setPower] = useState(true)
  const [isChanging, setIsChanging] = useState(false)
  const [minimized, setMinimized] = useState(false)

  const changeChannel = (dir: number) => {
    setIsChanging(true)
    setTimeout(() => {
      setChannel(c => {
        const next = c + dir
        if (next < 0) return CHANNELS.length - 1
        if (next >= CHANNELS.length) return 0
        return next
      })
      setIsChanging(false)
    }, 300)
  }

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)} className="fixed bottom-4 right-4 z-[75] px-3 py-1.5 text-xs" style={{
        background: '#333', border: '1px solid #555', color: '#888',
        fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
      }}>
        📺 TV (Ch. {CHANNELS[channel].num})
      </button>
    )
  }

  return (
    <div className="fixed left-3 top-24 z-[75] select-none" style={{ width: '220px' }}>
      {/* TV HOUSING */}
      <div style={{
        background: 'linear-gradient(180deg, #8B7355, #6B5340, #4A3728)',
        borderRadius: '12px 12px 4px 4px',
        padding: '12px 12px 8px',
        border: '3px ridge #A0896C',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
      }}>
        {/* Antenna */}
        <div className="flex justify-center mb-1">
          <div style={{ width: '2px', height: '20px', background: '#999', transform: 'rotate(-20deg)', transformOrigin: 'bottom' }} />
          <div style={{ width: '2px', height: '20px', background: '#999', transform: 'rotate(20deg)', transformOrigin: 'bottom' }} />
        </div>

        {/* SCREEN */}
        <div style={{
          background: power ? '#111' : '#000',
          border: '4px ridge #555',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '140px',
        }}>
          {/* CRT curve overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)',
            borderRadius: '8px',
          }} />

          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
          }} />

          {power ? (
            <>
              {/* Channel indicator */}
              <div style={{
                position: 'absolute', top: '4px', right: '6px', zIndex: 4,
                fontFamily: 'monospace', fontSize: '10px', color: '#0FFF50',
                textShadow: '0 0 4px #0FFF50',
              }}>
                CH {CHANNELS[channel].num}
              </div>

              {/* Static during channel change */}
              {isChanging ? (
                <div style={{
                  minHeight: '140px',
                  background: 'repeating-conic-gradient(#222 0% 25%, #555 0% 50%) 50% / 6px 6px',
                  animation: 'jitter 0.05s infinite',
                }} />
              ) : (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {CHANNELS[channel].content}
                </div>
              )}
            </>
          ) : (
            <div style={{ minHeight: '140px' }} />
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex gap-1">
            {/* Channel knob buttons */}
            <button onClick={() => changeChannel(-1)} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #888, #444)',
              border: '2px ridge #666', cursor: 'pointer',
              fontSize: '10px', color: '#ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>◀</button>
            <button onClick={() => changeChannel(1)} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #888, #444)',
              border: '2px ridge #666', cursor: 'pointer',
              fontSize: '10px', color: '#ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>▶</button>
          </div>

          <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#A0896C' }}>
            FLIP-LY TV
          </span>

          <div className="flex gap-1">
            {/* Power button */}
            <button onClick={() => setPower(!power)} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: power ? 'radial-gradient(circle at 30% 30%, #aa4444, #662222)' : 'radial-gradient(circle at 30% 30%, #888, #444)',
              border: '2px ridge #666', cursor: 'pointer',
              fontSize: '8px', color: power ? '#ff6666' : '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>⏻</button>
            {/* Minimize */}
            <button onClick={() => setMinimized(true)} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #888, #444)',
              border: '2px ridge #666', cursor: 'pointer',
              fontSize: '8px', color: '#ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>_</button>
          </div>
        </div>
      </div>

      {/* TV Name plate */}
      <div className="text-center mt-1">
        <span style={{ fontFamily: 'serif', fontSize: '9px', color: '#666', letterSpacing: '3px' }}>
          PANASONIC
        </span>
      </div>
    </div>
  )
}
