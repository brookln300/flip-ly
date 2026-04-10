'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/* ── TYPES ─────────────────────────────────────────────── */
interface Listing {
  id: string
  title: string
  price: string
  city: string
  date: string
  time?: string
  hot: boolean
  source: string
  deal_score: number | 'gated'
  deal_reason?: string
  description?: string
  tags?: string[]
  source_url?: string
  posted_at?: string
  image_url?: string
  event_type?: string
  distance_miles?: number
  address?: string
  lat?: number
  lng?: number
  zip_code?: string
  enriched?: boolean
}

interface User {
  id: string
  email: string
  name?: string
  city: string
  state: string
  market_id: string
  market_slug?: string
  is_premium: boolean
  subscription_tier?: string | null
  created_at: string
}

interface SearchGate {
  is_premium: boolean
  searches_used: number
  searches_remaining: number
  searches_max: number
  limited?: boolean
}

interface MarketOption {
  id: string
  slug: string
  name: string
  listing_count?: number
}

/* ── INLINE STYLES (Apple-light) ──────────────────────── */
const DASH_CSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
  .dash-fade { animation: fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both }
  .dash-fade-d1 { animation-delay: 0.06s }
  .dash-fade-d2 { animation-delay: 0.12s }
  .dash-fade-d3 { animation-delay: 0.18s }
  .dash-fade-d4 { animation-delay: 0.24s }
  .dash-row:hover { background: #fafafa !important }
  .dash-row { transition: all 0.15s ease }
  .dash-tag:hover { border-color: rgba(22,163,74,0.4) !important; color: var(--accent-green) !important; background: rgba(22,163,74,0.04) !important }
  .dash-tag-active { border-color: var(--accent-green) !important; color: #fff !important; background: var(--accent-green) !important }
  .dash-search:focus-within { border-color: var(--accent-green) !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important }
  .dash-stat { position: relative; overflow: hidden; transition: all 0.2s ease }
  .dash-stat:hover { border-color: var(--border-active) !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.06) }
  .dash-btn:hover { opacity: 0.9; transform: translateY(-0.5px) }
  .dash-btn-outline:hover { border-color: var(--border-active) !important; background: var(--bg-surface) !important }
  .dash-action { opacity: 0; transition: opacity 0.15s }
  .dash-row:hover .dash-action { opacity: 1 }
  .dash-save-btn { transition: all 0.15s ease }
  .dash-save-btn:hover { transform: scale(1.15) }
  .dash-dropdown { animation: slideDown 0.15s ease }
  .dash-expand { max-height: 0; overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease; opacity: 0 }
  .dash-expand.open { max-height: 300px; opacity: 1 }
  .dash-img-thumb { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: var(--bg-surface); border: 1px solid var(--border-subtle) }
  .dash-score-tip { position: relative; cursor: help }
  .dash-score-tip:hover .dash-tip-text { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto }
  .dash-tip-text { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(4px); background: var(--text-primary); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 11px; white-space: nowrap; max-width: 240px; white-space: normal; opacity: 0; pointer-events: none; transition: all 0.15s ease; z-index: 50; box-shadow: 0 4px 12px rgba(0,0,0,0.15) }
  .dash-date-pill { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap }
  .dash-tag-sm { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 500; background: var(--bg-surface); color: var(--text-muted); border: 1px solid var(--border-subtle) }
  @media (max-width: 640px) {
    .dash-stats-grid { grid-template-columns: repeat(2, 1fr) !important }
    .dash-bottom-grid { grid-template-columns: 1fr !important }
    .dash-action { opacity: 1 }
    .dash-row { padding: 10px 8px !important; gap: 8px !important; }
    .dash-score-tip > div:first-child { width: 36px !important; height: 36px !important; }
    .dash-img-thumb { width: 36px !important; height: 36px !important; }
  }
`

const font = 'var(--font-primary), system-ui, -apple-system, sans-serif'

// Event type filters — these hit the API directly via event_type param
const EVENT_TYPES = [
  { key: 'all', label: 'All', icon: '🔍' },
  { key: 'garage_sale', label: 'Garage Sales', icon: '🏠' },
  { key: 'estate_sale', label: 'Estate Sales', icon: '🏛️' },
  { key: 'flea_market', label: 'Flea Markets', icon: '🎪' },
  { key: 'moving_sale', label: 'Moving Sales', icon: '📦' },
  { key: 'auction', label: 'Auctions', icon: '🔨' },
  { key: 'community_sale', label: 'Community', icon: '🏘️' },
  { key: 'event', label: 'Events', icon: '🎫' },
]

// Quick filters — special logic
const QUICK_FILTERS = [
  { key: 'weekend', label: 'This Weekend' },
  { key: 'hot', label: 'Score 7+' },
  { key: 'free', label: 'Free Items' },
  { key: 'nearby', label: 'Near Me' },
]

/* ── HELPERS ───────────────────────────────────────────── */
function formatDisplayName(user: User): string {
  if (user.name) return user.name.split(' ')[0]
  const raw = user.email.split('@')[0]
  const cleaned = raw.replace(/[._\-']/g, ' ').replace(/\d+$/g, '').replace(/\bs\b$/i, '').trim()
  if (!cleaned) return raw
  const first = cleaned.split(' ')[0].toLowerCase()
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function formatTimeAgo(hours: number): string {
  if (hours < 1) return 'Just now'
  if (hours < 2) return '1 hour ago'
  if (hours < 24) return `${Math.round(hours)}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day ago' : `${days}d ago`
}

// Event type display config
const EVENT_TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  garage_sale: { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6', label: 'Garage Sale' },
  estate_sale: { bg: 'rgba(168,85,247,0.08)', color: '#A855F7', label: 'Estate Sale' },
  moving_sale: { bg: 'rgba(249,115,22,0.08)', color: '#F97316', label: 'Moving Sale' },
  flea_market: { bg: 'rgba(236,72,153,0.08)', color: '#EC4899', label: 'Flea Market' },
  auction: { bg: 'rgba(239,68,68,0.08)', color: '#EF4444', label: 'Auction' },
  community_sale: { bg: 'rgba(20,184,166,0.08)', color: '#14B8A6', label: 'Community' },
  thrift: { bg: 'rgba(132,204,22,0.08)', color: '#84CC16', label: 'Thrift' },
  event: { bg: 'rgba(99,102,241,0.08)', color: '#6366F1', label: 'Event' },
  listing: { bg: 'rgba(107,114,128,0.06)', color: '#6B7280', label: 'Listing' },
}

function getWeekendDates(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  // Saturday = 6, Sunday = 0
  const daysUntilSat = (6 - day + 7) % 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  return {
    start: sat.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  }
}

/* ── ICONS ─────────────────────────────────────────────── */
const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'var(--accent-green)' : 'none'} stroke={filled ? 'var(--accent-green)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M17 7H7M17 7v10"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const RouteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)

/* ── ROUTE PLANNER HELPERS ────────────────────────────── */
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Sort stops by nearest-neighbor from a starting point */
function sortByProximity(stops: Listing[], startLat?: number, startLng?: number): Listing[] {
  const withCoords = stops.filter(s => s.lat && s.lng)
  const noCoords = stops.filter(s => !s.lat || !s.lng)
  if (withCoords.length === 0) return stops

  // If no start point, use first stop
  let curLat = startLat || Number(withCoords[0].lat)
  let curLng = startLng || Number(withCoords[0].lng)

  const sorted: Listing[] = []
  const remaining = [...withCoords]

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMiles(curLat, curLng, Number(remaining[i].lat), Number(remaining[i].lng))
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    }
    const next = remaining.splice(nearestIdx, 1)[0]
    sorted.push(next)
    curLat = Number(next.lat)
    curLng = Number(next.lng)
  }

  return [...sorted, ...noCoords]
}

/** Build Google Maps multi-stop directions URL */
function buildGoogleMapsRouteUrl(stops: Listing[]): string {
  const waypoints = stops
    .filter(s => s.address || (s.lat && s.lng))
    .slice(0, 10) // Google Maps supports max 10 waypoints
    .map(s => {
      if (s.address) {
        const full = [s.address, s.city].filter(Boolean).join(', ')
        return encodeURIComponent(full)
      }
      return `${s.lat},${s.lng}`
    })

  if (waypoints.length === 0) return ''
  if (waypoints.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${waypoints[0]}`
  }

  // First waypoint is origin, last is destination, middle are waypoints
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const middle = waypoints.slice(1, -1).join('|')

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  if (middle) url += `&waypoints=${middle}`
  return url
}

/** Estimate total route distance */
function estimateRouteDistance(stops: Listing[]): { totalMiles: number; legs: number[] } {
  const withCoords = stops.filter(s => s.lat && s.lng)
  const legs: number[] = []
  let total = 0

  for (let i = 1; i < withCoords.length; i++) {
    const d = haversineMiles(
      Number(withCoords[i - 1].lat), Number(withCoords[i - 1].lng),
      Number(withCoords[i].lat), Number(withCoords[i].lng)
    )
    legs.push(d)
    total += d
  }

  return { totalMiles: total, legs }
}

/** Estimate drive time from miles (rough: 25mph avg for suburban driving) */
function estimateDriveMinutes(miles: number): number {
  return Math.round(miles / 25 * 60)
}

/* ── STAT CARD ─────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accentColor }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accentColor?: string
}) {
  const color = accentColor || 'var(--text-primary)'
  return (
    <div className="dash-stat" style={{
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: '14px',
      padding: '18px 18px 16px',
      flex: 1, minWidth: '130px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'var(--bg-surface)' }}>
          {icon}
        </span>
        <p style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: font, fontWeight: 600 }}>
          {label}
        </p>
      </div>
      <p style={{ color, fontSize: '28px', fontWeight: 700, fontFamily: font, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '6px', fontFamily: font }}>{sub}</p>
      )}
    </div>
  )
}

/* ── SCORE BADGE ───────────────────────────────────────── */
function ScoreBadge({ score }: { score: number | 'gated' }) {
  if (score === 'gated') {
    return (
      <div style={{
        width: '42px', height: '42px', borderRadius: '11px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    )
  }
  const isExcellent = score >= 9
  const isGood = score >= 7
  const isMid = score >= 5
  const color = isExcellent ? 'var(--score-excellent)' : isGood ? 'var(--score-good)' : isMid ? 'var(--score-average)' : 'var(--score-low)'
  const bg = isExcellent ? 'rgba(22,163,74,0.08)' : isGood ? 'rgba(217,119,6,0.06)' : 'var(--bg-surface)'
  const border = isExcellent ? 'rgba(22,163,74,0.2)' : isGood ? 'rgba(217,119,6,0.15)' : 'var(--border-default)'
  return (
    <div style={{
      width: '42px', height: '42px', borderRadius: '11px',
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono), monospace', color }}>{score}</span>
    </div>
  )
}

/* ── DATE HELPERS ─────────────────────────────────────── */
function formatEventDate(dateStr: string | null | undefined): { label: string; isToday: boolean; isTomorrow: boolean; isWeekend: boolean; dayName: string } | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  if (isNaN(d.getTime())) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (86400000))
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
  const isToday = diffDays === 0
  const isTomorrow = diffDays === 1
  const isWeekend = d.getDay() === 0 || d.getDay() === 6
  let label = ''
  if (isToday) label = 'Today'
  else if (isTomorrow) label = 'Tomorrow'
  else if (diffDays > 0 && diffDays <= 6) label = dayName
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, isToday, isTomorrow, isWeekend, dayName }
}

/* ── LISTING ROW ───────────────────────────────────────── */
function ListingRow({ listing, isSaved, onToggleSave, isPro }: {
  listing: Listing; isSaved: boolean; onToggleSave: () => void; isPro: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `${listing.title} — ${listing.price}${listing.source_url ? `\n${listing.source_url}` : '\nhttps://flip-ly.net'}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  const eventDate = formatEventDate(listing.date)
  const hasDetails = listing.description || listing.deal_reason || listing.address || (listing.tags && listing.tags.length > 0)

  return (
    <div style={{ background: '#fff' }}>
      {/* ── Main row ── */}
      <div className="dash-row" style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        cursor: 'pointer',
      }}
      onClick={(e) => {
        // If there are details, toggle expand. Otherwise open source URL.
        if (hasDetails) { setExpanded(!expanded) }
        else if (listing.source_url) { window.open(listing.source_url, '_blank') }
      }}
      >
        {/* ── Score badge with tooltip ── */}
        <div className="dash-score-tip">
          <ScoreBadge score={listing.deal_score} />
          {listing.deal_reason && typeof listing.deal_score === 'number' && (
            <div className="dash-tip-text" style={{ fontFamily: font }}>{listing.deal_reason}</div>
          )}
        </div>

        {/* ── Image thumbnail (if available) ── */}
        {listing.image_url && (
          <img
            src={listing.image_url}
            alt=""
            className="dash-img-thumb"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: badges + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            {listing.hot && (
              <span style={{ background: '#fef2f2', color: '#dc2626', padding: '1px 5px', fontSize: '9px', fontWeight: 700, borderRadius: '3px', fontFamily: font, letterSpacing: '0.04em', flexShrink: 0 }}>HOT</span>
            )}
            {listing.event_type && listing.event_type !== 'listing' && EVENT_TYPE_COLORS[listing.event_type] && (
              <span style={{
                background: EVENT_TYPE_COLORS[listing.event_type].bg,
                color: EVENT_TYPE_COLORS[listing.event_type].color,
                padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                fontFamily: font, letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {EVENT_TYPE_COLORS[listing.event_type].label}
              </span>
            )}
            <span style={{
              color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500,
              fontFamily: font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {listing.title}
            </span>
          </div>

          {/* Row 2: location + date + distance + source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {eventDate && (
              <span className="dash-date-pill" style={{
                fontFamily: font,
                background: eventDate.isToday ? 'rgba(22,163,74,0.08)' : eventDate.isTomorrow ? 'rgba(59,130,246,0.08)' : eventDate.isWeekend ? 'rgba(168,85,247,0.06)' : 'var(--bg-surface)',
                color: eventDate.isToday ? 'var(--accent-green)' : eventDate.isTomorrow ? '#3B82F6' : eventDate.isWeekend ? '#A855F7' : 'var(--text-muted)',
                border: `1px solid ${eventDate.isToday ? 'rgba(22,163,74,0.15)' : eventDate.isTomorrow ? 'rgba(59,130,246,0.12)' : eventDate.isWeekend ? 'rgba(168,85,247,0.12)' : 'var(--border-subtle)'}`,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                </svg>
                {eventDate.label}{listing.time ? ` · ${listing.time}` : ''}
              </span>
            )}
            {listing.city && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: font }}>{listing.city}</span>
            )}
            {listing.distance_miles != null && (
              <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: font, fontWeight: 600 }}>
                {listing.distance_miles < 1 ? '< 1 mi' : `${Math.round(listing.distance_miles)} mi`}
              </span>
            )}
            <span style={{
              textTransform: 'uppercase', fontSize: '8px', color: 'var(--text-muted)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              padding: '1px 5px', borderRadius: '3px', fontFamily: font, fontWeight: 600, letterSpacing: '0.06em',
            }}>{listing.source}</span>
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            className="dash-save-btn"
            onClick={(e) => { e.stopPropagation(); onToggleSave() }}
            title={isSaved ? 'Unsave' : 'Save deal'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
              color: isSaved ? 'var(--accent-green)' : 'var(--text-dim)', borderRadius: '6px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
          <button
            className="dash-action"
            onClick={handleShare}
            title={copied ? 'Copied!' : 'Share'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
              color: copied ? 'var(--accent-green)' : 'var(--text-dim)', borderRadius: '6px',
              display: 'flex', alignItems: 'center',
            }}
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <ShareIcon />
            )}
          </button>
          {listing.source_url && (
            <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="dash-action"
              onClick={e => e.stopPropagation()}
              style={{ color: 'var(--text-dim)', padding: '6px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <ExternalIcon />
            </a>
          )}
          {/* Expand chevron */}
          {hasDetails && (
            <span style={{
              color: 'var(--text-dim)', padding: '4px', display: 'flex', alignItems: 'center',
              transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          )}
        </div>

        {/* ── PRICE ── */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '52px' }}>
          <span style={{
            fontFamily: font, fontWeight: 700, fontSize: '13px',
            color: listing.price === 'FREE' ? 'var(--accent-green)' : listing.price === 'Not listed' ? 'var(--text-dim)' : 'var(--text-primary)',
          }}>
            {listing.price === 'FREE' ? 'FREE' : listing.price === 'Not listed' ? '—' : listing.price || '—'}
          </span>
        </div>
      </div>

      {/* ── Expandable detail panel ── */}
      <div className={`dash-expand ${expanded ? 'open' : ''}`}>
        <div style={{ padding: '0 16px 14px 70px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* AI Description */}
          {listing.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: font, lineHeight: 1.5, margin: 0 }}>
              {listing.description}
            </p>
          )}

          {/* Deal reason */}
          {listing.deal_reason && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: font, fontStyle: 'italic' }}>
                {listing.deal_reason}
              </span>
            </div>
          )}

          {/* Address (Pro only) */}
          {isPro && listing.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(listing.address)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: '#3B82F6', fontSize: '11px', fontFamily: font, textDecoration: 'none' }}
              >
                {listing.address} →
              </a>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {listing.tags.map(tag => (
                <span key={tag} className="dash-tag-sm" style={{ fontFamily: font }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {listing.source_url && (
              <a
                href={listing.source_url}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--accent-green)', color: '#fff',
                  fontSize: '11px', fontWeight: 600, fontFamily: font,
                  textDecoration: 'none', transition: 'opacity 0.15s',
                }}
              >
                View listing <ExternalIcon />
              </a>
            )}
            {isPro && listing.address && (
              <a
                href={`https://maps.google.com/maps/dir/?api=1&destination=${encodeURIComponent(listing.address)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                  fontSize: '11px', fontWeight: 500, fontFamily: font,
                  textDecoration: 'none', border: '1px solid var(--border-default)',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Get directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [hotDeals, setHotDeals] = useState<Listing[]>([])
  const [totalListings, setTotalListings] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchGate, setSearchGate] = useState<SearchGate | null>(null)
  const [activeTab, setActiveTab] = useState<'deals' | 'search' | 'saved' | 'route'>('deals')
  const [searchResults, setSearchResults] = useState<Listing[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [meta, setMeta] = useState<any>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set())
  const [filterLoading, setFilterLoading] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [markets, setMarkets] = useState<MarketOption[]>([])
  const [showMarketPicker, setShowMarketPicker] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [activeMarketSlug, setActiveMarketSlug] = useState<string>('')
  const marketRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2000)
  }

  // Derived tier helpers — handles is_premium + subscription_tier correctly
  const isPremium = user ? (user.is_premium === true || ['pro', 'power', 'admin'].includes(user.subscription_tier as string)) : false
  const tierLabel = user?.subscription_tier === 'admin' ? 'Admin' : user?.subscription_tier === 'power' ? 'Power' : isPremium ? 'Pro' : 'Free'

  // ── Load user ──
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(async (data) => {
        let u = data.user
        if (u && !u.market_id) {
          try {
            const res = await fetch('/api/auth/assign-market', { method: 'POST' })
            const geo = await res.json()
            if (geo.assigned) u = { ...u, market_id: geo.market_id, city: geo.city, state: geo.state }
          } catch {}
        }
        setUser(u)
        if (u?.market_slug) setActiveMarketSlug(u.market_slug)
        setLoading(false)
      })
      .catch(() => { setLoading(false); window.location.href = '/' })
  }, [])

  // ── Load listings + saved deals ──
  useEffect(() => {
    if (!user || !activeMarketSlug) return

    const mkt = encodeURIComponent(activeMarketSlug)

    // Hot deals — filtered to user's market
    fetch(`/api/listings?hot=true&limit=10&market=${mkt}`)
      .then(r => r.json())
      .then(data => {
        if (data.results) setHotDeals(data.results)
        if (data._meta) setMeta(data._meta)
      }).catch(() => {})

    // All listings — filtered to user's market
    fetch(`/api/listings?limit=30&market=${mkt}`)
      .then(r => r.json())
      .then(data => {
        if (data.results) setListings(data.results)
        if (data.total) setTotalListings(data.total)
        if (data._gate) setSearchGate(data._gate)
      }).catch(() => {})

    // Saved deals
    fetch('/api/saved-deals')
      .then(r => r.json())
      .then(data => {
        if (data.saved) {
          setSavedIds(new Set(data.saved.map((s: any) => s.listing_id)))
        }
      }).catch(() => {})

    // Markets (for Pro switcher)
    if (isPremium) {
      fetch('/api/markets')
        .then(r => r.json())
        .then(data => {
          if (data.markets) {
            const flat: MarketOption[] = []
            Object.values(data.markets).forEach((arr: any) => arr.forEach((m: any) => flat.push(m)))
            setMarkets(flat)
          }
        }).catch(() => {})
    }
  }, [user, activeMarketSlug])

  // ── Close market picker on click outside ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) setShowMarketPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Toggle save ──
  const toggleSave = useCallback(async (listingId: string) => {
    const wasSaved = savedIds.has(listingId)
    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev)
      if (wasSaved) next.delete(listingId)
      else next.add(listingId)
      return next
    })

    try {
      if (wasSaved) {
        await fetch(`/api/saved-deals?listing_id=${listingId}`, { method: 'DELETE' })
        setSavedListings(prev => prev.filter(l => l.id !== listingId))
        showToast('Removed from saved')
      } else {
        await fetch('/api/saved-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: listingId }),
        })
        showToast('Deal saved')
      }
    } catch {
      // Revert on failure
      setSavedIds(prev => {
        const next = new Set(prev)
        if (wasSaved) next.add(listingId)
        else next.delete(listingId)
        return next
      })
    }
  }, [savedIds])

  // ── Build filter params (shared by search + browse) ──
  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams()
    if (activeMarketSlug) params.set('market', activeMarketSlug)
    if (eventTypeFilter !== 'all') params.set('event_type', eventTypeFilter)
    if (quickFilters.has('hot')) params.set('min_score', '7')
    if (quickFilters.has('weekend')) {
      const { start, end } = getWeekendDates()
      params.set('date_start', start)
      params.set('date_end', end)
    }
    if (quickFilters.has('nearby') && userLocation) {
      params.set('lat', String(userLocation.lat))
      params.set('lng', String(userLocation.lng))
      params.set('radius', '25')
    }
    return params
  }, [eventTypeFilter, quickFilters, activeMarketSlug])

  // ── Search ──
  const handleSearch = useCallback(async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault()
    const q = query ?? searchQuery
    if (!q.trim()) return
    setSearching(true)
    try {
      const params = buildFilterParams()
      params.set('q', q)
      params.set('limit', '20')
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (data._gate?.limited) { setSearchGate(data._gate); setSearchResults([]); return }
      setSearchResults(data.results || [])
      setSearchTotal(data.total || 0)
      if (data._gate) setSearchGate(data._gate)
      setActiveTab('search')
    } catch {} finally { setSearching(false) }
  }, [searchQuery, buildFilterParams])

  // ── Filtered browse (fires when event type or quick filters change) ──
  const fetchFilteredListings = useCallback(async () => {
    if (!user) return
    const hasFilters = eventTypeFilter !== 'all' || quickFilters.size > 0
    if (!hasFilters) return // Default browse handles no-filter state
    setFilterLoading(true)
    try {
      const params = buildFilterParams()
      params.set('limit', '30')
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (data.results) setListings(data.results)
      if (data.total) setTotalListings(data.total)
      if (data._gate) setSearchGate(data._gate)
    } catch {} finally { setFilterLoading(false) }
  }, [user, eventTypeFilter, quickFilters, buildFilterParams])

  // Trigger filtered fetch when filters change
  useEffect(() => {
    const hasFilters = eventTypeFilter !== 'all' || quickFilters.size > 0
    if (hasFilters && user) {
      fetchFilteredListings()
      setActiveTab('deals')
    } else if (user && !hasFilters && activeMarketSlug) {
      // Reset to default browse — filtered to user's market
      const mkt = encodeURIComponent(activeMarketSlug)
      fetch(`/api/listings?limit=30&market=${mkt}`)
        .then(r => r.json())
        .then(data => {
          if (data.results) setListings(data.results)
          if (data.total) setTotalListings(data.total)
        }).catch(() => {})
    }
  }, [eventTypeFilter, quickFilters, user, activeMarketSlug])

  // ── Geolocation for "Near Me" ──
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const requestLocation = useCallback(() => {
    if (userLocation) return // Already have it
    if (!navigator.geolocation) { showToast('Location not supported'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => showToast('Location access denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [userLocation])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-default)', borderTop: '2px solid var(--accent-green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: font, fontWeight: 500 }}>Loading dashboard...</p>
        </div>
        <style>{DASH_CSS}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontFamily: font, marginBottom: '16px' }}>Sign in to continue.</p>
          <a href="/" style={{ color: 'var(--accent-green)', fontSize: '14px', fontFamily: font, fontWeight: 500 }}>&larr; flip-ly.net</a>
        </div>
      </div>
    )
  }

  const displayName = formatDisplayName(user)
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const dow = new Date().getDay()
  const daysUntilThursday = (4 - dow + 7) % 7 || 7
  const nextDigest = daysUntilThursday === 0 ? 'Today' : daysUntilThursday === 1 ? 'Tomorrow' : `${daysUntilThursday} days`
  const nextDigestSub = daysUntilThursday === 0 ? 'Check your inbox' : 'Thursday 12 PM CDT'
  const dataAge = meta?.age_hours != null ? formatTimeAgo(meta.age_hours) : ''
  const cityAlreadyHasState = user.city && user.state && user.city.toLowerCase().includes(user.state.toLowerCase().replace(/\.$/, ''))
  const marketLabel = cityAlreadyHasState ? user.city : (user.city && user.state ? `${user.city}, ${user.state}` : user.city || 'your area')

  // ── Build display listings (API-driven filtering) ──
  let displayListings: Listing[]
  if (activeTab === 'search') {
    displayListings = searchResults
  } else if (activeTab === 'saved') {
    displayListings = [...hotDeals, ...listings].filter(l => savedIds.has(l.id))
    const seen = new Set<string>()
    displayListings = displayListings.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })
  } else {
    // Filters are applied API-side now; just show what came back
    const hasFilters = eventTypeFilter !== 'all' || quickFilters.size > 0
    displayListings = hasFilters ? listings : (hotDeals.length > 0 ? hotDeals : listings)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style>{DASH_CSS}</style>

      {/* ═══ TOAST ═══ */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-primary)', color: '#fff', padding: '10px 20px',
          borderRadius: '10px', fontSize: '13px', fontFamily: font, fontWeight: 500,
          zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: '0 max(20px, calc((100% - 960px) / 2))',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky', top: 0, zIndex: 80,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#16a34a"/>
                <path d="M7 8h10M7 12h7M7 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, fontFamily: font, letterSpacing: '-0.03em' }}>flip-ly</span>
            </a>
            <span style={{ color: 'var(--border-default)', fontSize: '14px' }}>/</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: font, fontWeight: 500 }}>Dashboard</span>
            {isPremium && (
              <span style={{ background: tierLabel === 'Power' ? '#7C3AED' : tierLabel === 'Admin' ? '#DC2626' : 'var(--accent-green)', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, fontFamily: font, letterSpacing: '0.06em' }}>{tierLabel.toUpperCase()}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* ── Market switcher (Pro) ── */}
            <div ref={marketRef} style={{ position: 'relative' }}>
              <button
                onClick={() => isPremium && markets.length > 0 ? setShowMarketPicker(!showMarketPicker) : null}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
                  cursor: isPremium ? 'pointer' : 'default', padding: '4px 8px', borderRadius: '6px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (isPremium) e.currentTarget.style.background = 'var(--bg-surface)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: font, fontWeight: 500 }}>{marketLabel}</span>
                {isPremium && markets.length > 0 && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </button>
              {showMarketPicker && (
                <div className="dash-dropdown" style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: '#fff', border: '1px solid var(--border-default)',
                  borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  padding: '6px', minWidth: '200px', maxHeight: '280px', overflowY: 'auto',
                  zIndex: 90,
                }}>
                  {markets.map(m => (
                    <button key={m.id} onClick={() => { setShowMarketPicker(false); setActiveMarketSlug(m.slug); setUser(prev => prev ? { ...prev, city: m.name, market_id: m.id } : prev); showToast(`Switched to ${m.name}`) }}
                      style={{
                        display: 'block', width: '100%', padding: '8px 12px', border: 'none',
                        background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '6px',
                        fontSize: '13px', fontFamily: font, color: 'var(--text-primary)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                    >
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      {m.listing_count && (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginLeft: '8px' }}>{m.listing_count} deals</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="dash-btn-outline" style={{
              background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '7px',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 12px', fontSize: '11px',
              fontFamily: font, fontWeight: 500, transition: 'all 0.15s',
            }}>Sign Out</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* ═══ WELCOME ═══ */}
        <div className="dash-fade" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: font, letterSpacing: '-0.04em', marginBottom: '4px' }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: font, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
                Scanning {marketLabel} for deals{dataAge ? ` · Updated ${dataAge}` : ''}
              </p>
            </div>
            {!isPremium && (
              <a href="/pro" className="dash-btn" style={{
                background: 'var(--accent-green)', color: '#fff', padding: '9px 20px',
                borderRadius: '9px', fontSize: '12px', fontWeight: 600, fontFamily: font,
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>Upgrade to Pro</a>
            )}
          </div>
        </div>

        {/* ═══ STATS ROW ═══ */}
        <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div className="dash-fade dash-fade-d1">
            <StatCard
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
              label="Total Deals"
              value={totalListings > 0 ? totalListings.toLocaleString() : '—'}
              sub="in your market"
              accentColor="#3B82F6"
            />
          </div>
          <div className="dash-fade dash-fade-d2">
            <StatCard
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
              label="Hot Deals"
              value={hotDeals.length > 0 ? String(hotDeals.length) : '—'}
              sub="scored 8+"
              accentColor="var(--accent-green)"
            />
          </div>
          <div className="dash-fade dash-fade-d3">
            <StatCard
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              label="Next Digest"
              value={nextDigest}
              sub={nextDigestSub}
              accentColor="#A855F7"
            />
          </div>
          <div className="dash-fade dash-fade-d4">
            <StatCard
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={searchGate?.is_premium ? 'var(--accent-green)' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
              label="Searches"
              value={searchGate?.is_premium ? '∞' : (searchGate?.searches_remaining != null ? `${searchGate.searches_remaining}` : '10')}
              sub={searchGate?.is_premium ? 'unlimited' : (searchGate ? `of ${searchGate.searches_max} today` : '')}
              accentColor={searchGate?.is_premium ? 'var(--accent-green)' : '#F59E0B'}
            />
          </div>
        </div>

        {/* ═══ SEARCH BAR ═══ */}
        <div className="dash-fade" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleSearch}>
            <div className="dash-search" style={{
              background: '#fff', border: '1px solid var(--border-default)',
              borderRadius: '12px', padding: '3px', display: 'flex', gap: '3px',
              transition: 'all 0.2s',
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search deals — tools, vintage, furniture, electronics..."
                  style={{
                    width: '100%', padding: '12px 0', border: 'none', outline: 'none',
                    fontFamily: font, fontSize: '13px', color: 'var(--text-primary)', background: 'transparent',
                  }}
                />
              </div>
              <button type="submit" disabled={searching} style={{
                padding: '10px 24px',
                background: searching ? 'var(--bg-surface)' : 'var(--accent-green)',
                color: searching ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '9px',
                fontFamily: font, fontWeight: 600, fontSize: '12px',
                cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* ═══ EVENT TYPE CHIPS ═══ */}
        <div className="dash-fade" style={{ marginBottom: '8px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {EVENT_TYPES.map(et => (
            <button
              key={et.key}
              className={`dash-tag ${eventTypeFilter === et.key ? 'dash-tag-active' : ''}`}
              onClick={() => { setEventTypeFilter(et.key); setActiveTab('deals') }}
              style={{
                padding: '6px 14px',
                border: '1px solid var(--border-default)', borderRadius: '20px',
                fontFamily: font, fontSize: '12px', fontWeight: 500,
                color: eventTypeFilter === et.key ? '#fff' : 'var(--text-muted)',
                background: eventTypeFilter === et.key ? 'var(--accent-green)' : 'transparent',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <span style={{ fontSize: '13px' }}>{et.icon}</span> {et.label}
            </button>
          ))}
        </div>

        {/* ═══ QUICK FILTER CHIPS ═══ */}
        <div className="dash-fade" style={{ marginBottom: '20px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: font, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Quick:</span>
          {QUICK_FILTERS.map(qf => {
            const isActive = quickFilters.has(qf.key)
            return (
              <button
                key={qf.key}
                className={`dash-tag ${isActive ? 'dash-tag-active' : ''}`}
                onClick={() => {
                  if (qf.key === 'nearby' && !isActive) requestLocation()
                  setQuickFilters(prev => {
                    const next = new Set(prev)
                    if (isActive) next.delete(qf.key)
                    else next.add(qf.key)
                    return next
                  })
                  setActiveTab('deals')
                }}
                style={{
                  padding: '5px 12px',
                  border: `1px solid ${isActive ? 'var(--accent-green)' : 'var(--border-default)'}`,
                  borderRadius: '16px',
                  fontFamily: font, fontSize: '11px', fontWeight: 500,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent-green)' : 'transparent',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                {qf.label}
              </button>
            )
          })}
          {filterLoading && (
            <div style={{ width: '14px', height: '14px', border: '2px solid var(--border-default)', borderTop: '2px solid var(--accent-green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          )}
        </div>

        {/* ═══ RATE LIMIT ═══ */}
        {searchGate?.limited && (
          <div style={{
            marginBottom: '20px', background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)',
            borderRadius: '12px', padding: '18px 20px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, fontFamily: font, marginBottom: '4px' }}>Daily search limit reached</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: font, marginBottom: '14px' }}>Free accounts get {searchGate.searches_max} searches per day.</p>
            <a href="/pro" style={{ display: 'inline-block', padding: '9px 22px', background: 'var(--accent-green)', color: '#fff', borderRadius: '9px', fontWeight: 600, fontSize: '12px', textDecoration: 'none', fontFamily: font }}>Upgrade to Pro</a>
          </div>
        )}

        {/* ═══ TAB SWITCHER ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          {[
            { key: 'deals' as const, label: 'Hot Deals', show: true },
            { key: 'saved' as const, label: `Saved (${savedIds.size})`, show: savedIds.size > 0 },
            { key: 'route' as const, label: `Plan Weekend`, show: savedIds.size >= 2 },
            { key: 'search' as const, label: `Results (${searchTotal})`, show: searchResults.length > 0 },
          ].filter(t => t.show).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 16px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: font, fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1, borderBottom: '1px solid var(--border-subtle)' }} />
          {activeTab === 'deals' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--score-excellent)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: font }}>Score = deal quality</span>
            </div>
          )}
        </div>

        {/* ═══ ROUTE PLANNER ═══ */}
        {activeTab === 'route' && (() => {
          // Build sorted route from saved deals
          const allDeals = [...hotDeals, ...listings]
          const savedDeals = allDeals.filter(l => savedIds.has(l.id))
          const seen = new Set<string>()
          const uniqueSaved = savedDeals.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })

          const routeStops = sortByProximity(uniqueSaved, userLocation?.lat, userLocation?.lng)
          const stopsWithCoords = routeStops.filter(s => s.lat && s.lng)
          const { totalMiles, legs } = estimateRouteDistance(routeStops)
          const totalMinutes = estimateDriveMinutes(totalMiles)
          const mapsUrl = buildGoogleMapsRouteUrl(routeStops)

          // Pro gating: free users see first 2 stops
          const FREE_STOP_LIMIT = 2
          const isPro = isPremium
          const visibleStops = isPro ? routeStops : routeStops.slice(0, FREE_STOP_LIMIT)
          const gatedStops = isPro ? [] : routeStops.slice(FREE_STOP_LIMIT)

          return (
            <div style={{ marginBottom: '32px' }}>
              {/* Route header card */}
              <div style={{
                background: '#fff', borderRadius: '14px',
                border: '1px solid var(--border-subtle)', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                marginBottom: '12px',
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <RouteIcon />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: font, margin: 0 }}>
                          Weekend Route
                        </h3>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: font, margin: 0 }}>
                        {stopsWithCoords.length} stop{stopsWithCoords.length !== 1 ? 's' : ''} with directions
                        {routeStops.length > stopsWithCoords.length && ` · ${routeStops.length - stopsWithCoords.length} without coordinates`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {isPro ? (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: font, margin: 0 }}>
                              {totalMiles.toFixed(1)}
                            </p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>miles</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: font, margin: 0 }}>
                              {totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
                            </p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>est. drive</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dim)', fontFamily: font, margin: 0 }}>🔒</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: font }}>miles</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dim)', fontFamily: font, margin: 0 }}>🔒</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: font }}>drive time</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Route stops */}
                {routeStops.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: font }}>
                      Save at least 2 deals to plan a route.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Visible stops */}
                    {visibleStops.map((stop, i) => {
                      const legDist = i > 0 && legs[i - 1] !== undefined ? legs[i - 1] : null
                      const typeConfig = EVENT_TYPE_COLORS[stop.event_type || ''] || EVENT_TYPE_COLORS.listing
                      return (
                        <div key={stop.id}>
                          {/* Leg connector */}
                          {i > 0 && isPro && legDist !== null && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '4px 20px 4px 32px',
                              color: 'var(--text-dim)', fontSize: '10px', fontFamily: font,
                            }}>
                              <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', marginLeft: '8px' }} />
                              <span>{legDist.toFixed(1)} mi &middot; ~{estimateDriveMinutes(legDist)} min</span>
                            </div>
                          )}
                          <div className="dash-row" style={{
                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                            padding: '14px 20px',
                            borderBottom: (i < visibleStops.length - 1 || gatedStops.length > 0) ? '1px solid var(--border-subtle)' : 'none',
                          }}>
                            {/* Stop number */}
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              background: 'var(--accent-green)', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700, fontFamily: font,
                            }}>
                              {i + 1}
                            </div>

                            {/* Stop info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                {stop.event_type && (
                                  <span style={{
                                    padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                                    background: typeConfig.bg, color: typeConfig.color,
                                  }}>
                                    {typeConfig.label}
                                  </span>
                                )}
                                {stop.deal_score && stop.deal_score !== 'gated' && (
                                  <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                                    color: (stop.deal_score as number) >= 7 ? 'var(--score-good)' : 'var(--text-muted)',
                                    background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px',
                                  }}>
                                    {stop.deal_score}/10
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: font, margin: '0 0 3px', lineHeight: 1.3 }}>
                                {stop.source_url ? (
                                  <a href={stop.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{stop.title}</a>
                                ) : stop.title}
                              </p>
                              {stop.address && isPro && (
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: font, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPinIcon /> {stop.address}{stop.city ? `, ${stop.city}` : ''}
                                </p>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                {stop.date && (
                                  <span className="dash-date-pill" style={{
                                    background: 'var(--bg-surface)', color: 'var(--text-muted)',
                                    border: '1px solid var(--border-subtle)',
                                  }}>
                                    {new Date(stop.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    {stop.time ? ` · ${stop.time}` : ''}
                                  </span>
                                )}
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: stop.price === 'FREE' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                                  {stop.price === 'FREE' ? 'FREE' : stop.price === 'Not listed' ? '' : stop.price}
                                </span>
                              </div>
                            </div>

                            {/* Directions button (Pro) */}
                            {isPro && stop.address && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([stop.address, stop.city].filter(Boolean).join(', '))}`}
                                target="_blank" rel="noopener noreferrer"
                                className="dash-btn"
                                style={{
                                  padding: '6px 10px', background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-subtle)', borderRadius: '7px',
                                  color: 'var(--text-muted)', fontSize: '11px', fontFamily: font, fontWeight: 500,
                                  textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                              >
                                <MapPinIcon /> Go
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Gated stops (free users) */}
                    {gatedStops.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        {/* Blurred preview of next 2 stops */}
                        {gatedStops.slice(0, 2).map((stop, i) => (
                          <div key={stop.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-subtle)',
                            filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none',
                          }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              background: 'var(--border-default)', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700, fontFamily: font,
                            }}>
                              {FREE_STOP_LIMIT + i + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: font, margin: 0 }}>{stop.title}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: font, margin: '2px 0 0' }}>{stop.city || 'Address hidden'}</p>
                            </div>
                          </div>
                        ))}
                        {/* Upgrade overlay */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.7)',
                        }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: font, margin: '0 0 4px' }}>
                            +{gatedStops.length} more stops
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: font, margin: '0 0 12px' }}>
                            Upgrade for full route, directions, and drive times
                          </p>
                          <a href="/pro" className="dash-btn" style={{
                            padding: '9px 22px', background: 'var(--accent-green)', color: '#fff',
                            borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: font,
                          }}>
                            Go Pro — $5/mo
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Open in Google Maps button */}
              {stopsWithCoords.length >= 2 && (
                <div style={{ textAlign: 'center' }}>
                  {isPro ? (
                    <a
                      href={mapsUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="dash-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '13px 28px', background: 'var(--accent-green)', color: '#fff',
                        borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: font,
                        boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Open Route in Google Maps
                    </a>
                  ) : (
                    <a
                      href="/pro"
                      className="dash-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '13px 28px', background: 'var(--accent-green)', color: '#fff',
                        borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: font,
                        boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Upgrade to Open in Google Maps
                    </a>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: font, marginTop: '8px' }}>
                    {isPro
                      ? `${stopsWithCoords.length} stops · ${totalMiles.toFixed(1)} miles · ~${totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} driving`
                      : 'Pro members get full route with turn-by-turn directions'
                    }
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* ═══ LISTINGS FEED ═══ */}
        {activeTab !== 'route' && <div style={{ marginBottom: '32px' }}>
          <div style={{
            background: '#fff', borderRadius: '14px',
            border: '1px solid var(--border-subtle)', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            {displayListings.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
                  {activeTab === 'saved' ? (
                    <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></>
                  ) : (
                    <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>
                  )}
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: font }}>
                  {activeTab === 'saved' ? 'No saved deals yet. Tap the bookmark icon to save deals.' :
                   activeTab === 'search' ? 'No results found. Try a different search.' :
                   (eventTypeFilter !== 'all' || quickFilters.size > 0) ? 'No deals match these filters. Try adjusting.' :
                   hotDeals.length === 0 && !loading ? 'No 8+ deals right now. We check every 4 hours — check back soon.' :
                   'Scanning for deals...'}
                </p>
              </div>
            ) : displayListings.map((listing, i) => (
              <div key={listing.id || i} style={{ borderBottom: i < displayListings.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <ListingRow
                  listing={listing}
                  isSaved={savedIds.has(listing.id)}
                  onToggleSave={() => toggleSave(listing.id)}
                  isPro={isPremium}
                />
              </div>
            ))}
          </div>

          {activeTab === 'deals' && totalListings > displayListings.length && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: font }}>
                {totalListings - displayListings.length} more deals available
                {!isPremium && (
                  <> &middot; <a href="/pro" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>Unlock all</a></>
                )}
              </p>
            </div>
          )}
        </div>}

        {/* ═══ BOTTOM CARDS ═══ */}
        <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {/* Digest card */}
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(22,163,74,0.3)', animation: 'pulse 2s ease-in-out infinite' }} />
              <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, fontFamily: font }}>Weekly Digest</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: font, marginBottom: '3px' }}>Scanning {marketLabel}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: font, marginBottom: '12px' }}>Delivered every Thursday at 12:00 PM CDT</p>
            {isPremium ? (
              <div style={{ background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.1)', borderRadius: '8px', padding: '8px 12px' }}>
                <p style={{ color: 'var(--accent-green)', fontSize: '11px', fontFamily: font, fontWeight: 500 }}>Your digest arrives 6 hours before free users.</p>
              </div>
            ) : (
              <a href="/pro" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontSize: '12px', textDecoration: 'none', fontFamily: font, fontWeight: 500 }}>
                Get your digest 6 hours early &rarr;
              </a>
            )}
          </div>

          {/* Account card */}
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, fontFamily: font, marginBottom: '12px' }}>Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: font }}>
              {[
                { l: 'Email', v: user.email },
                { l: 'Market', v: marketLabel },
                { l: 'Plan', v: tierLabel, accent: isPremium },
                { l: 'Saved deals', v: String(savedIds.size) },
                { l: 'Member since', v: joinDate },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.l}</span>
                  <span style={{ color: row.accent ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: row.accent ? 600 : 400 }}>{row.v}</span>
                </div>
              ))}
            </div>
            {isPremium && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <a href="/pro" style={{ color: 'var(--text-muted)', fontSize: '11px', textDecoration: 'none', fontFamily: font, fontWeight: 500 }}>Manage subscription &rarr;</a>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SHARE BAR ═══ */}
        <div style={{
          marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: font }}>Know someone who flips?</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText('Check out flip-ly.net — scans 20+ sources, sends AI-scored deals weekly.\n\nhttps://flip-ly.net')
                .then(() => showToast('Invite link copied!'))
                .catch(() => showToast('Could not copy'))
            }}
            className="dash-btn-outline"
            style={{
              background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: '7px', padding: '6px 14px', color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: '11px', fontFamily: font, fontWeight: 500, transition: 'all 0.15s',
            }}
          >Copy invite link</button>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
          <a href="/" style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: font, textDecoration: 'none', fontWeight: 500 }}>&larr; flip-ly.net</a>
        </div>
      </main>
    </div>
  )
}
