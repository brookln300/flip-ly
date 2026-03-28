'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ProContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something broke. The lobster is investigating.')
        setLoading(false)
      }
    } catch {
      alert('Network error. Try again.')
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Portal unavailable.')
        setLoading(false)
      }
    } catch {
      alert('Network error. Try again.')
      setLoading(false)
    }
  }

  // POST-CHECKOUT SUCCESS
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center px-8 max-w-lg">
          <p className="text-6xl mb-6">🦞💎</p>
          <h1 className="text-3xl font-bold mb-4" style={{
            fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)',
          }}>
            WELCOME TO FIRST DIBS, PRO.
          </h1>
          <p className="text-base mb-4" style={{ color: '#ccc', fontFamily: '"Courier New", monospace' }}>
            You now get the digest 6 hours before everyone else.
            While normies sleep, you flip.
          </p>
          <div className="mb-6 p-4 inline-block" style={{
            border: '3px dashed var(--hotpink)',
            background: '#1a1a1a',
          }}>
            <p style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--neon-orange)', fontSize: '16px' }}>
              PRO MEMBER — FIRST DIBS 🥇
            </p>
            <p style={{ fontFamily: 'monospace', color: '#888', fontSize: '11px', marginTop: '4px' }}>
              $5/mo &middot; cancel anytime &middot; no hard feelings
            </p>
          </div>
          <div className="mb-6">
            <p style={{ color: 'var(--mustard)', fontSize: '13px', fontFamily: 'monospace' }}>
              ✅ Digest 6hrs early &middot; ✅ Unlimited search &middot; ✅ Full deal data
            </p>
          </div>
          <a href="/" style={{
            color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive',
            textDecoration: 'underline',
          }}>
            ← return to the chaos (now with first dibs)
          </a>
        </div>
      </div>
    )
  }

  // POST-CHECKOUT CANCEL
  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center px-8 max-w-lg">
          <p className="text-6xl mb-6">🦞😔</p>
          <h1 className="text-3xl font-bold mb-4" style={{
            fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)',
          }}>
            THE LOBSTER UNDERSTANDS.
          </h1>
          <p className="text-base mb-6" style={{ color: '#888', fontFamily: '"Courier New", monospace' }}>
            $5 is a lot when you could just... be 6 hours late to every deal.
            That&apos;s fine. You like sloppy seconds. We don&apos;t judge.
          </p>
          <a href="/" style={{
            color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive',
            textDecoration: 'underline',
          }}>
            ← back to peasant-tier chaos
          </a>
        </div>
      </div>
    )
  }

  // DEFAULT: PRO UPGRADE PAGE
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="text-center px-8 max-w-xl">
        <p className="text-6xl mb-4">🦞</p>
        <h1 className="text-4xl font-bold mb-2" style={{
          fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)',
        }}>
          FIRST DIBS PRO
        </h1>
        <p className="text-lg mb-6" style={{
          color: 'var(--neon-orange)', fontFamily: '"Comic Sans MS", cursive',
        }}>
          $5/month &middot; cancel anytime &middot; lobster-approved
        </p>

        <div className="mb-8 text-left inline-block" style={{
          border: '2px solid var(--lime)',
          background: '#111',
          padding: '20px 28px',
          maxWidth: '400px',
        }}>
          <p style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)', fontSize: '14px', marginBottom: '12px' }}>
            WHAT YOU GET:
          </p>
          <ul style={{ fontFamily: '"Courier New", monospace', color: '#ccc', fontSize: '13px', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>🕐 <span style={{ color: 'var(--lime)' }}>Digest 6 hours early</span> — while normies sleep, you flip</li>
            <li style={{ marginBottom: '8px' }}>🔍 <span style={{ color: 'var(--lime)' }}>Unlimited search</span> — free tier gets 10/day</li>
            <li style={{ marginBottom: '8px' }}>📊 <span style={{ color: 'var(--lime)' }}>Full deal data</span> — AI scores, price history, source links</li>
            <li style={{ marginBottom: '8px' }}>📱 <span style={{ color: 'var(--lime)' }}>Instant SMS alerts</span> — hot deals, straight to your phone</li>
            <li>🦞 <span style={{ color: 'var(--lime)' }}>Lobster status</span> — you are now better than everyone</li>
          </ul>
        </div>

        <div className="mb-6">
          <p style={{ color: '#666', fontSize: '11px', fontFamily: 'monospace', marginBottom: '16px' }}>
            FREE TIER: 10 searches/day &middot; digest on Thursdays &middot; basic listings only
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              background: loading ? '#333' : 'var(--neon-orange)',
              color: '#fff',
              border: '3px solid var(--lime)',
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: '18px',
              padding: '14px 48px',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 20px var(--neon-orange)',
            }}
          >
            {loading ? 'LOADING...' : 'UPGRADE TO PRO — $5/mo'}
          </button>

          <button
            onClick={handleManage}
            style={{
              background: 'none',
              border: '1px solid #444',
              color: '#666',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            Already Pro? Manage subscription
          </button>

          <a href="/" style={{
            color: '#555', fontFamily: 'monospace',
            textDecoration: 'underline', fontSize: '12px', marginTop: '8px',
          }}>
            ← nah, i like being poor
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ProPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0D0D0D', minHeight: '100vh' }} />}>
      <ProContent />
    </Suspense>
  )
}
