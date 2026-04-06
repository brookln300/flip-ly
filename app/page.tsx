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
  const [stats, setStats] = useState({ listings: 0, sources: 20, markets: 413 })
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
          cursor: showExpand && deal.deal_reason ? 'pointer' : 'default',
        }}
        onClick={() => showExpand && deal.deal_reason && setExpandedDeal(expandedDeal === i ? null : i)}
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
            background: `${scoreColor(deal.deal_score)}15`,
            border: `1px solid ${scoreColor(deal.deal_score)}25`,
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

      {/* Score reason — only shown if real data exists */}
      {showExpand && expandedDeal === i && deal.deal_reason && (
        <div style={{
          padding: '8px 0 12px 52px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {deal.deal_reason}
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
          padding: '20px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>You&apos;ve used today&apos;s searches</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Resets at midnight, or go unlimited with Pro.</p>
          <a href="/pro" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent-green)', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none', borderRadius: '8px' }}>Go Pro</a>
        </div>
      )}

      {/* HEADER */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--text-primary)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>FLIP-LY</span>
        </a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="/blog" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>Blog</a>
          <a href="#pricing" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>Pricing</a>
          {loggedInUser ? (
            <a href="/dashboard" style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: 700,
              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)', borderRadius: '6px', textDecoration: 'none',
            }}>
              {loggedInUser.email.split('@')[0]}
            </a>
          ) : (
            <button onClick={() => setShowSignup(true)} style={{
              padding: '6px 16px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}
        </div>
      </header>


      {/* ═══ BEAT 1: HERO — Clear value prop + search ═══ */}
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>

        {/* Centered value proposition */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em',
            marginBottom: 'var(--space-3)',
          }}>
            Find underpriced items to flip for profit.
          </h1>
          <p style={{
            fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.5,
            maxWidth: '480px', margin: '0 auto', marginBottom: 'var(--space-3)',
          }}>
            We scan 20+ marketplaces and score every deal by resale potential &mdash; so you don&apos;t have to.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {stats.listings > 0 ? `${stats.listings.toLocaleString()} deals` : `${stats.markets} markets`} &middot; {stats.sources || '20'}+ sources &middot; updated daily
          </p>
        </div>

        {/* Search bar — centered, full width */}
        <div id="search" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <form onSubmit={handleSearch}>
            <div style={{
              background: '#ffffff', border: '1px solid var(--border-default)',
              borderRadius: '14px', padding: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
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
                  flex: 1, padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: '10px',
                  fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer',
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
                  color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                  cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                }}>
                  {searching ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Quick tags */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
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

        {/* How it works — 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ maxWidth: '560px', margin: 'var(--space-10) auto 0' }}>
          {[
            { step: '1', label: 'We scan', desc: 'Craigslist, OfferUp, estate sales, and 20+ more sources.' },
            { step: '2', label: 'AI scores', desc: 'Every listing rated by resale value, demand, and margin.' },
            { step: '3', label: 'You flip', desc: 'See the best deals first. Buy low, sell high.' },
          ].map(item => (
            <div key={item.step} style={{ textAlign: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 8px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              }}>{item.step}</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.label}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
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
                padding: '10px 24px', background: 'var(--accent-green)', color: '#fff',
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
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Top deals in {featuredMarketName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  updated today
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Scored by AI — higher score = better flip potential
              </p>
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
        {/* Source text already shown in hero — no duplicate here */}
      </div>




      {/* ═══ BEAT 4: INLINE SIGNUP — not a modal, just a form ═══ */}
      {!loggedInUser && (
        <div style={{ maxWidth: '28rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
            Get the weekly digest every Thursday
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--space-6)' }}>
            Top deals in your market, scored and sorted. Free · 15 searches/day.
          </p>
          <button onClick={() => signIn('google')} type="button" style={{
            width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', cursor: 'pointer',
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


      {/* ═══ PRICING — inline tiers, not a sales grid ═══ */}
      <div id="pricing" style={{ maxWidth: '32rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Free */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ padding: '14px 16px', background: 'var(--bg-surface)', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '52px' }}>Free</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} className="sm:hidden">$0</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }} className="sm:flex-1">15 searches/day · 1 market · weekly digest</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }} className="hidden sm:inline">$0</span>
          </div>
          {/* Pro */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ padding: '14px 16px', background: 'var(--bg-surface)', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)', minWidth: '52px' }}>Pro</span>
              <a href="/pro" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', background: 'var(--accent-green)', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none' }} className="sm:hidden">$5/mo</a>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }} className="sm:flex-1">Unlimited · 3 markets · score breakdown · saved searches</span>
            <a href="/pro" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', flexShrink: 0, background: 'var(--accent-green)', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none' }} className="hidden sm:inline">$5/mo</a>
          </div>
          {/* Power */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ padding: '14px 16px', background: 'var(--bg-surface)', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)', minWidth: '52px' }}>Power</span>
              <a href="/pro" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-active)', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none' }} className="sm:hidden">$19/mo</a>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }} className="sm:flex-1">Unlimited everything · instant alerts · trends</span>
            <a href="/pro" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0, border: '1px solid var(--border-active)', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none' }} className="hidden sm:inline">$19/mo</a>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '11px', marginTop: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
          {(() => {
            const end = new Date('2026-04-18T23:59:59')
            const now = new Date()
            const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))
            return days > 0 ? `Founding price · ${days} days left` : 'Founding pricing ends soon'
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
                <a href="/blog" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Blog</a>
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
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'transparent', position: 'absolute', top: '50%', left: '50%' }} />
          </a>
        </div>
      </footer>


      {/* SIGNUP MODAL — kept for header CTA and direct links */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)} style={{ background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', border: '1px solid var(--border-default)',
            borderRadius: '16px', cursor: 'default', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <button onClick={() => { setShowSignup(false); setSubmitted(false); setSignupError('') }}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
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
                    background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>Continue</button>
                </div>
              ) : isLoginMode ? (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome Back</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Log in to your account.</p>
                  <button onClick={() => signIn('google')} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', cursor: 'pointer',
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
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
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
                    background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', cursor: 'pointer',
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
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
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
          onClick={() => setShowFeedback(false)} style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '420px',
            background: '#ffffff', border: '1px solid var(--border-default)',
            borderRadius: '16px', padding: 'var(--space-6)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
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
                  background: feedbackSending ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
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
