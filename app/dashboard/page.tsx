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
  name?: string
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
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
  @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
  .dash-fade { animation: fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both }
  .dash-fade-d1 { animation-delay: 0.06s }
  .dash-fade-d2 { animation-delay: 0.12s }
  .dash-fade-d3 { animation-delay: 0.18s }
  .dash-fade-d4 { animation-delay: 0.24s }
  .dash-row:hover { background: rgba(255,255,255,0.03) !important; transform: translateX(2px) }
  .dash-row { transition: all 0.2s cubic-bezier(0.16,1,0.3,1) }
  .dash-tag:hover { border-color: rgba(34,197,94,0.3) !important; color: #22C55E !important; background: rgba(34,197,94,0.04) !important }
  .dash-search:focus-within { border-color: rgba(34,197,94,0.2) !important; box-shadow: 0 0 0 4px rgba(34,197,94,0.05), 0 4px 24px rgba(0,0,0,0.3) !important }
  .dash-stat { position: relative; overflow: hidden; transition: all 0.2s ease }
  .dash-stat:hover { border-color: rgba(255,255,255,0.1) !important; transform: translateY(-1px) }
  .dash-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent) }
  .dash-btn-outline:hover { border-color: rgba(255,255,255,0.2) !important; color: #aaa !important; background: rgba(255,255,255,0.03) !important }
`

const font = 'var(--font-primary), system-ui, -apple-system, sans-serif'

/* ── HELPERS ───────────────────────────────────────────── */
function formatDisplayName(user: User): string {
  if (user.name) return user.name.split(' ')[0]
  const raw = user.email.split('@')[0]
  // Strip special chars, trailing numbers, possessives
  const cleaned = raw.replace(/[._\-']/g, ' ').replace(/\d+$/g, '').replace(/\bs\b$/i, '').trim()
  if (!cleaned) return raw
  const first = cleaned.split(' ')[0].toLowerCase()
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function formatTimeAgo(hours: number): string {
  if (hours < 1) return 'Just now'
  if (hours < 2) return '1 hour ago'
  if (hours < 24) return `${Math.round(hours)}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day ago' : `${days}d ago`
}

/* ── STAT CARD ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, icon, accentColor }: {
  label: string; value: string; sub?: string; accent?: boolean; icon: React.ReactNode; accentColor?: string
}) {
  const color = accentColor || (accent ? '#22C55E' : '#fff')
  return (
    <div className="dash-stat" style={{
      background: 'linear-gradient(145deg, rgba(18,18,18,0.9) 0%, rgba(12,12,12,0.9) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '20px 20px 18px',
      flex: 1, minWidth: '140px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: `${color}08`, border: `1px solid ${color}15` }}>
          {icon}
        </span>
        <p style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: font, fontWeight: 600 }}>
          {label}
        </p>
      </div>
      <p style={{
        color, fontSize: '30px', fontWeight: 700, fontFamily: font,
        lineHeight: 1, letterSpacing: '-0.04em',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: '#3a3a3a', fontSize: '12px', marginTop: '8px', fontFamily: font, fontWeight: 400 }}>
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
        width: '46px', height: '46px', borderRadius: '13px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    )
  }
  const isExcellent = score >= 9
  const isGood = score >= 7
  const isMid = score >= 5
  const color = isExcellent ? 'var(--score-excellent)' : isGood ? 'var(--score-good)' : isMid ? 'var(--score-average)' : 'var(--score-low)'
  const bg = isExcellent ? 'rgba(34,197,94,0.1)' : isGood ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)'
  const border = isExcellent ? 'rgba(34,197,94,0.2)' : isGood ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'
  return (
    <div style={{
      width: '46px', height: '46px', borderRadius: '13px',
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: isExcellent ? '0 0 12px rgba(34,197,94,0.08)' : 'none',
    }}>
      <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-mono), monospace', color, letterSpacing: '-0.02em' }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #111', borderTop: '2px solid var(--accent-green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#333', fontSize: '13px', fontFamily: font, fontWeight: 500 }}>Loading dashboard...</p>
        </div>
        <style>{DASH_CSS}</style>
      </div>
    )
  }

  /* Not authenticated */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: '#666', fontSize: '15px', fontFamily: font, marginBottom: '16px' }}>Sign in to continue.</p>
          <a href="/" style={{ color: 'var(--accent-green)', fontSize: '14px', fontFamily: font, fontWeight: 500 }}>&larr; flip-ly.net</a>
        </div>
      </div>
    )
  }

  const displayName = formatDisplayName(user)
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const dow = new Date().getDay()
  const daysUntilThursday = (4 - dow + 7) % 7 || 7
  const nextDigest = daysUntilThursday === 0 ? 'Today' : daysUntilThursday === 1 ? 'Tomorrow' : `${daysUntilThursday} days`
  const nextDigestSub = daysUntilThursday === 0 ? 'Check your inbox' : 'Thursday 12 PM CDT'
  const dataAge = meta?.age_hours != null ? formatTimeAgo(meta.age_hours) : ''
  const displayListings = activeTab === 'search' ? searchResults : (hotDeals.length > 0 ? hotDeals : listings)
  const displayTotal = activeTab === 'search' ? searchTotal : totalListings
  // Avoid "Bowling Green, Ky, KY" — if city already contains state abbreviation, skip appending state
  const cityAlreadyHasState = user.city && user.state && user.city.toLowerCase().includes(user.state.toLowerCase().replace(/\.$/, ''))
  const marketLabel = cityAlreadyHasState ? user.city : (user.city && user.state ? `${user.city}, ${user.state}` : user.city || 'your area')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: '#fff' }}>
      <style>{DASH_CSS}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: '0 max(20px, calc((100% - 920px) / 2))',
        background: 'rgba(6,6,6,0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 80,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#22C55E"/>
                <path d="M7 8h10M7 12h7M7 16h4" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: font, letterSpacing: '-0.03em' }}>
                flip-ly
              </span>
            </a>
            <span style={{ color: '#222', fontSize: '14px' }}>/</span>
            <span style={{ color: '#444', fontSize: '13px', fontFamily: font, fontWeight: 500 }}>
              Dashboard
            </span>
            {user.is_premium && (
              <span style={{
                background: 'var(--accent-green)',
                color: '#000', padding: '2px 8px',
                borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                fontFamily: font, letterSpacing: '0.06em',
              }}>PRO</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ color: '#444', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
                {marketLabel}
              </span>
            </div>
            <button onClick={handleLogout} className="dash-btn-outline" style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              color: '#444', cursor: 'pointer', padding: '6px 14px', fontSize: '12px',
              fontFamily: font, fontWeight: 500, transition: 'all 0.2s',
            }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 20px 60px' }}>
        {/* ═══ WELCOME ═══ */}
        <div className="dash-fade" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{
                fontSize: '26px', fontWeight: 700, color: '#fff',
                fontFamily: font, letterSpacing: '-0.04em', marginBottom: '6px',
              }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ color: '#444', fontSize: '14px', fontFamily: font, fontWeight: 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
                Scanning {marketLabel} for deals{dataAge ? ` · ${dataAge}` : ''}
              </p>
            </div>
            {!user.is_premium && (
              <a href="/pro" style={{
                background: 'var(--accent-green)',
                color: '#000', padding: '10px 22px',
                borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                fontFamily: font, textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 2px 12px rgba(34,197,94,0.2)',
              }}>
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>

        {/* ═══ STATS ROW ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          <div className="dash-fade dash-fade-d1">
            <StatCard
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
              label="Total Deals"
              value={totalListings > 0 ? totalListings.toLocaleString() : '—'}
              sub="in your market"
              accentColor="#3B82F6"
            />
          </div>
          <div className="dash-fade dash-fade-d2">
            <StatCard
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
              label="Hot Deals"
              value={hotDeals.length > 0 ? String(hotDeals.length) : '—'}
              sub="scored 8+"
              accent
            />
          </div>
          <div className="dash-fade dash-fade-d3">
            <StatCard
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              label="Next Digest"
              value={nextDigest}
              sub={nextDigestSub}
              accentColor="#A855F7"
            />
          </div>
          <div className="dash-fade dash-fade-d4">
            <StatCard
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={searchGate?.is_premium ? '#22C55E' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
              label="Searches"
              value={searchGate?.is_premium ? '∞' : (searchGate?.searches_remaining != null ? `${searchGate.searches_remaining}` : (searchGate?.searches_max != null ? `${searchGate.searches_max}` : '15'))}
              sub={searchGate?.is_premium ? 'unlimited' : (searchGate ? `of ${searchGate.searches_max} today` : '')}
              accent={searchGate?.is_premium}
              accentColor={searchGate?.is_premium ? '#22C55E' : '#F59E0B'}
            />
          </div>
        </div>

        {/* ═══ SEARCH BAR ═══ */}
        <div className="dash-fade" style={{ marginBottom: '28px' }}>
          <form onSubmit={handleSearch}>
            <div className="dash-search" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '4px', display: 'flex', gap: '4px',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search deals — tools, vintage, furniture, electronics..."
                  style={{
                    width: '100%', padding: '14px 0', border: 'none', outline: 'none',
                    fontFamily: font, fontSize: '14px', fontWeight: 400,
                    color: '#ddd', background: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                />
              </div>
              <button type="submit" disabled={searching} style={{
                padding: '12px 28px',
                background: searching ? '#111' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: searching ? '#666' : '#000', border: 'none', borderRadius: '10px',
                fontFamily: font, fontWeight: 600, fontSize: '13px',
                cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                boxShadow: searching ? 'none' : '0 2px 12px rgba(34,197,94,0.2)',
                transition: 'all 0.2s ease',
              }}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' as any }}>
            {['tools', 'vintage', 'furniture', 'free', 'electronics', 'estate sale', 'collectibles'].map(tag => (
              <button key={tag} type="button" className="dash-tag" onClick={() => setSearchQuery(tag)} style={{
                padding: '5px 14px',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px',
                fontFamily: font, fontSize: '12px', fontWeight: 500,
                color: '#444', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.2s ease',
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ RATE LIMIT ═══ */}
        {searchGate?.limited && (
          <div style={{
            marginBottom: '28px',
            background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '14px',
            padding: '20px 24px', textAlign: 'center',
          }}>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, fontFamily: font, marginBottom: '6px' }}>
              Daily search limit reached
            </p>
            <p style={{ color: '#555', fontSize: '13px', fontFamily: font, marginBottom: '16px' }}>
              Free accounts get {searchGate.searches_max} searches per day.
            </p>
            <a href="/pro" style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'var(--accent-green)', color: '#000',
              borderRadius: '10px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', fontFamily: font,
            }}>
              Upgrade to Pro
            </a>
          </div>
        )}

        {/* ═══ TAB SWITCHER ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '0px' }}>
          <button onClick={() => setActiveTab('deals')} style={{
            padding: '10px 18px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'deals' ? '2px solid #22C55E' : '2px solid transparent',
            color: activeTab === 'deals' ? '#fff' : '#333',
            fontFamily: font, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '-0.01em',
          }}>
            Hot Deals
          </button>
          {searchResults.length > 0 && (
            <button onClick={() => setActiveTab('search')} style={{
              padding: '10px 18px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'search' ? '2px solid #22C55E' : '2px solid transparent',
              color: activeTab === 'search' ? '#fff' : '#333',
              fontFamily: font, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '-0.01em',
            }}>
              Results ({searchTotal})
            </button>
          )}
          <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
          {activeTab === 'deals' && hotDeals.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--score-excellent)', display: 'inline-block' }} />
              <span style={{ color: '#333', fontSize: '11px', fontFamily: font, fontWeight: 500 }}>
                Score color = deal quality
              </span>
            </div>
          )}
        </div>

        {/* ═══ LISTINGS FEED ═══ */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 2px' }}>
            <span style={{ color: '#333', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
              {activeTab === 'search'
                ? `${searchResults.length} of ${searchTotal} results`
                : `${displayListings.length} top deals in ${marketLabel}`}
            </span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.015)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}>
            {displayListings.length === 0 ? (
              <div style={{ padding: '56px 20px', textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <p style={{ color: '#333', fontSize: '14px', fontFamily: font }}>
                  {activeTab === 'search' ? 'No results found. Try a different search.' : 'Scanning for deals...'}
                </p>
              </div>
            ) : displayListings.map((listing, i) => (
              <div key={listing.id || i} className="dash-row" style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                borderBottom: i < displayListings.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                cursor: listing.source_url ? 'pointer' : 'default',
              }}
              onClick={() => { if (listing.source_url) window.open(listing.source_url, '_blank') }}
              >
                <ScoreBadge score={listing.deal_score} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      color: '#e0e0e0', fontSize: '14px', fontWeight: 500,
                      fontFamily: font, letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {listing.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {listing.city && (
                      <span style={{ fontSize: '12px', color: '#444', fontFamily: font, fontWeight: 400 }}>{listing.city}</span>
                    )}
                    <span style={{
                      textTransform: 'uppercase', fontSize: '9px', color: '#3a3a3a',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '2px 6px', borderRadius: '4px',
                      fontFamily: font, fontWeight: 600, letterSpacing: '0.06em',
                    }}>{listing.source}</span>
                    {listing.description && (
                      <span style={{ color: '#282828', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', fontFamily: font }}>
                        {listing.description}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{
                    fontFamily: font, fontWeight: 700,
                    fontSize: '14px',
                    color: listing.price === 'FREE' ? 'var(--accent-green)' : listing.price === 'Not listed' ? 'var(--text-dim)' : 'var(--text-secondary)',
                    letterSpacing: '-0.02em',
                  }}>
                    {listing.price === 'FREE' ? 'FREE' : listing.price === 'Not listed' ? '—' : listing.price || '—'}
                  </div>
                  {listing.source_url && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7v10"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {displayTotal > displayListings.length && (
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <p style={{ color: '#333', fontSize: '12px', fontFamily: font }}>
                {displayTotal - displayListings.length} more deals available
                {!user.is_premium && (
                  <> &middot; <a href="/pro" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>Unlock all</a></>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ═══ BOTTOM CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '36px' }}>
          {/* Digest */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px', padding: '22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                animation: 'pulse 2s ease-in-out infinite', flexShrink: 0,
              }} />
              <h3 style={{ color: '#ddd', fontSize: '14px', fontWeight: 600, fontFamily: font, letterSpacing: '-0.02em' }}>
                Weekly Digest
              </h3>
            </div>
            <p style={{ color: '#555', fontSize: '13px', fontFamily: font, marginBottom: '4px' }}>
              Scanning {marketLabel}
            </p>
            <p style={{ color: '#333', fontSize: '12px', fontFamily: font, marginBottom: '14px' }}>
              Delivered every Thursday at 12:00 PM CDT
            </p>
            {user.is_premium ? (
              <div style={{
                background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
                borderRadius: '10px', padding: '10px 14px',
              }}>
                <p style={{ color: 'var(--accent-green)', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>
                  Your digest arrives 6 hours before free users.
                </p>
              </div>
            ) : (
              <a href="/pro" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                color: 'var(--accent-amber)', fontSize: '13px', textDecoration: 'none',
                fontFamily: font, fontWeight: 500,
              }}>
                Get your digest 6 hours early <span style={{ fontSize: '12px' }}>&rarr;</span>
              </a>
            )}
          </div>

          {/* Account */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px', padding: '22px',
          }}>
            <h3 style={{ color: '#ddd', fontSize: '14px', fontWeight: 600, fontFamily: font, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              Account
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: font }}>
              {[
                { l: 'Email', v: user.email },
                { l: 'Market', v: marketLabel },
                { l: 'Plan', v: user.is_premium ? 'Pro' : 'Free', accent: user.is_premium },
                { l: 'Member since', v: joinDate },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#333', fontSize: '13px', fontWeight: 400 }}>{row.l}</span>
                  <span style={{
                    color: row.accent ? '#22C55E' : '#666',
                    fontSize: '13px', fontWeight: row.accent ? 600 : 400,
                  }}>{row.v}</span>
                </div>
              ))}
            </div>
            {user.is_premium && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <a href="/pro" className="dash-btn-outline" style={{ color: '#333', fontSize: '12px', textDecoration: 'none', fontFamily: font, fontWeight: 500, transition: 'color 0.2s' }}>
                  Manage subscription &rarr;
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SHARE BAR ═══ */}
        <div style={{
          marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '14px',
        }}>
          <p style={{ color: '#444', fontSize: '13px', fontFamily: font, fontWeight: 400 }}>
            Know someone who flips?
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText('Check out flip-ly.net — scans Craigslist, EstateSales.net & 20+ sources, sends AI-scored deals weekly.\n\nhttps://flip-ly.net')
                .then(() => alert('Copied!'))
                .catch(() => alert('Could not copy.'))
            }}
            className="dash-btn-outline"
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '7px 16px', color: '#444', cursor: 'pointer',
              fontSize: '12px', fontFamily: font, fontWeight: 500, whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            Copy invite link
          </button>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <a href="/" style={{ color: '#222', fontSize: '12px', fontFamily: font, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#222' }}
          >
            &larr; flip-ly.net
          </a>
        </div>
      </main>
    </div>
  )
}
