'use client'

import { useSignup } from './SignupContext'

/**
 * The hub's plain, warm, always-there nav. The Hearth scene is the soul;
 * this is the skeleton — nobody ever needs the magic to find the calendar.
 */
const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Family', href: '/family' },
  { label: 'Deals', href: '/deals' },
  { label: 'Help', href: '/help' },
]

export default function HubNav({ active = 'Home' }: { active?: string }) {
  const { openSignup, loggedInUser } = useSignup()
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 80,
      background: 'rgba(18,23,43,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,246,236,0.08)',
    }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <span aria-hidden="true" style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #FFD166 0%, #F4A259 45%, rgba(231,111,81,0.25) 100%)', boxShadow: '0 0 14px rgba(244,162,89,0.55)' }} />
          <span style={{ fontFamily: 'var(--font-display), serif', fontSize: '18px', fontWeight: 600, color: '#FFF6EC', letterSpacing: '0.01em' }}>The Hearth</span>
        </a>
        <nav aria-label="Hub navigation" style={{ display: 'flex', gap: '2px', alignItems: 'center', overflowX: 'auto' }}>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} style={{
              padding: '7px 12px', fontSize: '14px', borderRadius: '9px', textDecoration: 'none', whiteSpace: 'nowrap',
              color: l.label === active ? '#FFF6EC' : '#C9BFB2',
              background: l.label === active ? 'rgba(255,246,236,0.09)' : 'transparent',
              fontWeight: l.label === active ? 600 : 400,
            }}>{l.label}</a>
          ))}
          {loggedInUser ? (
            <a href="/family/me" title="Tend your lantern" style={{ marginLeft: '8px', padding: '7px 13px', fontSize: '13px', fontWeight: 600, borderRadius: '9px', textDecoration: 'none', color: '#16213E', background: 'linear-gradient(120deg, #FFD166, #F4A259)', whiteSpace: 'nowrap' }}>My lantern</a>
          ) : (
            <button onClick={openSignup} style={{ marginLeft: '8px', padding: '7px 13px', fontSize: '13px', fontWeight: 600, borderRadius: '9px', border: 'none', cursor: 'pointer', color: '#16213E', background: 'linear-gradient(120deg, #FFD166, #F4A259)', whiteSpace: 'nowrap' }}>Come in</button>
          )}
        </nav>
      </div>
    </header>
  )
}
