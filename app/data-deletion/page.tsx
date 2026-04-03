import Link from 'next/link'

export const metadata = {
  title: 'Data Deletion — Flip-ly.net',
  description: 'Request deletion of your data from Flip-ly.net.',
}

export default function DataDeletion() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: '#000', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: '#22C55E' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>
        Data Deletion
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Last updated: March 31, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Your Data, Your Choice</h2>
          <p>If you want your data deleted from flip-ly.net, we will delete it. No retention flows, no friction. You ask, we delete.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>What Gets Deleted</h2>
          <p>When you request data deletion, we remove the following:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Account information</strong> — email, password hash, profile data</li>
            <li><strong>Search history</strong> — all logged searches and activity</li>
            <li><strong>Location preferences</strong> — city, state, zip code</li>
            <li><strong>Subscription data</strong> — Stripe customer association (the subscription itself is cancelled through Stripe)</li>
            <li><strong>Email event history</strong> — delivery, open, and click tracking data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>What We Cannot Delete</h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Stripe payment records</strong> — Stripe retains transaction history per their own data retention policies. Contact <a href="https://support.stripe.com" style={{ color: '#22C55E', textDecoration: 'underline' }}>Stripe Support</a> for payment record deletion.</li>
            <li><strong>Google Analytics data</strong> — anonymized analytics data already collected by GA4 cannot be retroactively removed by us. This data is not personally identifiable.</li>
            <li><strong>Server logs</strong> — standard web server logs retained by Vercel for up to 30 days, after which they are automatically purged.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>How to Request Deletion</h2>
          <p>You have two options:</p>

          <h3 className="font-bold mt-4 mb-1" style={{ color: '#aaa' }}>Option 1: Email Us</h3>
          <p>Send an email to <span style={{ color: '#22C55E' }}>hello@flip-ly.net</span> with the subject line <strong>&quot;Delete My Data&quot;</strong> from the email address associated with your account. We will confirm deletion within 48 hours.</p>

          <h3 className="font-bold mt-4 mb-1" style={{ color: '#aaa' }}>Option 2: Direct Contact</h3>
          <p>Email <span style={{ color: '#22C55E' }}>knation@gmail.com</span> with your account email and the words &quot;data deletion request.&quot; Same 48-hour turnaround.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Facebook / Meta Login</h2>
          <p>If you signed up or logged in using Facebook, you can also request data deletion directly through Facebook:</p>
          <ol className="list-decimal ml-6 mt-2 space-y-1">
            <li>Go to your Facebook Settings &amp; Privacy &rarr; Settings</li>
            <li>Click &quot;Apps and Websites&quot;</li>
            <li>Find &quot;Flip-ly Social&quot; and click &quot;Remove&quot;</li>
            <li>Check the box to delete all data the app received about you</li>
          </ol>
          <p className="mt-2">When you remove the app through Facebook, we receive a deletion callback and will process your request automatically. To confirm deletion was completed, email us at <span style={{ color: '#22C55E' }}>hello@flip-ly.net</span>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Timeline</h2>
          <p>Data deletion is completed within <strong>30 days</strong> of your request. In practice, we typically handle it within 48 hours.</p>
          <p className="mt-2">You will receive a confirmation email when deletion is complete.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Questions?</h2>
          <p>Email <span style={{ color: '#22C55E' }}>hello@flip-ly.net</span>.</p>
          <p className="mt-2" style={{ color: '#666' }}>
            AetherCoreAI<br />
            Dallas, TX
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid #222' }}>
        <Link href="/privacy" style={{ color: '#22C55E', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#22C55E', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/about" style={{ color: '#22C55E', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: '#444', fontFamily: 'system-ui, -apple-system, sans-serif' }}>&copy; 2026 Flip-ly.net &middot; AetherCoreAI</p>
      </div>
    </div>
  )
}
