'use client'

import { useState, lazy, Suspense, useEffect, useCallback } from 'react'
import { useSignup } from './SignupContext'

const FlipShell = lazy(() => import('./FlipShell'))

export default function HomeHeader() {
  const { openSignup, loggedInUser } = useSignup()
  const [shellOpen, setShellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on ESC
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  // Close menu on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const handler = () => { if (mq.matches) setMenuOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
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
            title="The Lobster Protocol"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              fontSize: '12px',
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 4px #00ff41', flexShrink: 0 }} />
            <span className="hidden sm:inline">LOBSTER PROTOCOL</span>
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
          {/* Mobile hamburger */}
          <button
            className="sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', padding: 0,
              background: 'transparent', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div
          className="sm:hidden"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 79,
            background: 'rgba(0,0,0,0.3)',
          }}
          onClick={closeMenu}
        >
          <nav
            aria-label="Mobile navigation"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: '52px', left: 0, right: 0,
              background: 'var(--bg-overlay)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '8px 0',
              animation: 'slideDown 0.15s ease',
            }}
          >
            {[
              { href: '#search', label: 'Search' },
              { href: '/blog', label: 'Blog' },
              { href: '#whats-new', label: "What's New" },
              { href: '#pricing', label: 'Pricing' },
              { href: '/about', label: 'About' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                style={{
                  display: 'block', padding: '12px 20px',
                  fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {link.label}
              </a>
            ))}
            {!loggedInUser && (
              <div style={{ padding: '12px 20px' }}>
                <button
                  onClick={() => { closeMenu(); openSignup() }}
                  style={{
                    width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
                    background: 'var(--accent-green)', color: '#fff', border: 'none',
                    borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {shellOpen && (
        <Suspense fallback={null}>
          <FlipShell isOpen={shellOpen} onClose={() => setShellOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
