import Link from 'next/link'

export const metadata = {
  title: 'Official Contest Rules — The Lobster Hunt — Flip-ly.net',
  description: 'Official rules for the Lobster Hunt contest on Flip-ly.net. No purchase necessary.',
}

export default function ContestRules() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: '#000', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: '#22C55E' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>
        Official Contest Rules
      </h1>
      <h2 className="text-xl mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#888' }}>
        The Lobster Hunt
      </h2>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Last updated: March 28, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>1. No Purchase Necessary</h2>
          <p><strong>NO PURCHASE OR PAYMENT IS NECESSARY TO ENTER OR WIN.</strong> A purchase will not improve your chances of winning. The contest is free to enter for all eligible participants.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>2. Eligibility</h2>
          <p>The Lobster Hunt is open to legal residents of the United States who are 18 years of age or older at the time of entry. Employees, officers, and directors of AetherCoreAI and their immediate family members are not eligible.</p>
          <p className="mt-2">Void where prohibited by law.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>3. Contest Period</h2>
          <p>The Lobster Hunt is an ongoing contest that began on March 27, 2026. The contest will remain active until a winner is confirmed or the Sponsor elects to end the contest, whichever occurs first. The Sponsor reserves the right to extend, modify, or terminate the contest at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>4. How to Enter</h2>
          <p>To enter the contest:</p>
          <ol className="list-decimal ml-6 mt-2 space-y-1">
            <li>Visit flip-ly.net</li>
            <li>Locate the hidden contest entry point on the website</li>
            <li>Enter a password in the contest terminal</li>
          </ol>
          <p className="mt-2">The website contains clues to help you discover the correct password. The contest is designed as a puzzle — exploration and attention to detail are encouraged.</p>
          <p className="mt-2"><strong>Rate limit:</strong> Participants are limited to 20 password attempts per hour per IP address to prevent automated abuse.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>5. Decoy Passwords</h2>
          <p>The contest contains seven (7) decoy passwords that trigger humorous &quot;prize&quot; screens. These are not real prizes and will not be shipped. Finding a decoy earns you a spot on the <Link href="/lobster-hunt" style={{ color: '#22C55E', textDecoration: 'underline' }}>leaderboard</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>6. The Real Prize</h2>
          <p><strong>Prize:</strong> One (1) lobster dinner delivered to the winner. Approximate retail value: $150 USD.</p>
          <p className="mt-2">The prize will be fulfilled via a food delivery service or equivalent gift card at the Sponsor&apos;s discretion. The prize is non-transferable and cannot be exchanged for cash.</p>
          <p className="mt-2"><strong>Number of prizes:</strong> One (1). The first person to enter the correct password wins. Once the prize is claimed, the contest ends.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>7. Odds of Winning</h2>
          <p>The odds of winning depend on the number of entries received and the participant&apos;s ability to solve the puzzle. This is a skill-based contest, not a random drawing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>8. Winner Notification</h2>
          <p>The winner will be notified via the email address provided on the contest result screen. If the winner does not respond within 14 days, the prize may be forfeited and no alternate winner will be selected.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>9. Data Collection</h2>
          <p>Contest participation involves the collection of:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Chosen agent name (display name for the leaderboard)</li>
            <li>Password attempts</li>
            <li>IP address and browser user agent (for rate limiting and fraud prevention)</li>
            <li>Email address (voluntarily provided on result screens)</li>
          </ul>
          <p className="mt-2">See our <Link href="/privacy" style={{ color: '#22C55E', textDecoration: 'underline' }}>Privacy Policy</Link> for full details.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>10. General Conditions</h2>
          <p>By entering, participants agree to be bound by these Official Rules and the decisions of the Sponsor, which are final. The Sponsor reserves the right to disqualify any entrant who tampers with the entry process or violates these rules.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>11. Governing Law</h2>
          <p>This contest is governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Dallas County, Texas.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>12. Sponsor</h2>
          <p style={{ color: '#666' }}>
            AetherCoreAI<br />
            Dallas, TX<br />
            <span style={{ color: '#22C55E' }}>hello@flip-ly.net</span>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid #222' }}>
        <Link href="/terms" style={{ color: '#22C55E', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/privacy" style={{ color: '#22C55E', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/lobster-hunt" style={{ color: '#22C55E', textDecoration: 'underline' }}>Leaderboard</Link>
        <Link href="/about" style={{ color: '#22C55E', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: '#444', fontFamily: 'system-ui, -apple-system, sans-serif' }}>&copy; 2026 Flip-ly.net &middot; AetherCoreAI</p>
      </div>
    </div>
  )
}
