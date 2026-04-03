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

  const handleUpgrade = async () => {
    if (authStatus !== 'authenticated') {
      window.location.href = '/?signup=pro'
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center px-8 max-w-lg">
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)', border: '2px solid #22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '28px',
          }}>
            &#x2713;
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#fff',
          }}>
            Welcome to Pro
          </h1>
          <p className="text-base mb-6" style={{ color: '#999', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
            You're now a Pro member. Your weekly digest arrives 6 hours before everyone else, and you have unlimited searches.
          </p>
          <div className="mb-6 p-4 inline-block" style={{
            background: '#111', border: '1px solid #22C55E',
            borderRadius: '12px', padding: '20px 32px',
          }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', color: '#22C55E', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              PRO MEMBER
            </p>
            <p style={{ fontFamily: 'system-ui, sans-serif', color: '#666', fontSize: '12px' }}>
              $5/mo &middot; early adopter pricing locked for life
            </p>
          </div>
          <div className="mb-6">
            <p style={{ color: '#888', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
              &#x2705; Digest 6hrs early &middot; &#x2705; Unlimited search &middot; &#x2705; Full deal data &middot; &#x2705; Hot deal alerts
            </p>
          </div>
          <a href="/" style={{
            color: '#22C55E', fontFamily: 'system-ui, sans-serif',
            textDecoration: 'underline', fontSize: '14px',
          }}>
            &larr; Go to dashboard
          </a>
        </div>
      </div>
    )
  }

  // POST-CHECKOUT CANCEL
  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center px-8 max-w-lg">
          <h1 className="text-2xl font-bold mb-4" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
          }}>
            No worries
          </h1>
          <p className="text-base mb-6" style={{ color: '#888', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
            You can always upgrade later. The free tier still gives you a weekly digest and 10 searches per day.
          </p>
          <p className="text-sm mb-6" style={{ color: '#555', fontFamily: 'system-ui, sans-serif' }}>
            Early adopter pricing ($5/mo locked for life) is available while we're in this phase.
          </p>
          <a href="/" style={{
            color: '#22C55E', fontFamily: 'system-ui, sans-serif',
            textDecoration: 'underline', fontSize: '14px',
          }}>
            &larr; Back to flip-ly
          </a>
        </div>
      </div>
    )
  }

  // DEFAULT: PRO UPGRADE PAGE
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <div className="text-center px-8 max-w-xl">

        {/* Early adopter badge */}
        <div style={{
          display: 'inline-block', background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px',
          padding: '4px 14px', marginBottom: '24px',
          fontSize: '12px', color: '#22C55E', fontFamily: 'system-ui, sans-serif',
          fontWeight: 600, letterSpacing: '0.5px',
        }}>
          EARLY ADOPTER PRICING
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{
          fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
        }}>
          Flip-ly Pro
        </h1>
        <p className="text-lg mb-2" style={{
          color: '#fff', fontFamily: 'system-ui, sans-serif', fontWeight: 700,
          fontSize: '40px',
        }}>
          $5<span style={{ fontSize: '16px', color: '#666', fontWeight: 400 }}>/month</span>
        </p>
        <p className="mb-8" style={{
          color: '#22C55E', fontFamily: 'system-ui, sans-serif',
          fontSize: '14px', fontWeight: 600,
        }}>
          Lock this price in for life. Even when the price goes up.
        </p>

        <div className="mb-8 text-left inline-block" style={{
          background: '#111', border: '1px solid #222', borderRadius: '12px',
          padding: '24px 28px', maxWidth: '400px', width: '100%',
        }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
            What you get:
          </p>
          <ul style={{ fontFamily: 'system-ui, sans-serif', color: '#999', fontSize: '14px', listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <span style={{ color: '#22C55E' }}>&#x2713;</span>
              <span><strong style={{ color: '#fff' }}>Digest 6 hours early</strong> — get deals before free users see them</span>
            </li>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <span style={{ color: '#22C55E' }}>&#x2713;</span>
              <span><strong style={{ color: '#fff' }}>Unlimited searches</strong> — free tier is limited to 10/day</span>
            </li>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <span style={{ color: '#22C55E' }}>&#x2713;</span>
              <span><strong style={{ color: '#fff' }}>Full AI scores + direct links</strong> — know exactly what's worth your time</span>
            </li>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <span style={{ color: '#22C55E' }}>&#x2713;</span>
              <span><strong style={{ color: '#fff' }}>Hot deal alerts</strong> — get notified when a 9+/10 deal drops</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#22C55E' }}>&#x2713;</span>
              <span><strong style={{ color: '#fff' }}>Custom saved searches</strong> — alerts for what you care about</span>
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <p style={{ color: '#555', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
            One good find pays for a year of Pro. Cancel anytime.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3" style={{
            background: '#1a0000', border: '1px solid #dc2626',
            borderRadius: '8px', maxWidth: '400px', margin: '0 auto 16px',
          }}>
            <p style={{ color: '#dc2626', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        {authStatus !== 'authenticated' && (
          <div className="mb-4 px-4 py-3" style={{
            background: '#111', border: '1px solid #333',
            borderRadius: '8px', maxWidth: '400px', margin: '0 auto 16px',
          }}>
            <p style={{ color: '#999', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
              Sign up or log in first to upgrade to Pro.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              background: loading ? '#333' : '#22C55E',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              padding: '14px 48px',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : (authStatus !== 'authenticated' ? 'Sign Up to Upgrade' : 'Lock In $5/month')}
          </button>

          <button
            onClick={handleManage}
            style={{
              background: 'none',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#666',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            Already Pro? Manage subscription
          </button>

          <a href="/" style={{
            color: '#555', fontFamily: 'system-ui, sans-serif',
            textDecoration: 'underline', fontSize: '12px', marginTop: '8px',
          }}>
            &larr; back to free tier
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ProPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100vh' }} />}>
      <ProContent />
    </Suspense>
  )
}
