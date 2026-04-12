import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Flip-ly.net',
  description: 'Terms of Service for Flip-ly.net — AI-powered garage sale finder.',
}

export default function Terms() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--accent-green)' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>
        Terms of Service
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: April 12, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'var(--font-primary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using flip-ly.net (&quot;the Service&quot;), operated by Duskfall Ventures LLC (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>2. Description of Service</h2>
          <p>Flip-ly.net is a garage sale, estate sale, and secondhand listing aggregator. We collect publicly available listing data from sources including Craigslist, Eventbrite, EstateSales.net, and others, then present it in a searchable format with AI-powered deal scoring.</p>
          <p className="mt-2">The Service includes free and paid tiers, email communications, and an AI-powered deal scoring system.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>3. User Accounts</h2>
          <p>You may create an account using your email address. You are responsible for maintaining the confidentiality of your password and the security of your account. You agree to notify us immediately of any unauthorized use.</p>
          <p className="mt-2">We will never ask for your password via email or any other channel.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>4. Free, Pro, and Power Tiers</h2>
          <p><strong style={{ color: 'var(--accent-green)' }}>Free accounts</strong> include up to 15 searches per day, score number only, and a weekly email digest.</p>
          <p className="mt-2"><strong style={{ color: 'var(--accent-green)' }}>Pro accounts</strong> ($5/month) include unlimited searches, full score breakdowns with source URLs, 3 markets, saved searches, and early digest access. Billed monthly through Stripe. Cancel anytime.</p>
          <p className="mt-2"><strong style={{ color: 'var(--accent-purple)' }}>Power accounts</strong> ($19/month) include everything in Pro plus unlimited markets, instant deal alerts, category trends, and 90-day deal history. Billed monthly through Stripe. Cancel anytime.</p>
          <p className="mt-2">Refunds are governed by our <Link href="/refund" style={{ color: "var(--accent-green)", textDecoration: "underline" }}>Refund Policy</Link> &mdash; 7-day no-questions-asked window on any charge.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>5. AI Deal Scoring Disclaimer</h2>
          <p>Flip-ly.net uses an AI-powered scoring system to rate listings on a 1&ndash;10 scale based on factors including price, category, description quality, and historical patterns. These scores are <strong>algorithmic estimates, not financial advice</strong>. We make no guarantees about the accuracy, profitability, or resale value of any listing.</p>
          <p className="mt-2">Use your own judgment when making purchasing decisions based on our scores.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>6. Content Accuracy</h2>
          <p>Listing data is aggregated from publicly available third-party sources. We make no guarantees about accuracy, availability, or pricing. Listings may be outdated, removed, or inaccurate at the source. Visit sales at your own discretion.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>7. Email Communications</h2>
          <p>By creating an account, you consent to receive the following email communications:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Welcome and onboarding emails</li>
            <li>Weekly listing digest (Thursdays)</li>
            <li>Feature updates and tips</li>
            <li>Service announcements</li>
          </ul>
          <p className="mt-2">Every email includes a one-click unsubscribe link. You can also unsubscribe at any time by emailing <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>8. Intellectual Property</h2>
          <p>The flip-ly.net website, its design, code, branding, and all original content are the property of Duskfall Ventures LLC.</p>
          <p className="mt-2">Listing data is sourced from third parties and remains the property of its original publishers. We display it under fair use for aggregation purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>9. Prohibited Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Use the Service to harass sellers, spam listings, or engage in fraud</li>
            <li>Attempt to scrape, reverse-engineer, or exploit the Service or its APIs</li>
            <li>Create multiple accounts to circumvent search limits or rate limiting</li>
            <li>Use automated tools (bots, scrapers) to access the Service</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Use the Service for any illegal purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>10. Limitation of Liability</h2>
          <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. DUSKFALL VENTURES LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>11. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Duskfall Ventures LLC, its operators, and affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>12. Termination</h2>
          <p>We may suspend or terminate accounts that violate these Terms. You may delete your account at any time by contacting us at <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>. Upon termination, your data will be handled according to our <Link href="/privacy" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>13. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Collin County, Texas.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>14. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be reflected by updating the date at the top of this page. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>15. Contact</h2>
          <p>Questions about these Terms? Email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>.</p>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Duskfall Ventures LLC<br />
            9309 Sterling Gate Drive<br />
            McKinney, TX 75072<br />
            (469) 885-8164
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/privacy" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/data-deletion" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Data Deletion</Link>
        <Link href="/about" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>&copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC</p>
      </div>
    </div>
  )
}
