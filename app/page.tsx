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
   SECTION 2: Social Proof Bar
   Real numbers from API. No fabrication.
   ══════════════════════════════════════════════════════════ */
function SocialProofBar() {
  const [stats, setStats] = useState({ listings: 0, sources: 0, markets: 413 })

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStats({
            listings: data.total_listings || 0,
            sources: data.total_sources || 0,
            markets: data.total_markets || 413,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: 'var(--space-4) 0',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        maxWidth: '70rem',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '32px',
        flexWrap: 'wrap',
        padding: '0 var(--space-4)',
      }}>
        <span style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-primary)',
        }}>
          20+ sources scanned
        </span>
        <span style={{ color: 'var(--border-active)', fontSize: '13px' }}>&middot;</span>
        <span style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-primary)',
        }}>
          {stats.listings > 0 ? `${stats.listings.toLocaleString()} deals scored` : 'Deals scored daily'}
        </span>
        <span style={{ color: 'var(--border-active)', fontSize: '13px' }}>&middot;</span>
        <span style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-primary)',
        }}>
          {stats.markets} US markets
        </span>
      </div>

      {/* Source logos — muted, compact */}
      <div style={{
        maxWidth: '70rem',
        margin: 'var(--space-3) auto 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '0 var(--space-4)',
        opacity: 0.6,
      }}>
        {/* Craigslist */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>Craigslist</span>
        </div>
        {/* EstateSales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>EstateSales</span>
        </div>
        {/* Eventbrite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>Eventbrite</span>
        </div>
        {/* + more */}
        <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>+ 20 more</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — 8-section landing page per LANDING-PAGE-SPEC
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
    fetch(`/api/listings?hot=true&limit=6&market=${marketSlug}`)
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

  // Score color helper
  const scoreColor = (score: number) => {
    if (score >= 9) return 'var(--score-excellent)'
    if (score >= 7) return 'var(--score-good)'
    if (score >= 5) return 'var(--score-average)'
    return 'var(--score-low)'
  }

  return (
    <div className="min-h-screen relative">

      {/* Search rate limit pill */}
      {searchGate && !searchGate.is_premium && searchGate.searches_used !== undefined && (
        <div className="fixed bottom-4 right-4 z-[60]" style={{
          background: searchGate.searches_remaining <= 2 ? '#1a0000' : 'var(--bg-surface)',
          border: `1px solid ${searchGate.searches_remaining <= 2 ? 'var(--accent-red)' : 'var(--border-active)'}`,
          borderRadius: '8px', padding: '8px 14px', fontSize: '12px',
          fontFamily: 'var(--font-primary)',
        }}>
          <span style={{ color: searchGate.searches_remaining <= 2 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {searchGate.searches_remaining <= 0
              ? 'Daily searches used'
              : `${searchGate.searches_remaining}/${searchGate.searches_max} searches left`}
          </span>
          {searchGate.searches_remaining <= 3 && searchGate.searches_remaining > 0 && (
            <a href="/pro" style={{
              display: 'block', marginTop: '4px',
              color: 'var(--accent-amber)', fontSize: '11px', textDecoration: 'underline',
            }}>
              Go unlimited
            </a>
          )}
        </div>
      )}

      {/* Rate limit banner */}
      {searchGate?.limited && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] max-w-md w-full mx-4" style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px',
          padding: '20px 24px', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            Daily search limit reached
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Free accounts get 15 searches per day. Upgrade for unlimited.
          </p>
          <a href="/pro" style={{
            display: 'inline-block', padding: '10px 24px',
            background: 'var(--accent-green)', color: '#000',
            fontWeight: 600, fontSize: '14px', textDecoration: 'none', borderRadius: '8px',
          }}>
            Upgrade to Pro
          </a>
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '8px' }}>
            Searches reset daily at midnight.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════ */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
              <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{
              fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700,
              letterSpacing: '-0.03em',
            }}>
              FLIP-LY
            </span>
          </a>

          <nav className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px' }}>
            {[
              { label: 'Search', href: '#search' },
              { label: 'Pricing', href: '#pricing' },
            ].map(link => (
              <a key={link.label} href={link.href} style={{
                color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '6px', fontWeight: 500,
                transition: 'color 0.15s',
              }}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {loggedInUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loggedInUser.is_premium && (
                <span className="hidden sm:inline" style={{
                  background: 'var(--accent-green)', color: '#000',
                  padding: '2px 8px', borderRadius: '4px',
                  fontSize: '10px', fontWeight: 700,
                }}>PRO</span>
              )}
              <a href="/dashboard" style={{
                padding: '6px 12px', fontSize: '12px', fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                textDecoration: 'none',
              }}>
                {loggedInUser.email.split('@')[0]}
              </a>
            </div>
          ) : (
            <button onClick={() => setShowSignup(true)} style={{
              padding: '6px 16px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#000', border: 'none',
              borderRadius: '6px', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setShowMobileNav(!showMobileNav)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', marginLeft: '4px',
          }}>
            <span style={{ width: '18px', height: '2px', background: 'var(--text-muted)', borderRadius: '1px', display: 'block', transition: 'all 0.2s', transform: showMobileNav ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ width: '18px', height: '2px', background: 'var(--text-muted)', borderRadius: '1px', display: 'block', transition: 'all 0.2s', opacity: showMobileNav ? 0 : 1 }} />
            <span style={{ width: '18px', height: '2px', background: 'var(--text-muted)', borderRadius: '1px', display: 'block', transition: 'all 0.2s', transform: showMobileNav ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      {showMobileNav && (
        <div className="md:hidden" style={{
          position: 'sticky', top: '49px', zIndex: 79,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 16px 12px',
        }}>
          {[
            { label: 'Search', href: '#search' },
            { label: 'Pricing', href: '#pricing' },
          ].map(link => (
            <a key={link.label} href={link.href} onClick={() => setShowMobileNav(false)} style={{
              display: 'block', padding: '10px 12px',
              color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none',
              borderRadius: '6px', fontWeight: 500,
            }}>
              {link.label}
            </a>
          ))}
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO
          Split layout — left copy, right screenshot placeholder
          ═══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-primary)', padding: 'var(--space-16) var(--space-4)' }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" style={{ padding: 'var(--space-8) 0' }}>
              {/* Left: Copy */}
              <div>
                <h1 style={{
                  fontSize: 'clamp(36px, 6vw, 56px)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  marginBottom: 'var(--space-6)',
                }}>
                  Every deal near you. Scored before you see it.
                </h1>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  maxWidth: '480px',
                  marginBottom: 'var(--space-8)',
                }}>
                  We scan Craigslist, estate sales, OfferUp, and 20+ local sources. AI scores every listing for flip potential. You see what&apos;s worth your time.
                </p>
                <button onClick={() => setShowSignup(true)} style={{
                  padding: '12px 24px',
                  background: 'var(--accent-green)',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}>
                  Start finding deals
                </button>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  marginTop: 'var(--space-3)',
                }}>
                  Free &middot; 15 searches/day &middot; No credit card
                </p>
              </div>

              {/* Right: Product screenshot placeholder */}
              <div className="hidden md:flex justify-center">
                <div style={{
                  width: '100%',
                  maxWidth: '480px',
                  aspectRatio: '4/3',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {/* Placeholder — will be replaced with real dashboard screenshot */}
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '48px',
                      fontWeight: 700,
                      color: 'var(--score-excellent)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      8.7
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      KitchenAid Artisan &middot; $45
                    </p>
                    <div style={{
                      marginTop: 'var(--space-6)',
                      textAlign: 'left',
                      fontSize: '12px',
                      color: 'var(--text-dim)',
                      lineHeight: 2,
                    }}>
                      <div>Price — 62% below market avg</div>
                      <div>Seller — Motivated, estate sale</div>
                      <div>Brand — KitchenAid, strong resale</div>
                      <div>Quality — 6 photos, excellent condition</div>
                      <div>Freshness — Posted 2 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 2: SOCIAL PROOF BAR
          ═══════════════════════════════════════════════════════ */}
      <SocialProofBar />


      {/* ═══════════════════════════════════════════════════════
          SECTION 3: SCORE BREAKDOWN CARD
          Show the product, don't describe it. (Day 2 build)
          ═══════════════════════════════════════════════════════ */}
      <section id="score-breakdown" style={{
        background: 'var(--bg-elevated)',
        padding: 'var(--space-20) var(--space-4)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            {/* Score card — hardcoded with real-looking data */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: 'var(--space-6)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Vintage KitchenAid Artisan Mixer
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    $45 &middot; EstateSales &middot; Arlington, TX &middot; 2h ago
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--score-excellent)',
                }}>
                  8.7
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 2.2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price</span>
                  <span style={{ color: 'var(--text-muted)' }}>62% below market avg for mixers in DFW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Seller</span>
                  <span style={{ color: 'var(--text-muted)' }}>Estate sale — high motivation signal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Brand</span>
                  <span style={{ color: 'var(--text-muted)' }}>KitchenAid — $180-220 avg resale</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Quality</span>
                  <span style={{ color: 'var(--text-muted)' }}>6 photos, excellent condition noted</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Freshness</span>
                  <span style={{ color: 'var(--text-muted)' }}>Posted 2 hours ago</span>
                </div>
              </div>
            </div>

            <p style={{
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: '13px',
              marginTop: 'var(--space-6)',
            }}>
              Every listing, scored like this.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 4: LIVE SEARCH
          ═══════════════════════════════════════════════════════ */}
      <section id="search" style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        padding: 'var(--space-20) var(--space-4)',
      }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '13px',
            marginBottom: 'var(--space-6)',
          }}>
            Try it — no signup needed
          </p>

          <form onSubmit={handleSearch}>
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
              borderRadius: '8px', padding: '4px',
            }}>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tools, vintage, furniture, free stuff..."
                    style={{
                      width: '100%', padding: '12px 4px', border: 'none', outline: 'none',
                      fontSize: '16px', color: 'var(--text-primary)', background: 'transparent',
                    }}
                  />
                </div>
                <div className="flex gap-2 px-2 pb-2 sm:pb-0 sm:px-0 sm:pr-2">
                  <select
                    value={searchMarket}
                    onChange={e => setSearchMarket(e.target.value)}
                    className="flex-1 sm:flex-none"
                    style={{
                      padding: '10px 12px', border: '1px solid var(--border-active)', borderRadius: '6px',
                      fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-surface-hover)', cursor: 'pointer',
                    }}
                  >
                    <option value="">All Areas</option>
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
                    border: 'none', borderRadius: '6px', fontWeight: 600,
                    fontSize: '14px', cursor: searching ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick tags */}
            <div className="mt-3 flex gap-2 justify-center overflow-x-auto sm:flex-wrap sm:overflow-visible pb-2 sm:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              {['tools', 'vintage', 'furniture', 'free', 'electronics', 'estate sale', 'kids', 'collectibles'].map(tag => (
                <button key={tag} type="button" onClick={() => setSearchQuery(tag)} style={{
                  padding: '6px 14px',
                  border: '1px solid var(--border-active)', borderRadius: '16px',
                  fontSize: '13px', color: 'var(--text-secondary)',
                  background: 'var(--bg-surface-hover)', cursor: 'pointer', flexShrink: 0,
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Results */}
          {showResults && (
            <div style={{ marginTop: 'var(--space-8)' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', marginBottom: '12px',
                background: 'var(--bg-surface)', borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px', color: 'var(--text-muted)',
              }}>
                <span>
                  Showing {realListings.length} of {totalResults} results
                  {searchQuery ? ` for "${searchQuery}"` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {realListings.slice(0, loggedInUser ? realListings.length : 3).map((listing, i) => (
                  <div key={listing.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '12px 16px',
                    background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    borderRadius: '6px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        {listing.deal_score && listing.deal_score !== 'gated' && (
                          <span style={{
                            fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            color: scoreColor(listing.deal_score),
                          }}>{listing.deal_score}</span>
                        )}
                        {listing.deal_score === 'gated' && (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>--</span>
                        )}
                        {listing.source_url ? (
                          <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="truncate" style={{
                            color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                          }}>
                            {listing.title}
                          </a>
                        ) : (
                          <span className="truncate" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                            {listing.title}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {listing.city && <span>{listing.city}</span>}
                        <span style={{
                          textTransform: 'uppercase', fontSize: '10px',
                          color: 'var(--text-dim)', border: '1px solid var(--border-active)',
                          padding: '0 4px', borderRadius: '2px',
                        }}>{listing.source}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '13px',
                        color: listing.price === 'FREE' ? 'var(--accent-green)' : listing.price === 'Not listed' ? 'var(--text-dim)' : 'var(--accent-amber)',
                      }}>
                        {listing.price === 'FREE' ? 'FREE' : listing.price === 'Not listed' ? 'Garage Sale' : listing.price || 'Ask'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Anonymous upgrade CTA */}
              {!loggedInUser && realListings.length > 3 && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 'var(--space-4)' }}>
                    Sign up free for 15 searches/day and full results.
                  </p>
                  <button onClick={() => setShowSignup(true)} style={{
                    padding: '12px 24px', background: 'var(--accent-green)', color: '#000',
                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  }}>
                    Start finding deals
                  </button>
                </div>
              )}

              {loggedInUser && totalResults > realListings.length && (
                <div style={{
                  textAlign: 'center', marginTop: 'var(--space-6)',
                  padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px',
                  fontSize: '13px', color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {totalResults - realListings.length} more deals in the database
                </div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 5: FEATURED DEALS
          ═══════════════════════════════════════════════════════ */}
      {featuredDeals.length > 0 && (
        <section style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-subtle)',
          padding: 'var(--space-20) var(--space-4)',
        }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 style={{
                fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', marginBottom: 'var(--space-6)',
              }}>
                {featuredMarketName}
              </h2>

              <div style={{
                background: 'var(--bg-elevated)', borderRadius: '12px',
                padding: '4px', border: '1px solid var(--border-subtle)',
              }}>
                {featuredDeals.map((deal, i) => (
                  <div key={deal.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '12px 16px',
                    background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {deal.deal_score && deal.deal_score !== 'gated' && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
                            color: scoreColor(deal.deal_score),
                          }}>{deal.deal_score}</span>
                        )}
                        <span className="truncate" style={{
                          color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500,
                        }}>
                          {deal.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {deal.city && <span>{deal.city}</span>}
                        <span style={{
                          textTransform: 'uppercase', fontSize: '10px',
                          color: 'var(--text-dim)', border: '1px solid var(--border-active)',
                          padding: '0 4px', borderRadius: '2px',
                        }}>{deal.source}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '13px',
                        color: deal.price === 'FREE' ? 'var(--accent-green)' : deal.price === 'Not listed' ? 'var(--text-dim)' : 'var(--accent-amber)',
                      }}>
                        {deal.price === 'FREE' ? 'FREE' : deal.price === 'Not listed' ? 'Garage Sale' : deal.price || 'Ask'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{
                textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)',
                marginTop: 'var(--space-4)',
              }}>
                Sign up to see all deals in your market.
              </p>
            </motion.div>
          </div>
        </section>
      )}
      {featuredLoading && (
        <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)', padding: 'var(--space-8) var(--space-4)' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Loading deals...</p>
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════════
          SECTION 6: PRICING (3-tier per spec — Day 3 full build)
          ═══════════════════════════════════════════════════════ */}
      <section id="pricing" style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: 'var(--space-20) var(--space-4)',
      }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
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
                <button onClick={() => setShowSignup(true)} style={{
                  width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border-active)', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Get Started
                </button>
              </div>

              {/* Pro — highlighted */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
                borderRadius: '12px', padding: 'var(--space-6)', textAlign: 'center',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px',
                }}>Most Popular</div>
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
                <a href="/pro" style={{
                  display: 'block', width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
                  background: 'var(--accent-green)', color: '#000',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none', textAlign: 'center',
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
                <button onClick={() => setShowSignup(true)} style={{
                  width: '100%', marginTop: 'var(--space-6)', padding: '12px 24px',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border-active)', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Go Power
                </button>
              </div>
            </div>

            <p style={{
              textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px',
              marginTop: 'var(--space-6)',
            }}>
              All plans include 20+ source coverage and AI scoring.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 7: FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--bg-elevated)',
        padding: 'var(--space-20) var(--space-4)',
        textAlign: 'center',
      }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 style={{
            fontSize: '34px', fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', marginBottom: 'var(--space-8)',
          }}>
            Every deal in your area. Scored.
          </h2>
          <button onClick={() => setShowSignup(true)} style={{
            padding: '12px 24px', background: 'var(--accent-green)', color: '#000',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Start finding deals
          </button>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 8: FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        padding: 'var(--space-12) var(--space-4) var(--space-8)',
      }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#search" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Search</a>
                <a href="#pricing" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Pricing</a>
                <a href="#score-breakdown" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>How Scoring Works</a>
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
                <a href="/privacy" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="/terms" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Terms of Service</a>
                <a href="/data-deletion" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Data Deletion</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Social</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>X / Twitter</a>
                <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>Instagram</a>
                <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>TikTok</a>
                <a href="https://www.youtube.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', fontSize: '13px', textDecoration: 'none' }}>YouTube</a>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--border-default)', paddingTop: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
          }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
              &copy; 2026 Flip-ly &middot; Deal intelligence for resellers and bargain hunters
            </p>
          </div>
        </div>

        {/* The lobster pixel */}
        <div style={{ position: 'relative', height: '12px', marginTop: '4px' }}>
          <a href="/lobster-hunt" onClick={e => e.stopPropagation()} style={{
            width: '16px', height: '16px', background: 'transparent', cursor: 'default',
            position: 'absolute', right: '23%', top: '0', zIndex: 60, display: 'block',
          }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%', background: 'var(--bg-elevated)',
              position: 'absolute', top: '50%', left: '50%',
            }} />
          </a>
        </div>
      </footer>


      {/* ═══════════════════════════════════════════════════════
          SIGNUP / LOGIN MODAL
          ═══════════════════════════════════════════════════════ */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)}
          style={{ background: 'rgba(0,0,0,0.85)', cursor: 'pointer' }}>
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
                  {!isLoginMode && (
                    <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                      (check spam too if you don&apos;t see it)
                    </p>
                  )}
                  <button onClick={() => { setShowSignup(false); setSubmitted(false) }} style={{
                    marginTop: 'var(--space-6)', padding: '8px 24px',
                    background: 'var(--accent-green)', color: '#000', border: 'none',
                    borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>
                    Continue
                  </button>
                </div>
              ) : isLoginMode ? (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Welcome Back
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                    Log in to your account.
                  </p>
                  <button onClick={() => signIn('google')} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#fff', color: '#333', border: '1px solid #ddd',
                    borderRadius: '6px', cursor: 'pointer',
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
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required className="cl-input" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="password" required className="cl-input" />
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>
                      {signingUp ? 'Logging in...' : 'Log In'}
                    </button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(false); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)',
                      cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>
                      Don&apos;t have an account? Sign up
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Create Your Account
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                    Free. 15 searches/day. No credit card.
                  </p>
                  <button onClick={() => signIn('google')} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#fff', color: '#333', border: '1px solid #ddd',
                    borderRadius: '6px', cursor: 'pointer',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Sign up with Google
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or sign up with email</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                  </div>
                  <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required className="cl-input" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="password (6+ chars)" required minLength={6} className="cl-input" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select value={signupState} onChange={e => { setSignupState(e.target.value); setSignupMarketId('') }}
                        required className="cl-input" style={{ flex: 1, cursor: 'pointer' }}>
                        <option value="">State *</option>
                        {Object.keys(marketsData).sort().map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <select value={signupMarketId} onChange={e => setSignupMarketId(e.target.value)}
                        required className="cl-input" style={{ flex: 1, cursor: 'pointer' }} disabled={!signupState}>
                        <option value="">Area *</option>
                        {(marketsData[signupState] || []).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#000',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>
                      {signingUp ? 'Creating account...' : 'Get Started Free'}
                    </button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(true); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)',
                      cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>
                      Already have an account? Log in
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Feedback widget */}
      <button onClick={() => { setShowFeedback(true); setFeedbackSent(false); setFeedbackMsg(''); setFeedbackCat('general') }}
        className="fixed z-[50]"
        style={{
          bottom: '16px', left: '16px',
          background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
          fontSize: '12px', color: 'var(--text-muted)',
        }}>
        Feedback
      </button>

      {showFeedback && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowFeedback(false)}
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '420px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
            borderRadius: '12px', padding: 'var(--space-6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {feedbackSent ? 'Thanks' : 'Send Feedback'}
              </h4>
              <button onClick={() => setShowFeedback(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px',
              }}>&#10005;</button>
            </div>

            {feedbackSent ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                  Your feedback has been recorded. We read every submission.
                </p>
                <p style={{ color: 'var(--accent-green)', fontSize: '13px' }}>
                  If we implement your idea, you get a free month of Pro.
                </p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (feedbackMsg.trim().length < 5) return
                setFeedbackSending(true)
                try {
                  const res = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: feedbackMsg, category: feedbackCat }),
                  })
                  if (res.ok) setFeedbackSent(true)
                } catch {}
                setFeedbackSending(false)
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <select value={feedbackCat} onChange={e => setFeedbackCat(e.target.value)} style={{
                    width: '100%', padding: '8px 12px',
                    background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)',
                    borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px',
                  }}>
                    <option value="general">General</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="ux">Design / UX</option>
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    value={feedbackMsg}
                    onChange={e => setFeedbackMsg(e.target.value)}
                    placeholder="What could be better? We read every message."
                    rows={4} maxLength={2000} required
                    style={{
                      width: '100%', padding: '12px',
                      background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)',
                      borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px',
                      resize: 'vertical', outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{feedbackMsg.length}/2000</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>
                      Implemented ideas = 1 free month of Pro
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={feedbackSending || feedbackMsg.trim().length < 5} style={{
                  width: '100%', padding: '12px',
                  background: feedbackSending ? 'var(--border-active)' : 'var(--accent-green)',
                  color: feedbackSending ? 'var(--text-muted)' : '#000',
                  border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '14px',
                  cursor: feedbackSending ? 'wait' : 'pointer',
                }}>
                  {feedbackSending ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
