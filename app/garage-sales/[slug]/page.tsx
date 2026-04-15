import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

interface MarketData {
  id: string
  slug: string
  name: string
  display_name: string
  state: string
  is_active: boolean
}

interface ListingSummary {
  total: number
  scored: number
  hot: number
  sources: string[]
  topScore: number | null
  avgScore: number | null
}

async function getMarket(slug: string): Promise<MarketData | null> {
  const { data } = await supabase
    .from('fliply_markets')
    .select('id, slug, name, display_name, state, is_active')
    .eq('slug', slug)
    .single()
  return data
}

async function getListingSummary(marketId: string): Promise<ListingSummary> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, scoredRes, hotRes, sourcesRes, topRes] = await Promise.all([
    supabase
      .from('fliply_listings')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', marketId)
      .gte('scraped_at', sevenDaysAgo),
    supabase
      .from('fliply_listings')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', marketId)
      .not('deal_score', 'is', null)
      .gte('scraped_at', sevenDaysAgo),
    supabase
      .from('fliply_listings')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', marketId)
      .eq('is_hot', true)
      .gte('scraped_at', sevenDaysAgo),
    supabase
      .from('fliply_sources')
      .select('source_type')
      .eq('market_id', marketId)
      .eq('status', 'active'),
    supabase
      .from('fliply_listings')
      .select('deal_score')
      .eq('market_id', marketId)
      .not('deal_score', 'is', null)
      .gte('scraped_at', sevenDaysAgo)
      .order('deal_score', { ascending: false })
      .limit(50),
  ])

  const scores = (topRes.data || []).map((r: any) => r.deal_score).filter(Boolean)
  const uniqueSources = [...new Set((sourcesRes.data || []).map((s: any) => s.source_type))]

  return {
    total: totalRes.count || 0,
    scored: scoredRes.count || 0,
    hot: hotRes.count || 0,
    sources: uniqueSources,
    topScore: scores.length > 0 ? scores[0] : null,
    avgScore: scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : null,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const market = await getMarket(slug)
  if (!market) return { title: 'Market Not Found' }

  const cityName = market.display_name || market.name
  const title = `Garage Sales & Estate Sales in ${cityName}, ${market.state} | Flip-ly`
  const description = `Find the best garage sales, estate sales, yard sales, and local deals in ${cityName}, ${market.state}. AI scores every listing 1-10 by resale profit potential. Updated every 4 hours.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://flip-ly.net/garage-sales/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://flip-ly.net/garage-sales/${slug}`,
      siteName: 'Flip-ly',
      images: [{ url: '/api/og', width: 1200, height: 630, alt: `Garage sales in ${cityName}` }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Garage Sales in ${cityName}, ${market.state} | Flip-ly`,
      description: `AI-scored deals from Craigslist, estate sales & more in ${cityName}. Free.`,
      images: ['/api/og'],
    },
    robots: { index: true, follow: true },
  }
}

function formatSourceName(type: string): string {
  const map: Record<string, string> = {
    craigslist: 'Craigslist',
    estatesales: 'EstateSales.net',
    eventbrite: 'Eventbrite',
    offerup: 'OfferUp',
    facebook: 'Facebook Marketplace',
    nextdoor: 'Nextdoor',
    custom: 'Local Sources',
  }
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const market = await getMarket(slug)
  if (!market) notFound()

  const summary = await getListingSummary(market.id)
  const cityName = market.display_name || market.name
  const hasListings = summary.total > 0

  return (
    <main id="main" className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            FLIP-LY
          </span>
        </a>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/garage-sales" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>All Markets</Link>
          <Link href="/pro" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Pro</Link>
        </nav>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: 'var(--space-3) var(--space-4) 0' }}>
        <nav style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <Link href="/garage-sales" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Garage Sales</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{cityName}, {market.state}</span>
        </nav>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
        <h1 style={{
          fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700,
          color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.02em',
          marginBottom: 'var(--space-3)',
        }}>
          Garage Sales &amp; Estate Sales in {cityName}, {market.state}
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '540px' }}>
          {hasListings
            ? `${summary.total.toLocaleString()} listings found this week from ${summary.sources.length} source${summary.sources.length !== 1 ? 's' : ''}. Every deal scored 1\u201310 by AI for resale profit potential.`
            : `We\u2019re building coverage in ${cityName}. Sources are being added \u2014 sign up to get notified when deals go live.`
          }
        </p>
      </div>

      {/* Stats Grid */}
      {hasListings && (
        <div style={{
          maxWidth: '56rem', margin: '0 auto', padding: '0 var(--space-4) var(--space-8)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px',
        }}>
          {[
            { value: summary.total.toLocaleString(), label: 'Listings This Week' },
            { value: summary.scored.toLocaleString(), label: 'AI-Scored Deals' },
            { value: summary.hot > 0 ? summary.hot.toLocaleString() : '\u2014', label: 'Hot Deals' },
            { value: summary.topScore ? `${summary.topScore}/10` : '\u2014', label: 'Top Score' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
              }}>{stat.value}</div>
              <div style={{
                fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginTop: '4px',
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sources Active */}
      {summary.sources.length > 0 && (
        <div style={{
          maxWidth: '56rem', margin: '0 auto', padding: '0 var(--space-4) var(--space-8)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Sources We Scan in {cityName}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {summary.sources.map(source => (
              <span key={source} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: '6px', padding: '6px 12px', fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                {formatSourceName(source)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'var(--space-10) var(--space-4)',
      }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
            How Flip-ly Finds Deals in {cityName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ textAlign: 'center' }}>
            {[
              { step: '1', title: 'We scan local sources', desc: `Craigslist, EstateSales.net, and other sources in the ${cityName} area \u2014 automatically, every 4 hours.` },
              { step: '2', title: 'AI scores every listing', desc: 'Each deal rated 1\u201310 based on resale value, demand signals, brand detection, and profit margin potential.' },
              { step: '3', title: 'You get the best deals first', desc: 'Search instantly, or get scored deals delivered via daily digest and instant alerts.' },
            ].map(item => (
              <div key={item.step}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px', fontSize: '14px', fontWeight: 700,
                  color: 'var(--accent-green)', fontFamily: 'var(--font-mono)',
                }}>{item.step}</div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {hasListings
            ? `Start Finding Deals in ${cityName}`
            : `Get Notified When ${cityName} Goes Live`
          }
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)', maxWidth: '420px', margin: '0 auto var(--space-6)' }}>
          {hasListings
            ? 'Free tier: 15 searches/day, weekly digest, 1 market. No credit card required.'
            : 'Sign up free and we\u2019ll notify you as soon as listings start flowing.'
          }
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/?signup=free" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'var(--accent-green)', color: '#fff',
            borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Sign Up Free
          </a>
          {hasListings && (
            <a href="/dashboard" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border-active)', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Search {cityName} Deals
            </a>
          )}
        </div>
      </div>

      {/* FAQ-style content for SEO */}
      <div style={{
        maxWidth: '56rem', margin: '0 auto',
        padding: '0 var(--space-4) var(--space-12)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
          Frequently Asked Questions About {cityName} Deals
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              q: `How do I find garage sales in ${cityName}, ${market.state}?`,
              a: `Flip-ly scans ${summary.sources.length > 0 ? summary.sources.map(formatSourceName).join(', ') : 'Craigslist, EstateSales.net, and other local sources'} in the ${cityName} area every 4 hours. Sign up free to search deals or get a weekly digest with the best finds.`,
            },
            {
              q: `What is an AI deal score?`,
              a: `Every listing is analyzed by AI and rated 1\u201310 based on resale profit potential. Scores factor in price anomaly (30%), motivation signals (20%), brand detection (20%), listing quality (15%), and freshness (15%).`,
            },
            {
              q: `Is Flip-ly free to use?`,
              a: `Yes. The free tier includes 15 searches per day, one market, and a weekly email digest. Pro ($5/mo) adds unlimited searches, 3 markets, and daily digests. Power ($19/mo) adds unlimited markets and instant alerts.`,
            },
            {
              q: `How often are ${cityName} listings updated?`,
              a: `Sources are scanned every 4 hours (6 times per day). New listings are scored by AI within minutes of discovery.`,
            },
          ].map(faq => (
            <div key={faq.q} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '16px 20px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{faq.q}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-6) var(--space-4)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          &copy; {new Date().getFullYear()} Flip-ly.net &middot;{' '}
          <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About</Link>
          {' '}&middot;{' '}
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
        </p>
      </footer>

      {/* JSON-LD structured data for this market */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Garage Sales & Estate Sales in ${cityName}, ${market.state}`,
            description: `Find AI-scored garage sales, estate sales, and local deals in ${cityName}, ${market.state}. Updated every 4 hours.`,
            url: `https://flip-ly.net/garage-sales/${slug}`,
            isPartOf: { '@id': 'https://flip-ly.net/#website' },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
                { '@type': 'ListItem', position: 2, name: 'Garage Sales', item: 'https://flip-ly.net/garage-sales' },
                { '@type': 'ListItem', position: 3, name: `${cityName}, ${market.state}` },
              ],
            },
            ...(summary.total > 0 ? {
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: summary.total,
                itemListElement: [],
              },
            } : {}),
          }),
        }}
      />
    </main>
  )
}
