import Link from 'next/link'
import { getFoundingSnapshot } from '../lib/founding'
import { getPowerVisibility } from '../lib/pricing'

export const metadata = {
  title: 'About — Flip-ly.net',
  description: 'About Flip-ly.net — AI-powered garage sale finder helping you find deals near you.',
}

export default function About() {
  const founding = getFoundingSnapshot()
  const proPrice = founding.priceVariant === 'founding' ? founding.foundingPrice : founding.normalPrice
  const showPower = getPowerVisibility() === 'public'
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--accent-green)' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>
        About Flip-ly
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>AI-powered garage sale finder</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'var(--font-primary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>What We Do</h2>
          <p>Flip-ly.net is a garage sale, estate sale, and secondhand listing search engine. We aggregate publicly available listings from sources like Craigslist, Eventbrite, and EstateSales.net across 413 US markets, then score them using AI that evaluates deal quality on a 1&ndash;10 scale.</p>
          <p className="mt-2">We do the searching. You get the deals.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>How It Works</h2>
          <ol className="list-decimal ml-6 mt-2 space-y-2">
            <li><strong>We scan public listings</strong> — our automated system collects garage sale and estate sale listings from 20+ publicly available sources in your area.</li>
            <li><strong>AI scores every deal</strong> — each listing gets a 1&ndash;10 deal score based on price, category, description, and historical patterns.</li>
            <li><strong>You search and filter</strong> — enter your city or zip code, browse listings, and find deals near you.</li>
            <li><strong>Weekly digest</strong> — every Thursday at noon, we email you the best finds so you never miss a deal.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Plans</h2>
          <div className="mt-2 p-4 rounded" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Free</strong> — 15 searches/day, 1 market, weekly digest on Thursdays.</p>
            <p className="mt-2"><strong style={{ color: 'var(--accent-green)' }}>Pro (${proPrice}/mo)</strong> — Unlimited searches, 3 markets, full score breakdowns, saved searches. Cancel anytime.</p>
            {showPower && (
              <p className="mt-2"><strong style={{ color: 'var(--accent-purple)' }}>Power ($19/mo)</strong> — Unlimited everything, instant alerts, category trends, 90-day history.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Who We Are</h2>
          <p>Flip-ly.net is operated by <strong>Duskfall Ventures LLC</strong>, based in McKinney, Texas. We believe garage sales are one of the most underrated ways to find value, and AI can surface deals that would otherwise get buried across dozens of sources.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Contact</h2>
          <p>Questions or feedback:</p>
          <p className="mt-2">
            <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>
          </p>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Duskfall Ventures LLC<br />
            9309 Sterling Gate Drive<br />
            McKinney, TX 75072<br />
            (469) 885-8164
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Follow Us</h2>
          <div className="flex gap-4 mt-2">
            <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>X / Twitter</a>
            <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>TikTok</a>
            <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Instagram</a>
            <a href="https://www.youtube.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>YouTube</a>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/terms" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/privacy" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/why" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Why Flip-ly?</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>&copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC</p>
      </div>
    </div>
  )
}
