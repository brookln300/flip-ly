import Link from 'next/link'

export const metadata = {
  title: 'About — FLIP-LY.NET',
  description: 'About flip-ly.net — who we are, what we do, and why it looks like this.',
}

export default function About() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--darker)', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--lime)' }}>
        &larr; Back to the chaos
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--electric)' }}>
        About FLIP-LY.NET
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Yes, this is a real website. Yes, it is supposed to look like this.</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>What Is This?</h2>
          <p>Flip-ly.net is a garage sale, estate sale, and secondhand listing search engine for the Dallas-Fort Worth metroplex (expanding soon). We aggregate publicly available listings from sources like Craigslist, Eventbrite, and EstateSales.net, then score them using an AI system that evaluates deal quality on a 1&ndash;10 scale.</p>
          <p className="mt-2">Think of it as Google for garage sales, except Google would never let their website look like this.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Why Does It Look Like 1997?</h2>
          <p>On purpose. Every blinking text, Comic Sans heading, construction banner, and Windows 98 error dialog is intentional. The internet used to be fun, weird, and personal. We miss that. Modern web design is clean, professional, and soulless. We chose chaos.</p>
          <p className="mt-2">The retro aesthetic is not a sign of an unfinished website, a scam, or a security issue. It is the product. We are aware that it looks unhinged. Thank you for your concern.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>How It Works</h2>
          <ol className="list-decimal ml-6 mt-2 space-y-2">
            <li><strong>We scrape public listings</strong> — our automated system collects garage sale and estate sale listings from publicly available sources twice a week.</li>
            <li><strong>AI scores every deal</strong> — each listing gets a 1&ndash;10 deal score based on price, category, description, and historical patterns. Higher scores mean our robot thinks there is more flip potential.</li>
            <li><strong>You search and filter</strong> — enter your city or zip code, browse listings, and find deals near you.</li>
            <li><strong>Weekly digest</strong> — we email you the best finds every Thursday so you do not have to check manually.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Free vs. Pro</h2>
          <div className="mt-2 p-4 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--lime)' }}>
            <p><strong style={{ color: 'var(--lime)' }}>Free</strong> — 10 searches/day, partial deal scores, weekly digest on Thursdays at 5 PM</p>
            <p className="mt-2"><strong style={{ color: 'var(--hotpink)' }}>Pro ($5/month)</strong> — Unlimited searches, full scores with source URLs, weekly digest 6 hours early, priority deal alerts. Cancel anytime.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>The Lobster Hunt</h2>
          <p>Hidden somewhere on this website is a contest called the Lobster Hunt. Find the secret password and win a lobster dinner. There are decoys. There is a leaderboard. There are clues. No purchase necessary. See the <Link href="/contest-rules" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>Official Contest Rules</Link> for details.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Who Runs This?</h2>
          <p>Flip-ly.net is operated by <strong>AetherCoreAI</strong>, based in Dallas, Texas. We are a small team that believes garage sales are underrated, AI can find deals humans miss, and the internet should have more personality.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Contact</h2>
          <p>Questions, feedback, love letters, or complaints about our font choices:</p>
          <p className="mt-2">
            <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span>
          </p>
          <p className="mt-2" style={{ color: '#666' }}>
            AetherCoreAI<br />
            Dallas, TX
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Follow Us</h2>
          <div className="flex gap-4 mt-2">
            <a href="https://x.com/fliply_dot_net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>X (Twitter)</a>
            <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--hotpink)', textDecoration: 'underline' }}>TikTok</a>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '2px dashed var(--electric)' }}>
        <Link href="/terms" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/privacy" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/contest-rules" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Contest Rules</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: '#444' }}>&copy; 2026 AetherCoreAI. Dallas, TX.</p>
      </div>
    </div>
  )
}
