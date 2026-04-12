import Link from 'next/link'

export const metadata = {
  title: 'Why Flip-ly? — Flip-ly.net',
  description: 'Why we built Flip-ly — the problem with finding garage sales, and how we solved it.',
}

export default function WhyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <a href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            FLIP-LY
          </span>
        </a>
        <a href="/" className="text-xs" style={{
          color: 'var(--accent-green)', fontFamily: 'var(--font-primary)',
          textDecoration: 'none',
        }}>
          &larr; Back to Flip-ly
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4" style={{
          fontFamily: 'var(--font-primary)',
          letterSpacing: '-0.02em',
        }}>
          Why Flip-ly?
        </h1>
        <p className="mb-12" style={{ color: 'var(--text-muted)', fontSize: '15px', fontFamily: 'var(--font-primary)', lineHeight: 1.7 }}>
          Finding garage sales shouldn&apos;t be a full-time job. Here&apos;s why we built this.
        </p>

        <div className="space-y-10" style={{ fontFamily: 'var(--font-primary)', lineHeight: 1.8 }}>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              The Problem
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Garage sales, estate sales, and secondhand listings are scattered across dozens of sources &mdash;
              Craigslist, Facebook Marketplace, EstateSales.net, local community boards. To find the best deals,
              you have to manually check each one, every week. Most people don&apos;t have the time.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              The deals are out there. The problem is discovery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              What We Built
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Flip-ly aggregates listings from 20+ sources across 413 US markets into a single searchable database.
              Our AI evaluates every listing for flip potential, pricing anomalies, and deal quality. You see a simple
              1&ndash;10 score. We do the homework.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              Every Thursday at noon, you get one curated email with the best sales near your zip code.
              No app to download. No feed to scroll. Just the deals that matter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Who It&apos;s For
            </h2>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p><strong style={{ color: 'var(--accent-green)' }}>Flippers</strong> &mdash; People who buy low at garage sales and resell on eBay, Facebook Marketplace, or Mercari. Time is money. We save you the search.</p>
              <p><strong style={{ color: 'var(--accent-green)' }}>Bargain hunters</strong> &mdash; Anyone who loves a good deal. Furniture, tools, vintage items, electronics &mdash; if it&apos;s underpriced at a garage sale near you, we&apos;ll find it.</p>
              <p><strong style={{ color: 'var(--accent-green)' }}>Weekend explorers</strong> &mdash; People who enjoy hitting garage sales on Saturday morning but want to plan their route in advance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Simple Pricing
            </h2>
            <div className="mt-2 p-5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Free</strong> &mdash; 15 searches/day, 1 market, weekly digest on Thursdays.</p>
              <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--accent-green)' }}>Pro ($5/mo)</strong> &mdash; Unlimited searches, 3 markets, full score breakdowns, saved searches. Cancel anytime.</p>
              <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--accent-purple)' }}>Power ($19/mo)</strong> &mdash; Unlimited everything, instant alerts, category trends, 90-day history.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Built in Dallas
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Flip-ly is built by <strong>Duskfall Ventures LLC</strong> in McKinney, Texas. We started by solving our own problem &mdash;
              we wanted a better way to find garage sales in DFW. Now we&apos;re expanding across the country.
            </p>
          </section>

          {/* CTA */}
          <div className="text-center py-10" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Ready to find better deals?
            </p>
            <a href="/" style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: 'var(--accent-green)',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '15px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}>
              Get Started Free
            </a>
          </div>
        </div>
      </main>

      <footer className="px-4 py-6 text-center" style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>
          &copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC
        </p>
      </footer>
    </div>
  )
}
