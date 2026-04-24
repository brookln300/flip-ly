'use client'

import { useSignup } from './SignupContext'
import { trackFunnelEvent } from '../lib/analytics-client'

export default function HeroCTA({ variant }: { variant?: 'free-tier' }) {
  const { openSignup, loggedInUser } = useSignup()

  if (variant === 'free-tier') {
    return (
      <button onClick={openSignup} style={{
        width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
        background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
        borderRadius: '8px', cursor: 'pointer',
      }}>Get started</button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
      <button
        onClick={() => {
          trackFunnelEvent('plan_selected', {
            tier: 'free',
            surface: 'hero_cta',
            logged_in: !!loggedInUser,
          })
          openSignup()
        }}
        style={{
          background: 'var(--accent-green)', color: '#fff', border: 'none',
          padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Start finding deals — free, no card
      </button>
      <a href="#search" style={{
        fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        or try a search
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>
  )
}
