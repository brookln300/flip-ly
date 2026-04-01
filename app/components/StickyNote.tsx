'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * Draggable Post-It Note — the ONLY way to reach /lobster-hunt.
 * Dismiss it and panic ensues.
 * Pure design element — no APIs, no tracking, no breadcrumbs.
 */

type NoteState = 'visible' | 'dismissed' | 'panicking' | 'gone'

export default function StickyNote({ onOpenHunt }: { onOpenHunt?: () => void } = {}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [state, setState] = useState<NoteState>('visible')
  const [mascotMsg, setMascotMsg] = useState(0)
  const noteRef = useRef<HTMLDivElement>(null)

  const mascotMessages = [
    "Psst... check the source code. I'll wait.",
    "The clues are in hex. And morse. And base64. Good luck.",
    "One password is real. Seven are decoys. Choose wisely.",
    "Have you tried 'admin'? ...just kidding. Or am I?",
    "Hint: the answer isn't one clue. It's pieces of many.",
    "Look at the HTML comments. Not all of them lie.",
    "The footer knows things. So does the <head>.",
    "No single decoded string is the answer. You must combine.",
    "I've been stuck to this page since 1997. I've seen things.",
    "The lobster sees all. The lobster says nothing. Except this.",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setMascotMsg(prev => (prev + 1) % mascotMessages.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Position in bottom-right on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPos({
        x: 20,
        y: 140,
      })
    }
  }, [])

  // When dismissed, trigger panic after 1.5s
  useEffect(() => {
    if (state === 'dismissed') {
      const timer = setTimeout(() => setState('panicking'), 1500)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setDragging(true)
    setOffset({ x: touch.clientX - pos.x, y: touch.clientY - pos.y })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (dragging) {
        const touch = e.touches[0]
        setPos({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
      }
    }
    const handleUp = () => setDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [dragging, offset])

  // ═══ STATE: PANIC POPUP ═══
  if (state === 'panicking') {
    return (
      <>
        {/* Dimmed backdrop */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99998,
          background: 'rgba(0,0,0,0.6)',
        }} />
        {/* Win98 error dialog */}
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          width: '380px',
          background: '#c0c0c0',
          border: '2px outset #fff',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
          fontFamily: '"Courier New", monospace',
        }}>
          {/* Title bar */}
          <div style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            padding: '3px 6px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>⚠️ lobster_panic.exe</span>
            <span style={{ color: '#fff', fontSize: '11px' }}>✕</span>
          </div>
          {/* Body */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '32px' }}>🦞</span>
              <div>
                <p style={{ fontSize: '12px', color: '#000', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Wait. <strong>WAIT.</strong>
                </p>
                <p style={{ fontSize: '11px', color: '#000', margin: '0 0 8px', lineHeight: 1.6 }}>
                  That sticky note was the only link to the <strong>Hall of Almost</strong>.
                </p>
                <p style={{ fontSize: '11px', color: '#000', margin: '0 0 4px', lineHeight: 1.6 }}>
                  The webmaster is going to be <em>so</em> mad.
                </p>
                <p style={{ fontSize: '9px', color: '#666', margin: '8px 0 0', fontStyle: 'italic' }}>
                  A fatal exception HAS_NO_MAP has occurred at 0x0000CLAW
                </p>
              </div>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setState('visible')
                  // Reset position
                  if (typeof window !== 'undefined') {
                    setPos({
                      x: window.innerWidth - 280,
                      y: window.innerHeight - 320,
                    })
                  }
                }}
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  padding: '4px 16px',
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  cursor: 'pointer',
                  color: '#000',
                }}
              >
                OK I&apos;m sorry, bring it back
              </button>
              <button
                onClick={() => setState('gone')}
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  padding: '4px 16px',
                  background: '#c0c0c0',
                  border: '2px outset #fff',
                  cursor: 'pointer',
                  color: '#000',
                }}
              >
                I don&apos;t need it
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ═══ STATE: GONE — tiny rescue lobster in corner ═══
  if (state === 'gone' || state === 'dismissed') {
    return (
      <div
        onClick={() => {
          setState('visible')
          if (typeof window !== 'undefined') {
            setPos({
              x: window.innerWidth - 280,
              y: window.innerHeight - 320,
            })
          }
        }}
        title="You abandoned me."
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: 9998,
          fontSize: '18px',
          cursor: 'pointer',
          opacity: state === 'dismissed' ? 0 : 0.4,
          transition: 'opacity 0.3s',
          filter: 'grayscale(1)',
        }}
      >
        🦞
      </div>
    )
  }

  // ═══ STATE: VISIBLE — the full sticky note ═══
  return (
    <div
      ref={noteRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 9998,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* ═══ THE STICKY NOTE ═══ */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          width: '220px',
          background: '#fef68a',
          padding: '14px 16px 12px',
          boxShadow: '3px 3px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.05)',
          transform: 'rotate(-2deg)',
          position: 'relative',
        }}
      >
        {/* Tape at top */}
        <div style={{
          position: 'absolute',
          top: '-6px', left: '50%',
          transform: 'translateX(-50%)',
          width: '60px', height: '14px',
          background: 'rgba(200,200,180,0.5)',
          borderRadius: '2px',
        }} />

        {/* Dismiss X */}
        <div
          onClick={(e) => { e.stopPropagation(); setState('dismissed') }}
          style={{
            position: 'absolute',
            top: '2px', right: '6px',
            fontSize: '12px', color: '#999',
            cursor: 'pointer', lineHeight: 1,
          }}
        >
          &times;
        </div>

        {/* Note content */}
        <p style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '12px', color: '#333',
          lineHeight: 1.5, margin: 0,
        }}>
          psst... there&apos;s a lobster hiding in the source code.
          we&apos;re not kidding.
        </p>
        <p style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '9px', color: '#999',
          marginTop: '8px', marginBottom: '0',
        }}>
          → <a href="/lobster-hunt" onClick={e => e.stopPropagation()} style={{ color: '#aaa', textDecoration: 'underline' }}>hall of almost</a>
        </p>
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '7px', color: '#aaa',
          marginTop: '8px', marginBottom: '0',
        }}>
          last updated by the webmaster
        </p>

        {/* Hidden clickable pixel — opens hunt terminal */}
        <div
          onClick={(e) => { e.stopPropagation(); onOpenHunt?.() }}
          style={{
            position: 'absolute',
            bottom: '6px', right: '10px',
            width: '12px', height: '12px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title=""
        >
          <div style={{
            width: '4px', height: '4px', borderRadius: '50%',
            background: '#e8d44d',
          }} />
        </div>

        {/* NEW! blink */}
        <span style={{
          position: 'absolute',
          top: '8px', left: '8px',
          fontSize: '8px', color: '#ff0000',
          fontFamily: '"Comic Sans MS", cursive',
          fontWeight: 'bold',
          animation: 'blink90s 1s infinite',
        }}>
          NEW!
        </span>
      </div>

      {/* ═══ LOBSTER MASCOT + SPEECH BUBBLE ═══ */}
      <div style={{
        position: 'relative',
        marginTop: '-4px',
        marginLeft: '160px',
      }}>
        {/* Speech bubble */}
        <div style={{
          background: '#fff',
          border: '1px solid #888',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '9px',
          fontFamily: '"Comic Sans MS", cursive',
          color: '#444',
          maxWidth: '180px',
          position: 'relative',
          boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
        }}>
          {mascotMessages[mascotMsg]}
          {/* Bubble tail */}
          <div style={{
            position: 'absolute',
            bottom: '-6px', left: '12px',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #fff',
          }} />
        </div>
        {/* The lobster */}
        <div style={{ fontSize: '28px', marginTop: '2px', marginLeft: '4px' }}>
          🦞
        </div>
      </div>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink90s {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
