'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { trackGoogleAdsConversion, trackGA4Event } from './components/GoogleAnalytics'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

/* ── VALUE PROPS ──────────────────────────────────────── */
function ValuePropsSection() {
  const cleanCards = [
    {
      iconSrc: '/assets/icon-scan.svg', label: 'We Scan', title: 'We Scan',
      desc: 'We crawl Craigslist, EstateSales.net, Facebook Marketplace, and 20+ local sources in your area every day so you never miss a listing.',
      color: 'var(--clean-accent)',
    },
    {
      iconSrc: '/assets/icon-score.svg', label: 'AI Scores', title: 'AI Scores',
      desc: 'Our AI evaluates every listing for flip potential, pricing anomalies, and deal quality. You see the score; we do the homework.',
      color: 'var(--clean-accent)',
    },
    {
      iconSrc: '/assets/icon-deliver.svg', label: 'You Get Deals', title: 'You Get Deals',
      desc: 'Every Thursday at noon you get one curated email digest with the best garage sales near your zip. No spam. No app. Just deals.',
      color: 'var(--clean-accent)',
    },
  ]

  return (
    <section className="px-4 py-20" style={{ background: '#0a0a0a' }}>
      <h3 className="text-center mb-12" style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '34px',
        color: 'var(--clean-accent)',
        letterSpacing: '-0.02em',
        fontWeight: 700,
      }}>
        How It Works
      </h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {cleanCards.map((card, i) => (
            <div key={i} className="text-center" style={{
              background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '32px 24px',
            }}>
              <div className="mx-auto mb-5 flex items-center justify-center" style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
              }}>
                <img src={card.iconSrc} alt={card.label} width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h4 className="text-lg font-bold mb-3" style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#fff', letterSpacing: '-0.01em',
              }}>
                {card.title}
              </h4>
              <p className="text-sm" style={{ color: '#999', lineHeight: 1.7 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

/* ── TESTIMONIALS ─────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    {
      cleanName: 'Sarah M.',
      cleanMsg: 'Found a $400 table for $20 in McKinney. Sold it on Facebook in 2 hours. This service literally changed how I shop for deals.',
      date: '03/24/26',
      color: '#22C55E',
    },
    {
      cleanName: 'Jake R.',
      cleanMsg: "Found a vintage Eames chair at an estate sale for $15. The weekly digest consistently surfaces deals I would have missed on my own.",
      date: '03/23/26',
      color: '#EC4899',
    },
    {
      cleanName: 'Maria L.',
      cleanMsg: "I made $200 last weekend from a single estate sale Flip-ly told me about. My husband signed up too. The Thursday email is now a household event.",
      date: '03/25/26',
      color: '#EAB308',
    },
    {
      cleanName: 'David K.',
      cleanMsg: "Signed up on a whim after a friend shared it. Now I check my email every Thursday at noon. The AI scoring saves me hours of scrolling Marketplace.",
      date: '03/26/26',
      color: '#3B82F6',
    },
  ]

  return (
    <section className="px-4 py-20" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto">
        <h3 className="text-center mb-8" style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '34px',
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          What Users Are Saying
        </h3>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
          <div className="space-y-4">
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: '#111',
                border: '1px solid #222',
                borderLeft: `3px solid ${t.color}`,
                padding: '20px 24px',
                borderRadius: '8px',
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#1a1a1a', border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px', fontWeight: 700, color: t.color,
                    flexShrink: 0,
                  }}>
                    {t.cleanName.charAt(0)}
                  </div>
                  <div>
                    <span style={{
                      color: '#eee', fontWeight: 600, fontSize: '14px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>{t.cleanName}</span>
                    <span style={{ color: '#555', fontSize: '12px', marginLeft: '8px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>{t.date}</span>
                  </div>
                </div>
                <p style={{
                  color: '#bbb', fontSize: '14px', lineHeight: 1.7,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  &ldquo;{t.cleanMsg}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════ */
/* MAIN PAGE                                                  */
/* ══════════════════════════════════════════════════════════ */

export default function Home() {
  const [showSignup, setShowSignup] = useState(false)
  const [utmSource, setUtmSource] = useState<string | null>(null)

  // Capture UTM source on page load (persists in sessionStorage for signup)
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
    // Auto-open signup if redirected from /pro
    if (params.get('signup') === 'pro') {
      setShowSignup(true)
    }
  }, [])

  // Check if user is logged in
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
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
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
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackCat, setFeedbackCat] = useState('general')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [searchGate, setSearchGate] = useState<any>(null)
  const [featuredDeals, setFeaturedDeals] = useState<any[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // Fetch featured/hot deals — use logged-in user's market, fallback to DFW
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

  // Fetch market list for dropdowns (signup + search)
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
        // Rate limited
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
          email,
          password,
          market_id: signupMarketId,
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
      // Fire conversion events for ad platforms
      trackGA4Event('sign_up', { method: 'email' })
      trackGoogleAdsConversion('YYhjCIqC4pQcENWFh4MD')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
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
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  return (
    <div className="min-h-screen relative">

      {/* Search rate limit indicator (clean pill) */}
      {searchGate && !searchGate.is_premium && searchGate.searches_used !== undefined && (
        <div className="fixed bottom-4 right-4 z-[60]" style={{
          background: searchGate.searches_remaining <= 2 ? '#1a0000' : '#111',
          border: `1px solid ${searchGate.searches_remaining <= 2 ? '#ff4444' : '#333'}`,
          borderRadius: '8px',
          padding: '8px 14px',
          fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '12px',
          transition: 'all 0.3s',
        }}>
          <span style={{ color: searchGate.searches_remaining <= 2 ? '#ff4444' : 'var(--clean-accent)' }}>
            {searchGate.searches_remaining <= 0
              ? 'Daily searches used'
              : `${searchGate.searches_remaining}/${searchGate.searches_max} searches left`}
          </span>
          {searchGate.searches_remaining <= 3 && searchGate.searches_remaining > 0 && (
            <a href="/pro" style={{
              display: 'block', marginTop: '4px',
              color: '#ff6600', fontSize: '11px', textDecoration: 'underline',
            }}>
              Go unlimited — $5/mo for life
            </a>
          )}
        </div>
      )}

      {/* Rate limit banner */}
      {searchGate?.limited && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] max-w-md w-full mx-4" style={{
          background: '#111', border: '1px solid #ff4444', borderRadius: '12px',
          padding: '20px 24px', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '8px' }}>
            Daily search limit reached
          </p>
          <p style={{ color: '#999', fontSize: '13px', fontFamily: 'system-ui, sans-serif', marginBottom: '16px' }}>
            Free accounts get 10 searches per day. Upgrade to Pro for unlimited searches.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/pro" style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'var(--clean-accent)', color: '#000',
              fontFamily: 'system-ui, sans-serif', fontWeight: 600,
              fontSize: '14px', textDecoration: 'none', borderRadius: '8px',
            }}>
              Upgrade to Pro — $5/mo
            </a>
          </div>
          <p style={{ color: '#555', fontSize: '11px', marginTop: '8px', fontFamily: 'system-ui, sans-serif' }}>
            Searches reset daily at midnight.
          </p>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: '#000', borderBottom: '1px solid #222',
        position: 'sticky', top: 0, zIndex: 80,
      }}>
        <div className="flex items-center gap-3">
          <h1 style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            color: '#fff',
            fontWeight: 700,
          }}>
            FLIP-LY
          </h1>
          <nav className="hidden md:flex items-center gap-5 ml-6">
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Search', href: '#search' },
              { label: 'Pricing', href: '#pricing' },
            ].map(link => (
              <a key={link.label} href={link.href} style={{
                color: '#888', fontSize: '13px', textDecoration: 'none',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'color 0.15s',
              }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                 onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex gap-2 items-center">
          {loggedInUser ? (
            <div className="flex items-center gap-2">
              {loggedInUser.is_premium && (
                <span className="px-2 py-0.5 text-[10px] font-bold hidden sm:inline" style={{
                  background: '#22C55E',
                  color: '#000', fontFamily: 'system-ui, sans-serif',
                  borderRadius: '4px',
                }}>
                  PRO
                </span>
              )}
              <a href="/dashboard" className="px-3 py-1.5 text-xs font-bold" style={{
                background: '#1a1a1a', color: '#ccc', border: '1px solid #333',
                borderRadius: '6px', fontFamily: 'system-ui, sans-serif',
                textDecoration: 'none', cursor: 'pointer',
              }}>
                {loggedInUser.email.split('@')[0]}
              </a>
            </div>
          ) : (
            <button onClick={() => setShowSignup(true)} className="px-3 py-1.5 text-xs font-bold" style={{
              background: 'var(--clean-accent)', color: '#000', border: 'none',
              borderRadius: '6px', fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="px-4 py-12 md:py-20 relative" style={{ background: '#000' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-8 md:py-16">
              {/* Left: Copy + CTAs */}
              <div>
                <h2 className="mb-5" style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: 'clamp(32px, 8vw, 56px)',
                  color: '#fff',
                  lineHeight: 1.08,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}>
                  Every garage sale near you.
                </h2>
                <p className="text-base md:text-lg mb-6" style={{
                  color: '#999', lineHeight: 1.7,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  maxWidth: '480px',
                }}>
                  We scan Craigslist, EstateSales.net &amp; 20+ sources in your area. You get one curated digest every Thursday at noon. No app. No algorithm.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <button onClick={() => setShowSignup(true)} className="px-8 py-3.5 text-base font-bold" style={{
                    background: 'var(--clean-accent)', color: '#000',
                    border: 'none', borderRadius: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    cursor: 'pointer', width: '100%', maxWidth: '240px',
                  }}>
                    Get Started — Free
                  </button>
                  <a href="#search" className="px-8 py-3.5 text-base font-bold text-center" style={{
                    background: 'transparent', color: '#888',
                    border: '1px solid #333', borderRadius: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    cursor: 'pointer', textDecoration: 'none',
                    width: '100%', maxWidth: '240px',
                  }}>
                    Try a Search
                  </a>
                </div>
                <p className="text-xs mt-4" style={{ color: '#555' }}>
                  Free forever &middot; No credit card &middot; Unsubscribe anytime
                </p>
              </div>
              {/* Right: Product mockup */}
              <div className="hidden md:flex justify-center">
                <div style={{
                  maxWidth: '100%', width: '420px', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.06)',
                }}>
                  <video
                    autoPlay muted loop playsInline preload="metadata"
                    poster="/assets/hero-mockup.png"
                    style={{ width: '100%', display: 'block', borderRadius: '12px' }}
                  >
                    <source src="/assets/hero-scroll.webm" type="video/webm" />
                    <source src="/assets/hero-mockup.mp4" type="video/mp4" />
                    <img src="/assets/hero-mockup.png" alt="Flip-ly deal digest preview" style={{ width: '100%' }} />
                  </video>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-6 mt-2" style={{
              borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
            }}>
              {[
                '480+ Listings Scored',
                '12 Active Markets',
                'Updated Weekly',
              ].map((stat, i) => (
                <span key={i} style={{
                  color: '#666', fontSize: '13px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.02em',
                }}>
                  {stat}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Source trust bar */}
          <div className="py-5 overflow-hidden" style={{ position: 'relative' }}>
            <p className="text-center mb-3" style={{
              color: '#444', fontSize: '11px', textTransform: 'uppercase',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '1.5px',
            }}>
              We scan
            </p>
            <div className="flex justify-center items-center gap-10 flex-wrap">
              {[
                { src: '/assets/logo-craigslist.png', alt: 'Craigslist', w: 100 },
                { src: '/assets/logo-eventbrite.png', alt: 'Eventbrite', w: 110 },
                { src: '/assets/logo-facebook.jpg', alt: 'Facebook Marketplace', w: 100 },
              ].map((logo, i) => (
                <img key={i} src={logo.src} alt={logo.alt} width={logo.w} style={{
                  filter: 'grayscale(100%) brightness(0.6)',
                  opacity: 0.5,
                  transition: 'opacity 0.2s',
                }} />
              ))}
              <span style={{
                color: '#555', fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 500,
              }}>
                + Local Sources
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEARCH ═══ */}
      <section id="search" className="px-4 py-20" style={{
        background: '#0a0a0a',
        borderTop: '1px solid #222',
        borderBottom: '1px solid #222',
        position: 'relative',
      }}>
        <div className="max-w-3xl mx-auto relative">
          {/* Search header */}
          <div className="mb-6 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
              <h3 style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '32px', fontWeight: 700,
                color: '#fff', marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}>
                Search Deals
              </h3>
              <p style={{
                fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px',
                color: '#888',
              }}>
                Real-time results from Craigslist, EstateSales.net &amp; local sources
              </p>
            </motion.div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch}>
            <div style={{ marginBottom: '8px' }}>
              <div className="flex flex-col gap-3">
                <div style={{
                  background: '#111', border: '1px solid #333', borderRadius: '8px',
                  padding: '4px',
                }}>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3">
                      <span style={{ fontSize: '18px', opacity: 0.5 }}>&#128269;</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search tools, vintage, furniture, free stuff..."
                        style={{
                          width: '100%', padding: '12px 4px', border: 'none', outline: 'none',
                          fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '16px',
                          color: '#eee', background: 'transparent',
                        }}
                      />
                    </div>
                    <div className="flex gap-2 px-2 pb-2 sm:pb-0 sm:px-0 sm:pr-2">
                      <select
                        value={searchMarket}
                        onChange={e => setSearchMarket(e.target.value)}
                        className="flex-1 sm:flex-none"
                        style={{
                          padding: '10px 12px', border: '1px solid #333', borderRadius: '6px',
                          fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px',
                          color: '#ccc', background: '#1a1a1a', cursor: 'pointer',
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
                        background: searching ? '#333' : 'var(--clean-accent)',
                        color: searching ? '#888' : '#000',
                        border: 'none', borderRadius: '6px',
                        fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600,
                        fontSize: '14px', cursor: searching ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick search tags */}
            <div className="mt-3 flex gap-2 justify-center overflow-x-auto sm:flex-wrap sm:overflow-visible pb-2 sm:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              {[
                { tag: 'tools', emoji: '' },
                { tag: 'vintage', emoji: '' },
                { tag: 'furniture', emoji: '' },
                { tag: 'free', emoji: '' },
                { tag: 'electronics', emoji: '' },
                { tag: 'estate sale', emoji: '' },
                { tag: 'kids', emoji: '' },
                { tag: 'collectibles', emoji: '' },
              ].map(({ tag }) => (
                <button key={tag} type="button" onClick={() => { setSearchQuery(tag); }} style={{
                  padding: '6px 14px',
                  border: '1px solid #333', borderRadius: '16px',
                  fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px',
                  color: '#ccc', background: '#1a1a1a',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-center mt-2" style={{
              fontSize: '9px', color: '#555',
              fontFamily: 'system-ui, sans-serif',
              fontStyle: 'italic',
            }}>
              Real-time results from Craigslist, EstateSales.net, and local sources across your market.
            </p>
          </form>

          {/* Results */}
          {showResults && (
            <div className="mt-8">
              {/* Results header bar */}
              <div className="flex justify-between items-center px-3 py-2 mb-3" style={{
                background: '#111', color: '#999', borderRadius: '6px',
                fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '12px',
                border: '1px solid #333',
              }}>
                <span>
                  Showing {realListings.length} of {totalResults} results
                  {searchQuery ? ` for "${searchQuery}"` : ''}
                </span>
                <span style={{ color: '#ff6600' }}>
                  HOT = Score 8+
                </span>
              </div>

              {/* Results list */}
              <div className="space-y-2">
                {realListings.map((listing, i) => (
                  <div key={listing.id || i} className="flex items-center gap-4 px-4 py-3" style={{
                    background: i % 2 === 0 ? '#111' : '#0d0d0d',
                    borderRadius: '6px',
                    border: listing.hot ? '1px solid rgba(255,102,0,0.3)' : '1px solid transparent',
                  }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {listing.hot && <span style={{
                          background: '#ff6600', color: '#fff', padding: '1px 6px',
                          borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                          fontFamily: 'system-ui, sans-serif',
                        }}>HOT</span>}
                        {listing.deal_score && listing.deal_score !== 'gated' && (
                          <span style={{
                            fontSize: '10px', fontFamily: 'monospace',
                            color: listing.deal_score >= 8 ? '#22C55E' : listing.deal_score >= 6 ? '#ff6600' : '#888',
                          }}>{listing.deal_score}/10</span>
                        )}
                        {listing.deal_score === 'gated' && (
                          <a href="/pro" style={{
                            fontSize: '10px', color: '#555', fontFamily: 'monospace',
                            textDecoration: 'none',
                          }}>Score: Pro only</a>
                        )}
                        {listing.source_url ? (
                          <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="truncate" style={{
                            color: '#eee', fontSize: '14px', fontWeight: 500,
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            textDecoration: 'none',
                          }}>
                            {listing.title}
                          </a>
                        ) : (
                          <span className="truncate" style={{
                            color: '#eee', fontSize: '14px', fontWeight: 500,
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                          }}>
                            {listing.title}
                            <a href="/pro" style={{
                              fontSize: '9px', color: '#555', marginLeft: '6px',
                              fontFamily: 'monospace', textDecoration: 'none',
                            }}>Pro only</a>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3" style={{ fontSize: '12px', color: '#888' }}>
                        {listing.city && <span>{listing.city}</span>}
                        <span style={{
                          textTransform: 'uppercase', fontSize: '10px',
                          color: '#666', border: '1px solid #333',
                          padding: '0 4px', borderRadius: '2px',
                        }}>{listing.source}</span>
                        {listing.description && (
                          <span className="truncate hidden sm:inline" style={{ color: '#666', maxWidth: '250px' }}>
                            {listing.description}
                          </span>
                        )}
                      </div>
                      {listing.tags?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {listing.tags.slice(0, 4).map((tag: string) => (
                            <span key={tag} style={{
                              padding: '0 6px', borderRadius: '3px',
                              fontSize: '9px', color: '#666',
                              fontFamily: 'system-ui, sans-serif',
                              background: '#1a1a1a', border: '1px solid #333',
                            }}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div style={{
                        fontFamily: 'system-ui, sans-serif', fontWeight: 700,
                        fontSize: listing.price === 'FREE' ? '15px' : '13px',
                        color: listing.price === 'FREE' ? '#22C55E' : listing.price === 'Not listed' ? '#666' : '#ff6600',
                      }}>
                        {listing.price === 'FREE' ? 'FREE' : listing.price === 'Not listed' ? 'Garage Sale' : listing.price || 'Ask'}
                      </div>
                      {listing.date && (
                        <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>
                          {listing.date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* More results + CTA */}
              <div className="text-center mt-8 space-y-4">
                {totalResults > realListings.length && (
                  <div style={{
                    background: '#111', border: '1px solid #333', borderRadius: '6px',
                    padding: '8px', fontFamily: 'system-ui, sans-serif', fontSize: '13px',
                  }}>
                    <span style={{ color: '#ff6600' }}>
                      {totalResults - realListings.length} more deals in the database
                    </span>
                    <span style={{ color: '#555' }}> — sign up for full access</span>
                  </div>
                )}
                <button onClick={() => setShowSignup(true)} className="px-8 py-3 text-base font-semibold" style={{
                  background: '#ff6600', color: '#fff', border: 'none', borderRadius: '8px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  cursor: 'pointer', letterSpacing: '0.5px',
                }}>
                  Sign Up Free — Get Weekly Deals
                </button>
                <p style={{ fontSize: '11px', color: '#555', fontFamily: 'system-ui, sans-serif' }}>
                  No spam. Weekly deals delivered to your inbox.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FEATURED DEALS ═══ */}
      {featuredDeals.length > 0 && (
        <section className="px-4 py-20" style={{ background: '#000', borderTop: '1px solid #1a1a1a' }}>
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
            <div className="flex items-center justify-between mb-6 gap-2">
              <div className="flex items-center gap-3">
                <h3 style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '26px', fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.02em',
                }}>
                  {featuredMarketName} Hot Deals
                </h3>
                <span style={{
                  background: 'rgba(34,197,94,0.1)', color: 'var(--clean-accent)',
                  padding: '2px 8px', borderRadius: '4px',
                  fontSize: '10px', fontWeight: 600,
                  fontFamily: 'system-ui, sans-serif',
                }}>Powered by AI</span>
              </div>
              <span className="hidden sm:inline" style={{
                fontSize: '12px', color: '#888',
                fontFamily: 'system-ui, sans-serif',
                flexShrink: 0,
              }}>
                Real data &middot; Updated weekly
              </span>
            </div>
            <div className="space-y-2" style={{ background: '#0a0a0a', borderRadius: '12px', padding: '4px', border: '1px solid #1a1a1a' }}>
              {featuredDeals.map((deal, i) => (
                <div key={deal.id || i} className="flex items-center gap-4 px-4 py-3" style={{
                  background: i % 2 === 0 ? '#111' : '#0d0d0d',
                  borderRadius: '8px',
                  border: deal.hot ? '1px solid rgba(255,102,0,0.3)' : '1px solid transparent',
                }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {deal.hot && <span style={{
                        background: '#ff6600', color: '#fff', padding: '1px 6px',
                        borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                        fontFamily: 'system-ui, sans-serif',
                      }}>HOT</span>}
                      <span className="truncate" style={{
                        color: '#eee', fontSize: '14px', fontWeight: 500,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}>
                        {deal.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: '12px', color: '#888' }}>
                      {deal.city && <span>{deal.city}</span>}
                      <span style={{
                        textTransform: 'uppercase', fontSize: '10px',
                        color: '#666', border: '1px solid #333',
                        padding: '0 4px', borderRadius: '2px',
                      }}>{deal.source}</span>
                      {deal.description && (
                        <span className="truncate hidden sm:inline" style={{ color: '#666', maxWidth: '200px' }}>
                          {deal.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div style={{
                      fontFamily: 'system-ui, sans-serif', fontWeight: 700,
                      fontSize: deal.price === 'FREE' ? '15px' : '13px',
                      color: deal.price === 'FREE' ? '#22C55E' : deal.price === 'Not listed' ? '#666' : '#ff6600',
                    }}>
                      {deal.price === 'FREE' ? 'FREE' : deal.price === 'Not listed' ? 'Garage Sale' : deal.price || 'Ask'}
                    </div>
                    {deal.deal_score && deal.deal_score !== 'gated' ? (
                      <div style={{ fontSize: '10px', color: '#22C55E', fontFamily: 'monospace' }}>
                        Score: {deal.deal_score}/10
                      </div>
                    ) : deal.deal_score === 'gated' ? (
                      <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>
                        Score: Pro only
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p style={{ fontSize: '12px', color: '#666', fontFamily: 'system-ui, sans-serif' }}>
                {featuredDeals.length < 8
                  ? 'All top deals this week.'
                  : 'Showing top 8 deals. Search below for more, or sign up for the weekly digest.'}
              </p>
            </div>
            </motion.div>
          </div>
        </section>
      )}
      {featuredLoading && (
        <section className="px-4 py-8" style={{ background: '#0a0a0a', borderTop: '1px solid #222' }}>
          <div className="max-w-3xl mx-auto text-center">
            <p style={{ color: '#555', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
              Loading deals...
            </p>
          </div>
        </section>
      )}

      {/* ═══ VALUE PROPS ═══ */}
      <ValuePropsSection />
      {/* ═══ TESTIMONIALS ═══ */}
      <TestimonialsSection />

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="px-4 py-20" style={{ background: '#000', borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
            <h3 className="text-center mb-2" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '34px', fontWeight: 700,
              color: '#fff', letterSpacing: '-0.02em',
            }}>
              Simple Pricing
            </h3>
            <p className="text-center mb-10" style={{ color: '#666', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
              Free gets you in the door. Pro gets you there first. Early adopters lock in $5/mo for life.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {/* Free tier */}
              <div style={{
                background: '#111', border: '1px solid #222', borderRadius: '12px',
                padding: '28px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '13px', color: '#888', fontFamily: 'system-ui, sans-serif', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Free</div>
                <div style={{ fontSize: '40px', fontWeight: 700, color: '#fff', fontFamily: 'system-ui, sans-serif', marginBottom: '20px' }}>$0<span style={{ fontSize: '14px', color: '#666' }}>/mo</span></div>
                <ul style={{ textAlign: 'left', fontSize: '13px', color: '#999', fontFamily: 'system-ui, sans-serif', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
                  <li>10 searches per day</li>
                  <li>Weekly digest (Thursday noon)</li>
                  <li>Basic deal info</li>
                  <li>All 413 US markets</li>
                </ul>
                <button onClick={() => setShowSignup(true)} className="w-full mt-6 py-3 text-sm font-bold" style={{
                  background: 'transparent', color: '#ccc', border: '1px solid #333',
                  borderRadius: '8px', fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
                }}>
                  Get Started Free
                </button>
              </div>
              {/* Pro tier */}
              <div style={{
                background: '#111', border: '1px solid var(--clean-accent)', borderRadius: '12px',
                padding: '28px', textAlign: 'center', position: 'relative',
                boxShadow: '0 0 30px rgba(34,197,94,0.06)',
              }}>
                <div style={{
                  position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--clean-accent)', color: '#000', padding: '2px 12px',
                  borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                }}>EARLY ADOPTER PRICING</div>
                <div style={{ fontSize: '13px', color: 'var(--clean-accent)', fontFamily: 'system-ui, sans-serif', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pro</div>
                <div style={{ fontSize: '40px', fontWeight: 700, color: '#fff', fontFamily: 'system-ui, sans-serif', marginBottom: '4px' }}>$5<span style={{ fontSize: '14px', color: '#666' }}>/mo</span></div>
                <div style={{ fontSize: '12px', color: '#22C55E', fontFamily: 'system-ui, sans-serif', marginBottom: '16px', fontWeight: 600 }}>Locked in for life</div>
                <ul style={{ textAlign: 'left', fontSize: '13px', color: '#999', fontFamily: 'system-ui, sans-serif', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
                  <li style={{ color: 'var(--clean-accent)' }}>Unlimited searches</li>
                  <li style={{ color: 'var(--clean-accent)' }}>Early digest (6hrs before free)</li>
                  <li style={{ color: 'var(--clean-accent)' }}>Full AI scores + direct links</li>
                  <li style={{ color: 'var(--clean-accent)' }}>Hot deal alerts</li>
                </ul>
                <a href="/pro" className="block w-full mt-6 py-3 text-sm font-bold text-center" style={{
                  background: 'var(--clean-accent)', color: '#000', border: 'none',
                  borderRadius: '8px', fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
                  textDecoration: 'none',
                }}>
                  Upgrade to Pro
                </a>
              </div>
            </div>
            <p className="text-center mt-6" style={{ fontSize: '13px', color: '#555', fontFamily: 'system-ui, sans-serif' }}>
              No contracts. Cancel anytime. Early adopters keep this price forever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20 text-center" style={{ background: '#0a0a0a' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp}>
          <h3 className="mb-3" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '34px',
            color: '#fff', fontWeight: 700, letterSpacing: '-0.02em',
          }}>
            Stop missing deals.
          </h3>
          <p className="mb-8 text-base" style={{ color: '#888', fontFamily: 'system-ui, sans-serif', maxWidth: '400px', margin: '0 auto 32px' }}>
            One email. Every Thursday. The best garage sales near you, scored and sorted.
          </p>
          <button onClick={() => setShowSignup(true)} className="px-8 py-3 text-base font-bold" style={{
            background: 'var(--clean-accent)', color: '#000',
            border: 'none', borderRadius: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: 'pointer',
          }}>
            Get Started — It&apos;s Free
          </button>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-4 py-10" style={{
        background: '#0a0a0a',
        borderTop: '1px solid #222',
        textAlign: 'left',
      }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '12px' }}>Product</h4>
              <div className="flex flex-col gap-2">
                <a href="#how-it-works" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>How It Works</a>
                <a href="#pricing" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Pricing</a>
                <a href="#search" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Search</a>
                <a href="/pro" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Upgrade to Pro</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '12px' }}>Company</h4>
              <div className="flex flex-col gap-2">
                <a href="/about" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>About</a>
                <a href="/why" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Why Flip-ly?</a>
                <a href="mailto:hello@flip-ly.net" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Contact</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '12px' }}>Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="/privacy" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Privacy Policy</a>
                <a href="/terms" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Terms of Service</a>
                <a href="/data-deletion" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Data Deletion</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', marginBottom: '12px' }}>Social</h4>
              <div className="flex flex-col gap-2">
                <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>X / Twitter</a>
                <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>Instagram</a>
                <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>TikTok</a>
                <a href="https://www.youtube.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>YouTube</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #222', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#444', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
              &copy; 2026 Flip-ly.net &middot; AetherCoreAI
            </p>
            <p style={{ color: '#444', fontSize: '11px', fontFamily: 'system-ui, sans-serif' }}>
              Built in DFW &middot; Powered by Supabase &amp; Stripe
            </p>
          </div>
        </div>
        {/* ═══ THE PIXEL — hidden tap target that navigates to /lobster-hunt ═══ */}
        <div style={{ position: 'relative', height: '12px', marginTop: '4px' }}>
          <a
            href="/lobster-hunt"
            onClick={(e) => { e.stopPropagation() }}
            style={{
              width: '16px', height: '16px',
              background: 'transparent',
              cursor: 'default',
              position: 'absolute',
              right: '23%',
              top: '0',
              zIndex: 60,
              display: 'block',
            }}
          >
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: '#0a0a0a',
              position: 'absolute',
              top: '50%', left: '50%',
            }} />
          </a>
        </div>
      </footer>

      {/* ═══ SIGNUP MODAL ═══ */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)}
          style={{ background: 'rgba(0,0,0,0.85)', cursor: 'pointer' }}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{
            background: '#111', border: '1px solid #333', borderRadius: '12px',
            cursor: 'default', overflow: 'hidden',
          }}>
            {/* Close button */}
            <button onClick={() => { setShowSignup(false); setSubmitted(false); setSignupError('') }}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', color: '#888' }}>
              &#10005;
            </button>

            <div style={{ padding: '24px' }}>
              {submitted ? (
                <div className="text-center py-6">
                  <h3 className="text-2xl font-bold mb-3" style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--clean-accent)',
                  }}>
                    {isLoginMode ? 'Welcome Back!' : 'You\'re In!'}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: '#ccc' }}>
                    {isLoginMode ? 'Redirecting to your dashboard...' : 'Welcome! Check your email for confirmation.'}
                  </p>
                  {!isLoginMode && (
                    <p className="text-xs" style={{ color: '#666' }}>
                      (check spam too if you don&apos;t see it)
                    </p>
                  )}
                  <button onClick={() => { setShowSignup(false); setSubmitted(false) }}
                    className="mt-6 px-6 py-2 text-sm font-bold" style={{
                      background: 'var(--clean-accent)', color: '#000', border: 'none',
                      borderRadius: '6px',
                      fontFamily: 'system-ui, -apple-system, sans-serif', cursor: 'pointer',
                    }}>
                    Continue
                  </button>
                </div>
              ) : isLoginMode ? (
                <>
                  <h3 className="text-xl font-bold mb-1" style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
                  }}>
                    Welcome Back
                  </h3>
                  <p className="text-xs mb-6" style={{ color: '#777' }}>
                    Log in to your account.
                  </p>
                  <button onClick={() => signIn('google')} type="button" className="w-full py-3 font-bold text-sm flex items-center justify-center gap-3" style={{
                      background: '#fff', color: '#333', border: '1px solid #ddd',
                      borderRadius: '6px', fontFamily: 'system-ui, -apple-system, sans-serif', cursor: 'pointer',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                      Continue with Google
                    </button>
                    <div className="flex items-center gap-3 my-1">
                      <div style={{ flex: 1, height: '1px', background: '#333' }} />
                      <span className="text-xs" style={{ color: '#555' }}>or</span>
                      <div style={{ flex: 1, height: '1px', background: '#333' }} />
                    </div>
                  <form onSubmit={handleLogin} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="cl-input"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="password"
                      required
                      className="cl-input"
                    />
                    {signupError && (
                      <p className="text-xs" style={{ color: '#ff4444' }}>
                        {signupError}
                      </p>
                    )}
                    <button type="submit" disabled={signingUp} className="w-full py-3 font-bold text-base" style={{
                      background: signingUp ? '#333' : 'var(--clean-accent)', color: '#000',
                      border: 'none', borderRadius: '6px',
                      fontFamily: 'system-ui, -apple-system, sans-serif', cursor: signingUp ? 'wait' : 'pointer',
                    }}>
                      {signingUp ? 'Logging in...' : 'Log In'}
                    </button>
                  </form>
                  <p className="text-xs mt-4 text-center">
                    <button onClick={() => { setIsLoginMode(false); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--clean-accent)',
                      fontFamily: 'system-ui, -apple-system, sans-serif', cursor: 'pointer',
                      textDecoration: 'underline', fontSize: '12px',
                    }}>
                      Don&apos;t have an account? Sign up
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-1" style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
                  }}>
                    Create Your Account
                  </h3>
                  <p className="text-xs mb-6" style={{ color: '#777' }}>
                    Free forever. Weekly deals delivered to your inbox.
                  </p>
                  <button onClick={() => signIn('google')} type="button" className="w-full py-3 font-bold text-sm flex items-center justify-center gap-3" style={{
                      background: '#fff', color: '#333', border: '1px solid #ddd',
                      borderRadius: '6px', fontFamily: 'system-ui, -apple-system, sans-serif', cursor: 'pointer',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                      Sign up with Google
                    </button>
                    <div className="flex items-center gap-3 my-1">
                      <div style={{ flex: 1, height: '1px', background: '#333' }} />
                      <span className="text-xs" style={{ color: '#555' }}>or sign up with email</span>
                      <div style={{ flex: 1, height: '1px', background: '#333' }} />
                    </div>
                  <form onSubmit={handleSignup} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="cl-input"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="password (6+ chars)"
                      required
                      minLength={6}
                      className="cl-input"
                    />
                    <div className="flex gap-2">
                      <select
                        value={signupState}
                        onChange={e => { setSignupState(e.target.value); setSignupMarketId('') }}
                        required
                        className="cl-input flex-1"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">State *</option>
                        {Object.keys(marketsData).sort().map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <select
                        value={signupMarketId}
                        onChange={e => setSignupMarketId(e.target.value)}
                        required
                        className="cl-input flex-1"
                        style={{ cursor: 'pointer' }}
                        disabled={!signupState}
                      >
                        <option value="">Area *</option>
                        {(marketsData[signupState] || []).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    {signupError && (
                      <p className="text-xs" style={{ color: '#ff4444' }}>
                        {signupError}
                      </p>
                    )}
                    <button type="submit" disabled={signingUp} className="w-full py-3 font-bold text-base" style={{
                      background: signingUp ? '#333' : 'var(--clean-accent)', color: '#000',
                      border: 'none', borderRadius: '6px',
                      fontFamily: 'system-ui, -apple-system, sans-serif', cursor: signingUp ? 'wait' : 'pointer',
                    }}>
                      {signingUp ? 'Creating account...' : 'Get Started Free'}
                    </button>
                  </form>
                  <p className="text-xs mt-4 text-center">
                    <button onClick={() => { setIsLoginMode(true); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--clean-accent)',
                      fontFamily: 'system-ui, -apple-system, sans-serif', cursor: 'pointer',
                      textDecoration: 'underline', fontSize: '12px',
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

      {/* ═══ FEEDBACK WIDGET ═══ */}
      <button onClick={() => { setShowFeedback(true); setFeedbackSent(false); setFeedbackMsg(''); setFeedbackCat('general') }}
        className="fixed z-[50]"
        style={{
          bottom: '16px', left: '16px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px', color: '#888',
        }}>
        Feedback
      </button>

      {showFeedback && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowFeedback(false)}
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '420px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div className="flex items-center justify-between mb-4">
              <h4 style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '18px', fontWeight: 700,
                color: '#fff',
              }}>
                {feedbackSent ? 'Thanks!' : 'Send Feedback'}
              </h4>
              <button onClick={() => setShowFeedback(false)} style={{
                background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px',
              }}>&#10005;</button>
            </div>

            {feedbackSent ? (
              <div>
                <p style={{ color: '#ccc', fontSize: '14px', fontFamily: 'system-ui, sans-serif', marginBottom: '8px' }}>
                  Your feedback has been recorded. We read every submission.
                </p>
                <p style={{ color: 'var(--clean-accent)', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
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
                <div className="mb-3">
                  <select value={feedbackCat} onChange={e => setFeedbackCat(e.target.value)} style={{
                    width: '100%', padding: '8px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#ccc', fontSize: '13px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}>
                    <option value="general">General</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="ux">Design / UX</option>
                  </select>
                </div>
                <div className="mb-3">
                  <textarea
                    value={feedbackMsg}
                    onChange={e => setFeedbackMsg(e.target.value)}
                    placeholder="What could be better? We read every message."
                    rows={4}
                    maxLength={2000}
                    required
                    style={{
                      width: '100%', padding: '12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#eee', fontSize: '14px', resize: 'vertical',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      outline: 'none',
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: '11px', color: '#555' }}>{feedbackMsg.length}/2000</span>
                    <span style={{ fontSize: '11px', color: 'var(--clean-accent)' }}>
                      Implemented ideas = 1 free month of Pro
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={feedbackSending || feedbackMsg.trim().length < 5} style={{
                  width: '100%', padding: '12px',
                  background: feedbackSending ? '#333' : 'var(--clean-accent)',
                  color: feedbackSending ? '#888' : '#000',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 600, fontSize: '14px',
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
