'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [digestResult, setDigestResult] = useState('')
  const [digestLoading, setDigestLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        window.location.href = '/'
      })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <p style={{ color: '#888', fontFamily: '"Comic Sans MS", cursive' }}>Loading your chaos...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#888', fontFamily: '"Comic Sans MS", cursive' }}>
            Not logged in. The chaos requires authentication.
          </p>
          <a href="/" style={{ color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive' }}>
            ← Back to flip-ly.net
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#fff' }}>
      {/* Clean header — chaos stays on landing page */}
      <header className="px-6 py-4 flex items-center justify-between" style={{
        borderBottom: '2px solid #222',
      }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🦞</span>
          <span className="font-bold" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
            FLIP-LY
          </span>
          <span className="text-xs px-2 py-0.5" style={{
            background: '#1a1a1a', border: '1px solid #333', color: '#888',
            fontFamily: 'monospace', fontSize: '10px',
          }}>
            DASHBOARD
          </span>
        </div>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5" style={{
          background: '#1a1a1a', border: '1px solid #333', color: '#888',
          fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
        }}>
          Sign Out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Welcome message */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4" style={{
            fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)',
          }}>
            Welcome to the chaos.
          </h1>
          <p className="text-base mb-2" style={{ color: '#ccc', fontFamily: 'monospace' }}>
            You made it. You signed up for a website with Comic Sans and a lobster cursor.
          </p>
          <p className="text-sm" style={{ color: '#888' }}>
            Your first weekly email will arrive soon. Until then, here&apos;s what&apos;s happening:
          </p>
        </div>

        {/* User info card */}
        <div className="mb-8 p-6" style={{
          background: '#1a1a1a', border: '2px dashed var(--lime)',
          boxShadow: '4px 4px 0 var(--hotpink)',
        }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--mustard)', fontFamily: 'monospace', letterSpacing: '2px' }}>
            YOUR PROFILE
          </h3>
          <div className="space-y-2 text-sm" style={{ fontFamily: 'monospace' }}>
            <p><span style={{ color: '#666' }}>email:</span> <span style={{ color: 'var(--lime)' }}>{user.email}</span></p>
            <p><span style={{ color: '#666' }}>city:</span> <span style={{ color: '#ccc' }}>{user.city || 'not set'}</span></p>
            <p><span style={{ color: '#666' }}>zip:</span> <span style={{ color: '#ccc' }}>{user.zip_code || 'not set'}</span></p>
            <p><span style={{ color: '#666' }}>plan:</span> <span style={{ color: user.is_premium ? 'var(--mustard)' : '#888' }}>{user.is_premium ? 'PREMIUM 👑' : 'free (the good kind)'}</span></p>
            <p><span style={{ color: '#666' }}>joined:</span> <span style={{ color: '#888' }}>{new Date(user.created_at).toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Weekly email status */}
        <div className="mb-8 p-6" style={{
          background: '#1a1a1a', border: '2px dashed var(--mustard)',
          boxShadow: '4px 4px 0 var(--electric)',
        }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--hotpink)', fontFamily: 'monospace', letterSpacing: '2px' }}>
            WEEKLY EMAIL STATUS
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--lime)', boxShadow: '0 0 8px var(--lime)' }} />
            <span className="text-sm" style={{ color: '#ccc', fontFamily: 'monospace' }}>Active — scanning for sales near {user.city || 'your area'}</span>
          </div>
          <p className="text-xs" style={{ color: '#666' }}>
            Next email: Monday 8:00 AM CDT
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: '#555' }}>
            We scrape Craigslist, EstateSales.net, and Facebook Marketplace so you don&apos;t have to.
          </p>
          <button
            onClick={async () => {
              setDigestLoading(true)
              setDigestResult('')
              try {
                const res = await fetch('/api/test-digest', { method: 'POST' })
                const data = await res.json()
                setDigestResult(data.message || 'Test digest triggered!')
              } catch {
                setDigestResult('Failed to trigger test digest')
              }
              setDigestLoading(false)
            }}
            disabled={digestLoading}
            className="px-4 py-2 text-xs font-bold"
            style={{
              background: digestLoading ? '#333' : 'var(--lime, #0FFF50)',
              color: '#000',
              border: '2px dashed #333',
              fontFamily: '"Comic Sans MS", cursive',
              cursor: digestLoading ? 'wait' : 'pointer',
            }}
          >
            {digestLoading ? 'Dialing 56k...' : '🧪 Trigger Test Digest'}
          </button>
          {digestResult && (
            <p className="text-xs mt-2" style={{ color: 'var(--mustard, #FFB81C)', fontFamily: 'monospace' }}>
              {digestResult}
            </p>
          )}
        </div>

        {/* What to expect */}
        <div className="p-6" style={{
          background: '#1a1a1a', border: '2px dashed var(--electric)',
          boxShadow: '4px 4px 0 var(--neon-orange)',
        }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--lime)', fontFamily: 'monospace', letterSpacing: '2px' }}>
            WHAT TO EXPECT
          </h3>
          <ul className="space-y-3 text-sm" style={{ fontFamily: 'monospace', color: '#ccc' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--lime)' }}>→</span>
              <span>Every Monday: email with 5-10 garage/estate sales near your zip code</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--hotpink)' }}>→</span>
              <span>Each listing includes: address, date, what&apos;s for sale, and a chaos rating</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--mustard)' }}>→</span>
              <span>Premium ($9/mo): ROI estimates, early access, and fewer lobster emojis</span>
            </li>
          </ul>
        </div>

        {/* Back to chaos */}
        <div className="mt-12 text-center">
          <a href="/" className="text-sm" style={{
            color: 'var(--electric)', fontFamily: '"Comic Sans MS", cursive',
          }}>
            ← back to the unhinged landing page
          </a>
        </div>
      </main>
    </div>
  )
}
