import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy — Flip-ly.net',
  description: 'Refund Policy for Flip-ly.net — 7-day no-questions-asked refunds on any charge.',
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--accent-green)' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>
        Refund Policy
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: April 12, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'var(--font-primary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>1. Cancellation</h2>
          <p>Cancel your paid subscription anytime from your dashboard or by emailing <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>. Cancellation takes effect at the end of your current billing period &mdash; you keep access until then. No cancellation fees.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>2. Refunds</h2>
          <p>If you&apos;re not satisfied, email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span> within 7 days of any charge and we&apos;ll issue a full refund for that billing period. No questions asked. Refunds are processed through Stripe and typically appear within 5&ndash;10 business days.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>3. What Qualifies</h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Refund requests within 7 days of a charge</li>
            <li>Dissatisfaction with the service</li>
            <li>Technical issues that prevented access</li>
            <li>Accidental renewal after forgetting to cancel</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>4. Founding Member Pricing</h2>
          <p>If you enrolled in a paid plan during an advertised founding member window and later cancel, your founding member rate is preserved on resubscription. The lock is tied to the account that enrolled during the founding window, not to the subscription record. Users who did not enroll during a founding window are billed at then-current rates shown at <Link href="/pro" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>flip-ly.net/pro</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>5. Data After Cancellation</h2>
          <p>Your account and search history are retained for 30 days after cancellation. After that, data is permanently deleted per our <Link href="/privacy" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Privacy Policy</Link>. You can request immediate deletion at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>6. Contact</h2>
          <p>Questions about refunds? Email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>.</p>
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
        <Link href="/terms" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/about" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>&copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC</p>
      </div>
    </div>
  )
}
