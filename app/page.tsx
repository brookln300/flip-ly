'use client'

import { useState, useEffect, useRef } from 'react'
import WinampPlayer from './components/WinampPlayer'
import RetroPopups from './components/RetroPopups'
import BSOD from './components/BSOD'

/* ── VISITOR COUNTER (fake but convincing) ──────────────── */
function VisitorCounter() {
  const [count, setCount] = useState(69420)
  useEffect(() => {
    const i = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 4000)
    return () => clearInterval(i)
  }, [])
  return <span className="visitor-counter">{count.toLocaleString()}</span>
}

/* ── WINDOWS 98 ERROR DIALOG (with real asset) ──────────── */
function Win98Error({ onClose, onSignup }: { onClose: () => void; onSignup: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{
      background: 'rgba(0,0,128,0.4)',
      backdropFilter: 'blur(2px)',
    }}>
      <div className="relative w-full max-w-lg" style={{ transform: 'rotate(-1deg)' }}>
        {/* The actual error box image as background */}
        <img src="/assets/hero-error-box.jpg" alt="FLIP-LY.NET HAS PERFORMED AN ILLEGAL OPERATION"
          className="w-full rounded-lg"
          style={{ boxShadow: '0 0 60px rgba(255, 16, 240, 0.3), 0 20px 40px rgba(0,0,0,0.5)' }}
        />
        {/* Clickable overlay buttons positioned over the image */}
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[80%] flex flex-col items-center gap-3">
          <button onClick={onSignup} className="w-full py-4 text-lg font-bold blink" style={{
            background: 'var(--neon-orange)',
            color: '#fff',
            border: '4px solid var(--lime)',
            fontFamily: '"Comic Sans MS", cursive',
            cursor: 'pointer',
            boxShadow: '0 0 20px var(--neon-orange), 0 4px 12px rgba(0,0,0,0.4)',
            letterSpacing: '1px',
          }}>
            OK — SIGN UP ANYWAY (it&apos;s free)
          </button>
          <button onClick={onClose} className="text-xs underline" style={{
            color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
          }}>
            Ignore (bad idea)
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── FLOATING MASCOT ────────────────────────────────────── */
function Mascot() {
  const [pos, setPos] = useState({ x: 80, y: 25 })
  const [msg, setMsg] = useState('')
  const msgs = [
    'why are you here?', 'nice margins bro', 'stop clicking me',
    'is this a real website?', 'i live here now', 'this is fine.',
    'Comic Sans is valid.', '404: taste not found', 'hire me (im a robot)',
    'FATAL_BARGAIN_DETECTED', 'have you tried Netscape?', '*dial-up noises*',
    'ur mom uses Papyrus', 'this CSS is cursed', 'embrace the chaos',
  ]

  useEffect(() => {
    const i = setInterval(() => {
      setPos({ x: Math.random() * 80 + 5, y: Math.random() * 60 + 20 })
      if (Math.random() > 0.7) { // less frequent bubbles
        setMsg(msgs[Math.floor(Math.random() * msgs.length)])
        setTimeout(() => setMsg(''), 4000)
      }
    }, 8000) // slower movement
    return () => clearInterval(i)
  }, [])

  return (
    <div className="fixed z-50 pointer-events-none select-none transition-all duration-[4000ms] ease-in-out hidden sm:block"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
      <div className="relative">
        <img src="/assets/robot-mascot.jpg" alt="G1TC# mascot" style={{
          width: '80px', height: '80px', objectFit: 'cover', objectPosition: 'top left',
          borderRadius: '50%',
          filter: 'drop-shadow(0 0 8px var(--lime))',
          animation: 'glitch1 3s infinite',
          border: '2px solid var(--lime)',
        }} />
        {msg && <div className="mascot-bubble">{msg}</div>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/* MAIN PAGE — THE CHAOS                                     */
/* ══════════════════════════════════════════════════════════ */

export default function Home() {
  const [showError, setShowError] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupCity, setSignupCity] = useState('')
  const [signupZip, setSignupZip] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signingUp, setSigningUp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Show Win98 error after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowError(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    // Crash animation
    setTimeout(() => {
      setSearching(false)
      setShowResults(true)
    }, 600)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !signupCity || !signupZip) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          city: signupCity,
          zip_code: signupZip,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data.error || 'Signup failed')
        setSigningUp(false)
        return
      }
      setSubmitted(true)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch {
      setSignupError('Something broke. Like our CSS.')
      setSigningUp(false)
    }
  }

  const fakeListings = [
    { title: 'Entire garage cleanout — tools, furniture, electronics', price: 'Multi-family', city: 'McKinney, TX', date: 'Sat 3/29', hot: true },
    { title: 'Estate sale — antique furniture, jewelry, art', price: '$5–$500', city: 'Plano, TX', date: 'Fri–Sun', hot: true },
    { title: 'Moving sale — EVERYTHING MUST GO', price: 'Make offer', city: 'Dallas, TX', date: 'Sat 3/29', hot: false },
    { title: 'Vintage vinyl records, turntables, speakers', price: '$2–$80', city: 'Denton, TX', date: 'Sat 3/29', hot: true },
    { title: 'Kids toys, bikes, baby gear — great condition', price: '$1–$40', city: 'Frisco, TX', date: 'Sat–Sun', hot: false },
    { title: 'Power tools, lawn equipment, workshop cleanout', price: '$5–$200', city: 'Arlington, TX', date: 'Sat 3/29', hot: true },
  ]

  return (
    <div className="min-h-screen relative">
      <Mascot />
      <WinampPlayer />
      <RetroPopups />
      <BSOD />
      {showError && <Win98Error onClose={() => setShowError(false)} onSignup={() => { setShowError(false); setShowSignup(true) }} />}

      {/* Mute toggle removed from here — now in header */}

      {/* ═══ CONSTRUCTION BANNER ═══ */}
      <div className="construction-banner">
        🚧 UNDER CONSTRUCTION 🚧 (everything works tho) 🚧 UNDER CONSTRUCTION 🚧
      </div>

      {/* ═══ NETSCAPE + KAZAA BANNER ═══ */}
      <div className="netscape-banner flex flex-wrap items-center justify-center gap-2">
        <span className="hidden sm:inline">🌐 Best viewed in Netscape 4.0 at 800x600 🌐</span>
        <span style={{ color: 'var(--mustard)' }}>Visitor #<VisitorCounter /> since 1996</span>
        <span className="hidden md:inline" style={{ color: 'var(--electric)' }}>
          | 📂 Kazaa: 4,269 deals shared
        </span>
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: '#000', borderBottom: '4px solid var(--lime)',
      }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl jitter">🦞</span>
          <h1 className="glitch" data-text="FLIP-LY.NET" style={{
            fontFamily: '"Comic Sans MS", cursive', fontSize: '24px', color: 'var(--lime)',
          }}>
            FLIP-LY<span style={{ color: 'var(--hotpink)' }}>.NET</span>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-2 py-1 text-[10px] font-bold hidden sm:block" style={{
            background: '#1a1a1a', border: '1px solid #333', color: '#888',
            fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
          }}>
            🔇 Mute Nostalgia
          </button>
          <span className="text-xs blink hidden sm:inline" style={{ color: 'var(--mustard)' }}>● LIVE</span>
          <button onClick={() => setShowSignup(true)} className="px-3 py-1.5 text-xs font-bold" style={{
            border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
            background: 'var(--win98-gray)', color: '#000',
            fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
          }}>
            Sign In
          </button>
        </div>
      </header>

      {/* ═══ CRAIGSLIST NAV BAR ═══ */}
      <div className="px-2 py-1 flex flex-wrap items-center gap-1 justify-center" style={{
        background: 'var(--hotpink)',
        borderBottom: '3px solid var(--lime)',
        fontFamily: 'Tahoma, sans-serif',
      }}>
        {['FOR SALE', 'HOUSING', 'JOBS', 'GIGS', 'SERVICES', 'COMMUNITY'].map((cat, i) => (
          <span key={cat} className="px-3 py-1 text-xs font-bold cursor-pointer" style={{
            background: i === 0 ? 'var(--lime)' : 'transparent',
            color: i === 0 ? '#000' : '#fff',
            border: '2px solid',
            borderColor: i === 0 ? 'var(--dark)' : 'rgba(255,255,255,0.3)',
          }}>
            {cat}
          </span>
        ))}
        <span className="px-4 py-1 text-xs font-bold cursor-pointer blink" style={{
          background: 'var(--neon-orange)', color: '#fff',
          border: '2px solid var(--mustard)',
          fontFamily: '"Comic Sans MS", cursive',
        }}>
          📮 POST
        </span>
      </div>

      <div className="rainbow-divider" />

      {/* ═══ HERO — WIN98 ERROR STYLE ═══ */}
      <section className="px-4 py-12 md:py-20 relative">
        {/* Decorative elements + robot mascot */}
        <div className="absolute top-8 left-6 text-6xl opacity-[0.06] rotate-45 select-none">🗑️</div>
        <div className="absolute bottom-12 right-8 text-5xl opacity-[0.06] -rotate-12 select-none">💎</div>
        <img src="/assets/robot-mascot.jpg" alt="" className="absolute bottom-4 left-4 select-none pointer-events-none"
          style={{ width: '120px', opacity: 0.15, transform: 'rotate(-8deg)', objectFit: 'cover', objectPosition: 'bottom right', borderRadius: '8px' }} />
        <img src="/assets/robot-mascot.jpg" alt="" className="absolute top-8 right-4 select-none pointer-events-none hidden md:block"
          style={{ width: '90px', opacity: 0.1, transform: 'rotate(12deg) scaleX(-1)', objectFit: 'cover', objectPosition: 'top right', borderRadius: '8px' }} />

        <div className="max-w-3xl mx-auto text-center">
          {/* Hero headline in Win98 window */}
          <div className="win98-window mb-8 fall-in" style={{ transform: 'rotate(-1deg)' }}>
            <div className="win98-titlebar">
              <span className="win98-titlebar-text">C:\FLIP-LY\DEALS.EXE</span>
              <div className="flex gap-1">
                <div className="win98-btn">_</div>
                <div className="win98-btn">□</div>
                <div className="win98-btn">✕</div>
              </div>
            </div>
            <div className="py-8 px-6" style={{ background: 'var(--darker)' }}>
              <h2 className="mb-4 glitch" data-text="FIND HIDDEN GEMS." style={{
                fontFamily: '"Comic Sans MS", cursive',
                fontSize: 'clamp(28px, 7vw, 64px)',
                color: 'var(--hotpink)',
                lineHeight: 1.1,
              }}>
                FIND HIDDEN GEMS.
              </h2>
              <h2 className="mb-6" style={{
                fontFamily: '"Comic Sans MS", cursive',
                fontSize: 'clamp(28px, 7vw, 64px)',
                color: 'var(--lime)',
                lineHeight: 1.1,
              }}>
                SKIP THE BS.
              </h2>
              <p className="text-sm md:text-base mb-2" style={{
                fontFamily: 'Papyrus, fantasy', color: 'var(--mustard)',
                letterSpacing: '2px',
              }}>
                We aggregated all the garage sales your city is having.
              </p>
              <p className="text-xs" style={{ color: '#666', fontStyle: 'italic' }}>
                Yeah, we scraped Craigslist. Yeah, that&apos;s legal. Yeah, we made it weird on purpose.
              </p>
            </div>
          </div>

          {/* BIG CTA */}
          <div className="fall-in mb-6">
            <button onClick={() => setShowSignup(true)} className="btn-chaos" style={{ transform: 'rotate(-2deg)' }}>
              GET STARTED — IT&apos;S FREE
            </button>
          </div>

          <p className="text-xs fall-in" style={{ color: '#555' }}>
            No credit card. No signup wall. No dignity in our CSS.
          </p>
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ CRAIGSLIST SEARCH (the functional part) ═══ */}
      <section className={`px-4 py-12 ${searching ? 'crash-shake' : ''}`} style={{ background: '#000' }}>
        <div className="max-w-3xl mx-auto">
          {/* Craigslist-style header */}
          <div className="mb-6 text-center">
            <h3 style={{
              fontFamily: 'Times New Roman, serif', fontSize: '28px',
              color: 'var(--craigslist-purple)', textDecoration: 'underline',
            }}>
              garage sales / estate sales / yard sales
            </h3>
            <p className="text-xs mt-1" style={{ color: '#666' }}>
              [ <span style={{ color: 'var(--lime)' }}>dallas</span> | austin | houston | san antonio | all DFW ]
            </p>
          </div>

          {/* Search form — Craigslist style with chaos colors */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="search garage sales (furniture, tools, vintage...)"
                className="cl-input flex-1"
              />
              <select
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                className="cl-input"
                style={{ width: '160px', color: '#000', cursor: 'pointer' }}
              >
                <option value="">all cities</option>
                <option value="dallas">Dallas</option>
                <option value="plano">Plano</option>
                <option value="frisco">Frisco</option>
                <option value="mckinney">McKinney</option>
                <option value="denton">Denton</option>
                <option value="arlington">Arlington</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-8 py-2 font-bold text-sm" style={{
                background: 'var(--lime)', color: '#000', border: '3px solid var(--hotpink)',
                fontFamily: '"Comic Sans MS", cursive', cursor: 'pointer',
              }}>
                🔍 SEARCH
              </button>
              <span className="text-xs self-center" style={{ color: '#555' }}>
                {searching ? '💥 CRASHING...' : showResults ? `${fakeListings.length} results` : 'try it, it works'}
              </span>
            </div>
          </form>

          {/* Results — Craigslist style listing rows */}
          {showResults && (
            <div className="mt-8 space-y-1">
              <div className="text-xs mb-3 flex justify-between" style={{ color: '#888' }}>
                <span>{fakeListings.length} results — sorted by date</span>
                <span style={{ color: 'var(--lime)' }}>🔥 = high ROI potential</span>
              </div>
              {fakeListings.map((listing, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer" style={{
                  borderBottom: '1px solid #222',
                  transform: `rotate(${(i % 2 === 0 ? -0.3 : 0.3)}deg)`,
                }}>
                  <span className="text-xs shrink-0" style={{ color: '#666', fontFamily: 'monospace' }}>{listing.date}</span>
                  <a href="#" className="text-sm flex-1 hover:underline" style={{
                    color: 'var(--craigslist-purple)',
                    fontFamily: 'Times New Roman, serif',
                  }}>
                    {listing.title}
                  </a>
                  <span className="text-xs shrink-0" style={{ color: 'var(--mustard)' }}>{listing.price}</span>
                  <span className="text-xs shrink-0" style={{ color: '#888' }}>{listing.city}</span>
                  {listing.hot && <span className="text-xs">🔥</span>}
                </div>
              ))}
              <div className="text-center mt-6">
                <button onClick={() => setShowSignup(true)} className="text-sm font-bold px-6 py-2" style={{
                  background: 'var(--neon-orange)', color: '#fff', border: '2px dashed var(--lime)',
                  fontFamily: '"Comic Sans MS", cursive', cursor: 'pointer',
                }}>
                  Sign up to save searches + get daily emails →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ VALUE PROPS (tilted Win98 windows) ═══ */}
      <section className="px-4 py-16" style={{ background: 'var(--darker)' }}>
        <h3 className="text-center mb-12" style={{
          fontFamily: 'Papyrus, fantasy', fontSize: '32px', color: 'var(--mustard)',
          letterSpacing: '6px',
        }}>
          REAL SIMPLE:
        </h3>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { emoji: '💰', title: 'Find Deals', desc: 'We tell you what sales are near you. Every 6 hours.', color: 'var(--lime)', rotate: '-3deg' },
            { emoji: '📊', title: 'Know the ROI', desc: 'See estimated profit margins before you leave your couch.', color: 'var(--hotpink)', rotate: '2deg', mt: '20px' },
            { emoji: '📧', title: 'Daily Email', desc: 'Top 5 matches every morning at 8 AM. Stop scrolling Facebook groups.', color: 'var(--mustard)', rotate: '-1deg', mt: '-10px' },
          ].map((card, i) => (
            <div key={i} className="card-wonky fall-in" style={{
              transform: `rotate(${card.rotate})`,
              marginTop: card.mt || '0',
            }}>
              <div className="text-5xl mb-4">{card.emoji}</div>
              <h4 className="text-xl font-bold mb-3" style={{
                fontFamily: '"Comic Sans MS", cursive', color: card.color,
              }}>
                {card.title}
              </h4>
              <p className="text-sm" style={{ color: '#ccc' }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ HOW IT WORKS (indented steps) ═══ */}
      <section className="px-4 py-16" style={{ background: '#000' }}>
        <h3 className="text-center mb-12" style={{
          fontFamily: '"Comic Sans MS", cursive', fontSize: '28px', color: 'var(--electric)',
        }}>
          HOW IT WORKS <span className="text-sm" style={{ color: '#555' }}>(we think)</span>
        </h3>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { n: '1', t: "Sign up (we won't sell your email, probably)", c: 'var(--lime)' },
            { n: '2', t: 'Save your interests (location, price range, type)', c: 'var(--hotpink)' },
            { n: '3', t: "Receive daily digest (8 AM CDT, we're consistent)", c: 'var(--mustard)' },
            { n: '4', t: "Go flip some stuff (make money, we're cool with it)", c: 'var(--electric)' },
            { n: '5', t: '(Optional) Pay $9/month to see ROI estimates (this pays for the servers)', c: 'var(--neon-orange)' },
          ].map((step, i) => (
            <div key={step.n} className="flex items-start gap-4 fall-in" style={{
              paddingLeft: `${i * 16}px`,
              transform: `rotate(${(i % 2 === 0 ? -0.5 : 0.5)}deg)`,
            }}>
              <span className="text-2xl font-bold shrink-0" style={{
                fontFamily: '"Comic Sans MS", cursive', color: step.c,
              }}>
                {step.n}.
              </span>
              <p className="text-sm" style={{ color: '#ddd' }}>{step.t}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-4 py-16" style={{ background: 'var(--darker)' }}>
        <h3 className="text-center mb-12" style={{
          fontFamily: 'Papyrus, fantasy', fontSize: '24px', color: 'var(--hotpink)',
          letterSpacing: '3px',
        }}>
          &ldquo;TESTIMONIALS&rdquo; <span className="text-xs" style={{ color: '#555' }}>(real ones, pinky promise)</span>
        </h3>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { q: 'I found a $400 table for $20. This website is weird but it works.', n: 'Sarah', c: 'McKinney TX', r: '-2deg' },
            { q: "The website design is so bad it's good. 10/10 would flip again.", n: 'Marcus', c: 'Dallas TX', r: '3deg' },
            { q: 'My husband thinks I\'m insane for using a site with Comic Sans. I made $200 last weekend.', n: 'Lisa', c: 'Plano TX', r: '-1deg' },
          ].map((t, i) => (
            <div key={i} className="card-wonky" style={{ transform: `rotate(${t.r})` }}>
              <p className="text-sm italic mb-4" style={{ color: '#ccc' }}>
                &ldquo;{t.q}&rdquo;
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--mustard)' }}>
                — {t.n}, {t.c}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20 text-center" style={{ background: '#000' }}>
        <h3 className="mb-4" style={{
          fontFamily: '"Comic Sans MS", cursive', fontSize: '38px', color: 'var(--lime)',
        }}>
          STILL HERE?
        </h3>
        <p className="mb-8 text-base" style={{ color: 'var(--mustard)' }}>
          That means it&apos;s working. Sign up already.
        </p>
        <button onClick={() => setShowSignup(true)} className="btn-chaos">
          FINE, I&apos;LL SIGN UP 🦞
        </button>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ MARQUEE (illegal in 2026) ═══ */}
      <div className="marquee-container py-3" style={{ background: '#000', borderTop: '2px solid var(--lime)', borderBottom: '2px solid var(--hotpink)' }}>
        <div className="marquee-content text-xs" style={{ color: 'var(--electric)' }}>
          {[...Array(2)].map((_, i) => (
            <span key={i}>
              🦞 FLIP-LY.NET — Find garage sales, estate sales, yard sales near you — Updated every 6 hours — Free forever — Made with chaos and Comic Sans — Dallas TX — 🦞 FLIP-LY.NET — We scraped Craigslist so you don&apos;t have to —
            </span>
          ))}
        </div>
      </div>

      {/* ═══ FOOTER (rotated, broken) ═══ */}
      <footer className="px-4 py-10 text-center" style={{ transform: 'rotate(-0.5deg)', background: 'var(--dark)' }}>
        <p className="text-sm mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--electric)' }}>
          🦞 Made by AetherCoreAI
        </p>
        <p className="text-xs mb-2" style={{ color: '#555' }}>
          Privacy Policy | Terms of Service (we don&apos;t have lawyers, be nice)
        </p>
        <p className="text-xs" style={{ color: '#333' }}>
          &copy; 1997&ndash;2026 FLIP-LY.NET | Best viewed in Netscape Navigator 4.0
        </p>
        <div className="mt-4">
          <VisitorCounter />
        </div>
      </footer>

      {/* ═══ SIGNUP MODAL (this part is actually clean) ═══ */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="win98-window w-full max-w-md" style={{ transform: 'rotate(-1deg)' }}>
            <div className="win98-titlebar">
              <span className="win98-titlebar-text">signup.exe — Join the Chaos</span>
              <button className="win98-btn" onClick={() => setShowSignup(false)}>✕</button>
            </div>
            <div style={{ background: 'var(--darker)', padding: '24px' }}>
              {submitted ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-3" style={{
                    fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)',
                  }}>
                    YOU&apos;RE IN, WEIRDO
                  </h3>
                  <p className="text-sm mb-2" style={{ color: '#ccc' }}>
                    Welcome to the chaos. Check your email for confirmation.
                  </p>
                  <p className="text-xs" style={{ color: '#666' }}>
                    (check spam too. we get it.)
                  </p>
                  <button onClick={() => { setShowSignup(false); setSubmitted(false) }}
                    className="mt-6 px-6 py-2 text-sm font-bold" style={{
                      background: 'var(--lime)', color: '#000', border: 'none',
                      fontFamily: '"Comic Sans MS", cursive', cursor: 'pointer',
                    }}>
                    COOL →
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-1" style={{
                    fontFamily: '"Comic Sans MS", cursive', color: 'var(--mustard)',
                  }}>
                    JOIN THE CHAOS
                  </h3>
                  <p className="text-xs mb-6" style={{ color: '#777' }}>
                    Free forever. Daily emails. Weird website. Good deals.
                  </p>
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
                      <input
                        type="text"
                        value={signupCity}
                        onChange={e => setSignupCity(e.target.value)}
                        placeholder="City *"
                        required
                        className="cl-input flex-1"
                      />
                      <input
                        type="text"
                        value={signupZip}
                        onChange={e => setSignupZip(e.target.value)}
                        placeholder="Zip *"
                        required
                        className="cl-input"
                        style={{ width: '100px' }}
                        maxLength={5}
                      />
                    </div>
                    {signupError && (
                      <p className="text-xs" style={{ color: 'var(--hotpink)' }}>
                        ⚠️ {signupError}
                      </p>
                    )}
                    <button type="submit" disabled={signingUp} className="w-full py-3 font-bold text-lg" style={{
                      background: signingUp ? '#666' : 'var(--neon-orange)', color: '#fff',
                      border: '3px solid var(--lime)',
                      fontFamily: '"Comic Sans MS", cursive', cursor: signingUp ? 'wait' : 'pointer',
                    }}>
                      {signingUp ? 'CONNECTING AT 56K...' : 'LET\u0027S GO 🦞'}
                    </button>
                  </form>
                  <p className="text-xs mt-4 text-center" style={{ color: '#555' }}>
                    We need your city + zip to find sales near you. That&apos;s it.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
