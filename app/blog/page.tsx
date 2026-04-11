import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Flip-ly.net',
  description: 'Reselling guides, deal-finding strategies, and market intelligence from the Flip-ly team.',
  openGraph: {
    title: 'Blog — Flip-ly.net',
    description: 'Reselling guides, deal-finding strategies, and market intelligence.',
    url: 'https://flip-ly.net/blog',
  },
}

const posts = [
  {
    slug: 'estate-sale-flipping-guide',
    title: 'Estate Sale Flipping: How to Find $500+ Deals Before Anyone Else',
    description: 'The scoring framework resellers use to filter thousands of listings down to the 3-5 worth driving to.',
    date: '2026-04-05',
    readTime: '6 min',
    tag: 'Strategy',
  },
]

export default function BlogIndex() {
  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '80px 16px' }}>
      <h1 style={{
        fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)',
        letterSpacing: '-0.03em', marginBottom: '8px',
      }}>
        Blog
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '48px' }}>
        Deal intelligence for resellers.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
        {posts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} style={{
            display: 'block', padding: '20px 16px', background: 'var(--bg-surface)',
            textDecoration: 'none', transition: 'background 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: 'var(--accent-green)', fontWeight: 600,
              }}>{post.tag}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {post.date} · {post.readTime}
              </span>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
              {post.title}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {post.description}
            </p>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none' }}>
          ← Back to Flip-ly
        </Link>
      </div>
    </div>
  )
}
