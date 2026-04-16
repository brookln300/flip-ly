import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import V2Search from './V2Search'

export const dynamic = 'force-dynamic'

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [listingsRes, sourcesRes, marketsRes, scoredRes] = await Promise.all([
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('fliply_markets').select('id', { count: 'exact', head: true }),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).not('deal_score', 'is', null).gte('scraped_at', sevenDaysAgo),
  ])
  return {
    listings: listingsRes.count || 0,
    sources: sourcesRes.count || 20,
    markets: marketsRes.count || 413,
    dealsScoredThisWeek: scoredRes.count || 0,
  }
}

async function getMarkets() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const markets: Record<string, { id: string; slug: string; name: string }[]> = {}
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
    id: d.id,
    title: d.title,
    price: d.price_text || d.price || null,
    city: d.city,
    date: d.event_date,
    event_type: d.event_type,
    deal_score: d.deal_score,
    deal_reason: d.deal_score_reason,
    tags: d.ai_tags,
  }))
}

export default async function V2Page() {
  const [stats, markets, featuredDeals] = await Promise.all([
    getStats(),
    getMarkets(),
    getFeaturedDeals(),
  ])

  return (
    <SignupProvider>
      <main className="min-h-screen bg-[#0a0a0a]">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-6">
              <a href="/v2" className="text-lime-500 font-semibold text-lg tracking-tight">flip-ly</a>
              <a href="/" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">&larr; current design</a>
            </div>
            <div className="flex items-center gap-5">
              <a href="#pricing" className="text-sm text-white/40 hover:text-white/70 transition-colors hidden sm:block">Pricing</a>
              <a
                href="/dashboard"
                className="text-sm font-medium text-[#0a0a0a] bg-white rounded-lg px-4 py-1.5 hover:bg-white/90 transition-colors"
              >
                Sign in
              </a>
            </div>
          </div>
        </header>

        {/* ── HERO + SEARCH (merged) ── */}
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-4">
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.1] mb-3">
            Find deals near you
          </h1>
          <p className="text-base text-white/40 mb-8 max-w-lg leading-relaxed">
            AI scans Craigslist, estate sales, and 20+ sources every 4 hours.
            Every listing scored 1&ndash;10 by resale potential.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mb-10 flex-wrap">
            {[
              { value: stats.listings > 0 ? stats.listings.toLocaleString() : `${stats.markets}`, label: stats.listings > 0 ? 'deals scored' : 'markets' },
              { value: `${stats.sources || 20}+`, label: 'sources' },
              { value: `${stats.markets}`, label: 'markets' },
            ].map(s => (
              <div key={s.label}>
                <span className="text-xl font-bold text-white font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </span>
                <span className="block text-[11px] text-white/25 mt-0.5 uppercase tracking-widest font-medium">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Search — client island */}
          <V2Search markets={markets} />
        </section>

        {/* ── FEATURED DEALS ── */}
        {featuredDeals.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Top deals</h2>
              {stats.dealsScoredThisWeek > 0 && (
                <span className="text-[11px] text-white/20 font-mono">
                  {stats.dealsScoredThisWeek.toLocaleString()} scored this week
                </span>
              )}
            </div>
            <div>
              {featuredDeals.map((deal: any) => {
                const score = deal.deal_score
                const scoreClass = score >= 9
                  ? 'text-lime-400 bg-lime-400/10 border-lime-400/20'
                  : score >= 7
                    ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                    : 'text-white/50 bg-white/[0.05] border-white/10'
                const eventLabel = deal.event_type && deal.event_type !== 'listing'
                  ? (deal.event_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : null

                return (
                  <div key={deal.id} className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
                    {score && (
                      <div className={`w-9 h-9 rounded-lg shrink-0 border flex items-center justify-center ${scoreClass}`}>
                        <span className="font-mono text-sm font-bold">{score}</span>
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
                    {deal.price && (
                      <span className="font-mono text-sm font-bold text-white shrink-0">{deal.price}</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-white/15 mt-4 text-center">
              Craigslist &middot; EstateSales.net &middot; Eventbrite &middot; OfferUp &middot; Facebook Marketplace &middot; Nextdoor{' '}
              <span className="font-mono">+ {(stats.sources || 20) - 6} more</span>
            </p>
          </section>
        )}

        {/* ── PRICING (settings-style) ── */}
        <section id="pricing" className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-base font-semibold text-white mb-1">Plan</h2>
          <p className="text-sm text-white/30 mb-6">Founding price &mdash; locked for life. Cancel anytime.</p>

          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            {/* Free */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-white">Free</span>
                  <span className="text-xs text-white/30 sm:ml-3 block sm:inline mt-0.5 sm:mt-0">
                    15 searches/day &middot; 1 market &middot; Weekly digest
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm text-white/40 mt-2 sm:mt-0 ml-7 sm:ml-0">$0</span>
            </div>

            {/* Pro — highlighted */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-lime-500/[0.04] border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-lime-500 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-lime-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Pro</span>
                    <span className="text-[10px] text-lime-400/60 font-semibold uppercase tracking-wider">recommended</span>
                  </div>
                  <span className="text-xs text-white/30 block mt-0.5">
                    Unlimited &middot; 3 markets &middot; 6hr early digest &middot; Full scores &middot; Source links
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 sm:mt-0 ml-7 sm:ml-0">
                <span className="font-mono text-sm text-white">$5<span className="text-white/30">/mo</span></span>
                <a
                  href="/pro"
                  className="text-xs font-semibold text-[#0a0a0a] bg-lime-500 hover:bg-lime-400 rounded-md px-3 py-1 transition-colors"
                >
                  Upgrade
                </a>
              </div>
            </div>

            {/* Power */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-white">Power</span>
                  <span className="text-xs text-white/30 block mt-0.5">
                    Everything in Pro &middot; Instant alerts &middot; Unlimited markets &middot; Category intelligence
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 sm:mt-0 ml-7 sm:ml-0">
                <span className="font-mono text-sm text-white">$19<span className="text-white/30">/mo</span></span>
                <a
                  href="/pro?tier=power"
                  className="text-xs font-medium text-white/50 border border-white/[0.1] hover:border-white/20 rounded-md px-3 py-1 transition-colors"
                >
                  Upgrade
                </a>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/15 mt-3 text-center">
            Secure checkout via Stripe &middot; One good find pays for a year
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.06] py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
            <span>&copy; 2026 Flip-ly &middot; Duskfall Ventures LLC</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-white/40 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white/40 transition-colors">Terms</a>
              <a href="/data-deletion" className="hover:text-white/40 transition-colors">Data Deletion</a>
              <a href="/refund" className="hover:text-white/40 transition-colors">Refund</a>
            </div>
          </div>
        </footer>

        <AuthModals />
      </main>
    </SignupProvider>
  )
}
