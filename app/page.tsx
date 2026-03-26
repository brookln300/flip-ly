'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [mascotPos, setMascotPos] = useState({ x: 80, y: 20 })
  const [mascotMsg, setMascotMsg] = useState('')

  const mascotMessages = [
    'why are you here?',
    'nice margins bro',
    'stop clicking me',
    'is this a real website?',
    'i live here now',
    'this is fine',
    'Comic Sans forever',
    'are you lost?',
    '404: taste not found',
    'hire me (im a robot)',
  ]

  // Mascot wanders randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setMascotPos({
        x: Math.random() * 85 + 5,
        y: Math.random() * 70 + 15,
      })
      if (Math.random() > 0.6) {
        setMascotMsg(mascotMessages[Math.floor(Math.random() * mascotMessages.length)])
        setTimeout(() => setMascotMsg(''), 3000)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: wire to API
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ═══ WANDERING MASCOT ═══ */}
      <div
        className="fixed z-50 transition-all duration-[3000ms] ease-in-out pointer-events-none select-none"
        style={{ left: `${mascotPos.x}%`, top: `${mascotPos.y}%` }}
      >
        <div className="relative">
          <div className="text-4xl" style={{ transform: `rotate(${Math.random() * 30 - 15}deg)`, filter: 'drop-shadow(0 0 8px #0FFF50)' }}>
            🤖
          </div>
          {mascotMsg && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded text-xs font-bold" style={{
              background: 'var(--hotpink)', color: '#fff', fontFamily: '"Comic Sans MS", cursive',
            }}>
              {mascotMsg}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONSTRUCTION BANNER ═══ */}
      <div className="construction">
        🚧 UNDER CONSTRUCTION 🚧 (everything works tho) 🚧
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '4px solid var(--lime)' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl jitter">🦞</span>
          <h1 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '28px', color: 'var(--lime)' }}>
            FLIP-LY<span style={{ color: 'var(--hotpink)' }}>.NET</span>
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-xs blink" style={{ color: 'var(--mustard)' }}>● LIVE</span>
          <button onClick={() => setShowSignup(true)} className="px-4 py-2 text-sm font-bold" style={{
            background: 'var(--electric)', color: '#fff', border: '2px solid var(--hotpink)',
            fontFamily: '"Comic Sans MS", cursive', transform: 'rotate(2deg)',
          }}>
            LOGIN (or whatever)
          </button>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="px-6 py-20 md:py-32 text-center relative">
        {/* Decorative garbage */}
        <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-45">🗑️</div>
        <div className="absolute bottom-20 right-10 text-5xl opacity-10 -rotate-12">💎</div>
        <div className="absolute top-40 right-20 text-4xl opacity-10 rotate-12">🏷️</div>

        <div className="max-w-4xl mx-auto">
          <h2 className="fall-in mb-6" style={{
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: 'clamp(36px, 8vw, 80px)',
            color: 'var(--hotpink)',
            lineHeight: 1.1,
            textShadow: '4px 4px 0 var(--dark)',
          }}>
            FIND HIDDEN GEMS.<br />
            <span style={{ color: 'var(--lime)' }}>SKIP THE BS.</span>
          </h2>

          <p className="fall-in text-lg md:text-xl max-w-2xl mx-auto mb-4" style={{
            fontFamily: '"Courier New", monospace',
            color: 'var(--mustard)',
            lineHeight: 2.0,
          }}>
            We aggregated all the garage sales your city is having.
          </p>

          <p className="fall-in text-sm mb-10" style={{ color: '#888', fontStyle: 'italic' }}>
            Yeah, we scraped Craigslist. Yeah, that&apos;s legal. Yeah, we made it weird on purpose.
          </p>

          {/* THE BIG BUTTON */}
          <div className="fall-in">
            <button onClick={() => setShowSignup(true)} className="btn-chaos">
              GET STARTED — IT&apos;S FREE
            </button>
          </div>

          <p className="fall-in mt-6 text-xs" style={{ color: '#666' }}>
            No credit card. No signup wall. Just... start.
          </p>
        </div>
      </section>

      <div className="divider-chaos" />

      {/* ═══ VALUE PROPS (tilted cards) ═══ */}
      <section className="px-6 py-20" style={{ background: 'var(--dark)' }}>
        <h3 className="text-center mb-16" style={{
          fontFamily: 'Papyrus, fantasy', fontSize: '36px', color: 'var(--mustard)',
          letterSpacing: '8px',
        }}>
          REAL SIMPLE:
        </h3>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 — tilted left */}
          <div className="card-wonky fall-in" style={{ transform: 'rotate(-3deg)' }}>
            <div className="text-5xl mb-4">💰</div>
            <h4 className="text-xl font-bold mb-3" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
              Find Deals
            </h4>
            <p className="text-sm" style={{ color: '#ccc' }}>
              We tell you what sales are near you. Every 6 hours. No spam.
            </p>
          </div>

          {/* Card 2 — tilted right */}
          <div className="card-wonky fall-in" style={{ transform: 'rotate(2deg)', marginTop: '20px' }}>
            <div className="text-5xl mb-4">📊</div>
            <h4 className="text-xl font-bold mb-3" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)' }}>
              Know the ROI
            </h4>
            <p className="text-sm" style={{ color: '#ccc' }}>
              See estimated profit margins before you leave your couch.
            </p>
          </div>

          {/* Card 3 — tilted weird */}
          <div className="card-wonky fall-in" style={{ transform: 'rotate(-1deg)', marginTop: '-10px' }}>
            <div className="text-5xl mb-4">📧</div>
            <h4 className="text-xl font-bold mb-3" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--mustard)' }}>
              Daily Email
            </h4>
            <p className="text-sm" style={{ color: '#ccc' }}>
              Top 5 matches every morning at 8 AM. Stop scrolling Facebook groups.
            </p>
          </div>
        </div>
      </section>

      <div className="divider-chaos" />

      {/* ═══ HOW IT WORKS (confusing diagram) ═══ */}
      <section className="px-6 py-20">
        <h3 className="text-center mb-16" style={{
          fontFamily: '"Comic Sans MS", cursive', fontSize: '32px', color: 'var(--electric)',
        }}>
          HOW IT WORKS <span className="text-sm" style={{ color: '#666' }}>(we think)</span>
        </h3>

        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { n: '1', text: 'Sign up (we won\'t sell your email, probably)', color: 'var(--lime)' },
            { n: '2', text: 'Save your interests (location, price range, type)', color: 'var(--hotpink)' },
            { n: '3', text: 'Receive daily digest (8 AM CDT, we\'re consistent)', color: 'var(--mustard)' },
            { n: '4', text: 'Go flip some stuff (make money, we\'re cool with it)', color: 'var(--electric)' },
            { n: '5', text: '(Optional) Pay $9/month to see ROI estimates (this pays for the servers)', color: 'var(--neon-orange)' },
          ].map((step, i) => (
            <div key={step.n} className="flex items-start gap-4 fall-in" style={{
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (Math.random() * 2 + 0.5)}deg)`,
              paddingLeft: `${i * 12}px`,
            }}>
              <span className="text-3xl font-bold" style={{
                fontFamily: '"Comic Sans MS", cursive', color: step.color,
                textShadow: '2px 2px 0 var(--dark)',
              }}>
                {step.n}.
              </span>
              <p className="text-base" style={{ fontFamily: '"Courier New", monospace', color: '#ddd' }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-chaos" />

      {/* ═══ TESTIMONIALS (fake but funny) ═══ */}
      <section className="px-6 py-20" style={{ background: 'var(--dark)' }}>
        <h3 className="text-center mb-16" style={{
          fontFamily: 'Papyrus, fantasy', fontSize: '28px', color: 'var(--hotpink)',
          letterSpacing: '4px',
        }}>
          &ldquo;TESTIMONIALS&rdquo; <span className="text-xs" style={{ color: '#666' }}>(real ones, pinky promise)</span>
        </h3>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'I found a $400 table for $20. This website is weird but it works.', name: 'Sarah', city: 'McKinney TX', rotate: '-2deg' },
            { quote: 'No credit card required. Best decision I made in 2026.', name: 'Marcus', city: 'Dallas TX', rotate: '3deg' },
            { quote: 'The website design is so bad it\'s good. 10/10 would flip again.', name: 'Unknown', city: '(we paid them $5 on Fiverr)', rotate: '-1deg' },
          ].map((t, i) => (
            <div key={i} className="card-wonky" style={{ transform: `rotate(${t.rotate})` }}>
              <p className="text-sm italic mb-4" style={{ color: '#ccc', fontFamily: '"Courier New", monospace' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--mustard)' }}>
                — {t.name}, {t.city}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-chaos" />

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 py-24 text-center">
        <h3 className="mb-6" style={{
          fontFamily: '"Comic Sans MS", cursive', fontSize: '42px', color: 'var(--lime)',
          textShadow: '3px 3px 0 var(--dark)',
        }}>
          STILL HERE?
        </h3>
        <p className="mb-8 text-lg" style={{ color: 'var(--mustard)', fontFamily: '"Courier New", monospace' }}>
          That means it&apos;s working. Sign up already.
        </p>
        <button onClick={() => setShowSignup(true)} className="btn-chaos">
          FINE, I&apos;LL SIGN UP
        </button>
      </section>

      <div className="divider-chaos" />

      {/* ═══ FOOTER (rotated, broken) ═══ */}
      <footer className="px-6 py-12 text-center" style={{ transform: 'rotate(-1deg)', background: 'var(--dark)' }}>
        <p className="text-sm mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--electric)' }}>
          🦞 Made by AetherCoreAI (that&apos;s us, we&apos;re in your site)
        </p>
        <p className="text-xs mb-2" style={{ color: '#666' }}>
          Privacy Policy | Terms (we don&apos;t have lawyers, this is made up)
        </p>
        <p className="text-xs" style={{ color: '#444' }}>
          &copy; 1997&ndash;2026 (we&apos;re not that old, but the design sure is)
        </p>
        <p className="text-xs mt-4" style={{ color: '#555' }}>
          Still don&apos;t get what flip-ly is? <span style={{ color: 'var(--lime)' }}>Here&apos;s Google.</span>
          {' '}Want to complain? <span style={{ color: 'var(--hotpink)' }}>Here&apos;s our email.</span>
        </p>
      </footer>

      {/* ═══ SIGNUP MODAL ═══ */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md p-8 relative" style={{
            background: 'var(--dark)',
            border: '4px solid var(--lime)',
            boxShadow: '12px 12px 0 var(--hotpink)',
            transform: 'rotate(-2deg)',
          }}>
            <button onClick={() => setShowSignup(false)} className="absolute top-4 right-4 text-2xl" style={{ color: 'var(--hotpink)' }}>
              &times;
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
                  YOU&apos;RE IN, WEIRDO
                </h3>
                <p className="text-sm" style={{ color: '#ccc', fontFamily: '"Courier New", monospace' }}>
                  Congrats, you&apos;re now officially trash-hunting.
                  <br />Check your email (or spam, we get it).
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--mustard)' }}>
                  JOIN THE CHAOS
                </h3>
                <p className="text-xs mb-6" style={{ color: '#888' }}>
                  Free forever. Daily emails. Weird website. Good deals.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com (we won't sell it)"
                    required
                    className="input-wonky"
                    style={{ transform: 'rotate(1deg)' }}
                  />
                  <button type="submit" className="btn-chaos w-full" style={{ fontSize: '18px' }}>
                    LET&apos;S GO 🦞
                  </button>
                </form>
                <p className="text-xs mt-4 text-center" style={{ color: '#555' }}>
                  Unsubscribe anytime. We respect that.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
