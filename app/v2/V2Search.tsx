'use client'

import { useState, useMemo } from 'react'
import { Search, Home, Landmark, Tent, Package, Hammer, Gift } from 'lucide-react'

function scoreClasses(s: number) {
  if (s >= 9) return { text: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-400/20' }
  if (s >= 7) return { text: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' }
  if (s >= 5) return { text: 'text-white/50', bg: 'bg-white/[0.05] border-white/10' }
  return { text: 'text-white/30', bg: 'bg-white/[0.03] border-white/[0.08]' }
}

function DealCard({ deal, i, expanded, setExpanded }: {
  deal: any; i: number; expanded: number | null; setExpanded: (v: number | null) => void
}) {
  const hasScore = deal.deal_score && deal.deal_score !== 'gated'
  const hasReason = !!deal.deal_reason
  const sc = hasScore ? scoreClasses(deal.deal_score) : null
  const eventLabel = deal.event_type && deal.event_type !== 'listing'
    ? (deal.event_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null
  const isExpanded = expanded === i

  return (
    <div>
      <div
        className={`flex items-center gap-3 py-3 border-b border-white/[0.06] ${hasReason ? 'cursor-pointer hover:bg-white/[0.02]' : ''} px-2 -mx-2 rounded transition-colors`}
        onClick={() => hasReason && setExpanded(isExpanded ? null : i)}
      >
        {hasScore && sc && (
          <div className={`w-9 h-9 rounded-lg shrink-0 border flex items-center justify-center ${sc.bg}`}>
            <span className={`font-mono text-sm font-bold ${sc.text}`}>{deal.deal_score}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {eventLabel && (
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-px shrink-0">
                {eventLabel}
              </span>
            )}
            <span className="text-sm font-medium text-white truncate">{deal.title}</span>
          </div>
          {deal.city && (
            <span className="text-xs text-white/25 mt-0.5 block">
              {deal.city}{deal.date ? ` \u00b7 ${deal.date}` : ''}
            </span>
          )}
        </div>
        {deal.price && deal.price !== 'Not listed' && (
          <span className="font-mono text-sm font-bold text-white shrink-0">{deal.price}</span>
        )}
        {hasReason && (
          <svg
            className={`w-4 h-4 text-white/20 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      {isExpanded && hasReason && (
        <div className="px-2 -mx-2 pb-3 border-b border-white/[0.06]">
          <div className="ml-12 mt-1">
            <p className="text-xs text-white/40 leading-relaxed">
              <span className="text-lime-400/70 font-semibold">AI insight:</span>{' '}
              {deal.deal_reason}
            </p>
            {deal.tags?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {deal.tags.slice(0, 5).map((tag: string) => (
                  <span key={tag} className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function V2Search({ markets }: {
  markets: Record<string, { id: string; slug: string; name: string }[]>
}) {
  const [query, setQuery] = useState('')
  const [market, setMarket] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const marketOptions = useMemo(() => {
    return Object.keys(markets).sort().flatMap(st =>
      (markets[st] || []).map(m => ({ key: m.id, value: m.slug, label: `${m.name}, ${st}` }))
    )
  }, [markets])

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault()
    const q = overrideQuery ?? query
    setSearching(true)
    setError('')
    setExpanded(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (market) params.set('market', market)
      params.set('limit', '20')
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (data._gate?.limited) {
        setResults([])
        setTotal(0)
        setShowResults(false)
        return
      }
      setResults(data.results || [])
      setTotal(data.total || 0)
      setShowResults(true)
    } catch {
      setResults([])
      setTotal(0)
      setShowResults(true)
      setError('Something went wrong.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSearch}>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 mb-3">
            <Search size={18} className="text-white/30 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tools, vintage, furniture..."
              aria-label="Search deals"
              autoComplete="off"
              className="w-full bg-transparent text-white text-lg outline-none placeholder:text-white/20"
            />
          </div>
          <div className="flex gap-2.5">
            <select
              value={market}
              onChange={e => setMarket(e.target.value)}
              aria-label="Select market area"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/60 cursor-pointer outline-none focus:border-lime-500/30"
            >
              <option value="">All areas</option>
              {marketOptions.map(m => (
                <option key={m.key} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={searching}
              className="px-8 py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Garage Sales', q: 'garage sale', Icon: Home },
            { label: 'Estate Sales', q: 'estate sale', Icon: Landmark },
            { label: 'Flea Markets', q: 'flea market', Icon: Tent },
            { label: 'Moving Sales', q: 'moving sale', Icon: Package },
            { label: 'Auctions', q: 'auction', Icon: Hammer },
            { label: 'Free Items', q: 'free', Icon: Gift },
          ].map(tag => (
            <button
              key={tag.q}
              type="button"
              onClick={() => { setQuery(tag.q); handleSearch(undefined, tag.q) }}
              className="px-3.5 py-1.5 border border-white/[0.08] rounded-full text-xs text-white/35 hover:text-lime-400 hover:border-lime-500/30 transition-all shrink-0 flex items-center gap-1.5 font-medium"
            >
              <tag.Icon size={12} strokeWidth={2} aria-hidden="true" />
              {tag.label}
            </button>
          ))}
        </div>
      </form>

      {/* Search results */}
      {showResults && (
        <div className="mt-8">
          {error ? (
            <p className="text-red-400 text-sm text-center py-6">{error}</p>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-white/50 font-medium mb-1">
                No deals found{query ? ` for "${query}"` : ''}
              </p>
              <p className="text-xs text-white/25">Try a different search term or select a broader area.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/25 font-mono mb-3">
                {total} results{query ? ` for "${query}"` : ''}
              </p>
              {results.map((deal, i) => (
                <DealCard key={deal.id || i} deal={deal} i={i} expanded={expanded} setExpanded={setExpanded} />
              ))}
            </>
          )}
        </div>
      )}
    </>
  )
}
