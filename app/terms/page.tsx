import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — FLIP-LY.NET',
  description: 'Terms of Service for flip-ly.net',
}

export default function Terms() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--darker)', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--lime)' }}>
        &larr; Back to the chaos
      </Link>

      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)' }}>
        Terms of Service
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Last updated: March 26, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>1. Acceptance of Terms</h2>
          <p>By accessing flip-ly.net, you agree to these Terms of Service. If you disagree, please close this tab and go outside. Touch grass. We hear it is nice.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>2. The Service</h2>
          <p>Flip-ly.net is a garage sale and estate sale listing aggregator. We collect publicly available listing data and present it in a format that looks like it was designed in 1997. That part is intentional.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>3. User Accounts</h2>
          <p>You may create an account using your email address. You are responsible for maintaining the security of your account. We will never ask for your password via email, carrier pigeon, or fax machine.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>4. User Data</h2>
          <p>We collect your email address, city, and zip code to provide location-based listing alerts. We do not sell your data. We do not share your data with third parties except as required to operate the service (email delivery via Resend).</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>5. Paid Features</h2>
          <p>Some features may require a paid subscription ($9/month). Subscriptions can be cancelled at any time. Refunds are handled on a case-by-case basis. We are reasonable humans.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>6. Content Accuracy</h2>
          <p>Listing data is aggregated from public sources. We make no guarantees about accuracy, availability, or whether that couch actually smells like possibility. Visit at your own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>7. Prohibited Use</h2>
          <p>Do not use flip-ly.net to harass sellers, spam listings, or attempt to hack our intentionally broken-looking website. The chaos is cosmetic. The security is real.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>8. Termination</h2>
          <p>We may terminate accounts that violate these terms. You may delete your account at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>9. Contact</h2>
          <p>Questions? Email us at <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span> or just yell into the void. We check both.</p>
        </section>
      </div>

      <div className="mt-12 pt-6" style={{ borderTop: '2px dashed var(--lime)' }}>
        <p className="text-xs" style={{ color: '#444' }}>&copy; 2026 AetherCoreAI. Dallas, TX.</p>
      </div>
    </div>
  )
}
