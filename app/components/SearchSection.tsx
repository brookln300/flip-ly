'use client'

import { useState, useEffect, useMemo } from 'react'
import { Home, Landmark, Tent, Package, Hammer, Gift } from 'lucide-react'
import DealRow from './DealRow'
import { useSignup } from './SignupContext'

export default function SearchSection({ markets }: {
  markets: Record<string, { id: string; slug: string; name: string }[]>
}) {
  const { openSignup } = useSignup()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMarket, setSearchMarket] = useState('')
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [realListings, setRealListings] = useState<any[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [searchError, setSearchError] = useState('')
  const [searchGate, setSearchGate] = useState<any>(null)
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const popularSearches = [
    'furniture', 'vintage', 'tools', 'electronics', 'kitchen',
    'garage sale', 'estate sale', 'free items', 'antique',
    'appliances', 'collectibles', 'power tools', 'vinyl records',
    'mid century', 'jewelry', 'bikes', 'kids toys', 'books',
  ]

  // Debounced suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase()
      const matches = popularSearches.filter(s => s.includes(q) && s !== q).slice(0, 5)
      setSuggestions(matches)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Check auth once for deal row gating
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setLoggedInUser(data.user) })
      .catch(() => {})
  }, [])

  const sortedMarketOptions = useMemo(() => {
    return Object.keys(markets).sort().flatMap(st =>
      (markets[st] || []).map(m => ({ key: m.id, value: m.slug, label: `${m.name}, ${st}` }))
    )
  }, [markets])

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

  return (
    <>
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
            <a href="/pro" style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Go unlimited</a>
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

      {/* Search form — full width, grows with viewport */}
      <div style={{ width: '100%', padding: 'var(--space-10) var(--space-4) 0', background: 'linear-gradient(180deg, #fffbf5 0%, var(--bg-primary) 100%)' }}>
        <div id="search" style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Try it — search your area for free
          </p>
          <form onSubmit={handleSearch}>
            <div style={{
              background: '#fffdf9', border: '1px solid var(--border-default)',
              borderRadius: '16px', padding: '20px 24px',
              boxShadow: '0 4px 24px rgba(160,120,60,0.08), 0 0 0 1px rgba(180,140,80,0.06)',
              transition: 'box-shadow 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text" value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search tools, vintage, furniture..."
                    aria-label="Search deals"
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '10px 0', border: 'none', outline: 'none',
                      fontSize: '18px', color: 'var(--text-primary)', background: 'transparent',
                    }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: '-32px', right: '-24px',
                      background: '#fff', border: '1px solid var(--border-default)',
                      borderRadius: '12px', marginTop: '8px', padding: '4px 0',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.10)', zIndex: 50,
                    }}>
                      {suggestions.map(s => (
                        <button key={s} type="button"
                          onMouseDown={() => { setSearchQuery(s); setShowSuggestions(false); handleSearch(undefined, s) }}
                          style={{
                            display: 'block', width: '100%', padding: '10px 20px', border: 'none',
                            background: 'transparent', textAlign: 'left', cursor: 'pointer',
                            fontSize: '15px', color: 'var(--text-secondary)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={searchMarket} onChange={e => setSearchMarket(e.target.value)} aria-label="Select market area" style={{
                  flex: 1, padding: '12px 14px', border: '1px solid var(--border-default)', borderRadius: '10px',
                  fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer',
                }}>
                  <option value="">All areas</option>
                  {sortedMarketOptions.map(m => (
                    <option key={m.key} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <button type="submit" disabled={searching} style={{
                  padding: '12px 32px',
                  background: searching ? 'var(--border-active)' : 'var(--accent-green)',
                  color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '15px',
                  cursor: searching ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                }}>
                  {searching ? '...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { label: 'Garage Sales', q: 'garage sale', icon: Home },
                { label: 'Estate Sales', q: 'estate sale', icon: Landmark },
                { label: 'Flea Markets', q: 'flea market', icon: Tent },
                { label: 'Moving Sales', q: 'moving sale', icon: Package },
                { label: 'Auctions', q: 'auction', icon: Hammer },
                { label: 'Free Items', q: 'free', icon: Gift },
              ].map(tag => (
                <button key={tag.q} type="button" onClick={() => { setSearchQuery(tag.q); handleSearch(undefined, tag.q) }} style={{
                  padding: '6px 16px', border: '1px solid var(--border-subtle)', borderRadius: '20px',
                  fontSize: '13px', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.15s', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.4)'; e.currentTarget.style.color = 'var(--accent-green)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <tag.icon size={13} strokeWidth={2} aria-hidden="true" />
                  {tag.label}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Search results */}
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
                  <DealRow deal={listing} i={i} showExpand={i < 5} expandedDeal={expandedDeal} setExpandedDeal={setExpandedDeal} loggedInUser={loggedInUser} />
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
                          Free members see all scores + source links on top 3 deals
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          Plus: direct links, full AI analysis, and weekly digest.
                        </p>
                      </div>
                      <button onClick={openSignup} style={{
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
              {!loggedInUser && realListings.length > 0 && (
                <div style={{ padding: 'var(--space-5) 0', textAlign: 'center' }}>
                  {totalResults > realListings.length ? (
                    <button onClick={openSignup} style={{
                      padding: '10px 24px', background: 'var(--accent-green)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    }}>
                      Sign up free for full scores and direct links on top deals
                    </button>
                  ) : (
                    <button onClick={openSignup} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px',
                      cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px',
                    }}>
                      Sign up free for all scores, source links on top 3, and full descriptions
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
