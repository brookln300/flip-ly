'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import DealRow from './DealRow'
import { useSignup } from './SignupContext'

export default function FeaturedDeals({ initialDeals, initialMarketName, markets }: {
  initialDeals: any[]
  initialMarketName: string
  markets: Record<string, { id: string; slug: string; name: string }[]>
}) {
  const { openSignup } = useSignup()
  const [featuredDeals, setFeaturedDeals] = useState(initialDeals)
  const [featuredMarketName, setFeaturedMarketName] = useState(initialMarketName)
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)

  // Check auth and optionally re-fetch for user's market
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.user) return
        setLoggedInUser(data.user)
        // If user has a market, fetch deals for their market
        if (data.user.market_id && Object.keys(markets).length > 0) {
          let marketSlug = ''
          for (const ms of Object.values(markets)) {
            const found = ms.find(m => m.id === data.user.market_id)
            if (found) {
              marketSlug = found.slug
              setFeaturedMarketName(found.name)
              break
            }
          }
          if (marketSlug) {
            fetch(`/api/listings?hot=true&limit=8&market=${marketSlug}`)
              .then(res => res.json())
              .then(d => { if (d.results?.length) setFeaturedDeals(d.results) })
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
  }, [markets])

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
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
          <div style={{ minHeight: '480px' }}>
            {featuredDeals.map((deal, i) => (
              <DealRow key={deal.id || i} deal={deal} i={100 + i} showExpand={i < 3} expandedDeal={expandedDeal} setExpandedDeal={setExpandedDeal} loggedInUser={loggedInUser} />
            ))}
          </div>
        </>
      )}
      {featuredDeals.length === 0 && (
        <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', minHeight: '480px' }}>
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
          <button onClick={openSignup} style={{
            display: 'block', margin: '8px auto 0', background: 'none', border: 'none',
            color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: '2px',
          }}>
            or use email
          </button>
        </div>
      )}
    </div>
  )
}
