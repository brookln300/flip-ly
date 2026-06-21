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
import PricingLink from './components/PricingLink'
import PricingSectionTracker from './components/PricingSectionTracker'
import { TrendingUp, DollarSign, Tags, Zap, CircleCheck, Construction, Check, Circle } from 'lucide-react'
import { getFoundingSnapshot } from './lib/founding'
import { getPowerVisibility } from './lib/pricing'

/* ══════════════════════════════════════════════════════════
   Server-side data fetching — runs at request time, no waterfall
   ══════════════════════════════════════════════════════════ */

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  const [listingsRes, sourcesRes, freshRes, mwlRes] = await Promise.all([
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).gte('scraped_at', twoDaysAgo),
    supabase.from('fliply_listings').select('market_id').gte('scraped_at', sevenDaysAgo).not('market_id', 'is', null).limit(1000),
  ])
  const uniqueMarkets = new Set((mwlRes.data || []).map((r: any) => r.market_id))
  return {
    listings: listingsRes.count || 0,
    sources: sourcesRes.count || 0,
    freshTwoDays: freshRes.count || 0,
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
  const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  // Best real deals available right now. The score-desc order surfaces the
  // strongest finds first; threshold is ≥5 (not ≥7) so the grid stays full of
  // genuine scores while the AI scoring backlog catches up after a key rotation.
  const { data } = await supabase
    .from('fliply_listings')
    .select('*')
    .gte('deal_score', 5)
    .or(`event_date.is.null,event_date.gte.${today}`)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .gte('scraped_at', maxAge)
    .order('deal_score', { ascending: false, nullsFirst: false })
    .order('scraped_at', { ascending: false })
    .limit(8)
  if (!data?.length) return []
  return data.map((d: any) => ({
    id: d.id, title: d.title, price: d.price_text || 'Not listed',
    city: d.city, date: d.event_date, time: d.event_time_text,
    hot: d.is_hot, source: d.source_type,
    event_type: d.event_type, deal_score: d.deal_score,
    deal_reason: d.deal_score_reason,
    tags: d.ai_tags, source_url: null, // gated for anon
  }))
}

// Highest real scored deal — drives the honest "what a score looks like" card.
async function getTopDeal() {
  const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('fliply_listings')
    .select('title, ai_description, description, deal_score, deal_score_reason, price_text, ai_tags, event_type, city, state')
    .gte('deal_score', 7)
    .gte('scraped_at', maxAge)
    .order('deal_score', { ascending: false })
    .order('scraped_at', { ascending: false })
    .limit(1)
  return data?.[0] || null
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  garage_sale: 'Garage Sale', estate_sale: 'Estate Sale', moving_sale: 'Moving Sale',
  flea_market: 'Flea Market', auction: 'Auction', community_sale: 'Community Sale',
  thrift: 'Thrift', listing: 'Listing', event: 'Event',
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — Server Component shell with client islands
   ══════════════════════════════════════════════════════════ */

export default async function Home() {
  const [stats, markets, featuredDeals, topDeal] = await Promise.all([
    getStats(),
    getMarkets(),
    getFeaturedDeals(),
    getTopDeal(),
  ])

  const founding = getFoundingSnapshot()
  const powerVisibility = getPowerVisibility()
  const showPower = powerVisibility === 'public'
  const proPrice = founding.priceVariant === 'founding' ? founding.foundingPrice : founding.normalPrice

  const topScore = topDeal?.deal_score ?? 0
  const topScoreColor = topScore >= 9 ? 'var(--score-excellent)' : topScore >= 7 ? 'var(--accent-amber)' : 'var(--text-muted)'
  const topScoreBg = topScore >= 9 ? 'rgba(22,163,74,0.1)' : topScore >= 7 ? 'rgba(217,119,6,0.1)' : 'var(--bg-surface)'
  const topScoreBorder = topScore >= 9 ? 'rgba(22,163,74,0.2)' : topScore >= 7 ? 'rgba(217,119,6,0.2)' : 'var(--border-subtle)'

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
            <div style={{ maxWidth: '540px' }}>
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
                fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800,
                color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.035em',
                marginBottom: 'var(--space-3)',
              }}>
                Underpriced local deals, <span style={{ color: 'var(--accent-green)' }}>scored before you scroll.</span>
              </h1>
              <p style={{
                fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6,
                maxWidth: '480px', marginBottom: 'var(--space-5)',
              }}>
                Flip-ly scans your local Craigslist around the clock and rates every garage sale, estate sale, and resale item &mdash; from retro games and collectibles to tools and furniture &mdash; <strong>1&ndash;10 for real resale-flip margin</strong>, so the money-makers float to the top. Strongest right now in Dallas&ndash;Fort Worth.
              </p>

              {/* CTA row — client component for signup trigger */}
              <HeroCTA />

              {/* Proof line — inline stats, real DB numbers */}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}>
                {stats.listings > 0 && (
                  <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.listings.toLocaleString()}</span> listings tracked &middot; </>
                )}
                {stats.sources > 0 && (
                  <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.sources}</span> active feeds &middot; </>
                )}
                {stats.freshTwoDays > 0 && (
                  <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.freshTwoDays.toLocaleString()}</span> new in 48h</>
                )}
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
                { step: '1', label: 'We scan', desc: 'Every active Craigslist region in your market, refreshed around the clock.', icon: 'search' },
                { step: '2', label: 'AI scores', desc: 'Each listing rated 1-10 on demand, margin, and how far below typical resale it’s priced — with the reasoning shown.', icon: 'chart' },
                { step: '3', label: 'You flip', desc: 'Sort by score, see the best deals first, and grab them before everyone else scrolling raw Craigslist does.', icon: 'dollar' },
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
            {/* Named sources — honest: what we actually scan today */}
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', lineHeight: 1.8 }}>
              Scanning{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Craigslist</span>
              {' '}<span style={{ color: 'var(--text-dim)' }}>across {stats.marketsWithListings > 0 ? stats.marketsWithListings : 'live'} active metros</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}> &mdash; more sources rolling out</span>
            </p>
          </div>
        </FadeIn>

        {/* ═══ FEATURED DEALS — client island with server-fetched initial data (real ≥7 scores) ═══ */}
        <FeaturedDeals initialDeals={featuredDeals} initialMarketName="Dallas / Fort Worth" markets={markets} />

        {/* ═══ SOCIAL PROOF STRIP — activity, not vanity counts ═══ */}
        {(stats.listings > 0 || stats.marketsWithListings > 0) && (
          <div style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)', padding: '20px var(--space-4)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
              margin: 0, letterSpacing: '0.01em',
            }}>
              {stats.listings > 0 && (
                <><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.listings.toLocaleString()}</span> listings tracked</>
              )}
              {stats.freshTwoDays > 0 && (
                <>
                  <span style={{ margin: '0 10px', color: 'var(--text-dim)' }}>&middot;</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.freshTwoDays.toLocaleString()}</span> added in the last 48h
                </>
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

        {/* ═══ SCORE BREAKDOWN EXAMPLE — a REAL top-scored listing from the database ═══ */}
        {topDeal && (
        <FadeIn style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-10) var(--space-4) 0' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            A real score from today&apos;s scan
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '14px',
            padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            maxWidth: '520px', margin: '0 auto',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Score badge — real score, color-coded */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                background: topScoreBg, border: `1px solid ${topScoreBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: topScoreColor }}>{topDeal.deal_score}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  {topDeal.event_type && (
                    <span style={{
                      padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                      background: 'rgba(124,58,237,0.08)', color: 'var(--accent-purple)',
                      border: '1px solid rgba(124,58,237,0.12)',
                    }}>{EVENT_TYPE_LABELS[topDeal.event_type] || topDeal.event_type}</span>
                  )}
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {topDeal.title}
                  </span>
                </div>
                {(topDeal.ai_description || topDeal.description) && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '6px 0 10px' }}>
                    {topDeal.ai_description || topDeal.description}
                  </p>
                )}
                {topDeal.deal_score_reason && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 10px', fontStyle: 'italic' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontStyle: 'normal' }}>AI insight:</span>{' '}
                    {topDeal.deal_score_reason}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {(topDeal.ai_tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} style={{
                      fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)',
                      background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                    }}>{tag}</span>
                  ))}
                  {topDeal.price_text && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{topDeal.price_text}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
            Pro members see full breakdowns, price context, and direct source links on every listing.
          </p>
        </FadeIn>
        )}

        {/* ═══ PRICING ═══ */}
        <FadeIn id="pricing" style={{ maxWidth: '48rem', margin: '0 auto', padding: 'var(--space-16) var(--space-4) 0' }}>
          <div style={{ position: 'relative' }}>
            <PricingSectionTracker />
          </div>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Deal Finder Plans &amp; Pricing</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>One good find pays for a year of Pro.</p>
          </div>
          <div className={`grid grid-cols-1 ${showPower ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                {founding.priceVariant === 'founding' && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '16px', marginRight: '2px' }}>${founding.normalPrice}</span>
                )}
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>${proPrice}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span>
              </div>
              {founding.priceVariant === 'founding' ? (
                <p style={{ fontSize: '12px', color: 'var(--accent-green)', marginBottom: '16px', fontWeight: 600 }}>Founding price &middot; Locked for life</p>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px', fontWeight: 600 }}>Month-to-month &middot; Cancel anytime</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span><strong>Unlimited</strong> searches</span>
                <span>3 markets</span>
                <span>Digest <strong>6 hours early</strong></span>
                <span>Full score breakdowns</span>
                <span>Direct source links</span>
              </div>
              <PricingLink href="/pro" label="Upgrade to Pro" tier="pro" surface="landing_pricing" className="pricing-cta-pro" style={{
                display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 700,
                background: 'var(--accent-green)', color: '#fff', border: 'none', textAlign: 'center',
                borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
              }} />
            </div>
            {/* Power — rendered only when NEXT_PUBLIC_POWER_VISIBILITY=public */}
            {showPower && (
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
              <PricingLink href="/pro?tier=power" label="Go Power" tier="power" surface="landing_pricing" className="pricing-cta-power" style={{
                display: 'block', width: '100%', marginTop: '20px', padding: '10px', fontSize: '13px', fontWeight: 600,
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', textAlign: 'center',
                borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s, box-shadow 0.2s',
              }} />
            </div>
            )}
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
              You&apos;re early &mdash; we ship improvements every week, and{' '}
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>your feedback shapes what we build next</span>.
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
