'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * Draggable Post-It Note with a lobster mascot.
 * Pure design element — no APIs, no tracking, no breadcrumbs.
 */
export default function StickyNote() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dismissed, setDismissed] = useState(false)
  const [mascotMsg, setMascotMsg] = useState(0)
  const noteRef = useRef<HTMLDivElement>(null)

  const mascotMessages = [
    "It looks like you're trying to find a password. Would you like help?",
    "Have you tried 'admin'? ...just kidding. Or am I?",
    "The answer is definitely not in this sticky note.",
    "I've been stuck to this page since 1997.",
    "Psst... check the source code. I'll wait.",
    "No really, I have nowhere else to be.",
  ]

  useEffect(() => {
    // Cycle mascot messages
    const interval = setInterval(() => {
      setMascotMsg(prev => (prev + 1) % mascotMessages.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Position in bottom-right on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPos({
        x: window.innerWidth - 280,
        y: window.innerHeight - 320,
      })
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setDragging(true)
    setOffset({
      x: touch.clientX - pos.x,
      y: touch.clientY - pos.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      }
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

  if (dismissed) return null

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
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '14px',
          background: 'rgba(200,200,180,0.5)',
          borderRadius: '2px',
        }} />

        {/* Dismiss X */}
        <div
          onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
          style={{
            position: 'absolute',
            top: '2px',
            right: '6px',
            fontSize: '12px',
            color: '#999',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &times;
        </div>

        {/* Note content */}
        <p style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '12px',
          color: '#333',
          lineHeight: 1.5,
          margin: 0,
        }}>
          psst... there&apos;s a lobster hiding in the source code.
          we&apos;re not kidding.
        </p>
        <p style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '11px',
          color: '#666',
          marginTop: '8px',
          marginBottom: '0',
        }}>
          → <a href="/lobster-hunt" style={{ color: '#8B4513', textDecoration: 'underline' }}>/lobster-hunt</a>
        </p>
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '7px',
          color: '#aaa',
          marginTop: '8px',
          marginBottom: '0',
        }}>
          last updated by the webmaster
        </p>

        {/* NEW! blink */}
        <span style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          fontSize: '8px',
          color: '#ff0000',
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
            bottom: '-6px',
            left: '12px',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #fff',
          }} />
        </div>
        {/* The lobster */}
        <div style={{
          fontSize: '28px',
          marginTop: '2px',
          marginLeft: '4px',
        }}>
          🦞
        </div>
      </div>

      {/* Blink keyframe injected inline */}
      <style>{`
        @keyframes blink90s {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
