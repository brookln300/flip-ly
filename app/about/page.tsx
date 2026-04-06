import Link from 'next/link'

export const metadata = {
  title: 'About — Flip-ly.net',
  description: 'About Flip-ly.net — AI-powered garage sale finder helping you find deals near you.',
}

export default function About() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: '#000', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: '#22C55E' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>
        About Flip-ly
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>AI-powered garage sale finder</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>What We Do</h2>
          <p>Flip-ly.net is a garage sale, estate sale, and secondhand listing search engine. We aggregate publicly available listings from sources like Craigslist, Eventbrite, and EstateSales.net across 413 US markets, then score them using AI that evaluates deal quality on a 1&ndash;10 scale.</p>
          <p className="mt-2">We do the searching. You get the deals.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>How It Works</h2>
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
            <p className="mt-2"><strong style={{ color: 'var(--accent-green)' }}>Pro ($5/mo)</strong> — Unlimited searches, 3 markets, full score breakdowns, saved searches. Cancel anytime.</p>
            <p className="mt-2"><strong style={{ color: 'var(--accent-purple)' }}>Power ($19/mo)</strong> — Unlimited everything, instant alerts, category trends, 90-day history.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Who We Are</h2>
          <p>Flip-ly.net is operated by <strong>AetherCoreAI</strong>, based in Dallas, Texas. We believe garage sales are one of the most underrated ways to find value, and AI can surface deals that would otherwise get buried across dozens of sources.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Contact</h2>
          <p>Questions or feedback:</p>
          <p className="mt-2">
            <span style={{ color: '#22C55E' }}>hello@flip-ly.net</span>
          </p>
          <p className="mt-2" style={{ color: '#666' }}>
            AetherCoreAI<br />
            Dallas, TX
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Follow Us</h2>
          <div className="flex gap-4 mt-2">
            <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', textDecoration: 'underline' }}>X / Twitter</a>
            <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', textDecoration: 'underline' }}>TikTok</a>
            <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', textDecoration: 'underline' }}>Instagram</a>
            <a href="https://www.youtube.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', textDecoration: 'underline' }}>YouTube</a>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid #222' }}>
        <Link href="/terms" style={{ color: '#22C55E', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/privacy" style={{ color: '#22C55E', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/why" style={{ color: '#22C55E', textDecoration: 'underline' }}>Why Flip-ly?</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: '#444', fontFamily: 'system-ui, -apple-system, sans-serif' }}>&copy; 2026 Flip-ly.net &middot; AetherCoreAI</p>
      </div>
    </div>
  )
}
