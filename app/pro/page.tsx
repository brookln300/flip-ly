'use client'

import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Suspense, useState } from 'react'

function ProContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const { data: authSession, status: authStatus } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async (tier: 'pro' | 'power') => {
    if (authStatus !== 'authenticated') {
      window.location.href = '/?signup=pro'
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
    if (authStatus !== 'authenticated') {
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

  // POST-CHECKOUT SUCCESS
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
            You're in.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            Your founding price is locked for life. Full score breakdowns, unlimited searches, and daily digests are now active.
          </p>
          <a href="/dashboard" style={{
            display: 'inline-block', padding: '12px 24px',
            background: 'var(--accent-green)', color: '#000',
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
        <button onClick={handleManage} style={{
          background: 'none', border: '1px solid var(--border-active)',
          borderRadius: '6px', color: 'var(--text-dim)', fontSize: '12px',
          padding: '6px 14px', cursor: 'pointer',
        }}>
          Manage subscription
        </button>
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

        {authStatus !== 'authenticated' && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '8px', padding: '12px 16px', maxWidth: '400px',
            margin: '0 auto var(--space-8)', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              <a href="/?signup=pro" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Sign up or log in</a> first to choose a plan.
            </p>
          </div>
        )}

        {/* 3-tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Free */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
              $0<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.4, listStyle: 'none', padding: 0 }}>
              <li>15 searches/day</li>
              <li>1 market</li>
              <li>Score number only</li>
              <li>Weekly digest</li>
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

          {/* Pro — highlighted */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Most Popular</div>
            <div style={{ fontSize: '13px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Pro</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              $5<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>
              Founding price &middot; Locks in for life
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.4, listStyle: 'none', padding: 0 }}>
              <li>Unlimited searches</li>
              <li>3 markets</li>
              <li>Full score breakdown</li>
              <li>Daily + weekly digest</li>
              <li>3 saved searches</li>
            </ul>
            <button onClick={() => handleUpgrade('pro')} disabled={loading} style={{
              display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
              background: loading ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}>
              {loading ? 'Loading...' : authStatus !== 'authenticated' ? 'Sign Up for Pro' : 'Start Pro'}
            </button>
          </div>

          {/* Power */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Power</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              $19<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>
              Founding price &middot; Locks in for life
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.4, listStyle: 'none', padding: 0 }}>
              <li>Unlimited searches</li>
              <li>Unlimited markets</li>
              <li>Breakdown + trends</li>
              <li>Daily + instant alerts</li>
              <li>Unlimited saved searches</li>
            </ul>
            <button onClick={() => handleUpgrade('power')} disabled={loading} style={{
              display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            }}>
              {loading ? 'Loading...' : authStatus !== 'authenticated' ? 'Sign Up for Power' : 'Go Power'}
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px',
          marginTop: 'var(--space-6)',
        }}>
          All plans include 20+ source coverage and AI scoring. No contracts.
        </p>

        {/* Feature comparison */}
        <div style={{
          maxWidth: '600px', margin: 'var(--space-12) auto 0',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: 'var(--space-6)', overflow: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Free</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--accent-green)', fontWeight: 600 }}>Pro</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--accent-purple)', fontWeight: 600 }}>Power</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Searches/day', '15', 'Unlimited', 'Unlimited'],
                ['Markets', '1', '3', 'Unlimited'],
                ['AI score', 'Number only', 'Full breakdown', 'Breakdown + trends'],
                ['Digest', 'Weekly', 'Daily + weekly', 'Daily + instant'],
                ['Saved searches', '--', '3', 'Unlimited'],
                ['Source links', 'Hidden', 'Full access', 'Full access'],
              ].map(([feature, free, pro, power], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{feature}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-dim)' }}>{free}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>{pro}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>{power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
