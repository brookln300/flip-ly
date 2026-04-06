'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { trackGoogleAdsConversion, trackGA4Event } from './components/GoogleAnalytics'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — Product-first flow
   ══════════════════════════════════════════════════════════ */

export default function Home() {
  const [showSignup, setShowSignup] = useState(false)
  const [utmSource, setUtmSource] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source')
    if (source) {
      sessionStorage.setItem('fliply_utm_source', source)
      sessionStorage.setItem('fliply_utm_medium', params.get('utm_medium') || '')
      sessionStorage.setItem('fliply_utm_campaign', params.get('utm_campaign') || '')
      setUtmSource(source)
    } else {
      const saved = sessionStorage.getItem('fliply_utm_source')
      if (saved) setUtmSource(saved)
    }
    if (params.get('signup') === 'pro') {
      setShowSignup(true)
    }
  }, [])

  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setLoggedInUser(data.user) })
      .catch(() => {})
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupState, setSignupState] = useState('')
  const [signupMarketId, setSignupMarketId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signingUp, setSigningUp] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMarket, setSearchMarket] = useState('')
  const [marketsData, setMarketsData] = useState<Record<string, { id: string; slug: string; name: string }[]>>({})
  const [marketsLoading, setMarketsLoading] = useState(true)
  const [featuredMarketName, setFeaturedMarketName] = useState('DFW')
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [realListings, setRealListings] = useState<any[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackCat, setFeedbackCat] = useState('general')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [searchGate, setSearchGate] = useState<any>(null)
  const [featuredDeals, setFeaturedDeals] = useState<any[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [stats, setStats] = useState({ listings: 0, sources: 0, markets: 413 })
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null)

  // Fetch featured deals
  useEffect(() => {
    let marketSlug = 'dfw'
    if (loggedInUser?.market_id && Object.keys(marketsData).length > 0) {
      for (const markets of Object.values(marketsData)) {
        const found = markets.find(m => m.id === loggedInUser.market_id)
        if (found) {
          marketSlug = found.slug
          setFeaturedMarketName(found.name)
          break
        }
      }
    }
    fetch(`/api/listings?hot=true&limit=8&market=${marketSlug}`)
      .then(res => res.json())
      .then(data => { if (data.results?.length) setFeaturedDeals(data.results) })
      .catch(() => {})
      .finally(() => setFeaturedLoading(false))
  }, [loggedInUser, marketsData])

  // Fetch markets
  useEffect(() => {
    fetch('/api/markets')
      .then(res => res.json())
      .then(data => { if (data.markets) setMarketsData(data.markets) })
      .catch(() => {})
      .finally(() => setMarketsLoading(false))
  }, [])

  // Fetch stats
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats({ listings: data.total_listings || 0, sources: data.total_sources || 0, markets: data.total_markets || 413 })
      })
      .catch(() => {})
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (searchMarket) params.set('market', searchMarket)
      params.set('limit', '20')
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      const gate = data._gate || null
      setSearchGate(gate)
      if (gate?.limited) {
        setRealListings([])
        setTotalResults(0)
        setShowResults(false)
        return
      }
      setRealListings(data.results || [])
      setTotalResults(data.total || 0)
      setShowResults(true)
    } catch {
      setRealListings([])
    } finally {
      setSearching(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !signupMarketId) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, market_id: signupMarketId,
          utm_source: sessionStorage.getItem('fliply_utm_source') || undefined,
          utm_medium: sessionStorage.getItem('fliply_utm_medium') || undefined,
          utm_campaign: sessionStorage.getItem('fliply_utm_campaign') || undefined,
          gclid: sessionStorage.getItem('fliply_gclid') || undefined,
          fbclid: sessionStorage.getItem('fliply_fbclid') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data.error || 'Signup failed')
        setSigningUp(false)
        return
      }
      setSubmitted(true)
      trackGA4Event('sign_up', { method: 'email' })
      trackGoogleAdsConversion('YYhjCIqC4pQcENWFh4MD')
      setTimeout(() => { window.location.href = '/dashboard' }, 2000)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data.error || 'Login failed')
        setSigningUp(false)
        return
      }
      setSubmitted(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 9) return 'var(--score-excellent)'
    if (score >= 7) return 'var(--score-good)'
    if (score >= 5) return 'var(--score-average)'
    return 'var(--score-low)'
  }

  const categoryIcon = (title: string) => {
    const t = (title || '').toLowerCase()
    if (t.match(/drill|saw|tool|wrench|hammer|milwaukee|dewalt|makita/)) return '\u{1F527}'
    if (t.match(/chair|table|desk|couch|sofa|dresser|shelf|furniture|bookcase/)) return '\u{1FA91}'
    if (t.match(/kitchen|mixer|oven|blender|pot|pan|kitchenaid|instant pot/)) return '\u{1F373}'
    if (t.match(/tv|monitor|speaker|headphone|electronic|laptop|phone|ipad|xbox|playstation/)) return '\u{1F4FA}'
    if (t.match(/vintage|antique|retro|mid.century|mcm/)) return '\u{1F3FA}'
    if (t.match(/bike|bicycle|trek|schwinn/)) return '\u{1F6B2}'
    if (t.match(/free|curb/)) return '\u{1F193}'
    if (t.match(/kid|toy|baby|stroller|crib/)) return '\u{1F9F8}'
    if (t.match(/yard|garden|mower|lawn/)) return '\u{1F33F}'
    if (t.match(/car|auto|truck|motor/)) return '\u{1F697}'
    return '\u{1F4E6}'
  }

  // Render a single deal row (reused in search results + featured feed)
  const DealRow = ({ deal, i, showExpand }: { deal: any; i: number; showExpand?: boolean }) => (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: showExpand ? 'pointer' : 'default',
        }}
        onClick={() => showExpand && setExpandedDeal(expandedDeal === i ? null : i)}
      >
        {/* Category icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          {categoryIcon(deal.title)}
        </div>

        {/* ScoreBadge */}
        {deal.deal_score && deal.deal_score !== 'gated' ? (
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
            background: `${scoreColor(deal.deal_score)}10`,
            border: `1px solid ${scoreColor(deal.deal_score)}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
              color: scoreColor(deal.deal_score),
            }}>{deal.deal_score}</span>
          </div>
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>--</span>
          </div>
        )}

        {/* Deal info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {deal.source_url ? (
              <a href={deal.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{deal.title}</a>
            ) : deal.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {deal.city && <span>{deal.city}</span>}
            <span style={{
              textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px',
              color: 'var(--text-dim)', background: 'var(--bg-surface)',
              padding: '1px 6px', borderRadius: '3px',
            }}>{deal.source}</span>
          </div>
        </div>

        {/* Price */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', flexShrink: 0,
          color: deal.price === 'FREE' ? 'var(--accent-green)' : deal.price === 'Not listed' ? 'var(--text-dim)' : 'var(--text-primary)',
        }}>
          {deal.price === 'FREE' ? 'FREE' : deal.price === 'Not listed' ? '--' : deal.price || '--'}
        </div>
      </div>

      {/* Expanded score breakdown — inline */}
      {showExpand && expandedDeal === i && (
        <div style={{
          padding: '16px 0 16px 52px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
            {[
              { label: 'Price', value: 95, desc: 'Below market avg', color: 'var(--score-excellent)' },
              { label: 'Brand', value: 88, desc: 'Strong resale value', color: 'var(--score-excellent)' },
              { label: 'Seller', value: 82, desc: 'Motivated seller', color: 'var(--score-good)' },
              { label: 'Quality', value: 78, desc: 'Good condition signals', color: 'var(--score-good)' },
              { label: 'Freshness', value: 90, desc: 'Recently posted', color: 'var(--score-excellent)' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{f.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.desc}</span>
                </div>
                <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'var(--border-subtle)' }}>
                  <div style={{ width: `${f.value}%`, height: '100%', borderRadius: '2px', background: f.color }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>
            Full breakdown available with Pro
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>

      {/* Search counter */}
      {searchGate && !searchGate.is_premium && searchGate.searches_used !== undefined && (
        <div className="fixed bottom-4 right-4 z-[60]" style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {searchGate.searches_remaining <= 0 ? 'Searches reset at midnight' : `${searchGate.searches_remaining}/${searchGate.searches_max} today`}
          </span>
          {searchGate.searches_remaining <= 5 && searchGate.searches_remaining > 0 && (
            <a href="/pro" style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '11px', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Go unlimited</a>
          )}
        </div>
      )}

      {/* Rate limit nudge */}
      {searchGate?.limited && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] max-w-md w-full mx-4" style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px',
          padding: '20px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>You&apos;ve used today&apos;s searches</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Resets at midnight, or go unlimited with Pro.</p>
          <a href="/pro" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent-green)', color: '#000', fontWeight: 600, fontSize: '14px', textDecoration: 'none', borderRadius: '8px' }}>Go Pro</a>
        </div>
      )}

      {/* HEADER */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>FLIP-LY</span>
        </a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="#pricing" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>Pricing</a>
          {loggedInUser ? (
            <a href="/dashboard" style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', textDecoration: 'none',
            }}>
              {loggedInUser.email.split('@')[0]}
            </a>
          ) : (
            <button onClick={() => setShowSignup(true)} style={{
              padding: '6px 16px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}
        </div>
      </header>


      {/* ═══ BEAT 1: HERO + SEARCH — The product IS the hero ═══ */}
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start" style={{ minHeight: '280px' }}>

          {/* Left: headline */}
          <div style={{ paddingTop: 'var(--space-4)' }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em',
              marginBottom: 'var(--space-4)',
            }}>
              What&apos;s the best deal near you right now?
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '420px' }}>
              {stats.markets} markets &middot; 20+ sources &middot; AI-scored
            </p>
          </div>

          {/* Right: search bar — the product */}
          <div id="search" style={{ paddingTop: 'var(--space-4)' }}>
            <form onSubmit={handleSearch}>
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
                borderRadius: '12px', padding: '16px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tools, vintage, furniture..."
                    style={{
                      width: '100%', padding: '8px 0', border: 'none', outline: 'none',
                      fontSize: '16px', color: 'var(--text-primary)', background: 'transparent',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={searchMarket} onChange={e => setSearchMarket(e.target.value)} style={{
                    flex: 1, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                    fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-surface-hover)', cursor: 'pointer',
                  }}>
                    <option value="">All areas</option>
                    {Object.keys(marketsData).sort().map(st =>
                      (marketsData[st] || []).map(m => (
                        <option key={m.id} value={m.slug}>{m.name}, {st}</option>
                      ))
                    )}
                  </select>
                  <button type="submit" disabled={searching} style={{
                    padding: '10px 24px',
                    background: searching ? 'var(--border-active)' : 'var(--accent-green)',
                    color: searching ? 'var(--text-muted)' : '#000',
                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                    cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {searching ? '...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Quick tags */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['tools', 'vintage', 'furniture', 'free', 'electronics', 'estate sale'].map(tag => (
                  <button key={tag} type="button" onClick={() => setSearchQuery(tag)} style={{
                    padding: '4px 12px', border: '1px solid var(--border-subtle)', borderRadius: '16px',
                    fontSize: '12px', color: 'var(--text-dim)', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                  }}>
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>


      {/* ═══ SEARCH RESULTS — inline, no section break ═══ */}
      {showResults && (
        <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-6) var(--space-4) 0' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
            {totalResults} results{searchQuery ? ` for "${searchQuery}"` : ''}
          </div>
          {realListings.slice(0, loggedInUser ? realListings.length : 3).map((listing, i) => (
            <DealRow key={listing.id || i} deal={listing} i={i} showExpand={i === 0} />
          ))}
          {!loggedInUser && realListings.length > 3 && (
            <div style={{ padding: 'var(--space-6) 0', textAlign: 'center' }}>
              <button onClick={() => setShowSignup(true)} style={{
                padding: '10px 24px', background: 'var(--accent-green)', color: '#000',
                border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              }}>
                Sign up free to see all {totalResults} results
              </button>
            </div>
          )}
        </div>
      )}


      {/* ═══ BEAT 2: LIVE FEED — deals happening now ═══ */}
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
        {featuredDeals.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {featuredMarketName}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                live
              </span>
            </div>
            {featuredDeals.map((deal, i) => (
              <DealRow key={deal.id || i} deal={deal} i={100 + i} showExpand={i === 1} />
            ))}
          </>
        )}
        {featuredLoading && (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Loading deals...</p>
          </div>
        )}
      </div>


      {/* ═══ BEAT 3: VIDEO PROOF — secondary, below the fold ═══ */}
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
        <div style={{
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', display: 'block' }}>
            <source src="/assets/hero-dashboard.webm" type="video/webm" />
          </video>
        </div>
      </div>


      {/* ═══ BEAT 4: INLINE SIGNUP — not a modal, just a form ═══ */}
      {!loggedInUser && (
        <div style={{ maxWidth: '28rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            See every deal in your market
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            Free. 15 searches/day.
          </p>
          <button onClick={() => signIn('google')} type="button" style={{
            width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer',
            marginBottom: '12px',
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button onClick={() => setShowSignup(true)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px',
          }}>
            or sign up with email
          </button>
        </div>
      )}


      {/* ═══ BEAT 5: PRICING ═══ */}
      <div id="pricing" style={{ maxWidth: '56rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Free */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              $0<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
              <li>15 searches/day</li>
              <li>1 market</li>
              <li>Score number only</li>
              <li>Weekly digest</li>
            </ul>
            <button onClick={() => setShowSignup(true)} style={{
              width: '100%', marginTop: 'var(--space-4)', padding: '10px 24px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
            borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Pro</div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              $5<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>Founding price</div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
              <li>Unlimited searches</li>
              <li>3 markets</li>
              <li>Full score breakdown</li>
              <li>Daily + weekly digest</li>
              <li>3 saved searches</li>
            </ul>
            <a href="/pro" style={{
              display: 'block', width: '100%', marginTop: 'var(--space-4)', padding: '10px 24px',
              background: 'var(--accent-green)', color: '#000',
              borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
            }}>
              Start Pro
            </a>
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
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-4)' }}>Founding price</div>
            <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
              <li>Unlimited searches</li>
              <li>Unlimited markets</li>
              <li>Breakdown + trends</li>
              <li>Daily + instant alerts</li>
              <li>Unlimited saved searches</li>
            </ul>
            <a href="/pro" style={{
              display: 'block', width: '100%', marginTop: 'var(--space-4)', padding: '10px 24px',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
            }}>
              Go Power
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px', marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
          {(() => {
            const end = new Date('2026-04-18T23:59:59')
            const now = new Date()
            const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))
            return days > 0 ? `${days} days left at founding price` : 'Founding pricing ends soon'
          })()}
        </p>
      </div>


      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-12) var(--space-4) var(--space-8)', marginTop: 'var(--space-16)' }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#search" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Search</a>
                <a href="#pricing" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Pricing</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/about" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>About</a>
                <a href="mailto:hello@flip-ly.net" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/privacy" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Privacy</a>
                <a href="/terms" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Terms</a>
                <a href="/data-deletion" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Data Deletion</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Social</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>X / Twitter</a>
                <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Instagram</a>
                <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>TikTok</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>&copy; 2026 Flip-ly &middot; Deal intelligence for resellers</p>
          </div>
        </div>
        <div style={{ position: 'relative', height: '12px', marginTop: '4px' }}>
          <a href="/lobster-hunt" onClick={e => e.stopPropagation()} style={{ width: '16px', height: '16px', background: 'transparent', cursor: 'default', position: 'absolute', right: '23%', top: '0', zIndex: 60, display: 'block' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--bg-primary)', position: 'absolute', top: '50%', left: '50%' }} />
          </a>
        </div>
      </footer>


      {/* SIGNUP MODAL — kept for header CTA and direct links */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)} style={{ background: 'rgba(0,0,0,0.85)', cursor: 'pointer' }}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
            borderRadius: '12px', cursor: 'default', overflow: 'hidden',
          }}>
            <button onClick={() => { setShowSignup(false); setSubmitted(false); setSignupError('') }}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              &#10005;
            </button>
            <div style={{ padding: 'var(--space-6)' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>
                    {isLoginMode ? 'Welcome Back' : 'You\'re In'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                    {isLoginMode ? 'Redirecting to your dashboard...' : 'Welcome. Check your email for confirmation.'}
                  </p>
                  {!isLoginMode && <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>(check spam too)</p>}
                  <button onClick={() => { setShowSignup(false); setSubmitted(false) }} style={{
                    marginTop: 'var(--space-6)', padding: '8px 24px',
                    background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>Continue</button>
                </div>
              ) : isLoginMode ? (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome Back</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Log in to your account.</p>
                  <button onClick={() => signIn('google')} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Continue with Google
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                  </div>
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="cl-input" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" required className="cl-input" />
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>{signingUp ? 'Logging in...' : 'Log In'}</button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(false); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>Don&apos;t have an account? Sign up</button>
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Create Your Account</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Free. 15 searches/day. No credit card.</p>
                  <button onClick={() => signIn('google')} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Sign up with Google
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or email</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                  </div>
                  <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="cl-input" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password (6+ chars)" required minLength={6} className="cl-input" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select value={signupState} onChange={e => { setSignupState(e.target.value); setSignupMarketId('') }} required className="cl-input" style={{ flex: 1, cursor: 'pointer' }}>
                        <option value="">State *</option>
                        {Object.keys(marketsData).sort().map(st => (<option key={st} value={st}>{st}</option>))}
                      </select>
                      <select value={signupMarketId} onChange={e => setSignupMarketId(e.target.value)} required className="cl-input" style={{ flex: 1, cursor: 'pointer' }} disabled={!signupState}>
                        <option value="">Area *</option>
                        {(marketsData[signupState] || []).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                      </select>
                    </div>
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>{signingUp ? 'Creating account...' : 'Get Started Free'}</button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(true); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>Already have an account? Log in</button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback widget */}
      <button onClick={() => { setShowFeedback(true); setFeedbackSent(false); setFeedbackMsg(''); setFeedbackCat('general') }}
        className="fixed z-[50]" style={{
          bottom: '16px', left: '16px',
          background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
          fontSize: '12px', color: 'var(--text-muted)',
        }}>Feedback</button>

      {showFeedback && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowFeedback(false)} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '420px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
            borderRadius: '12px', padding: 'var(--space-6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {feedbackSent ? 'Thanks' : 'Send Feedback'}
              </h4>
              <button onClick={() => setShowFeedback(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>&#10005;</button>
            </div>
            {feedbackSent ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Your feedback has been recorded.</p>
                <p style={{ color: 'var(--accent-green)', fontSize: '13px' }}>If we implement your idea, you get a free month of Pro.</p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!feedbackMsg.trim()) return
                setFeedbackSending(true)
                try {
                  await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: feedbackMsg, category: feedbackCat, page: '/' }),
                  })
                  setFeedbackSent(true)
                } catch {} finally { setFeedbackSending(false) }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select value={feedbackCat} onChange={e => setFeedbackCat(e.target.value)} className="cl-input" style={{ cursor: 'pointer' }}>
                  <option value="general">General</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="source">Source Suggestion</option>
                </select>
                <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} placeholder="What would make Flip-ly better?"
                  className="cl-input" rows={4} style={{ resize: 'vertical' }} />
                <button type="submit" disabled={feedbackSending || !feedbackMsg.trim()} style={{
                  padding: '10px 24px', fontWeight: 700, fontSize: '14px',
                  background: feedbackSending ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
                  border: 'none', borderRadius: '6px',
                  cursor: feedbackSending ? 'wait' : 'pointer',
                }}>{feedbackSending ? 'Sending...' : 'Send Feedback'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
