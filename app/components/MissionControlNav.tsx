'use client'

import { useState, useEffect } from 'react'
import { useSignup } from './SignupContext'

/**
 * Mission Control top nav — the 7 surfaces of the DFW dealfinder.
 * Built surfaces link out; not-yet-built ones render as dimmed "soon" chips
 * (no 404s). Public read-only; family login via the auth modal.
 */
const SECTIONS: { label: string; href: string | null }[] = [
  { label: 'Command', href: '/' },
  { label: 'Deals', href: '/deals' },
  { label: 'Map', href: null },
  { label: 'Alerts', href: null },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Messages', href: '/messages' },
  { label: 'Reports', href: null },
  { label: 'System', href: '/system' },
]

export default function MissionControlNav({ active = 'Command' }: { active?: string }) {
  const { openSignup, loggedInUser } = useSignup()
  const [notif, setNotif] = useState(0)

  useEffect(() => {
    let alive = true
    const poll = () => fetch('/api/messages/count').then(r => r.json()).then(j => { if (alive) setNotif(j.actionable || 0) }).catch(() => {})
    poll()
    const t = setInterval(poll, 60000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 80,
      background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: '80rem', margin: '0 auto',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <a href="/" aria-label="flip-ly home" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--text-primary)" />
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>flip-ly</span>
          <span className="hidden sm:inline" style={{ fontSize: '12px', color: 'var(--text-dim)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px' }}>DFW dealfinder</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <a href="/messages" aria-label={`Messages${notif ? ` (${notif} need attention)` : ''}`} title="Messages" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v12H5.17L4 17.17V4z" /></svg>
            {notif > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '17px', height: '17px', padding: '0 4px', borderRadius: '9px', background: 'var(--accent-green)', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{notif > 99 ? '99+' : notif}</span>
            )}
          </a>
          {loggedInUser ? (
            <a href="/dashboard" style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: 700,
              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)', borderRadius: '6px', textDecoration: 'none',
            }}>{loggedInUser.email.split('@')[0]}</a>
          ) : (
            <button onClick={openSignup} style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}>Sign in</button>
          )}
        </div>
      </div>

      <nav aria-label="Sections" style={{
        maxWidth: '80rem', margin: '0 auto',
        padding: '0 var(--space-4) var(--space-2)',
        display: 'flex', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {SECTIONS.map(s => {
          const isActive = s.label === active
          const base = {
            flexShrink: 0, padding: '5px 11px', fontSize: '13px', borderRadius: '6px',
            textDecoration: 'none', whiteSpace: 'nowrap' as const,
          }
          if (!s.href) {
            return (
              <span key={s.label} title="Coming soon" style={{
                ...base, color: 'var(--text-dim)', cursor: 'default',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}>
                {s.label}
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0 4px' }}>soon</span>
              </span>
            )
          }
          return (
            <a key={s.label} href={s.href} style={{
              ...base,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg-surface)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            }}>{s.label}</a>
          )
        })}
      </nav>
    </header>
  )
}
