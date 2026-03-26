import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — FLIP-LY.NET',
  description: 'Privacy Policy for flip-ly.net',
}

export default function Privacy() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--darker)', color: '#ccc' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--lime)' }}>
        &larr; Back to the chaos
      </Link>

      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)' }}>
        Privacy Policy
      </h1>
      <p className="text-xs mb-8" style={{ color: '#666' }}>Last updated: March 26, 2026</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>What We Collect</h2>
          <p>When you sign up, we collect your email address, city, and zip code. That is it. We are not the NSA. We are a garage sale website that looks like it was made in 1996.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>How We Use It</h2>
          <p>Your email: to send you weekly listing digests (Thursdays at noon). Your city and zip: to find garage sales near you. Your data is never sold, rented, or traded for Beanie Babies.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Third-Party Services</h2>
          <p>We use the following services to operate flip-ly.net:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Resend</strong> — email delivery</li>
            <li><strong>Vercel</strong> — website hosting</li>
            <li><strong>Stripe</strong> — payment processing (if you donate or subscribe)</li>
            <li><strong>Cloudflare</strong> — DNS and CDN</li>
          </ul>
          <p className="mt-2">These services have their own privacy policies. We encourage you to review them if you are the kind of person who reads privacy policies. We respect that energy.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Cookies</h2>
          <p>We use minimal cookies for authentication (keeping you logged in) and preferences (like the mute toggle). We do not use tracking cookies, advertising cookies, or any cookies that taste good.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Data Retention</h2>
          <p>Your data is stored as long as your account is active. If you delete your account, your data is removed within 30 days. We do not keep backups of deleted accounts because we are too lazy for that level of organization.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Your Rights</h2>
          <p>You can request a copy of your data, ask us to delete it, or update your information at any time. Email <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span> and we will respond within 48 hours. Probably faster. We do not sleep much.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Children</h2>
          <p>Flip-ly.net is not intended for users under 13. If you are under 13, please go play outside. Garage sales will still be there when you grow up.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Changes</h2>
          <p>We may update this policy. If we do, we will post the changes here and update the date at the top. We will not send you a 47-page email about it.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--mustard)' }}>Contact</h2>
          <p>Privacy questions? Email <span style={{ color: 'var(--lime)' }}>hello@flip-ly.net</span></p>
        </section>
      </div>

      <div className="mt-12 pt-6" style={{ borderTop: '2px dashed var(--hotpink)' }}>
        <p className="text-xs" style={{ color: '#444' }}>&copy; 2026 AetherCoreAI. Dallas, TX.</p>
      </div>
    </div>
  )
}
