import { supabase } from './lib/supabase'
import { SignupProvider } from './components/SignupContext'
import HomeHeader from './components/HomeHeader'
import SearchSection from './components/SearchSection'
import FeaturedDeals from './components/FeaturedDeals'
import AuthModals from './components/AuthModals'
import RetroPortalButton from './components/RetroPortalButton'
import ShellTrigger from './components/ShellTrigger'
import FadeIn from './components/FadeIn'
import HeroCTA from './components/HeroCTA'
import HeroBackground from './components/HeroBackground'
import { TrendingUp, DollarSign, Tags, Zap, CircleCheck, Construction, Check, Circle } from 'lucide-react'

/* ══════════════════════════════════════════════════════════
   Server-side data fetching — runs at request time, no waterfall
   ══════════════════════════════════════════════════════════ */

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [listingsRes, sourcesRes, marketsRes, scoredRes, usersRes, mwlRes] = await Promise.all([
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
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
      <main id="main" className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>

        <HomeHeader />

        {/* ═══ BEAT 1: HERO — Full-width image with text overlay ═══ */}
        <div className="hero-image-section" style={{
          position: 'relative',
          width: '100%',
          minHeight: '520px',
          overflow: 'hidden',
        }}>
          {/* Interactive background — cycles images with hover parallax */}
          <HeroBackground />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 2,
            maxWidth: '70rem', margin: '0 auto',
            padding: 'var(--space-12) var(--space-4)',
            display: 'flex', alignItems: 'center',
            minHeight: '520px',
          }}>
            <div style={{ maxWidth: '520px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: '20px', padding: '5px 12px', marginBottom: '16px',
                fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                Live — scanning now
              </div>
              <h1 style={{
                fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
                color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em',
                marginBottom: 'var(--space-3)',
              }}>
                Find Garage Sales, Estate Sales &amp; Deals Near You
              </h1>
              <p style={{
                fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6,
                maxWidth: '480px', marginBottom: 'var(--space-5)',
              }}>
                AI scans Craigslist, OfferUp, EstateSales.net &amp; 20+ sources every 4 hours and scores every listing by resale profit potential.
              </p>

              {/* CTA row — client component for signup trigger */}
              <HeroCTA />

              {/* Proof line — inline stats, not a grid */}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}>
                {stats.listings > 0 && (
                  <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.listings.toLocaleString()}</span> deals scored &middot; </>
                )}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.sources || '20'}+</span> sources &middot;{' '}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.markets}</span> markets
              </p>
            </div>
          </div>
        </div>

        {/* ═══ SEARCH — client island (directly below hero per marketplace pattern) ═══ */}
        <SearchSection markets={markets} />

        {/* ═══ HOW IT WORKS — server rendered static content ═══ */}
        <FadeIn style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '70rem', margin: '0 auto', padding: 'var(--space-10) var(--space-4)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: '1', label: 'We scan', desc: 'Craigslist, OfferUp, EstateSales.net, Eventbrite, and 20+ local sources — every 4 hours.', icon: 'search' },
                { step: '2', label: 'AI scores', desc: 'Every listing rated 1-10 by resale value, demand signals, and profit margin potential.', icon: 'chart' },
                { step: '3', label: 'You flip', desc: 'See the best deals before everyone else. Show up first, buy low, sell high.', icon: 'dollar' },
              ].map(item => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 12px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
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
            {/* Named sources */}
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', lineHeight: 1.8 }}>
              Scanning{' '}
              {['Craigslist', 'EstateSales.net', 'Eventbrite', 'OfferUp', 'Facebook Marketplace', 'Nextdoor'].map((name, i) => (
                <span key={name}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{name}</span>
                  {i < 5 ? <span style={{ margin: '0 6px', color: 'var(--text-dim)' }}>&middot;</span> : ''}
                </span>
              ))}
              {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>+ {stats.sources ? stats.sources - 6 : 14} more</span>
            </p>
          </div>
        </FadeIn>

        {/* ═══ FEATURED DEALS — client island with server-fetched initial data ═══ */}
        <FeaturedDeals initialDeals={featuredDeals} initialMarketName="Dallas / Fort Worth" markets={markets} />

        {/* ═══ SOCIAL PROOF STRIP — merged ═══ */}
        {(stats.dealsScoredThisWeek > 0 || stats.totalUsers > 0) && (
          <div style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)', padding: '20px var(--space-4)',
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

        {/* ═══ HOW SCORING WORKS ═══ */}
        {/* ═══ HOW SCORING WORKS — compact inline ═══ */}
        <FadeIn style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4) 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            AI Deal Scoring: Every Listing Rated 1&ndash;10
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto var(--space-6)' }}>
            Our AI weighs demand, margin potential, competition, and sell-through velocity to rate every listing 1&ndash;10.
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap',
          }}>
            {[
              { icon: TrendingUp, label: 'Demand' },
              { icon: DollarSign, label: 'Margin' },
              { icon: Tags, label: 'Competition' },
              { icon: Zap, label: 'Velocity' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <f.icon size={16} color="var(--accent-green)" strokeWidth={2} aria-hidden="true" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ═══ SCORE BREAKDOWN EXAMPLE — shows visitors what a real score looks like ═══ */}
        <FadeIn style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-10) var(--space-4) 0' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Here&apos;s what a score looks like
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '14px',
            padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            maxWidth: '520px', margin: '0 auto',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Score badge */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--score-excellent)' }}>9</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                    background: 'rgba(124,58,237,0.08)', color: 'var(--accent-purple)',
                    border: '1px solid rgba(124,58,237,0.12)',
                  }}>Estate Sale</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    DeWalt 20V MAX 5-Tool Combo Kit
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '6px 0 10px' }}>
                  Complete DeWalt 20V tool set including drill, impact driver, circular saw, reciprocating saw, and work light with two batteries and charger. Excellent condition, barely used.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 10px', fontStyle: 'italic' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontStyle: 'normal' }}>AI insight:</span>{' '}
                  DeWalt 20V 5-tool combo at $60 — typically resells for $180-220 on eBay. Strong 3x flip margin with high demand.
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['tools', 'electronics'].map(tag => (
                    <span key={tag} style={{
                      fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)',
                      background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                    }}>{tag}</span>
                  ))}
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--accent-green)',
                    background: 'rgba(22,163,74,0.06)', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid rgba(22,163,74,0.12)',
                  }}>68% below typical</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--accent-amber)',
                    background: 'rgba(217,119,6,0.06)', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid rgba(217,119,6,0.12)',
                  }}>Flip potential</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>$60</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
            Pro members see full breakdowns, price context, and flip indicators on every listing.
          </p>
        </FadeIn>

        {/* ═══ PRICING ═══ */}
        <FadeIn id="pricing" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Deal Finder Plans &amp; Pricing</h2>
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
              background: 'var(--bg-card)', borderRadius: '12px', padding: '24px',
              border: '2px solid var(--accent-green)',
              boxShadow: '0 4px 24px rgba(22,163,74,0.08)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--accent-green)', color: '#fff', fontSize: '12px', fontWeight: 700,
                padding: '3px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Most popular</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}>Pro</p>
              {stats.totalUsers > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 2px', fontFamily: 'var(--font-mono)' }}>
                  Join {stats.totalUsers.toLocaleString()} members
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '16px', marginRight: '2px' }}>$12</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$5</span>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--accent-green)', marginBottom: '16px', fontWeight: 600 }}>Founding price &middot; Locked for life</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span><strong>Unlimited</strong> searches</span>
                <span>3 markets</span>
                <span>Digest <strong>6 hours early</strong></span>
                <span>Full score breakdowns</span>
                <span>Direct source links</span>
              </div>
              <a href="/pro" className="pricing-cta-pro" style={{
                display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 700,
                background: 'var(--accent-green)', color: '#fff', border: 'none', textAlign: 'center',
                borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
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
              <p style={{ fontSize: '12px', color: 'var(--accent-purple)', marginBottom: '16px', fontWeight: 600 }}>Founding price &middot; Locked for life</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Everything in Pro</span>
                <span><strong>Unlimited</strong> markets</span>
                <span>Instant deal alerts</span>
                <span>Category intelligence</span>
                <span>Priority support</span>
              </div>
              <a href="/pro?tier=power" className="pricing-cta-power" style={{
                display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', textAlign: 'center',
                borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s, box-shadow 0.2s',
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


        {/* ═══ WHAT'S NEW + ROADMAP ═══ */}
        <FadeIn id="whats-new" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Changelog</p>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>What&apos;s new &amp; what&apos;s next</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
              We ship weekly. Your feedback shapes what we build.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CircleCheck size={18} color="var(--accent-green)" strokeWidth={2} aria-hidden="true" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recently shipped</h3>
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
                    <Check size={14} color="var(--accent-green)" strokeWidth={2.5} style={{ marginTop: '1px', flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        {item.tag && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(22,163,74,0.08)', borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.5px' }}>{item.tag}</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Construction size={18} color="var(--accent-amber)" strokeWidth={2} aria-hidden="true" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Coming soon</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Real-Time Deal Alerts', desc: 'Get notified the moment a high-score deal drops in your area', tier: 'Pro' },
                  { label: 'Saved Search Notifications', desc: 'Save a search query and get alerts when new matches appear', tier: 'Pro' },
                  { label: 'Native Mobile App', desc: 'Swipe-friendly cards, bottom nav, one-thumb operation', tier: 'All' },
                  { label: 'City SEO Pages', desc: '"Best estate sales in Dallas this weekend" — auto-generated from real data', tier: 'All' },
                  { label: 'More Sources', desc: 'Facebook Marketplace, OfferUp, Nextdoor, and local permit feeds', tier: 'All' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Circle size={14} color="var(--text-dim)" strokeWidth={2} style={{ marginTop: '1px', flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: item.tier === 'Pro' ? 'var(--accent-green)' : 'var(--text-dim)', background: item.tier === 'Pro' ? 'rgba(22,163,74,0.08)' : 'var(--bg-surface)', borderRadius: '4px', padding: '1px 5px' }}>{item.tier}</span>
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
                  <a href="#search" className="footer-link">Search</a>
                  <a href="#pricing" className="footer-link">Pricing</a>
                  <a href="/dashboard" className="footer-link">Dashboard</a>
                  <a href="/blog" className="footer-link">Blog</a>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Company</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/about" className="footer-link">About</a>
                  <a href="/contact" className="footer-link">Contact</a>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Legal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/privacy" className="footer-link">Privacy</a>
                  <a href="/terms" className="footer-link">Terms</a>
                  <a href="/data-deletion" className="footer-link">Data Deletion</a>
                  <a href="/refund" className="footer-link">Refund Policy</a>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Social</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" className="footer-link">X / Twitter</a>
                  <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
                  <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" className="footer-link">TikTok</a>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>&copy; 2026 Flip-ly &middot; Deal intelligence for resellers &middot; Operated by Duskfall Ventures LLC</p>
            </div>
          </div>
          <div style={{ position: 'relative', height: '12px', marginTop: '4px' }}>
            <a href="/lobster-hunt" style={{ width: '16px', height: '16px', background: 'transparent', cursor: 'default', position: 'absolute', right: '23%', top: '0', zIndex: 60, display: 'block' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'transparent', position: 'absolute', top: '50%', left: '50%' }} />
            </a>
          </div>
        </footer>

        {/* Client-side modals and widgets */}
        <AuthModals />
        <RetroPortalButton />
        <ShellTrigger variant="modern" />
      </main>
    </SignupProvider>
  )
}
