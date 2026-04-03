'use client'

import { useState, useEffect } from 'react'

const PREVIEW_LISTINGS = [
  'Mid-century dresser — solid wood, needs refinishing',
  'Vintage Pyrex mixing bowl set (4 piece, primary colors)',
  'Craftsman tool chest — full of hand tools, $40 takes it',
  'KitchenAid mixer — works great, minor paint chips',
  'Box of vinyl records — Beatles, Fleetwood Mac, misc.',
  'Cast iron skillet collection — 3 pieces, pre-seasoned',
  'Schwinn road bike — needs new tires, frame is solid',
  'Leather sectional — moving sale, priced to go',
  'Box of vintage baseball cards — Topps, upper deck, misc.',
  'Weber grill + propane tank — used twice, basically new',
  'Solid oak bookshelf — 6 feet tall, adjustable shelves',
  'Sewing machine (Singer) — works, includes carrying case',
]

const PREVIEW_DATES = ['Sat 4/5', 'Sun 4/6', 'Sat-Sun', 'Fri-Sun', 'This weekend']
const PREVIEW_PRICES = ['FREE', '$5', '$10-$50', '$2-$80', 'Make offer', '$15', '$40']

function DigestPreview({ city }: { city?: string }) {
  const [items, setItems] = useState<Array<{ title: string; date: string; price: string; score: number }>>([])
  const [refreshCount, setRefreshCount] = useState(0)

  const generateItems = () => {
    const shuffled = [...PREVIEW_LISTINGS].sort(() => Math.random() - 0.5).slice(0, 5)
    setItems(shuffled.map(title => ({
      title,
      date: PREVIEW_DATES[Math.floor(Math.random() * PREVIEW_DATES.length)],
      price: PREVIEW_PRICES[Math.floor(Math.random() * PREVIEW_PRICES.length)],
      score: Math.floor(Math.random() * 4) + 6,
    })))
  }

  useEffect(() => { generateItems() }, [])

  return (
    <div className="mb-6 rounded-xl overflow-hidden" style={{
      background: '#111', border: '1px solid #222',
    }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{
        borderBottom: '1px solid #222',
      }}>
        <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>
          Digest Preview
        </h3>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{
          background: 'rgba(34,197,94,0.1)', color: '#22C55E',
          fontSize: '11px', fontWeight: 500,
        }}>
          Sample data
        </span>
      </div>
      <div className="px-5 py-3">
        <p className="text-xs mb-3" style={{ color: '#666' }}>
          Here&apos;s a preview of what your Thursday digest looks like.
        </p>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{
              background: i === 0 ? 'rgba(34,197,94,0.05)' : 'transparent',
              borderLeft: `3px solid ${item.score >= 8 ? '#22C55E' : '#333'}`,
            }}>
              <span className="text-xs shrink-0 font-mono" style={{
                color: item.score >= 8 ? '#22C55E' : '#666',
                fontWeight: item.score >= 8 ? 600 : 400,
              }}>{item.score}/10</span>
              <span className="text-xs flex-1" style={{ color: '#ccc' }}>{item.title}</span>
              <span className="text-xs shrink-0" style={{ color: '#888' }}>{item.date}</span>
              <span className="text-xs shrink-0 font-medium" style={{
                color: item.price === 'FREE' ? '#22C55E' : '#fff',
              }}>{item.price}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 flex items-center justify-between" style={{
        borderTop: '1px solid #1a1a1a',
      }}>
        <p className="text-xs" style={{ color: '#555' }}>
          Real deals near {city || 'your area'} arrive every Thursday.
        </p>
        <button
          onClick={() => { generateItems(); setRefreshCount(r => r + 1) }}
          className="px-3 py-1.5 text-xs rounded-md shrink-0 ml-3"
          style={{
            background: '#1a1a1a', border: '1px solid #333',
            color: '#888', cursor: 'pointer',
          }}
        >
          Refresh {refreshCount > 0 ? `(${refreshCount})` : ''}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: '#888' }}>
            Please sign in to view your dashboard.
          </p>
          <a href="/" style={{ color: '#22C55E', fontSize: '14px' }}>
            &larr; Back to flip-ly.net
          </a>
        </div>
      </div>
    )
  }

  const username = user.email.split('@')[0]
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#fff' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div className="flex items-center gap-3">
          <a href="/" style={{ textDecoration: 'none' }}>
            <span className="font-bold text-lg" style={{ color: '#22C55E', letterSpacing: '-0.01em' }}>
              flip-ly.net
            </span>
          </a>
          <span className="text-xs px-2 py-0.5 rounded" style={{
            background: '#1a1a1a', border: '1px solid #222', color: '#666',
            fontSize: '11px',
          }}>
            Dashboard
          </span>
        </div>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-md" style={{
          background: 'transparent', border: '1px solid #333', color: '#888',
          cursor: 'pointer',
        }}>
          Sign Out
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>
            Hey, {username}.
          </h1>
          <p className="text-base mb-1" style={{ color: '#999' }}>
            We&apos;re scanning {user.city || 'your area'} for deals every day.
          </p>
          <p className="text-sm" style={{ color: '#666' }}>
            Your next digest arrives Thursday at 12 PM CDT.
          </p>
        </div>

        {/* Profile card */}
        <div className="mb-6 rounded-xl overflow-hidden" style={{
          background: '#111', border: '1px solid #222',
        }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>Your Account</h3>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#666' }}>Email</span>
              <span style={{ color: '#ccc' }}>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#666' }}>Market</span>
              <span style={{ color: '#ccc' }}>{user.city || 'Not set'}{user.state ? `, ${user.state}` : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#666' }}>Plan</span>
              {user.is_premium ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{
                  background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)',
                }}>Pro</span>
              ) : (
                <span style={{ color: '#888' }}>Free</span>
              )}
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#666' }}>Joined</span>
              <span style={{ color: '#888' }}>{joinDate}</span>
            </div>
          </div>
          {!user.is_premium && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
              <a href="/pro" className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold" style={{
                background: '#22C55E', color: '#000', textDecoration: 'none',
              }}>
                Upgrade to Pro &mdash; $5/mo
              </a>
              <p className="text-center mt-2" style={{ color: '#555', fontSize: '11px' }}>
                Early adopter pricing, locked in for life.
              </p>
            </div>
          )}
          {user.is_premium && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
              <a href="/pro" className="text-xs" style={{ color: '#666', textDecoration: 'underline' }}>
                Manage subscription
              </a>
            </div>
          )}
        </div>

        {/* Email status */}
        <div className="mb-6 rounded-xl overflow-hidden" style={{
          background: '#111', border: '1px solid #222',
        }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>Weekly Digest</h3>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-sm" style={{ color: '#ccc' }}>Active &mdash; scanning near {user.city || 'your area'}</span>
            </div>
            <p className="text-xs mb-1" style={{ color: '#666' }}>
              Every Thursday at 12:00 PM CDT
            </p>
            <p className="text-xs" style={{ color: '#555' }}>
              AI-scored deals from Craigslist, EstateSales.net, Eventbrite, and local sources &mdash; sorted by value so the best deals are on top.
            </p>
            {user.is_premium && (
              <div className="mt-3 px-3 py-2 rounded-lg" style={{
                background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)',
              }}>
                <p className="text-xs" style={{ color: '#22C55E' }}>
                  As a Pro member, you receive your digest 6 hours before free users.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Digest Preview */}
        <DigestPreview city={user.city} />

        {/* What you get */}
        <div className="mb-6 rounded-xl overflow-hidden" style={{
          background: '#111', border: '1px solid #222',
        }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>What&apos;s Included</h3>
          </div>
          <div className="px-5 py-4">
            <ul className="space-y-3 text-sm" style={{ color: '#999' }}>
              <li className="flex items-start gap-3">
                <span style={{ color: '#22C55E', fontSize: '12px', marginTop: '2px' }}>&#x2713;</span>
                <span>Weekly email with the best garage &amp; estate sales near you</span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#22C55E', fontSize: '12px', marginTop: '2px' }}>&#x2713;</span>
                <span>AI deal scores so you know what&apos;s worth the drive</span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#22C55E', fontSize: '12px', marginTop: '2px' }}>&#x2713;</span>
                <span>Search across 20+ sources &mdash; {user.is_premium ? 'unlimited' : '10 searches/day on free tier'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#22C55E', fontSize: '12px', marginTop: '2px' }}>&#x2713;</span>
                <span>Direct links to listings with dates, prices, and locations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Share */}
        <div className="mb-10 rounded-xl overflow-hidden" style={{
          background: '#111', border: '1px solid #222',
        }}>
          <div className="px-5 py-4">
            <p className="text-sm mb-3" style={{ color: '#999' }}>
              Know someone who&apos;d use this?
            </p>
            <button
              onClick={() => {
                const msg = `I've been using flip-ly.net to find garage and estate sales near me. It scans Craigslist, EstateSales.net, and other sources, then sends a weekly digest with the best deals scored by AI. Worth checking out.`
                navigator.clipboard.writeText(msg + '\n\nhttps://flip-ly.net')
                  .then(() => alert('Copied to clipboard!'))
                  .catch(() => alert('Could not copy — try again.'))
              }}
              className="px-4 py-2 text-sm rounded-lg font-medium"
              style={{
                background: '#1a1a1a',
                color: '#ccc',
                border: '1px solid #333',
                cursor: 'pointer',
              }}
            >
              Copy share link
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <a href="/" className="text-sm" style={{ color: '#555' }}>
            &larr; Back to flip-ly.net
          </a>
        </div>
      </main>
    </div>
  )
}
