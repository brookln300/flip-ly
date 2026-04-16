import Link from 'next/link'
import { supabase } from '../lib/supabase'

export const dynamic = 'force-dynamic'

interface Market {
  id: string
  name: string
  state: string
  slug: string
  is_active: boolean
}

async function getMarketsByState() {
  const { data: markets } = await supabase
    .from('fliply_markets')
    .select('id, name, state, slug, is_active')
    .order('state', { ascending: true })
    .order('name', { ascending: true })

  if (!markets) return {}

  const byState: Record<string, Market[]> = {}
  for (const m of markets) {
    if (!byState[m.state]) byState[m.state] = []
    byState[m.state].push(m)
  }
  return byState
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
    { '@type': 'ListItem', position: 2, name: 'Garage Sales', item: 'https://flip-ly.net/garage-sales' },
  ],
}

export default async function GarageSalesIndex() {
  const byState = await getMarketsByState()
  const states = Object.keys(byState).sort()
  const totalMarkets = Object.values(byState).flat().length
  const activeMarkets = Object.values(byState).flat().filter(m => m.is_active).length

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 20px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ padding: '20px 0 0' }}>
          <ol style={{ display: 'flex', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
            <li><Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Flip-ly</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--text-muted)' }}>Garage Sales</li>
          </ol>
        </nav>

        {/* Header */}
        <header style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            Garage Sales & Estate Sales Near You
          </h1>
          <p style={{
            fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6,
            maxWidth: '40rem', marginBottom: '16px',
          }}>
            Browse {totalMarkets} markets across the US. Each city page shows live stats,
            AI-scored deals, and active sources. {activeMarkets} markets are currently scanning.
          </p>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
              {activeMarkets} active markets
            </span>
            <span style={{ color: 'var(--text-dim)' }}>
              {totalMarkets} total cities
            </span>
          </div>
        </header>

        {/* Jump nav */}
        <nav style={{
          padding: '24px 0', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', flexWrap: 'wrap', gap: '6px',
        }}>
          {states.map(st => (
            <a
              key={st}
              href={`#${st}`}
              style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--accent-green)',
                textDecoration: 'none', padding: '4px 8px',
                border: '1px solid rgba(22, 163, 74, 0.15)',
                borderRadius: '4px',
              }}
            >
              {st}
            </a>
          ))}
        </nav>

        {/* Markets by state */}
        <section style={{ padding: '32px 0 64px' }}>
          {states.map(st => (
            <div key={st} id={st} style={{ marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', marginBottom: '16px',
                paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)',
              }}>
                {STATE_NAMES[st] || st}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}>
                {byState[st].map(market => (
                  <Link
                    key={market.id}
                    href={`/garage-sales/${market.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: market.is_active ? '#16a34a' : '#64748b',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: '14px', fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}>
                      {market.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section style={{
          padding: '40px 0 64px', borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Don&apos;t see your city?
          </h3>
          <p style={{
            fontSize: '15px', color: 'var(--text-muted)', marginBottom: '20px',
          }}>
            We&apos;re adding new markets every week. Sign up and we&apos;ll notify you when your area goes live.
          </p>
          <Link href="/?signup=free" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'var(--accent-green)', color: '#000',
            borderRadius: '8px', fontSize: '15px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Sign up free
          </Link>
        </section>
      </div>
    </>
  )
}
