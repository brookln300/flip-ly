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
  const [featuredMarketName, setFeaturedMarketName] = useState('Dallas / Fort Worth')
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
  const [sourceGateOverlay, setSourceGateOverlay] = useState(false)

  // Fetch featured deals
  useEffect(() => {
    let marketSlug = 'dallas-tx'
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

  const [searchError, setSearchError] = useState('')

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault()
    const q = overrideQuery ?? searchQuery
    setSearching(true)
    setSearchError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
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
      setTotalResults(0)
      setShowResults(true)
      setSearchError('Something went wrong. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
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
  const DealRow = ({ deal, i, showExpand }: { deal: any; i: number; showExpand?: boolean }) => {
    const hasRealScore = deal.deal_score && deal.deal_score !== 'gated'
    const isScoreGated = deal.deal_score === 'gated'
    const hasReason = !!deal.deal_reason
    const canExpand = showExpand && (hasReason || isScoreGated)

    const handleTitleClick = (e: React.MouseEvent) => {
      if (deal.source_url) return // Pro user — let the link work
      // Free/anon user — gate the click-through
      e.preventDefault()
      e.stopPropagation()
      setSourceGateOverlay(true)
    }

    return (
      <div>
        <div
          className="deal-row"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: canExpand ? 'pointer' : 'default',
          }}
          onClick={() => canExpand && setExpandedDeal(expandedDeal === i ? null : i)}
        >
          {/* Category icon */}
          <div className="deal-icon" style={{
            width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>
            {categoryIcon(deal.title)}
          </div>

          {/* ScoreBadge */}
          {hasRealScore ? (
            <div className="deal-score" style={{
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
          ) : isScoreGated ? (
            <div
              className="deal-score"
              onClick={(e) => { e.stopPropagation(); setShowSignup(true) }}
              style={{
                width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                background: 'linear-gradient(135deg, #f0fdf4, #f8f8f8)',
                border: '1px solid rgba(22,163,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}
              title="Sign up free to see this score"
            >
              <span style={{ fontSize: '14px' }}>🔒</span>
            </div>
          ) : (
            <div className="deal-score" style={{
              width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>--</span>
            </div>
          )}

          {/* Deal info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              {deal.hot && (
                <span style={{ background: '#fef2f2', color: '#dc2626', padding: '1px 5px', fontSize: '9px', fontWeight: 700, borderRadius: '3px', letterSpacing: '0.04em', flexShrink: 0 }}>HOT</span>
              )}
              {deal.event_type && deal.event_type !== 'listing' && (
                <span style={{
                  padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                  letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
                  background: deal.event_type === 'estate_sale' ? 'rgba(168,85,247,0.08)' : deal.event_type === 'garage_sale' ? 'rgba(59,130,246,0.08)' : deal.event_type === 'flea_market' ? 'rgba(236,72,153,0.08)' : deal.event_type === 'moving_sale' ? 'rgba(249,115,22,0.08)' : deal.event_type === 'auction' ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                  color: deal.event_type === 'estate_sale' ? '#A855F7' : deal.event_type === 'garage_sale' ? '#3B82F6' : deal.event_type === 'flea_market' ? '#EC4899' : deal.event_type === 'moving_sale' ? '#F97316' : deal.event_type === 'auction' ? '#EF4444' : '#6366F1',
                }}>
                  {(deal.event_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              )}
              <span
                onClick={handleTitleClick}
                style={{
                  fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                {deal.source_url ? (
                  <a href={deal.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{deal.title}</a>
                ) : deal.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {deal.date && (() => {
                const d = new Date(deal.date + 'T12:00:00')
                if (isNaN(d.getTime())) return null
                const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
                const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff > 0 && diff <= 6 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const isHot = diff === 0 || diff === 1
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                    background: isHot ? 'rgba(22,163,74,0.08)' : 'var(--bg-surface)',
                    color: isHot ? 'var(--accent-green)' : 'var(--text-muted)',
                    border: `1px solid ${isHot ? 'rgba(22,163,74,0.15)' : 'var(--border-subtle)'}`,
                  }}>
                    {label}{deal.time ? ` · ${deal.time}` : ''}
                  </span>
                )
              })()}
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

        {/* Deal reason — shown for top results with real reasons */}
        {showExpand && expandedDeal === i && hasReason && (
          <div className="deal-expanded" style={{
            padding: '8px 0 12px 52px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>AI insight:</span> {deal.deal_reason}
            </p>
            {!deal.source_url && !loggedInUser && (
              <button onClick={(e) => { e.stopPropagation(); setShowSignup(true) }} style={{
                marginTop: '8px', padding: '6px 14px', background: 'var(--accent-green)', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                Sign up free to see this deal
              </button>
            )}
          </div>
        )}

        {/* Gated score expand — nudge to sign up */}
        {showExpand && expandedDeal === i && isScoreGated && !hasReason && (
          <div style={{
            padding: '10px 0 14px 52px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
              AI score and analysis available with a free account.
            </p>
            <button onClick={(e) => { e.stopPropagation(); setShowSignup(true) }} style={{
              padding: '6px 14px', background: 'var(--accent-green)', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              Sign up free to unlock scores
            </button>
          </div>
        )}
      </div>
    )
  }

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
          <a href="#whats-new" className="hidden sm:inline" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px' }}>What&apos;s New</a>
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


      {/* ═══ BEAT 1: HERO — Split layout: text left, video right ═══ */}
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '40px',
          alignItems: 'center',
        }} className="hero-split">

          {/* ── Left: Value prop + stats + CTA ── */}
          <div style={{ textAlign: 'left' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: '20px', padding: '5px 12px', marginBottom: '16px',
              fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Live — scanning now
            </div>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em',
              marginBottom: 'var(--space-3)',
            }}>
              Find underpriced items to flip for profit.
            </h1>
            <p style={{
              fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6,
              maxWidth: '420px', marginBottom: 'var(--space-5)',
            }}>
              We scan 20+ marketplaces and score every deal by resale potential &mdash; so you don&apos;t have to.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSignup(true)}
                style={{
                  background: 'var(--accent-green)', color: '#fff', border: 'none',
                  padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                }}
                onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Start finding deals — free
              </button>
              <a href="#search" style={{
                fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                or try a search
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                { value: stats.listings > 0 ? stats.listings.toLocaleString() : `${stats.markets}`, label: stats.listings > 0 ? 'deals scored' : 'markets' },
                { value: `${stats.sources || '20'}+`, label: 'sources' },
                { value: 'Every 4h', label: 'refresh rate' },
              ].map(s => (
                <div key={s.label}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{s.value}</span>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Hero demo video — overflow crop to remove black edges ── */}
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#f5f5f7',
            boxShadow: '0 12px 48px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
          }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              poster="/hero-poster.jpg"
              style={{
                width: '110%', height: 'auto',
                margin: '-3% 0 -4% -5%',
                display: 'block',
              }}
            >
              <source src="/hero-demo.webm" type="video/webm" />
              <source src="/hero-demo.mp4" type="video/mp4" />
            </video>
          </div>

        </div>
      </div>

      {/* Hero split responsive + pulse animation */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .hero-split {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .hero-split > div:first-child {
            text-align: center !important;
          }
          .hero-split > div:first-child > div {
            justify-content: center !important;
          }
        }
        @media (max-width: 480px) {
          .deal-row { gap: 8px !important; }
          .deal-row .deal-icon { display: none !important; }
          .deal-row .deal-score { width: 32px !important; height: 32px !important; }
          .deal-expanded { padding-left: 0 !important; }
        }
      `}</style>

      {/* ═══ HOW IT WORKS — full-width section right under hero ═══ */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-10) var(--space-4)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', label: 'We scan', desc: 'Craigslist, OfferUp, EstateSales.net, Eventbrite, and 20+ local sources — every 4 hours.', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )},
              { step: '2', label: 'AI scores', desc: 'Every listing rated 1-10 by resale value, demand signals, and profit margin potential.', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              )},
              { step: '3', label: 'You flip', desc: 'See the best deals before everyone else. Show up first, buy low, sell high.', icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              )},
            ].map(item => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 12px',
                  background: '#ffffff', border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>{item.icon}</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{item.label}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {/* Source logos inline */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap', opacity: 0.4, marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Craigslist"><circle cx="12" cy="12" r="10" stroke="#6e6e73" strokeWidth="1.5"/><text x="12" y="16" textAnchor="middle" fill="#6e6e73" fontSize="10" fontWeight="700" fontFamily="system-ui">CL</text></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Facebook Marketplace"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="OfferUp"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="EstateSales.net"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Eventbrite"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="ShopGoodwill"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>+ 14 more</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ SEARCH — try before you sign up ═══ */}
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-10) var(--space-4) 0' }}>
        <div id="search" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Try it — search your area for free
          </p>
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

            {/* Event type quick filters */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { label: '🏠 Garage Sales', q: 'garage sale' },
                { label: '🏛️ Estate Sales', q: 'estate sale' },
                { label: '🎪 Flea Markets', q: 'flea market' },
                { label: '📦 Moving Sales', q: 'moving sale' },
                { label: '🔨 Auctions', q: 'auction' },
                { label: '🆓 Free Items', q: 'free' },
              ].map(tag => (
                <button key={tag.q} type="button" onClick={() => { setSearchQuery(tag.q); handleSearch(undefined, tag.q) }} style={{
                  padding: '5px 14px', border: '1px solid var(--border-subtle)', borderRadius: '20px',
                  fontSize: '12px', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.15s', fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.4)'; e.currentTarget.style.color = 'var(--accent-green)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </form>
        </div>

      </div>

      {/* ═══ SEARCH RESULTS — inline, no section break ═══ */}
      {showResults && (
        <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-6) var(--space-4) 0' }}>
          {searchError ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
              <p style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: '8px' }}>{searchError}</p>
              <button onClick={() => handleSearch()} style={{
                padding: '8px 20px', background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              }}>Try again</button>
            </div>
          ) : realListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                No deals found{searchQuery ? ` for "${searchQuery}"` : ''}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Try a different search term or select a broader area.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                {totalResults} results{searchQuery ? ` for "${searchQuery}"` : ''}
              </div>
              {realListings.map((listing, i) => (
                <div key={listing.id || i}>
                  <DealRow deal={listing} i={i} showExpand={i < 5} />

                  {/* Inline CTA after result #5 for anonymous users */}
                  {i === 4 && !loggedInUser && realListings.length > 5 && (
                    <div style={{
                      margin: '16px 0', padding: '16px 20px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))',
                      border: '1px solid rgba(22,163,74,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '12px',
                    }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                          Scores hidden below? Sign up free to see them all.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          Plus: direct links, full AI analysis, and weekly digest.
                        </p>
                      </div>
                      <button onClick={() => setShowSignup(true)} style={{
                        padding: '8px 20px', background: 'var(--accent-green)', color: '#fff',
                        border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px',
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        Sign up free
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Bottom CTA */}
              {!loggedInUser && realListings.length > 0 && (
                <div style={{ padding: 'var(--space-5) 0', textAlign: 'center' }}>
                  {totalResults > realListings.length ? (
                    <button onClick={() => setShowSignup(true)} style={{
                      padding: '10px 24px', background: 'var(--accent-green)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    }}>
                      Sign up free to see all {totalResults} results
                    </button>
                  ) : (
                    <button onClick={() => setShowSignup(true)} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px',
                      cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px',
                    }}>
                      Sign up for unlimited searches, full scores, and source links
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* ═══ BEAT 2: LIVE FEED — deals happening now ═══ */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
        style={{ maxWidth: '560px', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}
      >
        {featuredDeals.length > 0 && (
          <>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Top deals in {featuredMarketName}
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: '4px' }}>
                  live
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Scored by AI — higher number = better flip potential
              </p>
            </div>
            {featuredDeals.map((deal, i) => (
              <DealRow key={deal.id || i} deal={deal} i={100 + i} showExpand={i < 3} />
            ))}
          </>
        )}
        {featuredLoading && (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Loading deals...</p>
          </div>
        )}
        {featuredDeals.length > 0 && !loggedInUser && (
          <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
              These deals update every 4 hours. Get them in your inbox every Thursday.
            </p>
            <button onClick={() => signIn('google')} style={{
              padding: '12px 32px', background: 'var(--accent-green)', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22,163,74,0.2)',
            }}>
              Get started free
            </button>
            <button onClick={() => setShowSignup(true)} style={{
              display: 'block', margin: '8px auto 0', background: 'none', border: 'none',
              color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: '2px',
            }}>
              or use email
            </button>
          </div>
        )}
      </motion.div>




      {/* ═══ TRUST STRIP — value proposition (no image needed) ═══ */}
      {!loggedInUser && (
        <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Stop checking 5 sites every morning
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              We aggregate, score, and rank — so you can focus on buying and selling.
            </p>
          </div>
        </div>
      )}

      {/* ═══ HOW SCORING WORKS — visual breakdown ═══ */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
        style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0', textAlign: 'center' }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Every deal gets a flip score
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto var(--space-6)' }}>
          Our AI analyzes demand, margin potential, competition, and sell-through velocity to rate every listing 1&ndash;10.
        </p>
        <div className="score-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          maxWidth: '480px', margin: '0 auto',
        }}>
          {[
            { icon: '📈', label: 'Demand', desc: 'How fast does this category sell?' },
            { icon: '💰', label: 'Margin', desc: 'Price vs typical resale value' },
            { icon: '🏷️', label: 'Competition', desc: 'How many similar listings exist?' },
            { icon: '⚡', label: 'Velocity', desc: 'Days-to-sell estimate' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '14px 8px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{f.icon}</div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{f.label}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 480px) {
            .score-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </motion.div>

      {/* ═══ PRICING — card-based with clear feature differentiation ═══ */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
        id="pricing" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Simple pricing</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>One good find pays for a year of Pro.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Free */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Free</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>$0</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>15 searches / day</span>
              <span>1 market</span>
              <span>Weekly digest (Thursday)</span>
              <span>AI scores (number only)</span>
            </div>
            <button onClick={() => setShowSignup(true)} style={{
              width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
              borderRadius: '8px', cursor: 'pointer',
            }}>Get started</button>
          </div>
          {/* Pro */}
          <div style={{
            background: '#ffffff', borderRadius: '12px', padding: '24px',
            border: '2px solid var(--accent-green)',
            boxShadow: '0 4px 24px rgba(22,163,74,0.08)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--accent-green)', color: '#fff', fontSize: '10px', fontWeight: 700,
              padding: '3px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Most popular</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}>Pro</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$5</span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span><strong>Unlimited</strong> searches</span>
              <span>3 markets</span>
              <span>Digest <strong>6 hours early</strong></span>
              <span>Full score breakdowns</span>
              <span>Direct source links</span>
            </div>
            <a href="/pro" style={{
              display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 700,
              background: 'var(--accent-green)', color: '#fff', border: 'none', textAlign: 'center',
              borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
            }}>Upgrade to Pro</a>
          </div>
          {/* Power */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '4px' }}>Power</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$19</span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Everything in Pro</span>
              <span><strong>Unlimited</strong> markets</span>
              <span>Instant deal alerts</span>
              <span>Category intelligence</span>
              <span>Priority support</span>
            </div>
            <a href="/pro" style={{
              display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', textAlign: 'center',
              borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
            }}>Go Power</a>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px', marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
          Founding member pricing — locked in for life
        </p>
      </motion.div>


      {/* ═══ WHAT'S NEW + ROADMAP ═══ */}
      <motion.div
        id="whats-new"
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '20px', padding: '5px 14px', marginBottom: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(22,163,74,0.4)', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>Actively Building</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>What&apos;s new &amp; what&apos;s next</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
            We ship weekly. Your feedback shapes what we build.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Recently shipped */}
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>&#x2705;</span>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recently shipped</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Weekend Route Planner', desc: 'Save deals, get a proximity-sorted driving route with Google Maps directions', tag: 'NEW' },
                { label: 'AI Deal Scoring', desc: 'Every listing scored 1-10 for flip potential with reasoning', tag: null },
                { label: 'Advanced Filters', desc: '8 event types, date range, score threshold, and geo search', tag: null },
                { label: 'Weekly Digest Email', desc: 'Saturday/Sunday deal roundup delivered Thursday — Pro gets it 6 hours early', tag: null },
                { label: 'Expandable Listings', desc: 'Click any deal to see AI description, tags, address, and directions', tag: null },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-green)', fontSize: '13px', marginTop: '1px', flexShrink: 0 }}>&#x2713;</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                      {item.tag && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(22,163,74,0.08)', borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.5px' }}>{item.tag}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming soon */}
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>&#x1F6A7;</span>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Coming soon</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Real-Time Deal Alerts', desc: 'Get notified the moment a high-score deal drops in your area', tier: 'Pro' },
                { label: 'Saved Search Notifications', desc: 'Save a search query and get alerts when new matches appear', tier: 'Pro' },
                { label: 'Mobile-First Redesign', desc: 'Swipe-friendly cards, bottom nav, one-thumb operation', tier: 'All' },
                { label: 'City SEO Pages', desc: '"Best estate sales in Dallas this weekend" — auto-generated from real data', tier: 'All' },
                { label: 'More Sources', desc: 'Facebook Marketplace, OfferUp, Nextdoor, and local permit feeds', tier: 'All' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '1px', flexShrink: 0 }}>&#x25CB;</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: item.tier === 'Pro' ? 'var(--accent-green)' : 'var(--text-dim)', background: item.tier === 'Pro' ? 'rgba(22,163,74,0.08)' : 'var(--bg-surface)', borderRadius: '4px', padding: '1px 5px' }}>{item.tier}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Early access callout */}
        <div style={{
          marginTop: '20px', padding: '16px 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.04) 0%, rgba(22,163,74,0.02) 100%)',
          border: '1px solid rgba(22,163,74,0.12)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            You&apos;re early. We launched weeks ago and ship improvements daily.{' '}
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Founding members lock in current pricing for life</span>{' '}
            &mdash; it goes up as we add more sources and features.
          </p>
        </div>
      </motion.div>


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


      {/* SOURCE GATE OVERLAY — when anon clicks a deal title */}
      {sourceGateOverlay && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          onClick={() => setSourceGateOverlay(false)} style={{ background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
          <div className="w-full max-w-sm relative" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', borderRadius: '16px', cursor: 'default', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '32px 28px', textAlign: 'center',
          }}>
            <button onClick={() => setSourceGateOverlay(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              X
            </button>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Sign up free to see this deal
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Get direct links to listings, full AI scores, and a weekly digest of the best deals near you.
            </p>
            <button
              onClick={() => { setSourceGateOverlay(false); signIn('google') }}
              style={{
                width: '100%', padding: '12px', background: '#fff', color: 'var(--text-primary)',
                border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer', marginBottom: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.34 2.56 10.5l7.97-5.91z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.91C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <button
              onClick={() => { setSourceGateOverlay(false); setShowSignup(true) }}
              style={{
                width: '100%', padding: '12px', background: 'var(--accent-green)', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Sign up with email
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>
              Free forever. No credit card needed.
            </p>
          </div>
        </div>
      )}

      {/* SIGNUP MODAL — kept for header CTA and direct links */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)} style={{ background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', border: '1px solid var(--border-default)',
            borderRadius: '16px', cursor: 'default', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <button onClick={() => { setShowSignup(false); setSubmitted(false); setSignupError(''); setEmail(''); setPassword(''); setSignupState(''); setSignupMarketId(''); setIsLoginMode(false) }}
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
