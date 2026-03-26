'use client'

import { useState, useEffect, useRef } from 'react'
import WinampPlayer from './components/WinampPlayer'
import RetroPopups from './components/RetroPopups'
import BSOD from './components/BSOD'
import Y2KCountdown from './components/Y2KCountdown'
import MeltdownSequence from './components/MeltdownSequence'
import SketchyPopups from './components/SketchyPopups'

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        background: 'rgba(0,0,128,0.4)',
        backdropFilter: 'blur(2px)',
        cursor: 'pointer',
      }}>
      <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()} style={{ transform: 'rotate(-1deg)' }}>
        {/* Close X button — always visible, top right */}
        <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold" style={{
          background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
          cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
        }}>✕</button>

        {/* The actual error box image */}
        <img src="/assets/hero-error-box.jpg" alt="FLIP-LY.NET HAS PERFORMED AN ILLEGAL OPERATION"
          className="w-full rounded-lg"
          style={{ boxShadow: '0 0 60px rgba(255, 16, 240, 0.3), 0 20px 40px rgba(0,0,0,0.5)' }}
        />
        {/* Buttons below the image — guaranteed visible */}
        <div className="flex flex-col items-center gap-2 mt-3">
          <button onClick={onSignup} className="w-full py-3 text-base font-bold" style={{
            background: 'var(--neon-orange)',
            color: '#fff',
            border: '3px solid var(--lime)',
            fontFamily: '"Comic Sans MS", cursive',
            cursor: 'pointer',
            boxShadow: '0 0 16px var(--neon-orange)',
          }}>
            OK — SIGN UP ANYWAY (it&apos;s free)
          </button>
          <button onClick={onClose} className="text-xs underline" style={{
            color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
          }}>
            Ignore (bad idea) — or click anywhere outside
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

/* ── VALUE PROPS (interactive clickable chaos) ──────────── */
function ValuePropsSection() {
  const [clicked, setClicked] = useState<Record<number, boolean>>({})
  const [emailNum] = useState(() => Math.floor(Math.random() * 9000) + 1000)

  const FIND_TRUTHS = [
    "OK FINE HERE'S THE TRUTH: We scan Craigslist, EstateSales.net, and Facebook Marketplace in your zip code. Then we email you every Thursday at noon. That's literally it. You're on a website with Comic Sans for a newsletter. Welcome to 2026.",
    "REAL TALK: We aggregate garage sale listings from across DFW and send you the good ones. Every Thursday. 12:00 PM. One email. No spam. The website looks like this on purpose. We promise the email is normal. Mostly.",
    "ALRIGHT YOU CAUGHT US: This entire website exists to send you one (1) email per week with garage sales near your zip code. Everything else — the Winamp, the lobster cursor, the LimeWire popups — is just vibes. Expensive, server-burning vibes.",
  ]

  const ROI_TRUTHS = [
    "What's ROI? Great question. We googled it. Return On Investment. We put this card here because our Shopify template had it and we were too lazy to delete it. There is no ROI calculator. There might never be. But the card looks professional, right?",
    "ROI = Return On Investment. We don't actually calculate this. We thought about it for 11 seconds and decided Comic Sans was a better use of our time. Maybe someday. Maybe never. The lamp is still $3 though.",
    "jk we just had this in our shopify template and thought it sounded smart. If you want real ROI, buy the $3 lamp and sell it for $5. That's 67% ROI. You're welcome. We accept Venmo.",
  ]

  const cards = [
    {
      emoji: '💰', title: 'Find Deals',
      desc: `We tell you what sales are near you. Every ${emailNum} hours. (Just kidding — every Thursday at noon. One email. That's it.)`,
      color: 'var(--lime)', rotate: '-3deg',
      truthPool: FIND_TRUTHS,
    },
    {
      emoji: '📊', title: 'Know the ROI',
      desc: 'See estimated profit margins before you leave your couch. (Click for the truth.)',
      color: 'var(--hotpink)', rotate: '2deg', mt: '20px',
      truthPool: ROI_TRUTHS,
    },
    {
      emoji: '📧', title: `${emailNum} Daily Emails`,
      desc: `Top ${emailNum} matches every morning. jk — 1 email every Thursday, noon. Stop scrolling Facebook Marketplace at 2 AM like a gremlin.`,
      color: 'var(--mustard)', rotate: '-1deg', mt: '-10px',
      truthPool: FIND_TRUTHS,
    },
  ]

  return (
    <section className="px-4 py-16" style={{ background: 'var(--darker)' }}>
      <h3 className="text-center mb-12" style={{
        fontFamily: 'Papyrus, fantasy', fontSize: '32px', color: 'var(--mustard)',
        letterSpacing: '6px',
      }}>
        REAL SIMPLE:
      </h3>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, i) => (
          <div key={i} className="card-wonky fall-in" onClick={() => setClicked(prev => ({ ...prev, [i]: !prev[i] }))} style={{
            transform: `rotate(${card.rotate})`,
            marginTop: card.mt || '0',
            cursor: 'pointer',
          }}>
            <div className="text-5xl mb-4">{card.emoji}</div>
            <h4 className="text-xl font-bold mb-3" style={{
              fontFamily: '"Comic Sans MS", cursive', color: card.color,
            }}>
              {card.title}
            </h4>
            {clicked[i] ? (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--neon-orange)', fontFamily: 'monospace' }}>
                  ⚠️ THE TRUTH:
                </p>
                <p className="text-xs" style={{ color: '#ccc', lineHeight: 1.8 }}>
                  {card.truthPool[Math.floor(Math.random() * card.truthPool.length)]}
                </p>
                <p className="text-[10px] mt-3" style={{ color: '#555' }}>(click again to hide the truth)</p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#ccc' }}>{card.desc}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── HOW IT WORKS (chaotic honesty) ────────────────────── */
function HowItWorksSection() {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const steps = [
    {
      n: '1', c: 'var(--lime)',
      front: "Give us your email. We won't sell it. Probably. (We definitely won't. We can barely use Supabase.)",
      back: "FOR REAL: You type your email, city, and zip. We store it in a database. That's step 1. It took us 4 hours to build this form. Please use it.",
    },
    {
      n: '2', c: 'var(--hotpink)',
      front: "We pretend to scan the internet. (We actually do scan the internet. But the website makes it look fake.)",
      back: "ACTUAL TRUTH: Our robots crawl Craigslist, EstateSales.net, and Facebook every day looking for garage sales near your zip. This part is real. The Winamp player is not.",
    },
    {
      n: '3', c: 'var(--mustard)',
      front: "Every Thursday at noon, you get an email. It has garage sales in it. That's the whole product.",
      back: "YEP THAT'S IT: One email. Thursdays. 12 PM CDT. Contains 5-10 garage sales near you with addresses and dates. The email looks normal. Unlike this website.",
    },
    {
      n: '4', c: 'var(--electric)',
      front: "Go to the sale. Buy a $3 lamp. Sell it for $30. Tell no one about this website.",
      back: "THE BUSINESS MODEL: You flip things for profit. We take none of it. We don't even know what you bought. We're just the weird messenger with a lobster cursor.",
    },
    {
      n: '5', c: 'var(--neon-orange)',
      front: "(Optional) Pay $9/month so we can afford the servers. You get... slightly better emails. And our eternal gratitude. And fewer lobster emojis. Actually no, same amount of lobsters.",
      back: "BRUTAL HONESTY: The $9/month doesn't do much yet. We'll add ROI estimates someday. For now it just keeps the lights on and the Comic Sans flowing. We love you either way.",
    },
  ]

  return (
    <section className="px-4 py-16" style={{ background: '#000' }}>
      <h3 className="text-center mb-4" style={{
        fontFamily: '"Comic Sans MS", cursive', fontSize: '28px', color: 'var(--electric)',
      }}>
        HOW IT ACTUALLY WORKS
      </h3>
      <p className="text-center mb-12 text-xs" style={{ color: '#555' }}>
        (click any step for the embarrassingly honest version)
      </p>
      <div className="max-w-2xl mx-auto space-y-4">
        {steps.map((step, i) => (
          <div key={step.n} onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
            className="flex items-start gap-4 fall-in cursor-pointer" style={{
              paddingLeft: `${i * 12}px`,
              transform: `rotate(${(i % 2 === 0 ? -0.5 : 0.5)}deg)`,
              background: revealed[i] ? 'rgba(255,255,255,0.02)' : 'transparent',
              padding: `8px 8px 8px ${i * 12 + 8}px`,
              borderLeft: revealed[i] ? `3px solid ${step.c}` : '3px solid transparent',
              transition: 'all 0.2s',
            }}>
            <span className="text-2xl font-bold shrink-0" style={{
              fontFamily: '"Comic Sans MS", cursive', color: step.c,
            }}>
              {step.n}.
            </span>
            <div>
              <p className="text-sm" style={{ color: revealed[i] ? 'var(--neon-orange)' : '#ddd' }}>
                {revealed[i] ? step.back : step.front}
              </p>
              {revealed[i] && (
                <p className="text-[10px] mt-1" style={{ color: '#444' }}>(click to go back to the lies)</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── TESTIMONIALS (BBS / ANSI / Telnet LORD style) ─────── */
function TestimonialsSection() {
  return (
    <section className="px-4 py-16" style={{ background: '#000' }}>
      <div className="max-w-4xl mx-auto">
        {/* BBS header */}
        <div className="mb-8 text-center" style={{ fontFamily: '"Courier New", monospace' }}>
          <p style={{ color: 'var(--lime)', fontSize: '11px' }}>
            ╔══════════════════════════════════════════════════════════╗
          </p>
          <p style={{ color: 'var(--mustard)', fontSize: '13px', fontWeight: 700 }}>
            ║&nbsp;&nbsp;FLIP-LY BBS — TESTIMONIALS DOOR — ANSI MODE&nbsp;&nbsp;║
          </p>
          <p style={{ color: 'var(--lime)', fontSize: '11px' }}>
            ╠══════════════════════════════════════════════════════════╣
          </p>
          <p style={{ color: '#666', fontSize: '10px' }}>
            ║ SysOp: G1TC# | Users Online: 3 | Baud: 56000 | Node: 1 ║
          </p>
          <p style={{ color: 'var(--lime)', fontSize: '11px' }}>
            ╚══════════════════════════════════════════════════════════╝
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              user: 'xX_TableFlipper_Xx',
              level: 'LVL 42 GARAGE WARRIOR',
              hp: '847/847',
              msg: 'I found a $400 table for $20 in McKinney. Sold it on Facebook in 2 hours. This cursed website with the lobster cursor literally changed my life. I am not joking. My wife thinks I need help.',
              gold: '2,847',
              date: '03/24/26 02:17 AM',
              color: 'var(--lime)',
            },
            {
              user: 'COUCH_DESTROYER_99',
              level: 'LVL 69 FLIP MASTER',
              hp: '420/420',
              msg: "The website design is so bad it's good. I showed my therapist and she said 'this explains a lot about you.' 10/10 would flip again. Found a vintage Eames chair at an estate sale. The chair was $15. The therapy is $200/session.",
              gold: '69,420',
              date: '03/23/26 11:59 PM',
              color: 'var(--hotpink)',
            },
            {
              user: 'LampQueen_Dallas',
              level: 'LVL 33 LAMP HOARDER',
              hp: '333/333',
              msg: "My husband thinks I'm insane for using a site with Comic Sans and a fake Winamp player. I made $200 last weekend from a single estate sale this site told me about. He now also uses this site. We don't talk about it.",
              gold: '1,337',
              date: '03/25/26 08:42 AM',
              color: 'var(--mustard)',
            },
            {
              user: 'Anonymous_Flipper',
              level: 'LVL 1 NOOB',
              hp: '10/10',
              msg: "I came here because someone shared this on Reddit with the caption 'wtf is this website.' I signed up ironically. I now check my email every Thursday at noon. I have become the thing I mocked. The lobster is my shepherd.",
              gold: '0',
              date: '03/26/26 04:20 AM',
              color: 'var(--electric)',
            },
          ].map((t, i) => (
            <div key={i} style={{
              background: '#0a0a0a',
              border: `1px solid ${t.color}`,
              padding: '16px',
              fontFamily: '"Courier New", monospace',
            }}>
              {/* BBS user header */}
              <div className="flex flex-wrap items-center gap-3 mb-3" style={{ fontSize: '11px' }}>
                <span style={{ color: t.color, fontWeight: 700 }}>{t.user}</span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: '#888' }}>{t.level}</span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: 'var(--lime)' }}>HP: {t.hp}</span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: 'var(--mustard)' }}>Gold: {t.gold}</span>
              </div>
              {/* Message */}
              <p style={{ color: '#ccc', fontSize: '12px', lineHeight: 1.8 }}>
                &gt; {t.msg}
              </p>
              {/* Footer */}
              <div className="flex justify-between mt-3" style={{ fontSize: '9px', color: '#444' }}>
                <span>Posted: {t.date}</span>
                <span>Reply | Quote | Report to SysOp</span>
              </div>
            </div>
          ))}
        </div>

        {/* BBS footer */}
        <div className="mt-6 text-center" style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#444' }}>
          <p>[Press ENTER to continue, Q to quit, or just sign up already]</p>
          <p className="mt-1" style={{ color: '#333' }}>
            ═══ END OF MESSAGES — FLIP-LY BBS v4.20 — NO CARRIER ═══
          </p>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════ */
/* MAIN PAGE — THE CHAOS                                     */
/* ══════════════════════════════════════════════════════════ */

export default function Home() {
  const [showError, setShowError] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [muted, setMuted] = useState(true) // default muted

  // Persist mute state
  useEffect(() => {
    const saved = localStorage.getItem('fliply-muted')
    if (saved !== null) setMuted(saved === 'true')
  }, [])
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
  const [showChaosEgg, setShowChaosEgg] = useState(false)
  const [meltdownActive, setMeltdownActive] = useState(false)
  const [meltdownDone, setMeltdownDone] = useState(false)

  // Show Win98 error after 3 seconds, auto-dismiss after 15 seconds
  useEffect(() => {
    const show = setTimeout(() => setShowError(true), 3000)
    const autoDismiss = setTimeout(() => setShowError(false), 18000)
    return () => { clearTimeout(show); clearTimeout(autoDismiss) }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Easter egg: typing "chaos" exactly
    if (searchQuery.toLowerCase().trim() === 'chaos') {
      setShowChaosEgg(true)
      return
    }
    setSearching(true)
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

  const [show404, setShow404] = useState(false)
  const [showReply, setShowReply] = useState(false)

  const CL_FLAVOR = [
    '(serious inquiries only, no lowballs, I know what I got)',
    '(cash only, no trades for Beanie Babies)',
    '(god bless, located in my garage)',
    '(first come first serve, don\'t ask me to hold it)',
    '(price is firm, my ex already took everything else)',
    '(no scammers, I WILL call the police)',
    '(pickup only, I am not delivering a piano)',
    '(asking $5 OBO, I paid $400 in 2003)',
  ]
  const CL_SIGS = [
    '– Thanks for looking! No lowballs, I know what I got.',
    '– Located in my garage, cash only, God bless.',
    '– Posted from my Motorola RAZR',
    '– Sent from AOL Mail 5.0',
    '– If this ad is still up, it\'s still available. Stop asking.',
    '– I don\'t check email often, just show up Saturday.',
  ]
  const CL_EDITS = [
    'Last edited: 3 minutes ago by user42069',
    'Posted: Yesterday at 2:14 AM (edited 69 times)',
    'Last edited: just now by xX_FlipMaster_Xx',
    'Posted: 4 days ago (bumped 12 times)',
    'Last edited: 1 hour ago — "updated price, STOP LOWBALLING"',
  ]

  const fakeListings = [
    { title: 'Entire garage cleanout — tools, furniture, a cursed lamp', price: 'Multi-family', city: 'McKinney, TX', date: 'Sat 3/29', hot: true },
    { title: 'Estate sale — antique furniture, possibly haunted mirror', price: '$5–$500', city: 'Plano, TX', date: 'Fri–Sun', hot: true },
    { title: 'Moving sale — EVERYTHING MUST GO (including the dog, jk)', price: 'Make offer', city: 'Dallas, TX', date: 'Sat 3/29', hot: false },
    { title: 'Vintage vinyl, turntables, one broken lava lamp', price: '$2–$80', city: 'Denton, TX', date: 'Sat 3/29', hot: true },
    { title: 'Power tools from a guy who "definitely finished his projects"', price: '$5–$200', city: 'Arlington, TX', date: 'Sat 3/29', hot: true },
    { title: 'Divorce sale — his stuff. priced to annoy.', price: '$1–$999', city: 'Frisco, TX', date: 'Sat–Sun', hot: false },
    { title: 'FREE: couch that smells like possibility (and cats)', price: 'FREE', city: 'Fort Worth, TX', date: 'Sun only', hot: true },
    { title: 'Mannequin — no questions. $15 firm.', price: '$15 FIRM', city: 'Allen, TX', date: 'Sat 3/29', hot: false },
  ]

  return (
    <div className="min-h-screen relative">
      <Mascot />
      <WinampPlayer />
      <RetroPopups />
      <BSOD />
      <MeltdownSequence active={meltdownActive} onComplete={() => setMeltdownDone(true)} />
      <SketchyPopups />
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
          <button onClick={() => { const next = !muted; setMuted(next); localStorage.setItem('fliply-muted', String(next)) }} className="px-2 py-1 text-[10px] font-bold" style={{
            background: muted ? '#1a1a1a' : '#0FFF50',
            border: `1px solid ${muted ? '#333' : '#0FFF50'}`,
            color: muted ? '#888' : '#000',
            fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
          }}>
            {muted ? '🔇 Muted' : '🔊 Chaos ON'}
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

      {/* ═══ Y2K COUNTDOWN ═══ */}
      {!meltdownDone && (
        <Y2KCountdown onMeltdown={() => setMeltdownActive(true)} />
      )}

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

          {/* Results — 2001 Craigslist chaos table */}
          {showResults && (
            <div className="mt-8">
              {/* Sponsored spam */}
              <div className="mb-4 space-y-1">
                {[
                  '📢 Sponsored by LimeWire Premium — Download faster at 56k!',
                  '💋 Hot Singles in your area want to sell you their couch',
                  '💊 Click here for free Viagra with every estate sale',
                ].map((ad, i) => (
                  <div key={i} className="px-3 py-1.5" style={{
                    background: i === 2 ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,0,0.04)',
                    border: '1px solid #333',
                    fontFamily: 'Times New Roman, serif',
                    fontSize: '11px',
                    color: i === 2 ? '#ff6666' : '#999',
                    fontStyle: 'italic',
                  }}>
                    {ad} <span style={{ color: '#444', fontSize: '9px' }}>[AD]</span>
                  </div>
                ))}
              </div>

              <div className="text-xs mb-3 flex justify-between" style={{ color: '#888' }}>
                <span>{fakeListings.length} results — sorted by desperation level</span>
                <span style={{ color: 'var(--lime)' }}>🔥 = someone is lying about the price</span>
              </div>

              {/* Craigslist HTML table */}
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                border: '3px ridge var(--lime)',
                fontFamily: 'Times New Roman, serif',
              }}>
                <thead>
                  <tr style={{ background: '#1a1a1a', borderBottom: '2px solid var(--hotpink)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--mustard)', fontSize: '11px', fontWeight: 700 }}>DATE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--mustard)', fontSize: '11px', fontWeight: 700 }}>LISTING</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--mustard)', fontSize: '11px', fontWeight: 700 }}>PRICE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--mustard)', fontSize: '11px', fontWeight: 700 }}>AREA</th>
                  </tr>
                </thead>
                <tbody>
                  {fakeListings.map((listing, i) => {
                    const flavor = CL_FLAVOR[Math.floor(Math.random() * CL_FLAVOR.length)]
                    const sig = CL_SIGS[Math.floor(Math.random() * CL_SIGS.length)]
                    const edit = CL_EDITS[Math.floor(Math.random() * CL_EDITS.length)]
                    const is404 = Math.random() < 0.2

                    return (
                      <tr key={i} style={{
                        background: i % 2 === 0 ? 'rgba(15,255,80,0.04)' : 'rgba(255,16,240,0.04)',
                        borderBottom: '1px solid #222',
                      }}>
                        <td style={{
                          padding: '8px', fontSize: '11px', color: '#888',
                          fontFamily: 'monospace', verticalAlign: 'top', whiteSpace: 'nowrap',
                        }}>
                          {listing.date}
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'top' }}>
                          <a href="#" onClick={(e) => {
                            e.preventDefault()
                            if (is404) setShow404(true)
                          }} style={{
                            color: '#3366CC', textDecoration: 'underline', fontSize: '13px',
                            fontFamily: 'Times New Roman, serif',
                          }}>
                            {listing.title}
                          </a>
                          <span style={{ color: '#666', fontSize: '10px', marginLeft: '6px' }}>
                            {flavor}
                          </span>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ color: '#444', fontSize: '9px', fontStyle: 'italic' }}>{edit}</span>
                          </div>
                          <div style={{ marginTop: '2px' }}>
                            <span style={{ color: '#555', fontSize: '9px' }}>{sig}</span>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <button onClick={() => setShowReply(true)} style={{
                              background: 'none', border: '1px solid #444', padding: '1px 8px',
                              fontSize: '9px', color: '#888', cursor: 'pointer',
                              fontFamily: 'Tahoma, sans-serif',
                            }}>
                              reply to this post
                            </button>
                            {listing.hot && <span className="ml-2 text-xs">🔥</span>}
                          </div>
                        </td>
                        <td style={{
                          padding: '8px', textAlign: 'right', verticalAlign: 'top',
                          color: 'var(--lime)', fontFamily: 'monospace', fontSize: '12px',
                          fontWeight: 700,
                          paddingLeft: i % 3 === 0 ? '24px' : '8px',
                        }}>
                          {listing.price}
                        </td>
                        <td style={{
                          padding: '8px', textAlign: 'right', verticalAlign: 'top',
                          color: '#888', fontSize: '10px', whiteSpace: 'nowrap',
                        }}>
                          {listing.city}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* CL post button */}
              <div className="text-center mt-6">
                <button onClick={() => setShowSignup(true)} className="px-8 py-2 text-sm font-bold" style={{
                  background: '#c0c0c0', color: '#000',
                  border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                  fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
                }}>
                  post to classifieds (sign up first)
                </button>
              </div>
            </div>
          )}

          {/* 404 popup */}
          {show404 && (
            <div className="fixed inset-0 z-[85] flex items-center justify-center" onClick={() => setShow404(false)} style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="win98-window" onClick={e => e.stopPropagation()} style={{ width: '360px', transform: 'rotate(-1deg)' }}>
                <div className="win98-titlebar">
                  <span className="win98-titlebar-text">Internet Explorer</span>
                  <button className="win98-btn" onClick={() => setShow404(false)}>✕</button>
                </div>
                <div className="win98-body text-center py-6">
                  <p className="text-3xl mb-3">❌</p>
                  <p className="font-bold mb-2" style={{ fontSize: '13px' }}>
                    {Math.random() > 0.5
                      ? '404 — Garage Sale Not Found'
                      : 'This post has been flagged for too many lamps'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#666' }}>
                    The garage sale you requested is no longer available. The seller
                    probably sold the good stuff before 7 AM to the dealers who showed
                    up at 5:30 AM even though the ad said NO EARLY BIRDS.
                  </p>
                  <button onClick={() => setShow404(false)} className="mt-4 px-6 py-1.5 text-xs" style={{
                    border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                    background: '#c0c0c0', cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
                  }}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reply modal */}
          {showReply && (
            <div className="fixed inset-0 z-[85] flex items-center justify-center" onClick={() => setShowReply(false)} style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="win98-window" onClick={e => e.stopPropagation()} style={{ width: '320px', transform: 'rotate(1deg)' }}>
                <div className="win98-titlebar">
                  <span className="win98-titlebar-text">Sending Message...</span>
                  <button className="win98-btn" onClick={() => setShowReply(false)}>✕</button>
                </div>
                <div className="win98-body text-center py-6">
                  <p className="text-3xl mb-3">📧</p>
                  <p className="font-bold mb-2" style={{ fontSize: '13px' }}>
                    Message sent to seller... probably.
                  </p>
                  <p style={{ fontSize: '11px', color: '#666' }}>
                    Good luck champ. They might reply. They might not.
                    They might have already sold it to their neighbor
                    for $2 and a bag of Doritos.
                  </p>
                  <button onClick={() => setShowReply(false)} className="mt-4 px-6 py-1.5 text-xs" style={{
                    border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                    background: '#c0c0c0', cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
                  }}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="rainbow-divider" />

      {/* ═══ VALUE PROPS (interactive chaos cards) ═══ */}
      <ValuePropsSection />

      <div className="rainbow-divider" />

      {/* ═══ HOW IT WORKS (chaotic truth) ═══ */}
      <HowItWorksSection />

      <div className="rainbow-divider" />

      {/* ═══ TESTIMONIALS (BBS / ANSI / LORD style) ═══ */}
      <TestimonialsSection />

      <div className="rainbow-divider" />

      {/* ═══ CHAOTIC DONATION (real Stripe) ═══ */}
      <section className="px-4 py-12" style={{ background: '#0a0a0a' }}>
        <div className="max-w-md mx-auto">
          <div className="win98-window" style={{ transform: 'rotate(1.5deg)' }}>
            <div className="win98-titlebar" style={{ background: 'linear-gradient(90deg, #800000, #cc0000)' }}>
              <span className="win98-titlebar-text">GoFundMe.exe — URGENT</span>
              <div className="flex gap-1">
                <div className="win98-btn">_</div>
                <div className="win98-btn">✕</div>
              </div>
            </div>
            <div style={{ background: '#1a1a1a', padding: '20px' }}>
              <div className="text-center mb-4">
                <p className="text-3xl mb-2">🦞</p>
                <h4 style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)', fontSize: '18px', marginBottom: '8px' }}>
                  HELP KEEP THIS CURSED WEBSITE ALIVE
                </h4>
                <p style={{ fontFamily: '"Courier New", monospace', color: '#888', fontSize: '11px', lineHeight: 1.8 }}>
                  This website costs real money to run. The Comic Sans is free
                  but the servers are not. Every $1 keeps the lobster cursor
                  rendering for approximately 4.7 more minutes.
                </p>
              </div>

              <div className="flex gap-2 justify-center mb-4">
                {[1, 3, 5, 10].map(amt => (
                  <button key={amt} onClick={async () => {
                    try {
                      const res = await fetch('/api/donate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: amt }),
                      })
                      const data = await res.json()
                      if (data.url) window.location.href = data.url
                    } catch { alert('Donation failed. Like our CSS.') }
                  }}
                    className="px-4 py-2 text-sm font-bold"
                    style={{
                      background: amt === 1 ? 'var(--neon-orange)' : '#222',
                      color: amt === 1 ? '#fff' : '#888',
                      border: `2px solid ${amt === 1 ? 'var(--lime)' : '#444'}`,
                      fontFamily: '"Comic Sans MS", cursive',
                      cursor: 'pointer',
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <p className="text-center text-[10px]" style={{ color: '#444' }}>
                Real money. Real Stripe. Real chaos preservation.
              </p>
              <p className="text-center text-[9px] mt-1" style={{ color: '#333' }}>
                $1 = 4.7 min of lobster cursor | $5 = 23.5 min | $10 = 47 min of chaos
              </p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-1" style={{ fontSize: '9px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#666' }}>CHAOS FUND</span>
                  <span style={{ color: 'var(--lime)' }}>$47 / $100 goal</span>
                </div>
                <div style={{ height: '8px', background: '#111', border: '1px inset #333' }}>
                  <div style={{
                    width: '47%', height: '100%',
                    background: 'linear-gradient(90deg, var(--hotpink), var(--neon-orange), var(--lime))',
                    boxShadow: '0 0 6px var(--hotpink)',
                  }} />
                </div>
              </div>
            </div>
          </div>
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
          <a href="/why" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Why does this exist?</a>
          {' | '}Privacy Policy | Terms of Service (we don&apos;t have lawyers, be nice)
        </p>
        <p className="text-xs" style={{ color: '#333' }}>
          &copy; 1997&ndash;2026 FLIP-LY.NET | Best viewed in Netscape Navigator 4.0
        </p>
        <p className="text-xs mt-2" style={{ color: '#555', fontFamily: '"Comic Sans MS", cursive' }}>
          We scrape nothing. We make everything up. You&apos;re welcome.
        </p>
        <div className="mt-4">
          <VisitorCounter />
        </div>
      </footer>

      {/* ═══ CHAOS EASTER EGG ═══ */}
      {showChaosEgg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
          onClick={() => setShowChaosEgg(false)}
          style={{
            background: '#000',
          }}>
          <div className="text-center px-8">
            <p className="text-6xl mb-6 jitter">🦞</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-4 glitch" data-text="YOU FOUND THE TRUE CHAOS." style={{
              fontFamily: '"Comic Sans MS", cursive',
              color: 'var(--hotpink)',
              textShadow: '0 0 20px var(--hotpink), 0 0 40px var(--hotpink)',
            }}>
              YOU FOUND THE TRUE CHAOS.
            </h2>
            <p className="text-xl mb-6" style={{
              color: 'var(--lime)',
              fontFamily: '"Courier New", monospace',
              textShadow: '0 0 10px var(--lime)',
            }}>
              There is no escape.
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--mustard)' }}>
              (just kidding. click anywhere to go back.)
            </p>
            <p className="text-xs blink" style={{ color: '#444' }}>
              ...or stay here forever. we don&apos;t judge.
            </p>
            <div className="mt-8 text-xs" style={{ color: '#222', fontFamily: 'monospace' }}>
              CHAOS_LEVEL=MAXIMUM | SANITY=0 | COMIC_SANS=FOREVER | LOBSTER=ETERNAL
            </div>
          </div>
        </div>
      )}

      {/* ═══ SIGNUP MODAL (this part is actually clean) ═══ */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)}
          style={{ background: 'rgba(0,0,0,0.85)', cursor: 'pointer' }}>
          <div className="win98-window w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{ transform: 'rotate(-1deg)', cursor: 'default' }}>
            {/* Large close button — always visible */}
            <button onClick={() => { setShowSignup(false); setSubmitted(false); setSignupError('') }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer' }}>
              ✕
            </button>
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
