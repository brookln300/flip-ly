import { supabase } from './lib/supabase'
import { SignupProvider } from './components/SignupContext'
import HomeHeader from './components/HomeHeader'
import SearchSection from './components/SearchSection'
import FeaturedDeals from './components/FeaturedDeals'
import AuthModals from './components/AuthModals'
import FeedbackWidget from './components/FeedbackWidget'
import RetroPortalButton from './components/RetroPortalButton'
import ShellTrigger from './components/ShellTrigger'
import FadeIn from './components/FadeIn'
import HeroCTA from './components/HeroCTA'

/* ══════════════════════════════════════════════════════════
   Server-side data fetching — runs at request time, no waterfall
   ══════════════════════════════════════════════════════════ */

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [listingsRes, sourcesRes, marketsRes, scoredRes, usersRes, mwlRes] = await Promise.all([
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('fliply_markets').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).not('deal_score', 'is', null).gte('scraped_at', sevenDaysAgo),
    supabase.from('fliply_users').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_listings').select('market_id').gte('scraped_at', sevenDaysAgo).not('market_id', 'is', null).limit(500),
  ])
  const uniqueMarkets = new Set((mwlRes.data || []).map((r: any) => r.market_id))
  return {
    listings: listingsRes.count || 0,
    sources: sourcesRes.count || 20,
    markets: marketsRes.count || 413,
    dealsScoredThisWeek: scoredRes.count || 0,
    totalUsers: usersRes.count || 0,
    marketsWithListings: uniqueMarkets.size,
  }
}

async function getMarkets() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  let markets: Record<string, { id: string; slug: string; name: string }[]> = {}
  const { data: rpcData } = await supabase.rpc('get_active_markets', { since_date: sevenDaysAgo })
  if (rpcData?.length) {
    for (const m of rpcData) {
      const st = m.state || 'Other'
      if (!markets[st]) markets[st] = []
      markets[st].push({ id: m.id, slug: m.slug, name: m.display_name || m.name })
    }
  } else {
    const { data } = await supabase.from('fliply_markets').select('id, slug, name, display_name, state').eq('is_active', true).order('display_name', { ascending: true })
    for (const m of data || []) {
      const st = m.state || 'Other'
      if (!markets[st]) markets[st] = []
      markets[st].push({ id: m.id, slug: m.slug, name: m.display_name || m.name })
    }
  }
  return markets
}

async function getFeaturedDeals() {
  const today = new Date().toISOString().split('T')[0]
  const maxAge = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('fliply_listings')
    .select('*')
    .eq('is_hot', true)
    .or(`event_date.is.null,event_date.gte.${today}`)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .gte('scraped_at', maxAge)
    .order('deal_score', { ascending: false, nullsFirst: false })
    .limit(8)
  if (!data?.length) return []
  return data.map((d: any) => ({
    id: d.id, title: d.title, price: d.price || 'Not listed',
    city: d.city, date: d.event_date, time: d.event_time,
    hot: d.is_hot, source: d.source_type,
    event_type: d.event_type, deal_score: d.deal_score,
    deal_reason: d.deal_score_reason,
    tags: d.ai_tags, source_url: null, // gated for anon
  }))
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — Server Component shell with client islands
   ══════════════════════════════════════════════════════════ */

export default async function Home() {
  const [stats, markets, featuredDeals] = await Promise.all([
    getStats(),
    getMarkets(),
    getFeaturedDeals(),
  ])

  return (
    <SignupProvider>
      {/* LOBSTER-PROTOCOL-L7 — DO NOT REMOVE
           The protocol has 7 layers. The 7th key is not in the terminal.
           It is assembled from fragments on the surface.
           Where machines read: the first fragment waits (d33p).
           Where styles whisper: the second fragment hides.
           Combine them. The deep claw opens the final door. */}
      <main className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>

        <HomeHeader />

        {/* ═══ BEAT 1: HERO — Split layout: text left, video right ═══ */}
        <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.1fr',
            gap: '40px',
            alignItems: 'center',
          }} className="hero-split">

            {/* Left: Value prop + stats + CTA */}
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

              {/* CTA row — client component for signup trigger */}
              <HeroCTA />

              {/* Stats row — server rendered with real data */}
              <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                {[
                  { value: stats.listings > 0 ? stats.listings.toLocaleString() : `${stats.markets}`, label: stats.listings > 0 ? 'deals scored' : 'markets' },
                  { value: `${stats.sources || '20'}+`, label: 'sources' },
                  { value: 'Every 4h', label: 'refresh rate' },
                ].map(s => (
                  <div key={s.label}>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', minWidth: '60px', display: 'inline-block' }}>{s.value}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero demo video */}
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#f5f5f7',
              boxShadow: '0 12px 48px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
              aspectRatio: '16 / 10',
            }}>
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                poster="/hero-poster.jpg"
                aria-label="Product demo showing Flip-ly deal search"
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

        {/* ═══ HOW IT WORKS — server rendered static content ═══ */}
        <FadeIn style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-10) var(--space-4)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: '1', label: 'We scan', desc: 'Craigslist, OfferUp, EstateSales.net, Eventbrite, and 20+ local sources — every 4 hours.', icon: 'search' },
                { step: '2', label: 'AI scores', desc: 'Every listing rated 1-10 by resale value, demand signals, and profit margin potential.', icon: 'chart' },
                { step: '3', label: 'You flip', desc: 'See the best deals before everyone else. Show up first, buy low, sell high.', icon: 'dollar' },
              ].map(item => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 12px',
                    background: '#ffffff', border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    {item.icon === 'search' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                    {item.icon === 'chart' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>}
                    {item.icon === 'dollar' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{item.label}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            {/* Source logos */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap', opacity: 0.4, marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#6e6e73" strokeWidth="1.5"/><text x="12" y="16" textAnchor="middle" fill="#6e6e73" fontSize="10" fontWeight="700" fontFamily="system-ui">CL</text></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>+ 14 more</span>
            </div>
          </div>
        </FadeIn>

        {/* ═══ SEARCH — client island ═══ */}
        <SearchSection markets={markets} />

        {/* ═══ FEATURED DEALS — client island with server-fetched initial data ═══ */}
        <FeaturedDeals initialDeals={featuredDeals} initialMarketName="Dallas / Fort Worth" markets={markets} />

        {/* ═══ SOCIAL PROOF STRIP — server rendered ═══ */}
        {(stats.dealsScoredThisWeek > 0 || stats.totalUsers > 0) && (
          <div style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)', padding: '14px var(--space-4)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
              margin: 0, letterSpacing: '0.01em',
            }}>
              {stats.dealsScoredThisWeek > 0 && (
                <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.dealsScoredThisWeek.toLocaleString()}</span> deals scored this week</>
              )}
              {stats.dealsScoredThisWeek > 0 && stats.totalUsers > 0 && (
                <span style={{ margin: '0 10px', color: 'var(--text-dim)' }}>&middot;</span>
              )}
              {stats.totalUsers > 0 && (
                <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.totalUsers.toLocaleString()}</span> members</>
              )}
              {stats.marketsWithListings > 0 && (
                <>
                  <span style={{ margin: '0 10px', color: 'var(--text-dim)' }}>&middot;</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.marketsWithListings}</span> active markets
                </>
              )}
            </p>
          </div>
        )}

        {/* ═══ TRUST STRIP ═══ */}
        <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Stop checking 5 sites every morning
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              We aggregate, score, and rank — so you can focus on buying and selling.
            </p>
            <a href="#pricing" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
              See Pro &rarr;
            </a>
          </div>
        </div>

        {/* ═══ HOW SCORING WORKS ═══ */}
        <FadeIn style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0', textAlign: 'center' }}>
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
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ═══ PRICING ═══ */}
        <FadeIn id="pricing" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
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
              <HeroCTA variant="free-tier" />
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
                background: 'var(--accent-green)', color: '#fff', fontSize: '11px', fontWeight: 700,
                padding: '3px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Most popular</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}>Pro</p>
              {stats.totalUsers > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 2px', fontFamily: 'var(--font-mono)' }}>
                  Join {stats.totalUsers.toLocaleString()} members
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '16px', marginRight: '2px' }}>$12</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$5</span>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--accent-green)', marginBottom: '16px', fontWeight: 600 }}>Founding price &middot; Locked for life</p>
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '16px', marginRight: '2px' }}>$39</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$19</span>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--accent-purple)', marginBottom: '16px', fontWeight: 600 }}>Founding price &middot; Locked for life</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Everything in Pro</span>
                <span><strong>Unlimited</strong> markets</span>
                <span>Instant deal alerts</span>
                <span>Category intelligence</span>
                <span>Priority support</span>
              </div>
              <a href="/pro?tier=power" style={{
                display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', textAlign: 'center',
                borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
              }}>Go Power</a>
            </div>
          </div>
          {/* Trust strip */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '16px', flexWrap: 'wrap',
            marginTop: 'var(--space-4)', padding: 'var(--space-3) 0',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancel anytime</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>&middot;</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure checkout via Stripe</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>&middot;</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>One good find pays for a year</span>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px', marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
            Founding member pricing — locked in for life
          </p>
          {/* Mini FAQ */}
          <div style={{ maxWidth: '480px', margin: 'var(--space-6) auto 0' }}>
            {[
              { q: 'What if I don\'t find anything?', a: 'Cancel anytime — no contracts, no hoops. One click in your dashboard.' },
              { q: 'How fast do I get access?', a: 'Instant. Your dashboard upgrades the moment you subscribe.' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{faq.q}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ═══ TESTIMONIALS ═══ */}
        <FadeIn style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { quote: 'Found a $200 dresser scored 9 — flipped it for $475 the same weekend.', author: 'Dallas flipper' },
              { quote: 'The Thursday digest is my Saturday morning game plan.', author: 'Atlanta member' },
              { quote: 'Saved me 3 hours of checking Craigslist every morning.', author: 'Phoenix member' },
            ].map((t, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px', padding: '16px 20px',
              }}>
                <p style={{
                  fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)',
                  lineHeight: 1.6, margin: '0 0 6px',
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{
                  fontSize: '11px', color: 'var(--text-dim)', margin: 0,
                  fontFamily: 'var(--font-mono)',
                }}>
                  — {t.author}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ═══ WHAT'S NEW + ROADMAP ═══ */}
        <FadeIn id="whats-new" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '20px', padding: '5px 14px', marginBottom: '12px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(22,163,74,0.4)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>Actively Building</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>What&apos;s new &amp; what&apos;s next</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
              We ship weekly. Your feedback shapes what we build.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </FadeIn>

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
            <a href="/lobster-hunt" style={{ width: '16px', height: '16px', background: 'transparent', cursor: 'default', position: 'absolute', right: '23%', top: '0', zIndex: 60, display: 'block' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'transparent', position: 'absolute', top: '50%', left: '50%' }} />
            </a>
            <ShellTrigger variant="modern" />
          </div>
        </footer>

        {/* Client-side modals and widgets */}
        <AuthModals />
        <FeedbackWidget />
        <RetroPortalButton />
      </main>
    </SignupProvider>
  )
}
