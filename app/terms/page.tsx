import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — FLIP-LY.NET',
  description: 'Terms of Service for flip-ly.net — the garage sale search engine that looks like 1997.',
}

export default function Terms() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--darker)', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--lime)' }}>
        &larr; Back to the chaos
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
        Terms of Service
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Last updated: March 28, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using flip-ly.net (&quot;the Service&quot;), operated by AetherCoreAI (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, please close this tab and go outside. Touch grass. We hear it is nice.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>2. Description of Service</h2>
          <p>Flip-ly.net is a garage sale, estate sale, and secondhand listing aggregator. We collect publicly available listing data from sources including Craigslist, Eventbrite, EstateSales.net, and others, then present it in a searchable format styled to resemble a 1997 GeoCities page. That part is intentional.</p>
          <p className="mt-2">The Service includes free and paid tiers, email communications, an AI-powered deal scoring system, and an interactive contest (the &quot;Lobster Hunt&quot;).</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>3. User Accounts</h2>
          <p>You may create an account using your email address. You are responsible for maintaining the confidentiality of your password and the security of your account. You agree to notify us immediately of any unauthorized use.</p>
          <p className="mt-2">We will never ask for your password via email, carrier pigeon, Telegram, or fax machine. If someone does, that is not us.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>4. Free and Pro Tiers</h2>
          <p><strong style={{ color: 'var(--lime)' }}>Free accounts</strong> include up to 10 searches per day, partially redacted deal scores, and a weekly email digest.</p>
          <p className="mt-2"><strong style={{ color: 'var(--hotpink)' }}>Pro accounts</strong> ($5/month) include unlimited searches, full deal scores with source URLs, early access to the weekly digest (6 hours before free users), and priority deal alerts. Subscriptions are billed monthly through Stripe and can be cancelled at any time through the customer portal. No contracts, no commitments, no guilt trips.</p>
          <p className="mt-2">Refunds are handled on a case-by-case basis. We are reasonable humans. Email us and we will work it out.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>5. AI Deal Scoring Disclaimer</h2>
          <p>Flip-ly.net uses an AI-powered scoring system to rate listings on a 1&ndash;10 scale based on factors including price, category, description quality, and historical patterns. These scores are <strong>algorithmic estimates, not financial advice</strong>. We make no guarantees about the accuracy, profitability, or resale value of any listing.</p>
          <p className="mt-2">A score of 10/10 does not mean &quot;guaranteed profit.&quot; It means our robot thinks it looks promising. Our robot also thinks Comic Sans is a valid font choice. Use your own judgment.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>6. Content Accuracy</h2>
          <p>Listing data is aggregated from publicly available third-party sources. We make no guarantees about accuracy, availability, pricing, or whether that couch actually smells like possibility. Listings may be outdated, removed, or inaccurate at the source. Visit sales at your own discretion.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>7. Email Communications</h2>
          <p>By creating an account, you consent to receive the following email communications:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Welcome and onboarding emails</li>
            <li>Weekly listing digest (Thursdays)</li>
            <li>Drip email sequences related to features and tips</li>
            <li>Contest-related notifications (if you participate in the Lobster Hunt)</li>
            <li>Service announcements and updates</li>
          </ul>
          <p className="mt-2">Every email includes a one-click unsubscribe link. You can also unsubscribe at any time by emailing <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span>. We respect your inbox.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>8. The Lobster Hunt Contest</h2>
          <p>The Lobster Hunt is an interactive contest embedded in the site. Participation is governed by the <Link href="/contest-rules" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>Official Contest Rules</Link>. Key points:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>No purchase necessary to enter or win</li>
            <li>Open to legal residents of the United States, 18 years or older</li>
            <li>Contains decoy passwords designed for entertainment</li>
            <li>The real prize is a lobster dinner (approximate retail value: $150)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>9. Intellectual Property</h2>
          <p>The flip-ly.net website, its design, code, branding, lobster imagery, and all original content are the property of AetherCoreAI. The intentionally chaotic aesthetic is protected by our questionable taste and copyright law.</p>
          <p className="mt-2">Listing data is sourced from third parties and remains the property of its original publishers. We display it under fair use for aggregation purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>10. Prohibited Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Use the Service to harass sellers, spam listings, or engage in fraud</li>
            <li>Attempt to scrape, reverse-engineer, or exploit the Service or its APIs</li>
            <li>Create multiple accounts to circumvent search limits or rate limiting</li>
            <li>Use automated tools (bots, scrapers) to access the Service</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Use the Service for any illegal purpose</li>
          </ul>
          <p className="mt-2">The chaos is cosmetic. The security is real.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>11. Limitation of Liability</h2>
          <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. AETHERCOREAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>
          <p className="mt-2">We are a garage sale search engine. If you buy a haunted lamp at a garage sale because our robot gave it a 9/10, that is between you and the lamp.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>12. Indemnification</h2>
          <p>You agree to indemnify and hold harmless AetherCoreAI, its operators, and affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>13. Termination</h2>
          <p>We may suspend or terminate accounts that violate these Terms. You may delete your account at any time by contacting us at <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span>. Upon termination, your data will be handled according to our <Link href="/privacy" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>14. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Dallas County, Texas. We chose Texas because that is where we are and also because everything is bigger here, including our legal disclaimers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>15. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. If we make material changes, we will update the date at the top and may notify you via email. We will not send you a 47-page legal document about it. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>16. Contact</h2>
          <p>Questions about these Terms? Email <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span> or yell into the void. We check both.</p>
          <p className="mt-2" style={{ color: '#666' }}>
            AetherCoreAI<br />
            Dallas, TX
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '2px dashed var(--lime)' }}>
        <Link href="/privacy" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/contest-rules" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>Contest Rules</Link>
        <Link href="/about" style={{ color: 'var(--electric)', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: '#444' }}>&copy; 2026 AetherCoreAI. Dallas, TX.</p>
      </div>
    </div>
  )
}
