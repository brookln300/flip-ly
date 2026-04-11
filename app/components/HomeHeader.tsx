'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSignup } from './SignupContext'

const FlipShell = lazy(() => import('./FlipShell'))

export default function HomeHeader() {
  const { openSignup } = useSignup()
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  const [shellOpen, setShellOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setLoggedInUser(data.user) })
      .catch(() => {})
  }, [])

  return (
    <>
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" aria-label="Flip-ly home" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--text-primary)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>FLIP-LY</span>
        </a>
        <nav aria-label="Main navigation" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="/blog" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>Blog</a>
          <a href="#whats-new" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>What&apos;s New</a>
          <a href="#pricing" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>Pricing</a>
          <button
            onClick={() => setShellOpen(true)}
            className="hidden sm:inline-flex"
            style={{
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              color: '#6e6e73',
              background: 'transparent',
              border: '1px solid #d1d1d6',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00ff41'
              e.currentTarget.style.borderColor = '#00ff41'
              e.currentTarget.style.background = 'rgba(0, 255, 65, 0.04)'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 65, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6e6e73'
              e.currentTarget.style.borderColor = '#d1d1d6'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 4px #00ff41', flexShrink: 0 }} />
            <span>LOBSTER PROTOCOL</span>
          </button>
          {loggedInUser ? (
            <a href="/dashboard" style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: 700,
              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)', borderRadius: '6px', textDecoration: 'none',
            }}>
              {loggedInUser.email.split('@')[0]}
            </a>
          ) : (
            <button onClick={openSignup} style={{
              padding: '6px 16px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}
        </nav>
      </header>

      {shellOpen && (
        <Suspense fallback={null}>
          <FlipShell isOpen={shellOpen} onClose={() => setShellOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
