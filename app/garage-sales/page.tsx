'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackGoogleAdsConversion, trackGA4Event } from '../components/GoogleAnalytics'

export default function GarageSalesLanding() {
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupState, setSignupState] = useState('')
  const [signupMarketId, setSignupMarketId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signingUp, setSigningUp] = useState(false)
  const [marketsData, setMarketsData] = useState<Record<string, { id: string; slug: string; name: string }[]>>({})
  const [marketsLoading, setMarketsLoading] = useState(true)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)

  // Capture UTM + ad click IDs on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source')
    if (source) {
      sessionStorage.setItem('fliply_utm_source', source)
      sessionStorage.setItem('fliply_utm_medium', params.get('utm_medium') || '')
      sessionStorage.setItem('fliply_utm_campaign', params.get('utm_campaign') || '')
    }
    const gclid = params.get('gclid')
    if (gclid) sessionStorage.setItem('fliply_gclid', gclid)
    const fbclid = params.get('fbclid')
    if (fbclid) sessionStorage.setItem('fliply_fbclid', fbclid)
    const msclkid = params.get('msclkid')
    if (msclkid) sessionStorage.setItem('fliply_msclkid', msclkid)

    // Track landing page view
    trackGA4Event('page_view', { page_title: 'Garage Sales Landing', page_location: '/garage-sales' })
  }, [])

  // Check if user is logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setLoggedInUser(data.user) })
      .catch(() => {})
  }, [])

  // Fetch markets for signup dropdown
  useEffect(() => {
    fetch('/api/markets')
      .then(res => res.json())
      .then(data => { if (data.markets) setMarketsData(data.markets) })
      .catch(() => {})
      .finally(() => setMarketsLoading(false))
  }, [])

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
          utm_source: sessionStorage.getItem('fliply_utm_source') || 'google_ads',
          utm_medium: sessionStorage.getItem('fliply_utm_medium') || 'cpc',
          utm_campaign: sessionStorage.getItem('fliply_utm_campaign') || 'garage-sales-landing',
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
      trackGA4Event('sign_up', { method: 'email', source: 'garage-sales-landing' })
      trackGoogleAdsConversion('YYhjCIqC4pQcENWFh4MD')
      setTimeout(() => { window.location.href = '/dashboard' }, 2000)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ═══ HEADER ═══ */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: '#000', borderBottom: '1px solid #222',
        position: 'sticky', top: 0, zIndex: 80,
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: '20px', color: '#fff', fontWeight: 700 }}>FLIP-LY</h1>
        </a>
        <div className="flex gap-2 items-center">
          {loggedInUser ? (
            <a href="/dashboard" className="px-3 py-1.5 text-xs font-bold" style={{
              background: '#1a1a1a', color: '#ccc', border: '1px solid #333',
              borderRadius: '6px', textDecoration: 'none',
            }}>
              Dashboard
            </a>
          ) : (
            <button onClick={() => setShowSignup(true)} className="px-4 py-2 text-sm font-bold" style={{
              background: '#22C55E', color: '#000', border: 'none',
              borderRadius: '8px', cursor: 'pointer',
            }}>
              Sign Up Free
            </button>
          )}
        </div>
      </header>

      {/* ═══ HERO — Focused for ad traffic ═══ */}
      <section className="px-4 py-12 md:py-20">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-4" style={{
              fontSize: 'clamp(28px, 7vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              Find Garage Sales Near You.
              <br />
              <span style={{ color: '#22C55E' }}>Before Anyone Else.</span>
            </h2>
            <p className="mb-8 mx-auto" style={{
              color: '#999', fontSize: '18px', lineHeight: 1.7,
              maxWidth: '520px',
            }}>
              We scan Craigslist, EstateSales.net, Facebook Marketplace &amp; 20+ sources daily.
              Get one curated email every Thursday with the best deals in your area.
            </p>
            <button onClick={() => setShowSignup(true)} className="px-10 py-4 text-lg font-bold" style={{
              background: '#22C55E', color: '#000', border: 'none',
              borderRadius: '10px', cursor: 'pointer',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)',
            }}>
              Get Your Free Weekly Digest
            </button>
            <p className="mt-3" style={{ color: '#555', fontSize: '13px' }}>
              Free forever &middot; No credit card &middot; Unsubscribe anytime
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section className="px-4 py-6" style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {['480+ Listings Scored', '12 Active Markets', '20+ Sources Scanned', 'Updated Weekly'].map((stat, i) => (
            <span key={i} style={{ color: '#666', fontSize: '13px', letterSpacing: '0.02em' }}>
              {stat}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 Steps ═══ */}
      <section className="px-4 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h3 className="text-center mb-10" style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E' }}>
            How It Works
          </h3>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Sign Up Free', desc: 'Pick your city. Takes 30 seconds. No credit card needed.' },
              { num: '2', title: 'We Scan Everything', desc: 'Our AI scans 20+ sources daily — Craigslist, estate sales, Facebook groups, and local listings.' },
              { num: '3', title: 'Get Deals Thursday', desc: 'Every Thursday at noon, you get one email with the best garage sales near you, scored by AI.' },
            ].map((step, i) => (
              <div key={i} className="text-center" style={{
                background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '28px 20px',
              }}>
                <div className="mx-auto mb-4 flex items-center justify-center" style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E',
                  fontSize: '18px', fontWeight: 700,
                }}>
                  {step.num}
                </div>
                <h4 className="text-base font-bold mb-2" style={{ color: '#fff' }}>{step.title}</h4>
                <p className="text-sm" style={{ color: '#999', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ WHAT PEOPLE FIND ═══ */}
      <section className="px-4 py-16" style={{ background: '#0a0a0a' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h3 className="text-center mb-3" style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>
            Real Finds From Real Users
          </h3>
          <p className="text-center mb-10" style={{ color: '#666', fontSize: '14px' }}>
            These are actual deals our members found through Flip-ly
          </p>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { name: 'Sarah M.', msg: 'Found a $400 table for $20 in McKinney. Sold it on Facebook in 2 hours.', color: '#22C55E' },
              { name: 'Jake R.', msg: 'Found a vintage Eames chair at an estate sale for $15. The weekly digest consistently surfaces deals I would have missed.', color: '#EC4899' },
              { name: 'Maria L.', msg: 'I made $200 last weekend from a single estate sale Flip-ly told me about. My husband signed up too.', color: '#EAB308' },
              { name: 'David K.', msg: 'The AI scoring saves me hours of scrolling Marketplace. I check my email every Thursday at noon now.', color: '#3B82F6' },
            ].map((t, i) => (
              <div key={i} style={{
                background: '#111', border: '1px solid #222',
                borderLeft: `3px solid ${t.color}`,
                padding: '16px 20px', borderRadius: '8px',
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#1a1a1a', border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: t.color, flexShrink: 0,
                  }}>
                    {t.name.charAt(0)}
                  </div>
                  <span style={{ color: '#eee', fontWeight: 600, fontSize: '13px' }}>{t.name}</span>
                </div>
                <p style={{ color: '#bbb', fontSize: '14px', lineHeight: 1.6 }}>
                  &ldquo;{t.msg}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20 text-center" style={{ background: '#000' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h3 className="mb-3" style={{ fontSize: '32px', fontWeight: 700 }}>
            Stop Scrolling. Start Finding.
          </h3>
          <p className="mb-8 mx-auto" style={{ color: '#999', fontSize: '16px', maxWidth: '460px', lineHeight: 1.6 }}>
            Join hundreds of garage sale hunters who get the best deals delivered every Thursday. Free.
          </p>
          <button onClick={() => setShowSignup(true)} className="px-10 py-4 text-lg font-bold" style={{
            background: '#22C55E', color: '#000', border: 'none',
            borderRadius: '10px', cursor: 'pointer',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)',
          }}>
            Get Started — It&apos;s Free
          </button>
          <p className="mt-3" style={{ color: '#555', fontSize: '13px' }}>
            No spam. No app. Just deals.
          </p>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-4 py-8 text-center" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p style={{ color: '#444', fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} Flip-ly.net &middot;{' '}
          <a href="/privacy" style={{ color: '#555', textDecoration: 'underline' }}>Privacy</a> &middot;{' '}
          <a href="/terms" style={{ color: '#555', textDecoration: 'underline' }}>Terms</a> &middot;{' '}
          <a href="/about" style={{ color: '#555', textDecoration: 'underline' }}>About</a>
        </p>
      </footer>

      {/* ═══ SIGNUP MODAL ═══ */}
      {showSignup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div style={{
            background: '#111', border: '1px solid #333', borderRadius: '16px',
            padding: '32px', width: '100%', maxWidth: '400px', position: 'relative',
          }}>
            <button onClick={() => setShowSignup(false)} style={{
              position: 'absolute', top: '12px', right: '16px',
              background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer',
            }}>
              &times;
            </button>

            {submitted ? (
              <div className="text-center py-6">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#10003;</div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#22C55E' }}>
                  You&apos;re In!
                </h3>
                <p style={{ color: '#999', fontSize: '14px' }}>
                  Your first digest arrives this Thursday. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-1" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  Get Your Free Digest
                </h3>
                <p className="mb-5" style={{ color: '#888', fontSize: '13px' }}>
                  Every Thursday. Best garage sales near you. Free forever.
                </p>

                <form onSubmit={handleSignup}>
                  <div className="mb-3">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '12px 14px', fontSize: '14px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                        color: '#fff', outline: 'none',
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      placeholder="Create password (6+ chars)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{
                        width: '100%', padding: '12px 14px', fontSize: '14px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                        color: '#fff', outline: 'none',
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <select
                      value={signupState}
                      onChange={e => { setSignupState(e.target.value); setSignupMarketId('') }}
                      style={{
                        width: '100%', padding: '12px 14px', fontSize: '14px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                        color: signupState ? '#fff' : '#888', outline: 'none', marginBottom: '8px',
                      }}
                    >
                      <option value="">Select your state</option>
                      {Object.keys(marketsData).sort().map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {signupState && marketsData[signupState] && (
                      <select
                        value={signupMarketId}
                        onChange={e => setSignupMarketId(e.target.value)}
                        required
                        style={{
                          width: '100%', padding: '12px 14px', fontSize: '14px',
                          background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                          color: signupMarketId ? '#fff' : '#888', outline: 'none',
                        }}
                      >
                        <option value="">Select your market</option>
                        {marketsData[signupState].map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {signupError && (
                    <p className="mb-3" style={{ color: '#ff4444', fontSize: '13px' }}>{signupError}</p>
                  )}

                  <button type="submit" disabled={signingUp} className="w-full py-3 text-base font-bold" style={{
                    background: signingUp ? '#1a5c2e' : '#22C55E', color: '#000',
                    border: 'none', borderRadius: '8px', cursor: signingUp ? 'wait' : 'pointer',
                  }}>
                    {signingUp ? 'Creating account...' : 'Sign Up Free'}
                  </button>
                </form>

                <p className="mt-3 text-center" style={{ color: '#555', fontSize: '11px' }}>
                  Free forever &middot; No credit card &middot; Unsubscribe anytime
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
