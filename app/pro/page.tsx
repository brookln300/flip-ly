'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useRef, useCallback } from 'react'

interface UserData {
  id: string
  email: string
  is_premium: boolean
  subscription_tier: string | null
}

function ProContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserData | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activated, setActivated] = useState(false)
  const tierParam = params.get('tier')
  const isPower = tierParam === 'power'
  const autoTriggered = useRef(false)
  const pollCount = useRef(0)

  // Fetch user via custom JWT (works for ALL auth methods)
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const isAuthenticated = authChecked && user !== null
  const isAlreadyPro = user?.is_premium === true || ['pro', 'power', 'admin'].includes(user?.subscription_tier || '')

  const handleUpgrade = async (tier: 'pro' | 'power') => {
    if (!isAuthenticated) {
      window.location.href = isPower ? '/?signup=pro&next=/pro?tier=power' : '/?signup=pro'
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        window.location.href = '/?signup=pro'
      } else {
        setError(data.error || 'Something went wrong. Try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  const handleManage = async () => {
    if (!isAuthenticated) {
      window.location.href = '/?signup=pro'
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        window.location.href = '/?signup=pro'
      } else {
        setError(data.error || 'Portal unavailable. Try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  // Auto-trigger checkout if arriving from landing page with ?tier=power
  useEffect(() => {
    if (isPower && isAuthenticated && !isAlreadyPro && !loading && !autoTriggered.current) {
      autoTriggered.current = true
      handleUpgrade('power')
    }
  }, [isPower, isAuthenticated, isAlreadyPro, loading])

  // POST-CHECKOUT SUCCESS — poll for webhook completion
  useEffect(() => {
    if (status !== 'success') return
    const poll = setInterval(async () => {
      pollCount.current++
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user?.is_premium) {
          setActivated(true)
          clearInterval(poll)
        }
      } catch {}
      if (pollCount.current >= 15) clearInterval(poll)
    }, 2000)
    return () => clearInterval(poll)
  }, [status])

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: '32rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)', border: '2px solid var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '28px', color: 'var(--accent-green)',
          }}>
            &#x2713;
          </div>
          <h1 style={{
            fontSize: '30px', fontWeight: 700, color: 'var(--text-primary)',
            marginBottom: '16px',
          }}>
            You&apos;re in.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            {activated
              ? 'Your founding price is locked for life. Full score breakdowns, unlimited searches, and daily digests are now active.'
              : 'Activating your subscription... This takes just a moment.'}
          </p>
          <a href="/dashboard" style={{
            display: 'inline-block', padding: '12px 24px',
            background: 'var(--accent-green)', color: '#fff',
            borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // POST-CHECKOUT CANCEL
  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            No worries
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            The free tier still gives you 15 searches/day and a weekly digest. Founding pricing is available while spots last.
          </p>
          <a href="/" style={{
            color: 'var(--accent-green)', textDecoration: 'underline', fontSize: '14px',
          }}>
            &larr; Back to Flip-ly
          </a>
        </div>
      </div>
    )
  }

  // ALREADY PRO — show manage subscription view
  if (authChecked && isAlreadyPro) {
    const tierLabel = user?.subscription_tier === 'power' ? 'Power' : user?.subscription_tier === 'admin' ? 'Admin' : 'Pro'
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <header style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
              <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              FLIP-LY
            </span>
          </a>
        </header>

        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4)', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)', border: '2px solid var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '28px', color: 'var(--accent-green)',
          }}>
            &#x2713;
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            You&apos;re on {tierLabel}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
            Your founding price is locked for life. Full score breakdowns, unlimited searches, and daily digests are active.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.05)', border: '1px solid var(--accent-red)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
            }}>
              <p style={{ color: 'var(--accent-red)', fontSize: '13px' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleManage} disabled={loading} style={{
              display: 'inline-block', padding: '12px 24px',
              background: 'var(--accent-green)', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', minWidth: '220px',
            }}>
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>
            <a href="/dashboard" style={{
              color: 'var(--accent-green)', textDecoration: 'underline', fontSize: '14px',
            }}>
              Go to Dashboard
            </a>
          </div>

          {user?.subscription_tier !== 'power' && user?.subscription_tier !== 'admin' && (
            <div style={{
              marginTop: '48px', padding: '24px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Upgrade to Power?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Unlimited markets, instant alerts, and trend data — $19/mo founding price.
              </p>
              <button onClick={() => handleUpgrade('power')} disabled={loading} style={{
                padding: '10px 20px', background: '#8b5cf6', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
              }}>
                {loading ? 'Loading...' : 'Upgrade to Power'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Loading...</div>
      </div>
    )
  }

  // DEFAULT: 3-TIER PRICING PAGE
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            FLIP-LY
          </span>
        </a>
        {isAuthenticated && (
          <button onClick={handleManage} style={{
            background: 'none', border: '1px solid var(--border-active)',
            borderRadius: '6px', color: 'var(--text-dim)', fontSize: '12px',
            padding: '6px 14px', cursor: 'pointer',
          }}>
            Manage subscription
          </button>
        )}
      </header>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h1 style={{
            fontSize: '34px', fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', marginBottom: 'var(--space-3)',
          }}>
            Pick your plan
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            One good find pays for a year. Cancel anytime.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid var(--accent-red)',
            borderRadius: '8px', padding: '12px 16px', maxWidth: '400px',
            margin: '0 auto var(--space-8)', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--accent-red)', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {!isAuthenticated && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '8px', padding: '12px 16px', maxWidth: '400px',
            margin: '0 auto var(--space-8)', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              <a href={isPower ? '/?signup=pro&next=/pro?tier=power' : '/?signup=pro'} style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Sign up or log in</a> first to choose a plan.
            </p>
          </div>
        )}

        {/* 3-tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ maxWidth: '900px', margin: '0 auto', alignItems: 'stretch' }}>

          {/* Free */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
              $0<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.4, listStyle: 'none', padding: 0, flex: 1 }}>
              {['15 searches/day', '1 market', 'Score number only', 'Weekly digest'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '14px', flexShrink: 0, width: '18px', textAlign: 'center' }}>—</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="/" style={{
              display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
            }}>
              Current plan
            </a>
          </div>

          {/* Pro — highlighted with green accent */}
          <div style={{
            background: '#fff', border: '2px solid var(--accent-green)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(22,163,74,0.12), 0 0 0 1px rgba(22,163,74,0.05)',
            transform: 'scale(1.03)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Most Popular badge */}
            <div style={{
              position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--accent-green)', color: '#fff',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '4px 14px', borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}>
              Most Popular
            </div>
            <div style={{ fontSize: '13px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', marginTop: '8px' }}>Pro</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              $5<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>$12/mo</span>{' '}
              Founding price &middot; Locked for life
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 2.4, listStyle: 'none', padding: 0, flex: 1 }}>
              {['Unlimited searches', '3 markets', 'Full score breakdown', 'Daily + weekly digest', '3 saved searches'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade('pro')} disabled={loading} style={{
              display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '14px 24px',
              background: loading ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
              transition: 'all 0.15s',
            }}>
              {loading ? 'Loading...' : !isAuthenticated ? 'Sign Up for Pro' : 'Start Pro — $5/mo'}
            </button>
          </div>

          {/* Power */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: '13px', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Power</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              $19<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>$39/mo</span>{' '}
              Founding price &middot; Locked for life
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.4, listStyle: 'none', padding: 0, flex: 1 }}>
              {['Unlimited searches', 'Unlimited markets', 'Breakdown + trends', 'Daily + instant alerts', 'Unlimited saved searches'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade('power')} disabled={loading} style={{
              display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.15s',
            }}>
              {loading ? 'Loading...' : !isAuthenticated ? 'Sign Up for Power' : 'Go Power'}
            </button>
          </div>
        </div>

        {/* Trust / urgency strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '24px', flexWrap: 'wrap',
          marginTop: 'var(--space-6)', padding: 'var(--space-4) 0',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Cancel anytime
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>·</span>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Secure checkout via Stripe
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>·</span>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            One good find pays for a year
          </span>
        </div>

        {/* Feature comparison */}
        <div style={{
          maxWidth: '640px', margin: 'var(--space-12) auto 0',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: 'var(--space-6)', overflow: 'auto',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'center' }}>
            Full comparison
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Free</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--accent-green)', fontWeight: 600 }}>Pro</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: '#8b5cf6', fontWeight: 600 }}>Power</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Searches/day', '15', 'Unlimited', 'Unlimited'],
                ['Markets', '1', '3', 'Unlimited'],
                ['AI score', 'Number only', 'Full breakdown', 'Breakdown + trends'],
                ['Digest', 'Weekly', 'Daily + weekly', 'Daily + instant'],
                ['Saved searches', '—', '3', 'Unlimited'],
                ['Source links', 'Hidden', 'Full access', 'Full access'],
                ['Daily deals email', '—', '10 deals/day', '10 deals/day'],
                ['Bookmark deals', '—', 'Unlimited', 'Unlimited'],
              ].map(([feature, free, pro, power], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{feature}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: free === '—' ? 'var(--border-active)' : 'var(--text-dim)' }}>{free}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: pro === 'Unlimited' || pro === 'Full access' ? 600 : 400 }}>{pro}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: power === 'Unlimited' || power === 'Full access' ? 600 : 400 }}>{power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══ FLIP MATH — ROI calculator ═══ */}
        <div style={{
          maxWidth: '640px', margin: 'var(--space-12) auto 0',
          background: '#fff', border: '1px solid var(--border-subtle)',
          borderRadius: '16px', padding: 'var(--space-8) var(--space-6)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            The math is simple
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            One flip covers your entire year of Pro.
          </p>

          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '16px', flexWrap: 'wrap', marginBottom: '32px',
          }}>
            {[
              { label: 'Buy at garage sale', value: '$5', color: 'var(--text-primary)' },
              { label: '', value: '\u2192', color: 'var(--text-dim)' },
              { label: 'Sell on eBay', value: '$45', color: 'var(--text-primary)' },
              { label: '', value: '=', color: 'var(--text-dim)' },
              { label: 'Profit', value: '$40', color: 'var(--accent-green)' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: step.label ? '80px' : 'auto' }}>
                <span style={{
                  fontSize: step.label ? '28px' : '20px', fontWeight: 700,
                  color: step.color, fontFamily: 'var(--font-mono)',
                }}>
                  {step.value}
                </span>
                {step.label && (
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {step.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
            borderRadius: '10px', padding: '16px', maxWidth: '360px', margin: '0 auto',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Pro members see the <strong>full score breakdown</strong> — resale value, demand level, and profit margin — before they drive to the sale.
              Free users just see the number.
            </p>
          </div>
        </div>

        {/* ═══ FAQ ═══ */}
        <div style={{ maxWidth: '560px', margin: 'var(--space-12) auto 0' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '24px' }}>
            Questions
          </h3>
          {[
            { q: 'What happens when I upgrade?', a: 'Instant access. Your dashboard unlocks full score breakdowns, unlimited searches, and daily deal emails within seconds.' },
            { q: 'Can I cancel anytime?', a: 'Yes. One click in your Stripe portal. No calls, no hoops. Your access continues until the end of the billing period.' },
            { q: 'What does "founding price" mean?', a: 'We\'re in early launch. Founding members lock in the current price permanently — even when we raise prices later. Your rate never goes up.' },
            { q: 'What if I don\'t find anything good?', a: 'We scan 20+ sources every 4 hours across your markets. Most Pro members find their first flip-worthy deal within the first week.' },
            { q: 'How is the AI score calculated?', a: 'We analyze title keywords, price relative to category averages, demand signals from sold listings, and seasonal trends. Each deal gets a 1-10 score with a breakdown Pro members can see.' },
          ].map((faq, i) => (
            <details key={i} style={{
              borderBottom: '1px solid var(--border-subtle)',
              padding: '16px 0',
            }}>
              <summary style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {faq.q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '8px', paddingRight: '24px' }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        {/* ═══ FINAL CTA ═══ */}
        <div style={{
          textAlign: 'center', marginTop: 'var(--space-12)',
          paddingBottom: 'var(--space-12)',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready to flip smarter?
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Lock in founding pricing before it&apos;s gone.
          </p>
          <button onClick={() => handleUpgrade(isPower ? 'power' : 'pro')} disabled={loading} style={{
            background: loading ? 'var(--border-active)' : isPower ? '#8b5cf6' : 'var(--accent-green)', color: '#fff',
            border: 'none', padding: '14px 36px', borderRadius: '10px',
            fontSize: '16px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            boxShadow: isPower ? '0 2px 12px rgba(139,92,246,0.3)' : '0 2px 12px rgba(22,163,74,0.3)',
            transition: 'all 0.15s',
          }}>
            {loading ? 'Loading...' : isPower ? 'Go Power — $19/mo' : 'Start Pro — $5/mo'}
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '12px' }}>
            Cancel anytime &middot; Secure checkout via Stripe
          </p>
        </div>
      </div>

      {/* FAQ toggle animation */}
      <style>{`
        details[open] summary svg { transform: rotate(180deg); }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  )
}

export default function ProPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} />}>
      <ProContent />
    </Suspense>
  )
}
