import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Flip Desk — Reselling Guides & Deal Intelligence | Flip-ly.net',
  description: 'Reselling guides, deal-finding strategies, and market intelligence. Real frameworks from real data — no fluff, no filler.',
  openGraph: {
    title: 'The Flip Desk — Reselling Guides & Deal Intelligence',
    description: 'Reselling guides, deal-finding strategies, and market intelligence from the Flip-ly team.',
    url: 'https://flip-ly.net/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://flip-ly.net/blog',
  },
}

const posts = [
  {
    slug: 'estate-sale-flipping-guide',
    title: 'Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else',
    description: 'The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to. Real numbers, no fluff.',
    date: '2026-04-05',
    readTime: '6 min',
    tag: 'Strategy',
  },
]

/* Structured data for BreadcrumbList */
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flip-ly.net' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://flip-ly.net/blog' },
  ],
}

/* CollectionPage schema for the blog index */
const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'The Flip Desk',
  description: 'Reselling guides, deal-finding strategies, and market intelligence.',
  url: 'https://flip-ly.net/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Flip-ly',
    url: 'https://flip-ly.net',
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BlogIndex() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ padding: '20px 0 0' }}>
          <ol style={{ display: 'flex', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
            <li><Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Flip-ly</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--text-muted)' }}>Blog</li>
          </ol>
        </nav>

        {/* ── Header ── */}
        <header style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{
            fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--accent-green)', marginBottom: '12px',
          }}>
            The Flip Desk
          </p>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            Guides, strategies, and intelligence for resellers.
          </h1>
          <p style={{
            fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6,
            maxWidth: '36rem',
          }}>
            Frameworks that work, data that matters, and none of the filler. Written for people who flip for real money.
          </p>
        </header>

        {/* ── Posts ── */}
        <section style={{ padding: '48px 0 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {posts.map(post => (
              <article key={post.slug}>
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--accent-green)',
                      padding: '3px 8px', background: 'rgba(22, 163, 74, 0.08)',
                      borderRadius: '4px',
                    }}>
                      {post.tag}
                    </span>
                    <span style={{
                      fontSize: '13px', color: 'var(--text-dim)',
                    }}>
                      {formatDate(post.date)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      {post.readTime} read
                    </span>
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700,
                    color: 'var(--text-primary)', lineHeight: 1.25,
                    letterSpacing: '-0.02em', marginBottom: '8px',
                    transition: 'color 0.15s',
                  }}>
                    {post.title}
                  </h2>
                  <p style={{
                    fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.65,
                    maxWidth: '40rem',
                  }}>
                    {post.description}
                  </p>
                  <span style={{
                    display: 'inline-block', marginTop: '12px',
                    fontSize: '14px', fontWeight: 500, color: 'var(--accent-green)',
                  }}>
                    Read guide →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ── Newsletter / Coming soon teaser ── */}
        <section style={{
          padding: '40px 0', borderTop: '1px solid var(--border-subtle)',
          marginTop: '16px',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: '32px',
          }}>
            <h3 style={{
              fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)',
              marginBottom: '8px', letterSpacing: '-0.02em',
            }}>
              More guides shipping soon
            </h3>
            <p style={{
              fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6,
              marginBottom: '20px', maxWidth: '32rem',
            }}>
              Category deep dives, market-specific intel, and data-backed strategies from 50,000+ scored listings. Get the weekly digest to stay ahead.
            </p>
            <Link href="/?signup=free" style={{
              display: 'inline-block', padding: '10px 20px',
              background: 'var(--accent-green)', color: '#000',
              borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Get the weekly digest
            </Link>
          </div>
        </section>

        {/* ── Footer nav ── */}
        <div style={{
          padding: '24px 0 64px',
          textAlign: 'center',
        }}>
          <Link href="/" style={{
            fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none',
          }}>
            ← Back to Flip-ly
          </Link>
        </div>
      </div>
    </>
  )
}
