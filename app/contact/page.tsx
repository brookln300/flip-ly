import Link from 'next/link'

export const metadata = {
  title: 'Contact Us — Flip-ly.net',
  description: 'Get in touch with the Flip-ly team. Questions, feedback, or bug reports — we read every message.',
}

export default function Contact() {
  return (
    <div className="min-h-screen px-6 py-16 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <Link href="/" className="text-sm no-underline mb-8 inline-block" style={{ color: 'var(--accent-green)' }}>
        &larr; Back to Flip-ly
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>
        Contact Us
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>We want to hear from you</p>

      <div className="space-y-6 text-sm" style={{ lineHeight: 1.8, fontFamily: 'var(--font-primary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Get in Touch</h2>
          <p>We read every message. Whether you have a question about your account, found a bug, or want to suggest a feature &mdash; we want to hear from you.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Email</h2>
          <p>
            <a href="mailto:hello@flip-ly.net" style={{ color: 'var(--accent-green)', textDecoration: 'underline', fontWeight: 600 }}>hello@flip-ly.net</a>
          </p>
          <p className="mt-2">We respond within 24 hours on business days.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Phone</h2>
          <p>(469) 885-8164</p>
          <p className="mt-2">Voicemail monitored during business hours (CT).</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Mailing Address</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Duskfall Ventures LLC<br />
            9309 Sterling Gate Drive<br />
            McKinney, TX 75072
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Follow Us</h2>
          <div className="flex gap-4 mt-2">
            <a href="https://x.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>X / Twitter</a>
            <a href="https://tiktok.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>TikTok</a>
            <a href="https://instagram.com/ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Instagram</a>
            <a href="https://www.youtube.com/@ctrl_alt_flip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>YouTube</a>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/about" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>About</Link>
        <Link href="/privacy" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>Terms of Service</Link>
      </div>
      <div className="mt-4">
        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-primary)' }}>&copy; 2026 Flip-ly.net &middot; Duskfall Ventures LLC</p>
      </div>
    </div>
  )
}
