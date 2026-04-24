'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import WinampPlayer from '@/app/components/WinampPlayer'
import RetroPopups from '@/app/components/RetroPopups'
import BSOD from '@/app/components/BSOD'
import AOLWelcome from '@/app/components/AOLWelcome'
import ShellTrigger from '@/app/components/ShellTrigger'

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES — injected as a <style> tag since this is 'use client'
   ═══════════════════════════════════════════════════════════════ */
const RETRO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  * { box-sizing: border-box; }

  body.retro-page {
    margin: 0;
    padding: 0;
    cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text y='14' font-size='14'>⭐</text></svg>"), auto;
    background-color: #000033;
    background-image:
      radial-gradient(2px 2px at 10px 10px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 30px 50px, #ffff00 0%, transparent 100%),
      radial-gradient(1px 1px at 60px 20px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 90px 80px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 130px 30px, #ffff00 0%, transparent 100%),
      radial-gradient(2px 2px at 170px 60px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 200px 10px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 240px 90px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 280px 40px, #ffff00 0%, transparent 100%),
      radial-gradient(2px 2px at 320px 70px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 360px 20px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 400px 50px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 450px 80px, #ffff00 0%, transparent 100%),
      radial-gradient(2px 2px at 500px 30px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 550px 60px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 600px 10px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 650px 90px, #ffff00 0%, transparent 100%),
      radial-gradient(2px 2px at 700px 40px, #ffffff 0%, transparent 100%),
      radial-gradient(1px 1px at 750px 70px, #ffffff 0%, transparent 100%),
      radial-gradient(2px 2px at 800px 20px, #ffffff 0%, transparent 100%);
    background-size: 800px 100px;
    background-repeat: repeat;
    font-family: 'Comic Sans MS', 'Comic Sans', cursive;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .retro-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 10px 8px 120px;
  }

  /* Rainbow HR */
  .rainbow-hr {
    border: none;
    height: 4px;
    background: linear-gradient(
      to right,
      #ff0000, #ff7700, #ffff00, #00ff00,
      #00ffff, #0000ff, #ff00ff, #ff0000
    );
    margin: 16px 0;
    box-shadow: 0 0 8px rgba(255,255,255,0.3);
  }

  /* Blink animation */
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .blink { animation: blink 1s step-end infinite; }
  .blink-slow { animation: blink 2s step-end infinite; }

  /* Jitter / shake */
  @keyframes jitter {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    25% { transform: translate(-1px, 1px) rotate(-0.5deg); }
    50% { transform: translate(1px, -1px) rotate(0.5deg); }
    75% { transform: translate(-1px, -1px) rotate(-0.5deg); }
  }
  .jitter { animation: jitter 0.15s infinite; }

  /* NEW! badge pulse */
  @keyframes newBadge {
    0%,100% { background-color: #ff0000; transform: scale(1); }
    50% { background-color: #ff6600; transform: scale(1.08); }
  }
  .new-badge {
    display: inline-block;
    background: #ff0000;
    color: #ffff00;
    font-weight: 900;
    font-size: 10px;
    padding: 2px 5px;
    border: 2px solid #ffff00;
    animation: newBadge 0.7s ease-in-out infinite;
    vertical-align: middle;
    margin-left: 4px;
    font-family: 'Comic Sans MS', cursive;
  }

  /* Marquee */
  .marquee-container {
    overflow: hidden;
    background: #000000;
    border: 2px solid #0FFF50;
    padding: 6px 0;
    white-space: nowrap;
  }
  @keyframes marquee {
    0% { transform: translateX(100vw); }
    100% { transform: translateX(-100%); }
  }
  .marquee-inner {
    display: inline-block;
    animation: marquee 18s linear infinite;
    color: #0FFF50;
    font-family: 'Comic Sans MS', cursive;
    font-size: 14px;
    font-weight: bold;
  }

  /* Under Construction */
  @keyframes constructionBlink {
    0%,49% { color: #ffff00; text-shadow: 0 0 10px #ffff00; }
    50%,100% { color: #ff6600; text-shadow: 0 0 10px #ff6600; }
  }
  .under-construction {
    animation: constructionBlink 0.6s step-end infinite;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  /* Hard hat spin */
  @keyframes hardhat {
    0% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
    100% { transform: rotate(-5deg); }
  }
  .hardhat { display: inline-block; animation: hardhat 0.5s ease-in-out infinite; font-size: 18px; }

  /* 3D Beveled box */
  .bevel-box {
    border: 3px outset #c0c0c0;
    background: #000033;
    padding: 12px;
  }
  .bevel-box-inset {
    border: 3px inset #c0c0c0;
    background: #000022;
    padding: 10px;
  }

  /* Neon glow text */
  .neon-lime { color: #0FFF50; text-shadow: 0 0 6px #0FFF50, 0 0 12px #0FFF50; }
  .neon-pink { color: #FF10F0; text-shadow: 0 0 6px #FF10F0, 0 0 12px #FF10F0; }
  .neon-yellow { color: #FFB81C; text-shadow: 0 0 6px #FFB81C, 0 0 12px #FFB81C; }
  .neon-purple { color: #9D4EDD; text-shadow: 0 0 6px #9D4EDD, 0 0 12px #9D4EDD; }
  .neon-orange { color: #FF6600; text-shadow: 0 0 6px #FF6600, 0 0 12px #FF6600; }
  .neon-cyan { color: #00FFFF; text-shadow: 0 0 6px #00FFFF, 0 0 12px #00FFFF; }

  /* Table-style grid layout with visible borders */
  .retro-table {
    border-collapse: separate;
    border-spacing: 3px;
    width: 100%;
  }
  .retro-cell {
    border: 2px solid #c0c0c0;
    padding: 10px;
    vertical-align: top;
    background: #000022;
  }

  /* Score badge */
  .score-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-weight: 900;
    font-size: 13px;
    border: 2px solid;
    font-family: 'Comic Sans MS', cursive;
    flex-shrink: 0;
  }

  /* Search input */
  .retro-input {
    background: #000000;
    border: 3px inset #c0c0c0;
    color: #0FFF50;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 6px 10px;
    outline: none;
    width: 100%;
  }
  .retro-input::placeholder { color: #006600; }
  .retro-input:focus { border-color: #0FFF50; box-shadow: 0 0 8px #0FFF50; }

  /* Retro button */
  .retro-btn {
    font-family: 'Comic Sans MS', cursive;
    font-weight: 900;
    font-size: 13px;
    border: 3px outset #c0c0c0;
    padding: 6px 16px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .retro-btn:active { border-style: inset; }

  .retro-btn-lime { background: #0FFF50; color: #000000; }
  .retro-btn-pink { background: #FF10F0; color: #ffffff; }
  .retro-btn-yellow { background: #FFB81C; color: #000000; }
  .retro-btn-blue { background: #000099; color: #ffffff; }

  /* Web ring */
  .webring {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    border: 2px ridge #c0c0c0;
    padding: 10px;
    background: #000011;
  }
  .webring a {
    color: #00FFFF;
    font-size: 11px;
    text-decoration: underline;
    font-family: 'Comic Sans MS', cursive;
  }
  .webring a:hover { color: #FF10F0; }

  /* Visitor counter */
  .hit-counter {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    background: #000000;
    border: 2px inset #c0c0c0;
    padding: 4px 8px;
  }
  .hit-counter span {
    display: inline-block;
    background: #001100;
    color: #0FFF50;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    font-weight: 900;
    padding: 2px 4px;
    border: 1px solid #003300;
    text-shadow: 0 0 4px #0FFF50;
    min-width: 18px;
    text-align: center;
  }

  /* Mailbox animation */
  @keyframes mailboxOpen {
    0%,100% { transform: scaleY(1); }
    50% { transform: scaleY(0.85); }
  }
  .mailbox-anim { animation: mailboxOpen 1.5s ease-in-out infinite; display: inline-block; font-size: 20px; }

  /* Sparkle trail */
  .sparkle {
    position: fixed;
    pointer-events: none;
    font-size: 16px;
    z-index: 9999;
    animation: sparkle-fade 1s ease-out forwards;
  }
  @keyframes sparkle-fade {
    0% { opacity: 1; transform: scale(1) translateY(0); }
    100% { opacity: 0; transform: scale(0) translateY(-30px); }
  }

  /* Deal card */
  .deal-card {
    border: 2px outset #c0c0c0;
    background: #000022;
    padding: 10px;
    font-family: 'Comic Sans MS', cursive;
    transition: border-color 0.2s;
  }
  .deal-card:hover {
    border-color: #0FFF50;
    box-shadow: 0 0 10px rgba(15, 255, 80, 0.3);
  }

  /* Filter chip */
  .filter-chip {
    border: 2px outset #c0c0c0;
    background: #000044;
    color: #00FFFF;
    font-family: 'Comic Sans MS', cursive;
    font-size: 11px;
    padding: 3px 9px;
    cursor: pointer;
    font-weight: 700;
  }
  .filter-chip.active {
    background: #0FFF50;
    color: #000000;
    border-style: inset;
  }
  .filter-chip:hover:not(.active) {
    background: #000099;
  }

  /* Section header with papyrus-like styling */
  .section-header {
    font-family: Papyrus, 'Comic Sans MS', cursive;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 3px;
    margin: 8px 0;
  }

  /* Pricing card 3D effect */
  .price-card {
    border: 4px outset #c0c0c0;
    padding: 16px;
    text-align: center;
    font-family: 'Comic Sans MS', cursive;
    background: #000033;
    position: relative;
  }
  .price-card.featured {
    border-color: #FFB81C;
    box-shadow: 0 0 20px rgba(255,184,28,0.4), inset 0 0 30px rgba(255,184,28,0.05);
  }
  .price-card.power {
    border-color: #9D4EDD;
    box-shadow: 0 0 20px rgba(157,78,221,0.4), inset 0 0 30px rgba(157,78,221,0.05);
  }

  /* Loading dots */
  @keyframes loadDot {
    0%,80%,100% { opacity: 0; }
    40% { opacity: 1; }
  }
  .load-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #0FFF50;
    animation: loadDot 1.4s ease-in-out infinite;
  }
  .load-dot:nth-child(2) { animation-delay: 0.2s; }
  .load-dot:nth-child(3) { animation-delay: 0.4s; }

  /* Guestbook modal */
  .retro-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #c0c0c0;
    border: 4px outset #ffffff;
    z-index: 9000;
    min-width: 320px;
    box-shadow: 4px 4px 0 #000000;
    font-family: 'Comic Sans MS', cursive;
  }
  .retro-modal-title {
    background: linear-gradient(to right, #000080, #1084d0);
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .retro-modal-body { padding: 16px; color: #000000; font-size: 13px; }
  .retro-modal-close {
    background: #c0c0c0;
    border: 2px outset #ffffff;
    width: 16px;
    height: 16px;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }
  .retro-modal-close:active { border-style: inset; }

  /* Scrollbar retro */
  ::-webkit-scrollbar { width: 16px; background: #c0c0c0; }
  ::-webkit-scrollbar-thumb { background: #000080; border: 2px outset #ffffff; }
  ::-webkit-scrollbar-track { background: repeating-linear-gradient(45deg, #808080, #808080 2px, #c0c0c0 2px, #c0c0c0 8px); }

  /* Market select */
  .retro-select {
    background: #000000;
    border: 3px inset #c0c0c0;
    color: #0FFF50;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    padding: 5px 8px;
    outline: none;
  }
  .retro-select option { background: #000000; color: #0FFF50; }

  /* Responsive tweaks */
  @media (max-width: 640px) {
    .retro-grid-3 { display: block !important; }
    .retro-grid-3 > * { margin-bottom: 12px; }
    .hero-grid { display: block !important; }
  }
`

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface Deal {
  id: string
  title: string
  price: string | number | null
  city: string | null
  source: string | null
  deal_score: number | null
  deal_reason?: string | null
  event_type?: string | null
  hot?: boolean
  tags?: string[] | null
}

/* ═══════════════════════════════════════════════════════════════
   HELPER: Score badge color
   ═══════════════════════════════════════════════════════════════ */
function scoreBadge(score: number | null) {
  if (!score) return { bg: '#333', color: '#999', border: '#555', label: '?' }
  if (score >= 8) return { bg: '#003300', color: '#0FFF50', border: '#0FFF50', label: score.toString() }
  if (score >= 6) return { bg: '#332200', color: '#FFB81C', border: '#FFB81C', label: score.toString() }
  return { bg: '#330000', color: '#FF6666', border: '#FF6666', label: score.toString() }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN RETRO PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function RetroPage() {
  // Visitor counter
  const [visitorCount, setVisitorCount] = useState(0)
  const [showGuestbook, setShowGuestbook] = useState(false)
  const [guestbookName, setGuestbookName] = useState('')
  const [guestbookMsg, setGuestbookMsg] = useState('')
  const [guestbookSubmitted, setGuestbookSubmitted] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMarket, setSearchMarket] = useState('all')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<Deal[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Featured deals
  const [featuredDeals, setFeaturedDeals] = useState<Deal[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // Pricing snapshot — drives Pro card numbers + founder-lock copy.
  // Defaults match the founding variant so SSR markup matches client-
  // hydrated markup until /api/founding responds.
  const [proFoundingPrice, setProFoundingPrice] = useState(5)
  const [proNormalPrice, setProNormalPrice] = useState(9)
  const [priceVariant, setPriceVariant] = useState<'founding' | 'regular'>('founding')

  // Sparkle trail
  const sparkleRef = useRef<HTMLDivElement>(null)

  const SPARKLES = ['⭐', '✨', '💫', '🌟', '⚡', '💥', '🔥']

  // Init
  useEffect(() => {
    // Visitor counter: base + random delta stored in session
    const base = 1337420
    const stored = sessionStorage.getItem('retro-visits')
    let count = stored ? parseInt(stored) : base + Math.floor(Math.random() * 9999)
    if (!stored) {
      count = base + Math.floor(Math.random() * 9999)
      sessionStorage.setItem('retro-visits', count.toString())
    }
    // Increment each visit
    count += 1
    sessionStorage.setItem('retro-visits', count.toString())
    setVisitorCount(count)

    // Inject body class
    document.body.classList.add('retro-page')
    return () => { document.body.classList.remove('retro-page') }
  }, [])

  // Load featured deals
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/listings?hot=true&limit=8')
        if (res.ok) {
          const data = await res.json()
          const deals = Array.isArray(data) ? data : (data.listings || data.results || [])
          setFeaturedDeals(deals)
        }
      } catch {
        // silently fail — retro page doesn't crash
      } finally {
        setFeaturedLoading(false)
      }
    }
    loadFeatured()
  }, [])

  // Load pricing snapshot (drives Pro card numbers + founder-lock copy)
  useEffect(() => {
    fetch('/api/founding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        if (typeof data.foundingPrice === 'number') setProFoundingPrice(data.foundingPrice)
        if (typeof data.normalPrice === 'number') setProNormalPrice(data.normalPrice)
        if (data.priceVariant === 'regular' || data.priceVariant === 'founding') setPriceVariant(data.priceVariant)
      })
      .catch(() => {})
  }, [])

  // Sparkle trail
  useEffect(() => {
    const container = sparkleRef.current
    if (!container) return
    const handleMove = (e: MouseEvent) => {
      const sparkle = document.createElement('div')
      sparkle.className = 'sparkle'
      sparkle.textContent = SPARKLES[Math.floor(Math.random() * SPARKLES.length)]
      sparkle.style.left = e.clientX + 'px'
      sparkle.style.top = e.clientY + 'px'
      document.body.appendChild(sparkle)
      setTimeout(() => sparkle.remove(), 1000)
    }
    // Throttle to every 60ms
    let last = 0
    const throttled = (e: MouseEvent) => {
      const now = Date.now()
      if (now - last > 60) { last = now; handleMove(e) }
    }
    window.addEventListener('mousemove', throttled)
    return () => window.removeEventListener('mousemove', throttled)
  }, [])

  // BSOD easter egg handled by the BSOD component itself (has hidden trigger zone)

  // Search handler
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSearchLoading(true)
    setSearchError('')
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (searchMarket && searchMarket !== 'all') params.set('market', searchMarket)
      if (activeFilters.length > 0) params.set('type', activeFilters.join(','))
      params.set('limit', '10')
      const res = await fetch(`/api/listings?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const results = Array.isArray(data) ? data : (data.listings || data.results || [])
      setSearchResults(results)
    } catch {
      setSearchError('*** CONNECTION TIMED OUT *** Please try again')
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery, searchMarket, activeFilters])

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const QUICK_FILTERS = [
    { label: '🏡 Garage Sales', value: 'garage_sale' },
    { label: '🏛️ Estate Sales', value: 'estate_sale' },
    { label: '🛍️ Flea Markets', value: 'flea_market' },
    { label: '📦 Moving Sales', value: 'moving_sale' },
    { label: '🔨 Auctions', value: 'auction' },
    { label: '🆓 Free Items', value: 'free' },
  ]

  const MARKETS = [
    { value: 'all', label: '=== ALL MARKETS ===' },
    { value: 'dallas', label: 'Dallas / Fort Worth, TX' },
    { value: 'houston', label: 'Houston, TX' },
    { value: 'austin', label: 'Austin, TX' },
    { value: 'phoenix', label: 'Phoenix, AZ' },
    { value: 'atlanta', label: 'Atlanta, GA' },
    { value: 'chicago', label: 'Chicago, IL' },
    { value: 'denver', label: 'Denver, CO' },
    { value: 'seattle', label: 'Seattle, WA' },
    { value: 'miami', label: 'Miami, FL' },
    { value: 'nashville', label: 'Nashville, TN' },
  ]

  const formatPrice = (price: string | number | null) => {
    if (!price || price === 'Not listed') return 'FREE!!!!'
    if (typeof price === 'number') return `$${price.toFixed(2)}`
    return price.startsWith('$') ? price : `$${price}`
  }

  const visitorStr = visitorCount.toString().padStart(7, '0')

  return (
    <>
      {/* Inject CSS */}
      <style dangerouslySetInnerHTML={{ __html: RETRO_STYLES }} />

      {/* Sparkle container ref */}
      <div ref={sparkleRef} style={{ display: 'none' }} />

      {/* AOL Welcome screen — self-managing, triggers automatically after 6s */}
      <AOLWelcome />

      {/* BSOD easter egg — has hidden trigger zone + konami code via its own useEffect */}
      <BSOD />

      {/* Retro Popups (LimeWire, ICQ, Clippy etc.) */}
      <RetroPopups />

      {/* Winamp Player fixed bottom-left */}
      <WinampPlayer />

      {/* Guestbook Modal */}
      {showGuestbook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8999 }} onClick={() => setShowGuestbook(false)}>
          <div className="retro-modal" onClick={e => e.stopPropagation()}>
            <div className="retro-modal-title">
              <span>📖 flip-ly.net Guestbook — Sign In!</span>
              <button className="retro-modal-close" onClick={() => setShowGuestbook(false)}>✕</button>
            </div>
            <div className="retro-modal-body">
              {!guestbookSubmitted ? (
                <>
                  <p style={{ margin: '0 0 10px', color: '#000080', fontWeight: 900 }}>
                    Leave ur mark on teh intarwebz!! :D
                  </p>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>ur name (or handle):</label>
                    <input
                      value={guestbookName}
                      onChange={e => setGuestbookName(e.target.value)}
                      placeholder="xX_FlipMaster99_Xx"
                      style={{ width: '100%', border: '2px inset #808080', padding: '4px 6px', fontFamily: 'Comic Sans MS', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>ur message:</label>
                    <textarea
                      value={guestbookMsg}
                      onChange={e => setGuestbookMsg(e.target.value)}
                      placeholder="Gr8 site!! Bookmarked!! A/S/L?"
                      rows={3}
                      style={{ width: '100%', border: '2px inset #808080', padding: '4px 6px', fontFamily: 'Comic Sans MS', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className="retro-btn retro-btn-blue"
                      onClick={() => {
                        if (guestbookName.trim()) setGuestbookSubmitted(true)
                        else alert('pls enter ur name!! >:O')
                      }}
                    >
                      SUBMIT 2 GUESTBOOK!!
                    </button>
                    <button className="retro-btn" style={{ background: '#c0c0c0' }} onClick={() => setShowGuestbook(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <p style={{ fontWeight: 900, color: '#000080', fontSize: '15px' }}>
                    THANX {guestbookName.toUpperCase()}!!!
                  </p>
                  <p style={{ color: '#333' }}>
                    ur entry has been added 2 our guestbook!!<br />
                    come back soon!! ^_^
                  </p>
                  <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    (this is a fun retro page — no data was actually saved lol)
                  </p>
                  <button className="retro-btn retro-btn-lime" onClick={() => { setShowGuestbook(false); setGuestbookSubmitted(false); setGuestbookName(''); setGuestbookMsg('') }}>
                    CLOSE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PAGE WRAPPER
          ════════════════════════════════════════════════════════ */}
      <div className="retro-wrapper">

        {/* ═══ MARQUEE ANNOUNCEMENT BAR ═══ */}
        <div className="marquee-container" style={{ marginBottom: '8px' }}>
          <span className="marquee-inner">
            ⭐ WELCOME 2 FLIP-LY.NET :: THE HOTTEST DEAL SITE ON TEH WEB :: NOW WITH 20+ SOURCES SCANNED DAILY :: BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 AT 800x600 RESOLUTION :: FREE MEMBERSHIP AVAILABLE!! :: DON&apos;T FORGET 2 SIGN OUR GUESTBOOK!! :: NEW DEALS ADDED EVERY 4 HOURS!! :: DIAL-UP FRIENDLY (sort of) ⭐
          </span>
        </div>

        {/* ═══ SITE HEADER ═══ */}
        <div className="bevel-box" style={{ textAlign: 'center', background: 'linear-gradient(180deg, #000044 0%, #000022 100%)', marginBottom: '6px' }}>
          {/* Under construction banner */}
          <div style={{
            background: '#000000',
            border: '2px solid #FFB81C',
            padding: '6px 12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <span className="hardhat">🚧</span>
            <span className="under-construction">*** UNDER CONSTRUCTION ***</span>
            <span className="hardhat">🚧</span>
            <span className="under-construction blink" style={{ fontSize: '11px' }}>
              NEW FEATURES COMING SOON!! CHECK BACK DAILY!!
            </span>
            <span className="hardhat">🚧</span>
          </div>

          {/* Logo */}
          <h1 style={{
            fontFamily: 'Papyrus, Comic Sans MS, cursive',
            fontSize: 'clamp(28px, 6vw, 56px)',
            margin: '0 0 4px',
            background: 'linear-gradient(to right, #0FFF50, #00FFFF, #FF10F0, #FFB81C, #0FFF50)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            letterSpacing: '4px',
            filter: 'drop-shadow(0 0 8px rgba(15,255,80,0.5))',
          }}>
            ✦ flip-ly.net ✦
          </h1>
          <p style={{
            fontFamily: 'Papyrus, cursive',
            color: '#FFB81C',
            textShadow: '0 0 8px #FFB81C',
            fontSize: '14px',
            letterSpacing: '3px',
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            ~ The Ultimate Deal Finding Machine of the Internet ~
          </p>
          <p style={{ color: '#c0c0c0', fontSize: '11px', fontFamily: 'Comic Sans MS', margin: 0 }}>
            Est. MMXXIII :: Built with &hearts; and too much Mountain Dew
          </p>
        </div>

        {/* ═══ QUICK NAV ═══ */}
        <div style={{
          display: 'flex',
          gap: '4px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '6px',
          background: '#000011',
          border: '2px ridge #c0c0c0',
          marginBottom: '6px',
        }}>
          {[
            { label: '🏠 Home', href: '#top' },
            { label: '🔍 Search', href: '#search' },
            { label: '🔥 Hot Deals', href: '#featured' },
            { label: '💰 Pricing', href: '#pricing' },
            { label: '📊 Scoring', href: '#scoring' },
            { label: '📖 Guestbook', href: '#', onClick: () => setShowGuestbook(true) },
            { label: '🕹️ Main Site', href: '/' },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={link.onClick}
              style={{
                color: '#FFB81C',
                textDecoration: 'none',
                fontFamily: 'Comic Sans MS, cursive',
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 10px',
                border: '2px outset #c0c0c0',
                background: '#000033',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                ;(e.target as HTMLElement).style.background = '#FF10F0'
                ;(e.target as HTMLElement).style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                ;(e.target as HTMLElement).style.background = '#000033'
                ;(e.target as HTMLElement).style.color = '#FFB81C'
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ HERO SECTION ═══ */}
        <div id="top" className="bevel-box" style={{ marginBottom: '6px', textAlign: 'center' }}>
          <div className="section-header neon-pink" style={{ fontSize: '20px' }}>
            ★★★ FIND UNDERPRICED ITEMS TO FLIP FOR PROFIT ★★★
            <span className="new-badge">NEW!</span>
          </div>
          <p style={{ color: '#00FFFF', fontFamily: 'Comic Sans MS', fontSize: '13px', margin: '8px 0', lineHeight: 1.6, textShadow: '0 0 6px #00FFFF' }}>
            We scan <span className="neon-lime blink" style={{ fontWeight: 900, fontSize: '15px' }}>20+ marketplaces</span> and score every deal by resale potential — so you don&apos;t have to!!<br />
            Craigslist, OfferUp, EstateSales.net, Eventbrite, and more — scanned <strong style={{ color: '#FFB81C' }}>EVERY 4 HOURS</strong>!!
          </p>

          {/* Stats strip — styled like a ticker */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            padding: '10px',
            background: '#000000',
            border: '2px inset #c0c0c0',
            margin: '10px 0',
          }}>
            {[
              { value: '413+', label: 'MARKETS' },
              { value: '20+', label: 'SOURCES' },
              { value: 'EVERY 4H', label: 'REFRESH' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div className="neon-lime" style={{ fontFamily: 'Courier New', fontWeight: 900, fontSize: '22px' }}>
                  {s.value}
                </div>
                <div style={{ color: '#c0c0c0', fontSize: '10px', letterSpacing: '2px', fontFamily: 'Courier New' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
            <button
              className="retro-btn retro-btn-lime"
              style={{ fontSize: '14px', padding: '8px 24px' }}
              onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              🔍 START SEARCHING NOW!!
            </button>
            <a href="/?signup=pro" className="retro-btn retro-btn-pink" style={{ fontSize: '14px', padding: '8px 24px', textDecoration: 'none' }}>
              ✉️ GET FREE ACCOUNT!!
            </a>
          </div>
          <p style={{ color: '#888', fontSize: '10px', fontFamily: 'Comic Sans MS', margin: '8px 0 0' }}>
            &lt;&lt; 100% FREE TO SIGN UP!! NO CREDIT CARD NEEDED!! &gt;&gt;
          </p>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ HOW IT WORKS ═══ */}
        <div className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-yellow" style={{ fontSize: '16px', marginBottom: '10px' }}>
            ✦ HOW IT WORKS ✦
            <span className="new-badge">EASY!</span>
          </h2>
          <div className="retro-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              {
                step: 'STEP 1',
                icon: '🔎',
                label: 'WE SCAN',
                desc: 'Our robot army scans Craigslist, OfferUp, EstateSales.net, Eventbrite, and 20+ local sources EVERY 4 HOURS!! No sleep. Just deals.',
                color: '#0FFF50',
              },
              {
                step: 'STEP 2',
                icon: '🤖',
                label: 'AI SCORES',
                desc: 'Our turbo AI rates every listing 1-10 by resale value, demand signals, and profit margin potential!! Like having a robot friend who knows prices!!',
                color: '#FF10F0',
              },
              {
                step: 'STEP 3',
                icon: '💰',
                label: 'U FLIP!!',
                desc: 'See the best deals BEFORE everyone else!! Show up first, buy low, sell high. Its that simple!! $$$ PROFIT $$$',
                color: '#FFB81C',
              },
            ].map(item => (
              <div
                key={item.step}
                className="bevel-box-inset"
                style={{ textAlign: 'center', borderColor: item.color }}
              >
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{
                  fontFamily: 'Comic Sans MS',
                  fontSize: '10px',
                  color: '#c0c0c0',
                  letterSpacing: '2px',
                  marginBottom: '4px',
                }}>
                  {item.step}
                </div>
                <div style={{
                  fontFamily: 'Papyrus, cursive',
                  color: item.color,
                  fontWeight: 900,
                  fontSize: '14px',
                  textShadow: `0 0 8px ${item.color}`,
                  marginBottom: '6px',
                  letterSpacing: '2px',
                }}>
                  {item.label}
                </div>
                <p style={{ color: '#c0c0c0', fontSize: '11px', fontFamily: 'Comic Sans MS', lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ SEARCH SECTION ═══ */}
        <div id="search" className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-cyan" style={{ fontSize: '16px', marginBottom: '10px' }}>
            🔍 SEARCH 4 DEALS :: POWERED BY AI TECHNOLOGY!! 🔍
          </h2>

          {/* Market + query form */}
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <select
                className="retro-select"
                value={searchMarket}
                onChange={e => setSearchMarket(e.target.value)}
                style={{ flex: '0 0 auto', minWidth: '180px' }}
              >
                {MARKETS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input
                className="retro-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="type ur search here... (eg: vintage sofa, tools, bikes)"
                style={{ flex: '1 1 200px', minWidth: '180px' }}
              />
              <button
                type="submit"
                className="retro-btn retro-btn-lime"
                disabled={searchLoading}
              >
                {searchLoading ? '...' : '🔍 GO!!'}
              </button>
            </div>
          </form>

          {/* Quick filter chips */}
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#c0c0c0', fontSize: '11px', fontFamily: 'Comic Sans MS', marginRight: '6px' }}>
              Quick Filters:
            </span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f.value}
                className={`filter-chip ${activeFilters.includes(f.value) ? 'active' : ''}`}
                onClick={() => toggleFilter(f.value)}
                style={{ marginRight: '4px', marginBottom: '4px' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search results */}
          {searchLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span className="load-dot" />
                <span className="load-dot" />
                <span className="load-dot" />
              </div>
              <p className="neon-lime" style={{ fontFamily: 'Courier New', fontSize: '12px', letterSpacing: '2px' }}>
                CONNECTING TO DEAL DATABASE... PLEASE WAIT...
              </p>
            </div>
          )}

          {searchError && (
            <div style={{
              background: '#000000',
              border: '2px solid #FF0000',
              padding: '10px',
              color: '#FF0000',
              fontFamily: 'Courier New',
              fontSize: '12px',
              textShadow: '0 0 6px #FF0000',
            }}>
              *** ERROR *** {searchError} *** PRESS F5 TO RETRY ***
            </div>
          )}

          {hasSearched && !searchLoading && !searchError && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="neon-lime" style={{ fontFamily: 'Courier New', fontSize: '12px' }}>
                  FOUND {searchResults.length} RESULTS!!
                </span>
                {searchResults.length > 0 && (
                  <span className="blink" style={{ color: '#FFB81C', fontSize: '11px', fontFamily: 'Comic Sans MS' }}>
                    ↓ SCROLL DOWN TO SEE DEALZ ↓
                  </span>
                )}
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontFamily: 'Comic Sans MS', fontSize: '13px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>😔</div>
                  No deals found!! Try different keywords or check another market!!<br />
                  <span style={{ fontSize: '11px', color: '#555' }}>Our robot workers are searching 24/7 tho!!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {searchResults.map(deal => {
                    const badge = scoreBadge(deal.deal_score)
                    return (
                      <div key={deal.id} className="deal-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div
                            className="score-badge"
                            style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                          >
                            {badge.label}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              color: '#0FFF50',
                              fontFamily: 'Comic Sans MS',
                              fontWeight: 700,
                              fontSize: '13px',
                              marginBottom: '3px',
                            }}>
                              {deal.title}
                              {deal.hot && <span className="new-badge">HOT!!</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#FFB81C', fontFamily: 'Courier New', fontWeight: 900, fontSize: '14px' }}>
                                {formatPrice(deal.price)}
                              </span>
                              {deal.city && (
                                <span style={{ color: '#c0c0c0', fontSize: '11px', fontFamily: 'Comic Sans MS' }}>
                                  📍 {deal.city}
                                </span>
                              )}
                              {deal.source && (
                                <span style={{ color: '#888', fontSize: '11px', fontFamily: 'Comic Sans MS' }}>
                                  via {deal.source}
                                </span>
                              )}
                            </div>
                            {deal.deal_reason && (
                              <p style={{ color: '#888', fontSize: '11px', fontFamily: 'Comic Sans MS', margin: '4px 0 0', fontStyle: 'italic' }}>
                                🤖 AI says: {deal.deal_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!hasSearched && (
            <div style={{ textAlign: 'center', padding: '14px', border: '1px dashed #333' }}>
              <p style={{ color: '#555', fontFamily: 'Comic Sans MS', fontSize: '12px', margin: 0 }}>
                ☝️ Type something and hit GO to find deals near u!!
              </p>
            </div>
          )}
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ FEATURED DEALS ═══ */}
        <div id="featured" className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-pink" style={{ fontSize: '16px', marginBottom: '10px' }}>
            🔥 HOT DEALS RIGHT NOW 🔥
            <span className="new-badge">LIVE!!</span>
          </h2>
          <p style={{
            color: '#c0c0c0',
            fontFamily: 'Comic Sans MS',
            fontSize: '11px',
            textAlign: 'center',
            margin: '0 0 10px',
          }}>
            These dealz are scored by our AI robot and updated every 4 hours!! Don&apos;t miss out!! 😱
          </p>

          {featuredLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span className="load-dot" />
                <span className="load-dot" />
                <span className="load-dot" />
              </div>
              <p className="neon-lime" style={{ fontFamily: 'Courier New', fontSize: '12px', letterSpacing: '2px' }}>
                LOADING HOT DEALZ...
              </p>
            </div>
          ) : featuredDeals.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ color: '#555', fontFamily: 'Comic Sans MS', fontSize: '13px' }}>
                🤖 Our robots are still scanning!! Check back soon or{' '}
                <a href="/?signup=pro" style={{ color: '#0FFF50' }}>sign up for alerts</a>!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
              {featuredDeals.map((deal, i) => {
                const badge = scoreBadge(deal.deal_score)
                return (
                  <div key={deal.id || i} className="deal-card" style={{ position: 'relative' }}>
                    {i === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-1px',
                        right: '-1px',
                        background: '#FF0000',
                        color: '#FFB81C',
                        fontSize: '9px',
                        fontFamily: 'Comic Sans MS',
                        fontWeight: 900,
                        padding: '2px 6px',
                        border: '1px solid #FFB81C',
                      }}>
                        #1 DEAL!!
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div
                        className="score-badge"
                        style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                      >
                        {badge.label}
                      </div>
                      <div style={{
                        color: '#0FFF50',
                        fontFamily: 'Comic Sans MS',
                        fontWeight: 700,
                        fontSize: '12px',
                        flex: 1,
                        lineHeight: 1.3,
                      }}>
                        {deal.title}
                        {deal.hot && <span className="blink" style={{ color: '#FF0000', marginLeft: '4px' }}>🔥</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Courier New', color: '#FFB81C', fontWeight: 900, fontSize: '16px', marginBottom: '4px' }}>
                      {formatPrice(deal.price)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {deal.city && (
                        <span style={{ color: '#c0c0c0', fontSize: '10px', fontFamily: 'Comic Sans MS' }}>
                          📍 {deal.city}
                        </span>
                      )}
                      {deal.source && (
                        <span style={{ color: '#888', fontSize: '10px', fontFamily: 'Comic Sans MS' }}>
                          {deal.source}
                        </span>
                      )}
                      {deal.event_type && (
                        <span style={{ color: '#9D4EDD', fontSize: '10px', fontFamily: 'Comic Sans MS', textShadow: '0 0 4px #9D4EDD' }}>
                          {deal.event_type}
                        </span>
                      )}
                    </div>
                    {deal.deal_reason && (
                      <p style={{ color: '#555', fontSize: '10px', fontFamily: 'Comic Sans MS', margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
                        🤖 {deal.deal_reason.slice(0, 80)}{deal.deal_reason.length > 80 ? '...' : ''}
                      </p>
                    )}
                    <button
                      className="retro-btn retro-btn-blue"
                      style={{ width: '100%', marginTop: '8px', fontSize: '10px' }}
                      onClick={() => {
                        if (window.confirm('U need a PRO account to see the source link!! Want to sign up FREE?')) {
                          window.location.href = '/?signup=pro'
                        }
                      }}
                    >
                      SEE FULL DETAILS »
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              className="retro-btn retro-btn-yellow"
              onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              🔍 SEARCH ALL DEALS »
            </button>
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ SCORING EXPLAINER ═══ */}
        <div id="scoring" className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-purple" style={{ fontSize: '16px', marginBottom: '6px' }}>
            🤖 HOW WE SCORE DEALZ :: AI TECHNOLOGY EXPLAINED!! 🤖
          </h2>
          <p style={{ textAlign: 'center', color: '#c0c0c0', fontFamily: 'Comic Sans MS', fontSize: '11px', margin: '0 0 10px' }}>
            Our AI analyzes FOUR key factors to rate every listing 1-10!! Its like having a robot expert friend who knows everything about prices!!
          </p>
          <div className="retro-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
            {[
              { icon: '📈', label: 'DEMAND', desc: 'How fast does this category sell on eBay/Facebook?? Higher demand = better score!!', color: '#0FFF50' },
              { icon: '💰', label: 'MARGIN', desc: 'Price vs typical resale value on eBay!! Bigger spread = more profit 4 u!!', color: '#FFB81C' },
              { icon: '🏷️', label: 'COMPETITION', desc: 'How many similar listings exist?? Less competition = easier 2 sell!!', color: '#FF10F0' },
              { icon: '⚡', label: 'VELOCITY', desc: 'Days-to-sell estimate!! Faster moving = better!! Time is money!!', color: '#00FFFF' },
            ].map(f => (
              <div
                key={f.label}
                className="bevel-box-inset"
                style={{ textAlign: 'center', borderColor: f.color }}
              >
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{f.icon}</div>
                <div style={{
                  fontFamily: 'Papyrus, cursive',
                  color: f.color,
                  fontWeight: 900,
                  fontSize: '12px',
                  textShadow: `0 0 6px ${f.color}`,
                  marginBottom: '4px',
                  letterSpacing: '1px',
                }}>
                  {f.label}
                </div>
                <p style={{ color: '#aaa', fontSize: '10px', fontFamily: 'Comic Sans MS', lineHeight: 1.4, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '10px',
            padding: '8px',
            background: '#000000',
            border: '2px inset #c0c0c0',
            textAlign: 'center',
          }}>
            <span className="neon-lime" style={{ fontFamily: 'Courier New', fontSize: '12px' }}>
              SCORE 8-10 = 🔥 FIRE DEAL &nbsp;|&nbsp; SCORE 6-7 = 👍 GOOD DEAL &nbsp;|&nbsp; SCORE 1-5 = 🤷 MEH
            </span>
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ TESTIMONIALS ═══ */}
        <div className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-yellow" style={{ fontSize: '14px', marginBottom: '8px' }}>
            📣 WHAT PPL R SAYING ABOUT FLIP-LY!! 📣
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { quote: 'Found a $200 dresser scored 9 — flipped it for $475 the same weekend!!!! MADE $275 PROFIT!!!', author: 'xX_DallasFlippr_Xx', asl: '28/M/Texas' },
              { quote: 'The Thursday digest is my Saturday morning game plan!! Best email I get all week tbh', author: 'AtlantaHustler2000', asl: '34/M/Atlanta' },
              { quote: 'Saved me 3 hours of checking Craigslist every morning!! Now I just check flip-ly and go!!!', author: 'PhoenixDealer99', asl: '41/F/Phoenix' },
            ].map((t, i) => (
              <div key={i} className="bevel-box-inset">
                <p style={{
                  color: '#c0c0c0',
                  fontFamily: 'Comic Sans MS',
                  fontSize: '12px',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  margin: '0 0 4px',
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ color: '#888', fontSize: '10px', fontFamily: 'Courier New', margin: 0 }}>
                  — {t.author} :: a/s/l: {t.asl}
                </p>
              </div>
            ))}
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ PRICING ═══ */}
        <div id="pricing" className="bevel-box" style={{ marginBottom: '6px' }}>
          <h2 className="section-header neon-lime" style={{ fontSize: '16px', marginBottom: '4px' }}>
            💰 CHOOSE UR PLAN :: SUPER CHEAP PRICES!! 💰
          </h2>
          <p style={{ textAlign: 'center', color: '#c0c0c0', fontFamily: 'Comic Sans MS', fontSize: '11px', margin: '0 0 10px' }}>
            One good flip pays 4 a whole year of Pro!! No brainer!! 🧠
          </p>
          <div className="retro-grid-3" style={{ display: 'grid', gridTemplateColumns: (process.env.NEXT_PUBLIC_POWER_VISIBILITY === 'public') ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
            {/* Free */}
            <div className="price-card">
              <div style={{
                fontFamily: 'Papyrus, cursive',
                color: '#c0c0c0',
                fontSize: '16px',
                fontWeight: 900,
                marginBottom: '4px',
                letterSpacing: '2px',
              }}>
                FREE!!
              </div>
              <div style={{
                fontFamily: 'Courier New',
                color: '#0FFF50',
                fontSize: '36px',
                fontWeight: 900,
                textShadow: '0 0 10px #0FFF50',
                marginBottom: '8px',
              }}>
                $0
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  '✅ 15 searches / day',
                  '✅ 1 market',
                  '✅ Weekly digest (Thursday)',
                  '✅ AI scores (number only)',
                ].map(f => (
                  <div key={f} style={{ color: '#c0c0c0', fontFamily: 'Comic Sans MS', fontSize: '11px', textAlign: 'left' }}>{f}</div>
                ))}
              </div>
              <a href="/?signup=pro" className="retro-btn retro-btn-blue" style={{ display: 'block', textDecoration: 'none' }}>
                GET FREE ACCOUNT!!
              </a>
            </div>

            {/* Pro (featured) */}
            <div className="price-card featured">
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFB81C',
                color: '#000000',
                fontSize: '9px',
                fontFamily: 'Comic Sans MS',
                fontWeight: 900,
                padding: '2px 10px',
                border: '2px outset #ffffff',
                whiteSpace: 'nowrap',
              }}>
                ★ MOST POPULAR ★
              </div>
              <div style={{
                fontFamily: 'Papyrus, cursive',
                color: '#FFB81C',
                fontSize: '16px',
                fontWeight: 900,
                marginBottom: '4px',
                letterSpacing: '2px',
                textShadow: '0 0 8px #FFB81C',
              }}>
                PRO
              </div>
              <div style={{ marginBottom: '2px' }}>
                {priceVariant === 'founding' && (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#555', fontFamily: 'Courier New', fontSize: '16px' }}>${proNormalPrice}</span>
                    {' '}
                  </>
                )}
                <span style={{
                  fontFamily: 'Courier New',
                  color: '#FFB81C',
                  fontSize: '36px',
                  fontWeight: 900,
                  textShadow: '0 0 10px #FFB81C',
                }}>
                  ${priceVariant === 'founding' ? proFoundingPrice : proNormalPrice}
                </span>
                <span style={{ color: '#888', fontFamily: 'Comic Sans MS', fontSize: '12px' }}>/mo</span>
              </div>
              {priceVariant === 'founding' ? (
                <div className="blink" style={{ color: '#0FFF50', fontSize: '10px', fontFamily: 'Comic Sans MS', marginBottom: '8px', fontWeight: 700 }}>
                  FOUNDING PRICE — LOCKED 4 LIFE!!
                </div>
              ) : (
                <div style={{ color: '#888', fontSize: '10px', fontFamily: 'Comic Sans MS', marginBottom: '8px', fontWeight: 700 }}>
                  MONTH-2-MONTH :: CANCEL ANYTIME
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  '🔥 UNLIMITED searches',
                  '🔥 3 markets',
                  '🔥 Digest 6 hours early',
                  '🔥 Full score breakdowns',
                  '🔥 Direct source links',
                ].map(f => (
                  <div key={f} style={{ color: '#FFB81C', fontFamily: 'Comic Sans MS', fontSize: '11px', textAlign: 'left' }}>{f}</div>
                ))}
              </div>
              <a href="/pro" className="retro-btn retro-btn-yellow" style={{ display: 'block', textDecoration: 'none', fontSize: '14px' }}>
                UPGRADE 2 PRO NOW!!
              </a>
            </div>

            {/* Power — rendered only when NEXT_PUBLIC_POWER_VISIBILITY=public */}
            {process.env.NEXT_PUBLIC_POWER_VISIBILITY === 'public' && (
            <div className="price-card power">
              <div style={{
                fontFamily: 'Papyrus, cursive',
                color: '#9D4EDD',
                fontSize: '16px',
                fontWeight: 900,
                marginBottom: '4px',
                letterSpacing: '2px',
                textShadow: '0 0 8px #9D4EDD',
              }}>
                POWER ⚡
              </div>
              <div style={{ marginBottom: '2px' }}>
                <span style={{ textDecoration: 'line-through', color: '#555', fontFamily: 'Courier New', fontSize: '16px' }}>$39</span>
                {' '}
                <span style={{
                  fontFamily: 'Courier New',
                  color: '#9D4EDD',
                  fontSize: '36px',
                  fontWeight: 900,
                  textShadow: '0 0 10px #9D4EDD',
                }}>
                  $19
                </span>
                <span style={{ color: '#888', fontFamily: 'Comic Sans MS', fontSize: '12px' }}>/mo</span>
              </div>
              <div style={{ color: '#9D4EDD', fontSize: '10px', fontFamily: 'Comic Sans MS', marginBottom: '8px', fontWeight: 700 }}>
                FOUNDING PRICE — LOCKED 4 LIFE!!
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  '⚡ Everything in Pro',
                  '⚡ UNLIMITED markets',
                  '⚡ Instant deal alerts',
                  '⚡ Category intelligence',
                  '⚡ Priority support',
                ].map(f => (
                  <div key={f} style={{ color: '#9D4EDD', fontFamily: 'Comic Sans MS', fontSize: '11px', textAlign: 'left' }}>{f}</div>
                ))}
              </div>
              <a href="/pro?tier=power" className="retro-btn retro-btn-pink" style={{ display: 'block', textDecoration: 'none', fontSize: '12px' }}>
                GO POWER MODE!!
              </a>
            </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ color: '#555', fontFamily: 'Comic Sans MS', fontSize: '11px' }}>
              Cancel anytime :: Secure checkout via Stripe :: One good find pays for a year
            </span>
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ EMAIL SIGNUP / MAILBOX ═══ */}
        <div className="bevel-box" style={{ marginBottom: '6px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="mailbox-anim">📬</span>
            <h2 className="section-header neon-cyan" style={{ fontSize: '15px', margin: 0 }}>
              GET DEAL ALERTS IN UR INBOX!!
            </h2>
            <span className="mailbox-anim">📬</span>
          </div>
          <p style={{ color: '#c0c0c0', fontFamily: 'Comic Sans MS', fontSize: '11px', margin: '0 0 10px' }}>
            Sign up FREE 2 get the weekly Thursday digest + instant hot deal alerts!! 🔥
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '480px', margin: '0 auto' }}>
            <input
              className="retro-input"
              type="email"
              placeholder="ur_email@aol.com"
              style={{ flex: '1 1 200px', minWidth: '160px' }}
            />
            <button
              className="retro-btn retro-btn-lime"
              onClick={() => { alert('Plz use our main signup page!! We dont want ur email to get lost in cyberspace!! :D'); window.location.href = '/?signup=pro' }}
            >
              ✉️ SIGN UP!!
            </button>
          </div>
          <p style={{ color: '#555', fontFamily: 'Comic Sans MS', fontSize: '10px', margin: '8px 0 0' }}>
            No spam!! We promise!! We h8 spam as much as u do!! (unsubscribe anytime)
          </p>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ STATS STRIP ═══ */}
        <div style={{
          background: '#000000',
          border: '3px inset #c0c0c0',
          padding: '10px',
          marginBottom: '6px',
          textAlign: 'center',
        }}>
          <div className="section-header neon-orange" style={{ fontSize: '11px', marginBottom: '8px' }}>
            📊 LIVE SYSTEM STATS 📊
          </div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '🗃️', label: 'LISTINGS IN DB', value: '413+' },
              { icon: '🌐', label: 'SOURCES SCANNED', value: '20+' },
              { icon: '⏰', label: 'REFRESH RATE', value: 'EVERY 4H' },
              { icon: '🤖', label: 'AI SCORES TODAY', value: '100%' },
              { icon: '👥', label: 'ACTIVE MEMBERS', value: 'GROWING!!' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '18px', marginBottom: '2px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Courier New', color: '#0FFF50', fontWeight: 900, fontSize: '13px', textShadow: '0 0 4px #0FFF50' }}>
                  {s.value}
                </div>
                <div style={{ color: '#555', fontSize: '9px', fontFamily: 'Courier New', letterSpacing: '1px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="rainbow-hr" />

        {/* ═══ FOOTER ═══ */}
        <div className="bevel-box" style={{ textAlign: 'center' }}>
          {/* Guestbook + links */}
          <div style={{ marginBottom: '10px' }}>
            <button
              className="retro-btn retro-btn-blue"
              style={{ marginRight: '8px', marginBottom: '4px' }}
              onClick={() => setShowGuestbook(true)}
            >
              📖 SIGN OUR GUESTBOOK!!
            </button>
            <a href="/" className="retro-btn retro-btn-pink" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '4px' }}>
              🌐 GO 2 MAIN SITE
            </a>
          </div>

          {/* Visitor counter */}
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#c0c0c0', fontFamily: 'Comic Sans MS', fontSize: '11px', marginRight: '8px' }}>
              You are visitor #
            </span>
            <div className="hit-counter" style={{ display: 'inline-flex' }}>
              {visitorStr.split('').map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <ShellTrigger variant="retro" />
          </div>

          {/* Best viewed badge */}
          <div style={{
            display: 'inline-block',
            border: '3px outset #c0c0c0',
            padding: '6px 14px',
            background: '#000000',
            marginBottom: '10px',
            fontFamily: 'Comic Sans MS',
            fontSize: '10px',
            color: '#c0c0c0',
          }}>
            <div style={{ fontWeight: 900, color: '#0FFF50', marginBottom: '2px' }}>BEST VIEWED IN</div>
            <div style={{ color: '#FFB81C', fontWeight: 700 }}>NETSCAPE NAVIGATOR 4.0</div>
            <div style={{ color: '#888', fontSize: '9px' }}>at 800×600 resolution</div>
            <div style={{ color: '#FF10F0', fontSize: '9px' }}>IE 4.0 also ok i guess 🤷</div>
          </div>

          {/* Web Ring */}
          <div className="webring" style={{ marginBottom: '10px' }}>
            <span style={{ color: '#FFB81C', fontFamily: 'Comic Sans MS', fontSize: '11px', fontWeight: 900 }}>
              ⬡ DEAL FINDER WEB RING ⬡
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('This is a retro web ring!! The 90s are calling!!') }}>« Prev</a>
            <span style={{ color: '#c0c0c0', fontSize: '10px', fontFamily: 'Courier New' }}>|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('You are at flip-ly.net — the BEST site in the ring!!') }}>Random</a>
            <span style={{ color: '#c0c0c0', fontSize: '10px', fontFamily: 'Courier New' }}>|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('This is a retro web ring!! The 90s are calling!!') }}>Next »</a>
            <span style={{ color: '#c0c0c0', fontSize: '10px', fontFamily: 'Courier New' }}>|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('There are 47 sites in the Flip &amp; Deal Web Ring!! (not really lol)') }}>List All</a>
          </div>

          {/* Copyright */}
          <div style={{ color: '#555', fontFamily: 'Comic Sans MS', fontSize: '10px' }}>
            <p style={{ margin: '0 0 4px' }}>
              © 1999-2026 flip-ly.net :: All Rights Reserved :: Do Not Steal!!
            </p>
            <p style={{ margin: '0 0 4px' }}>
              <span className="blink-slow" style={{ color: '#FF0000' }}>★</span>
              {' '}This site is under construction!! Come back tomorrow!!{' '}
              <span className="blink-slow" style={{ color: '#FF0000' }}>★</span>
            </p>
            <p style={{ margin: '0 0 4px', color: '#444' }}>
              Made with ❤️ + Geocities Pro Account + too much Mountain Dew Code Red
            </p>
            <p style={{ margin: 0, fontSize: '9px', color: '#333' }}>
              flip-ly.net is not affiliated with Netscape, America Online, LimeWire, or ICQ.
              Any resemblance to a real 90s website is entirely intentional and extremely on purpose.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '9px', color: '#333' }}>
              Press ↑↑↓↓←→←→BA for a special surprise!! 🕹️
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
