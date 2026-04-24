import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Flip-ly.net',
  description: 'Privacy Policy for Flip-ly.net — what we collect, how we use it, and how we protect it.',
}

export default function Privacy() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--accent-green)' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>
        Privacy Policy
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: April 12, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'var(--font-primary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Who We Are</h2>
          <p>Flip-ly.net is operated by Duskfall Ventures LLC, based in McKinney, Texas. We are a garage sale listing aggregator that helps you find deals near you. We do not sell your data to advertisers or any third party.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>What We Collect</h2>
          <p>When you interact with flip-ly.net, we may collect the following information:</p>

          <h3 className="font-bold mt-4 mb-1" style={{ color: 'var(--text-secondary)' }}>Account Registration</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Email address</strong> (required) — to send you listing digests and service emails</li>
            <li><strong>Password</strong> — stored as a one-way bcrypt hash (we cannot read your password)</li>
            <li><strong>City, state, zip code</strong> (optional) — to find garage sales near you</li>
          </ul>

          <h3 className="font-bold mt-4 mb-1" style={{ color: 'var(--text-secondary)' }}>Payment Information</h3>
          <p>If you subscribe to a paid plan, payment is processed entirely by <strong>Stripe</strong>. We never see, store, or have access to your credit card number. We store only your Stripe customer ID and subscription ID to manage your account status.</p>

          <h3 className="font-bold mt-4 mb-1" style={{ color: 'var(--text-secondary)' }}>Search Activity</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Search queries and timestamps are logged for rate limiting (free users: 10 searches/day)</li>
            <li>For logged-in users, searches are associated with your user ID</li>
            <li>For non-logged-in users, searches are tracked by IP address</li>
            <li>Search logs are automatically cleaned up weekly</li>
          </ul>

          <h3 className="font-bold mt-4 mb-1" style={{ color: 'var(--text-secondary)' }}>Automatically Collected</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>IP address (for rate limiting and security)</li>
            <li>Browser user agent (for compatibility and security)</li>
            <li>Pages visited and interactions (via Google Analytics 4 — see below)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>How We Use Your Data</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Email</strong> — weekly listing digests, onboarding sequences, and service updates</li>
            <li><strong>City/zip</strong> — to find garage sales near your location</li>
            <li><strong>Search logs</strong> — to enforce rate limits and improve search quality</li>
            <li><strong>Analytics</strong> — to understand how the site is used and improve the experience</li>
          </ul>
          <p className="mt-2">Your data is never sold, rented, or shared with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Email Tracking</h2>
          <p>We use Resend for email delivery. Our email system tracks:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Delivery status</strong> — whether your email was delivered, bounced, or deferred</li>
            <li><strong>Open events</strong> — whether you opened the email</li>
            <li><strong>Click events</strong> — whether you clicked links in the email</li>
            <li><strong>Complaint events</strong> — if you marked the email as spam</li>
          </ul>
          <p className="mt-2">This data helps us ensure emails are being delivered and understand what content is useful.</p>
          <p className="mt-2">Every email includes a one-click unsubscribe link that complies with CAN-SPAM and RFC 8058. We honor unsubscribe requests immediately.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
          <p>We use <strong>Google Analytics 4</strong> to understand how the site is used. GA4 collects:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Pages visited and time spent</li>
            <li>General geographic region (not precise location)</li>
            <li>Device type and browser</li>
            <li>Referral source (how you found us)</li>
          </ul>
          <p className="mt-2">We also send custom events to GA4 via server-side measurement protocol, including signup completions, search activity, and subscription events. These events are associated with anonymized client IDs, not your personal information.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Third-Party Services</h2>
          <p>We use the following services to operate flip-ly.net:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Supabase</strong> — database hosting and data storage</li>
            <li><strong>Resend</strong> — email delivery and webhook event tracking</li>
            <li><strong>Vercel</strong> — website hosting and serverless functions</li>
            <li><strong>Stripe</strong> — payment processing for Pro subscriptions</li>
            <li><strong>Cloudflare</strong> — DNS, CDN, and DDoS protection</li>
            <li><strong>Google Analytics 4</strong> — website analytics and event tracking</li>
          </ul>
          <p className="mt-2">Each service has its own privacy policy. Your data is shared with these services only as necessary to operate the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Cookies</h2>
          <p>We use the following cookies:</p>
          <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Essential (always active):</p>
          <ul className="list-disc ml-6 mt-1 space-y-1">
            <li><strong>fliply_token</strong> (httpOnly) — session authentication, expires after 7 days</li>
            <li><strong>fliply_cookie_consent</strong> (localStorage) — stores your cookie preference</li>
          </ul>
          <p className="mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Analytics (loaded only with your consent):</p>
          <ul className="list-disc ml-6 mt-1 space-y-1">
            <li><strong>_ga</strong> — Google Analytics unique visitor ID, expires after 2 years</li>
            <li><strong>_ga_*</strong> — Google Analytics session data, expires after 1 year</li>
            <li><strong>_gid</strong> — Google Analytics session ID, expires after 24 hours</li>
            <li><strong>Vercel Analytics</strong> — page views and performance (cookieless, consent-gated)</li>
          </ul>
          <p className="mt-3">Analytics cookies are <strong>not loaded</strong> until you click &ldquo;Accept&rdquo; on our cookie banner. You can withdraw consent at any time by clearing your browser cookies — the banner will reappear. We do not use advertising or retargeting cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Data Retention</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Account data</strong> — stored as long as your account is active</li>
            <li><strong>Search logs</strong> — automatically cleaned up weekly (logs older than 7 days are deleted)</li>
            <li><strong>Email event data</strong> — retained for analytics purposes</li>
            <li><strong>Account deletion</strong> — if you delete your account, all personal data is removed within 30 days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Access</strong> — request a copy of your personal data</li>
            <li><strong>Correction</strong> — update or correct your information</li>
            <li><strong>Deletion</strong> — request deletion of your account and data</li>
            <li><strong>Opt out</strong> — unsubscribe from emails at any time</li>
            <li><strong>Portability</strong> — request your data in a portable format</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span> and we will respond within 48 hours.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>California Residents (CCPA)</h2>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>The right to know what personal information is collected and how it is used</li>
            <li>The right to delete your personal information</li>
            <li>The right to opt out of the sale of personal information</li>
            <li>The right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p className="mt-2"><strong>We do not sell your personal information.</strong> To submit a CCPA request, email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span> with the subject line &quot;CCPA Request.&quot;</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Do Not Track</h2>
          <p>We respect Do Not Track (DNT) browser signals. When DNT is enabled, we still use essential cookies for authentication but minimize analytics tracking where technically feasible.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Children</h2>
          <p>Flip-ly.net is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected data from a child under 13, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Security</h2>
          <p>We take reasonable measures to protect your data, including:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Passwords hashed with bcrypt (12 rounds)</li>
            <li>HTTPS encryption on all connections</li>
            <li>HttpOnly session cookies</li>
            <li>Webhook signature verification on all incoming webhooks</li>
            <li>Rate limiting on authentication and API endpoints</li>
          </ul>
          <p className="mt-2">No system is 100% secure. If we discover a breach, we will notify affected users within 72 hours.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the date at the top of this page. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Contact</h2>
          <p>Privacy questions? Email <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span></p>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Duskfall Ventures LLC<br />
            9309 Sterling Gate Drive<br />
            McKinney, TX 75072<br />
            (469) 885-8164
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/terms" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Terms of Service</Link>
        <Link href="/data-deletion" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Data Deletion</Link>
        <Link href="/about" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>About</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>&copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC</p>
      </div>
    </div>
  )
}
