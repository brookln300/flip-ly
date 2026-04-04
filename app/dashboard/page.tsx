'use client'

import { useState, useEffect, useCallback } from 'react'

/* ── TYPES ─────────────────────────────────────────────── */
interface Listing {
  id: string
  title: string
  price: string
  city: string
  date: string
  hot: boolean
  source: string
  deal_score: number | 'gated'
  deal_reason?: string
  description?: string
  tags?: string[]
  source_url?: string
  posted_at?: string
}

interface User {
  id: string
  email: string
  city: string
  state: string
  market_id: string
  is_premium: boolean
  created_at: string
}

interface SearchGate {
  is_premium: boolean
  searches_used: number
  searches_remaining: number
  searches_max: number
  limited?: boolean
}

/* ── INLINE STYLES ─────────────────────────────────────── */
const DASH_CSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
  .dash-fade { animation: fadeIn 0.4s ease-out both }
  .dash-fade-d1 { animation-delay: 0.05s }
  .dash-fade-d2 { animation-delay: 0.1s }
  .dash-fade-d3 { animation-delay: 0.15s }
  .dash-fade-d4 { animation-delay: 0.2s }
  .dash-row:hover { background: rgba(255,255,255,0.02) !important }
  .dash-row { transition: background 0.15s ease }
  .dash-tag:hover { border-color: #444 !important; color: #bbb !important }
  .dash-search:focus-within { border-color: #333 !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.06) !important }
  .dash-stat { position: relative; overflow: hidden }
  .dash-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent) }
`

const font = 'Inter, system-ui, -apple-system, sans-serif'

/* ── STAT CARD ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: boolean; icon: string
}) {
  return (
    <div className="dash-stat" style={{
      background: 'linear-gradient(145deg, #111 0%, #0d0d0d 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '22px 20px',
      flex: 1, minWidth: '150px',
    }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '14px', opacity: 0.5 }}>{icon}</span>
        <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: font, fontWeight: 500 }}>
          {label}
        </p>
      </div>
      <p style={{
        color: accent ? '#22C55E' : '#fff',
        fontSize: '32px', fontWeight: 700, fontFamily: font,
        lineHeight: 1, letterSpacing: '-0.03em',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: '#444', fontSize: '12px', marginTop: '6px', fontFamily: font, fontWeight: 400 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ── SCORE BADGE ───────────────────────────────────────── */
function ScoreBadge({ score }: { score: number | 'gated' }) {
  if (score === 'gated') {
    return (
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '9px', color: '#444', fontFamily: font, fontWeight: 600, letterSpacing: '0.05em' }}>PRO</span>
      </div>
    )
  }
  const isHot = score >= 8
  const isMid = score >= 6
  const color = isHot ? '#22C55E' : isMid ? '#F59E0B' : '#555'
  const bg = isHot ? 'rgba(34,197,94,0.08)' : isMid ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)'
  const border = isHot ? 'rgba(34,197,94,0.15)' : isMid ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)'
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '12px',
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: font, color, letterSpacing: '-0.02em' }}>
        {score}
      </span>
    </div>
  )
}

/* ── MAIN DASHBOARD ────────────────────────────────────── */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [hotDeals, setHotDeals] = useState<Listing[]>([])
  const [totalListings, setTotalListings] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchGate, setSearchGate] = useState<SearchGate | null>(null)
  const [activeTab, setActiveTab] = useState<'deals' | 'search'>('deals')
  const [searchResults, setSearchResults] = useState<Listing[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [meta, setMeta] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { setUser(data.user); setLoading(false) })
      .catch(() => { setLoading(false); window.location.href = '/' })
  }, [])

  useEffect(() => {
    if (!user?.market_id) return
    fetch(`/api/listings?hot=true&limit=10`)
      .then(r => r.json())
      .then(data => {
        if (data.results) setHotDeals(data.results)
        if (data._meta) setMeta(data._meta)
      })
      .catch(() => {})
    fetch(`/api/listings?limit=20`)
      .then(r => r.json())
      .then(data => {
        if (data.results) setListings(data.results)
        if (data.total) setTotalListings(data.total)
        if (data._gate) setSearchGate(data._gate)
      })
      .catch(() => {})
  }, [user])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const params = new URLSearchParams({ q: searchQuery, limit: '20' })
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (data._gate?.limited) { setSearchGate(data._gate); setSearchResults([]); return }
      setSearchResults(data.results || [])
      setSearchTotal(data.total || 0)
      if (data._gate) setSearchGate(data._gate)
      setActiveTab('search')
    } catch {} finally { setSearching(false) }
  }, [searchQuery])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid #1a1a1a', borderTop: '2px solid #22C55E', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#444', fontSize: '13px', fontFamily: font, fontWeight: 500 }}>Loading...</p>
        </div>
        <style>{DASH_CSS}</style>
      </div>
    )
  }

  /* Not authenticated */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <p style={{ color: '#666', fontSize: '15px', fontFamily: font, marginBottom: '16px' }}>Sign in to continue.</p>
          <a href="/" style={{ color: '#22C55E', fontSize: '14px', fontFamily: font, fontWeight: 500 }}>&larr; flip-ly.net</a>
        </div>
      </div>
    )
  }

  const username = user.email.split('@')[0]
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const dow = new Date().getDay()
  const daysUntilThursday = (4 - dow + 7) % 7 || 7
  const nextDigest = daysUntilThursday === 0 ? 'Today' : daysUntilThursday === 1 ? 'Tomorrow' : `${daysUntilThursday} days`
  const dataAge = meta?.age_hours != null ? `${Math.round(meta.age_hours)}h ago` : ''
  const displayListings = activeTab === 'search' ? searchResults : (hotDeals.length > 0 ? hotDeals : listings)
  const displayTotal = activeTab === 'search' ? searchTotal : totalListings

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#fff' }}>
      <style>{DASH_CSS}</style>

      {/* ═══ HEADER ═══ */}
      <header className="px-5 md:px-8 py-3.5 flex items-center justify-between" style={{
        background: 'rgba(8,8,8,0.8)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 80,
      }}>
        <div className="flex items-center gap-3">
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fff', fontSize: '17px', fontWeight: 700, fontFamily: font, letterSpacing: '-0.03em' }}>
              FLIP-LY
            </span>
          </a>
          {user.is_premium && (
            <span style={{
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#000', padding: '3px 10px',
              borderRadius: '6px', fontSize: '10px', fontWeight: 700,
              fontFamily: font, letterSpacing: '0.04em',
            }}>PRO</span>
          )}
          <span style={{
            color: '#333', fontSize: '12px', fontFamily: font,
            marginLeft: '4px',
          }}>/</span>
          <span style={{
            color: '#555', fontSize: '13px', fontFamily: font, fontWeight: 500,
          }}>Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: '#444', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
            {user.city || 'All Markets'}
          </span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            color: '#555', cursor: 'pointer', padding: '7px 14px', fontSize: '12px',
            fontFamily: font, fontWeight: 500, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#888' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#555' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        {/* ═══ WELCOME ═══ */}
        <div className="dash-fade mb-10">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 style={{
                fontSize: '28px', fontWeight: 700, color: '#fff',
                fontFamily: font, letterSpacing: '-0.03em', marginBottom: '6px',
              }}>
                Welcome back, {username}
              </h1>
              <p style={{ color: '#555', fontSize: '14px', fontFamily: font, fontWeight: 400 }}>
                Scanning {user.city || 'your area'} for deals{dataAge ? ` · Updated ${dataAge}` : ''}
              </p>
            </div>
            {!user.is_premium && (
              <a href="/pro" style={{
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#000', padding: '10px 20px',
                borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                fontFamily: font, textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(34,197,94,0.2)',
              }}>
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>

        {/* ═══ STATS ROW ═══ */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="dash-fade dash-fade-d1" style={{ flex: 1, display: 'flex' }}>
            <StatCard icon="&#9679;" label="Total Deals" value={totalListings > 0 ? totalListings.toLocaleString() : '—'} sub="in your market" />
          </div>
          <div className="dash-fade dash-fade-d2" style={{ flex: 1, display: 'flex' }}>
            <StatCard icon="&#9650;" label="Hot Deals" value={hotDeals.length > 0 ? String(hotDeals.length) : '—'} sub="scored 8+" accent />
          </div>
          <div className="dash-fade dash-fade-d3" style={{ flex: 1, display: 'flex' }}>
            <StatCard icon="&#9200;" label="Next Digest" value={nextDigest} sub="Thursday 12 PM CDT" />
          </div>
          <div className="dash-fade dash-fade-d4" style={{ flex: 1, display: 'flex' }}>
            <StatCard
              icon="&#128270;"
              label="Searches"
              value={searchGate?.is_premium ? '∞' : (searchGate?.searches_remaining != null ? `${searchGate.searches_remaining}` : '—')}
              sub={searchGate?.is_premium ? 'unlimited' : (searchGate ? `of ${searchGate.searches_max} today` : '')}
              accent={searchGate?.is_premium}
            />
          </div>
        </div>

        {/* ═══ SEARCH BAR ═══ */}
        <div className="dash-fade mb-8">
          <form onSubmit={handleSearch}>
            <div className="dash-search" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '5px', display: 'flex', gap: '4px',
              transition: 'all 0.2s ease',
            }}>
              <div className="flex-1 flex items-center gap-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tools, vintage, furniture, electronics..."
                  style={{
                    width: '100%', padding: '12px 0', border: 'none', outline: 'none',
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    color: '#ddd', background: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                />
              </div>
              <button type="submit" disabled={searching} style={{
                padding: '12px 24px',
                background: searching ? '#1a1a1a' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: searching ? '#666' : '#000', border: 'none', borderRadius: '10px',
                fontFamily: font, fontWeight: 600, fontSize: '13px',
                cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                boxShadow: searching ? 'none' : '0 2px 8px rgba(34,197,94,0.15)',
                transition: 'all 0.2s ease',
              }}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {['tools', 'vintage', 'furniture', 'free', 'electronics', 'estate sale', 'collectibles'].map(tag => (
              <button key={tag} type="button" className="dash-tag" onClick={() => setSearchQuery(tag)} style={{
                padding: '6px 14px',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px',
                fontFamily: font, fontSize: '12px', fontWeight: 500,
                color: '#555', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.15s ease',
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ RATE LIMIT ═══ */}
        {searchGate?.limited && (
          <div className="mb-8" style={{
            background: 'rgba(255,68,68,0.04)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '14px',
            padding: '20px 24px', textAlign: 'center',
          }}>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, fontFamily: font, marginBottom: '6px' }}>
              Daily search limit reached
            </p>
            <p style={{ color: '#666', fontSize: '13px', fontFamily: font, marginBottom: '16px' }}>
              Free accounts get 10 searches per day.
            </p>
            <a href="/pro" style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#000',
              borderRadius: '10px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', fontFamily: font,
            }}>
              Upgrade to Pro &mdash; $5/mo
            </a>
          </div>
        )}

        {/* ═══ TAB SWITCHER ═══ */}
        <div className="flex items-center gap-0 mb-5">
          <button onClick={() => setActiveTab('deals')} style={{
            padding: '10px 20px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'deals' ? '2px solid #22C55E' : '2px solid transparent',
            color: activeTab === 'deals' ? '#fff' : '#444',
            fontFamily: font, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.01em',
          }}>
            Hot Deals
          </button>
          {searchResults.length > 0 && (
            <button onClick={() => setActiveTab('search')} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'search' ? '2px solid #22C55E' : '2px solid transparent',
              color: activeTab === 'search' ? '#fff' : '#444',
              fontFamily: font, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.01em',
            }}>
              Results ({searchTotal})
            </button>
          )}
          <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
          {activeTab === 'deals' && (
            <span style={{ color: '#F59E0B', fontSize: '11px', fontFamily: font, fontWeight: 500, paddingBottom: '10px' }}>
              8+ = HOT
            </span>
          )}
        </div>

        {/* ═══ LISTINGS FEED ═══ */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-3 px-1">
            <span style={{ color: '#444', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
              {activeTab === 'search'
                ? `${searchResults.length} of ${searchTotal} results`
                : `${displayListings.length} top deals in ${user.city || 'your market'}`}
            </span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {displayListings.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ color: '#444', fontSize: '14px', fontFamily: font }}>
                  {activeTab === 'search' ? 'No results. Try a different search.' : 'Loading deals...'}
                </p>
              </div>
            ) : displayListings.map((listing, i) => (
              <div key={listing.id || i} className="dash-row flex items-center gap-4 px-5 py-4" style={{
                borderBottom: i < displayListings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: listing.source_url ? 'pointer' : 'default',
              }}
              onClick={() => { if (listing.source_url) window.open(listing.source_url, '_blank') }}
              >
                <ScoreBadge score={listing.deal_score} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {listing.hot && (
                      <span style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#000', padding: '2px 8px',
                        borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                        fontFamily: font, letterSpacing: '0.04em',
                      }}>HOT</span>
                    )}
                    <span className="truncate" style={{
                      color: '#e5e5e5', fontSize: '14px', fontWeight: 500,
                      fontFamily: font, letterSpacing: '-0.01em',
                    }}>
                      {listing.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {listing.city && (
                      <span style={{ fontSize: '12px', color: '#555', fontFamily: font, fontWeight: 400 }}>{listing.city}</span>
                    )}
                    <span style={{
                      textTransform: 'uppercase', fontSize: '10px', color: '#444',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '1px 6px', borderRadius: '4px',
                      fontFamily: font, fontWeight: 500, letterSpacing: '0.04em',
                    }}>{listing.source}</span>
                    {listing.date && (
                      <span style={{ fontSize: '12px', color: '#444', fontFamily: font }}>{listing.date}</span>
                    )}
                    {listing.description && (
                      <span className="truncate hidden md:inline" style={{ color: '#333', fontSize: '12px', maxWidth: '220px', fontFamily: font }}>
                        {listing.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div style={{
                    fontFamily: font, fontWeight: 700,
                    fontSize: listing.price === 'FREE' ? '15px' : '14px',
                    color: listing.price === 'FREE' ? '#22C55E' : listing.price === 'Not listed' ? '#333' : '#e5e5e5',
                    letterSpacing: '-0.02em',
                  }}>
                    {listing.price === 'FREE' ? 'FREE' : listing.price === 'Not listed' ? '—' : listing.price || '—'}
                  </div>
                  {listing.source_url && (
                    <span style={{ fontSize: '10px', color: '#333', fontFamily: font }}>
                      &#8599;
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {displayTotal > displayListings.length && (
            <div className="mt-4 text-center">
              <p style={{ color: '#444', fontSize: '12px', fontFamily: font }}>
                {displayTotal - displayListings.length} more deals available
                {!user.is_premium && (
                  <> &middot; <a href="/pro" style={{ color: '#22C55E', textDecoration: 'none', fontWeight: 500 }}>Unlock all</a></>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ═══ BOTTOM CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Digest */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '24px',
          }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <h3 style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: 600, fontFamily: font, letterSpacing: '-0.01em' }}>
                Weekly Digest
              </h3>
            </div>
            <p style={{ color: '#666', fontSize: '13px', fontFamily: font, marginBottom: '4px' }}>
              Scanning near {user.city || 'your area'}
            </p>
            <p style={{ color: '#444', fontSize: '12px', fontFamily: font, marginBottom: '14px' }}>
              Delivered every Thursday at 12:00 PM CDT
            </p>
            {user.is_premium ? (
              <div style={{
                background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
                borderRadius: '10px', padding: '12px 14px',
              }}>
                <p style={{ color: '#22C55E', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
                  You get your digest 6 hours before free users.
                </p>
              </div>
            ) : (
              <a href="/pro" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                color: '#F59E0B', fontSize: '13px', textDecoration: 'none',
                fontFamily: font, fontWeight: 500,
              }}>
                Get your digest 6 hours early <span style={{ fontSize: '12px' }}>&rarr;</span>
              </a>
            )}
          </div>

          {/* Account */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '24px',
          }}>
            <h3 style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: 600, fontFamily: font, letterSpacing: '-0.01em', marginBottom: '16px' }}>
              Account
            </h3>
            <div className="space-y-3" style={{ fontFamily: font }}>
              {[
                { l: 'Email', v: user.email },
                { l: 'Market', v: `${user.city || 'Not set'}${user.state ? `, ${user.state}` : ''}` },
                { l: 'Plan', v: user.is_premium ? 'Pro' : 'Free', accent: user.is_premium },
                { l: 'Member since', v: joinDate },
              ].map(row => (
                <div key={row.l} className="flex justify-between items-center">
                  <span style={{ color: '#444', fontSize: '13px', fontWeight: 400 }}>{row.l}</span>
                  <span style={{
                    color: row.accent ? '#22C55E' : '#888',
                    fontSize: '13px', fontWeight: row.accent ? 600 : 400,
                  }}>{row.v}</span>
                </div>
              ))}
            </div>
            {user.is_premium && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <a href="/pro" style={{ color: '#444', fontSize: '12px', textDecoration: 'none', fontFamily: font, fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                  Manage subscription &rarr;
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SHARE BAR ═══ */}
        <div className="mb-10 flex items-center justify-between px-5 py-4" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
        }}>
          <p style={{ color: '#555', fontSize: '13px', fontFamily: font, fontWeight: 400 }}>
            Know someone who flips?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText('Check out flip-ly.net — scans Craigslist, EstateSales.net & 20+ sources, sends AI-scored deals weekly.\n\nhttps://flip-ly.net')
                .then(() => alert('Copied!'))
                .catch(() => alert('Could not copy.'))
            }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '8px 16px', color: '#666', cursor: 'pointer',
              fontSize: '12px', fontFamily: font, fontWeight: 500, whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#aaa' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#666' }}
          >
            Share flip-ly
          </button>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="text-center pb-10">
          <a href="/" style={{ color: '#333', fontSize: '12px', fontFamily: font, textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#666' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
          >
            &larr; flip-ly.net
          </a>
        </div>
      </main>
    </div>
  )
}
