import Link from 'next/link'

export const metadata = {
  title: 'Contest Rules — The Lobster Protocol — Flip-ly.net',
  description: 'Official rules for The Lobster Protocol contest on Flip-ly.net. No purchase necessary. 7 levels, real prizes.',
}

export default function ContestRules() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      {/* Header */}
      <header style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l5 5h-3v4h-4V9H7l5-5z" fill="var(--accent-green)"/>
            <path d="M7 16a7 7 0 0 0 10 0" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{
            fontSize: '18px',
            color: 'var(--text-primary)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}>
            FLIP-LY
          </span>
        </a>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-4) var(--space-16)',
      }}>
        {/* Back link */}
        <Link href="/" style={{
          display: 'inline-block',
          fontSize: '14px',
          color: 'var(--accent-green)',
          textDecoration: 'none',
          marginBottom: 'var(--space-8)',
        }}>
          &larr; Back to Flip-ly
        </Link>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 'var(--space-2)',
        }}>
          Contest Rules
        </h1>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-2)',
        }}>
          The Lobster Protocol
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-dim)',
          marginBottom: 'var(--space-10)',
        }}>
          Last updated: April 10, 2026
        </p>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

          {/* Sponsor */}
          <section>
            <SectionHeading>Sponsor</SectionHeading>
            <p style={paragraphStyle}>
              Flip-ly (<a href="https://flip-ly.net" style={linkStyle}>flip-ly.net</a>), operated by AetherCoreAI, Dallas, TX.
            </p>
          </section>

          {/* No Purchase Necessary */}
          <section>
            <SectionHeading>No Purchase Necessary</SectionHeading>
            <p style={paragraphStyle}>
              No purchase or payment of any kind is necessary to enter or win. A purchase will not improve your chances of winning. The Lobster Protocol is free to participate in for all eligible entrants.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <SectionHeading>Eligibility</SectionHeading>
            <p style={paragraphStyle}>
              Open to anyone 18 years of age or older with internet access. Employees, officers, and directors of AetherCoreAI and their immediate family members are not eligible. Void where prohibited by law.
            </p>
          </section>

          {/* Contest Period */}
          <section>
            <SectionHeading>Contest Period</SectionHeading>
            <p style={paragraphStyle}>
              The Lobster Protocol begins April 12, 2026 (Saturday). There is no fixed end date. The contest ends when all five (5) Level 7 prizes have been claimed, or when the Sponsor elects to end the contest, whichever occurs first.
            </p>
          </section>

          {/* How to Enter */}
          <section>
            <SectionHeading>How to Enter</SectionHeading>
            <ol style={{
              ...paragraphStyle,
              paddingLeft: '24px',
              listStyleType: 'decimal',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}>
              <li>Visit <a href="https://flip-ly.net" style={linkStyle}>flip-ly.net</a> and find the hidden terminal entry point.</li>
              <li>Create an agent name and solve password challenges across 7 levels.</li>
              <li>Use the <code style={codeStyle}>claim</code> command to register your email and lock in your prize.</li>
              <li>Level 7 winners must provide a valid shipping address for physical prize delivery.</li>
            </ol>
            <p style={{ ...paragraphStyle, marginTop: 'var(--space-3)' }}>
              The contest is designed as a progressive puzzle. Exploration, attention to detail, and knowledge of web development tools are encouraged.
            </p>
          </section>

          {/* Prizes */}
          <section>
            <SectionHeading>Prizes by Level</SectionHeading>
            <div style={{
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              overflow: 'hidden',
              marginTop: 'var(--space-3)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    <th style={thStyle}>Level</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Prize</th>
                  </tr>
                </thead>
                <tbody>
                  <PrizeRow level="1" prize="Free Flip-ly account" />
                  <PrizeRow level="2" prize="3 days Pro trial" />
                  <PrizeRow level="3" prize="1 week Pro trial" />
                  <PrizeRow level="4" prize="2 weeks Pro access" />
                  <PrizeRow level="5" prize="1 month Pro access" />
                  <PrizeRow level="6" prize="3 months Power tier" />
                  <PrizeRow level="7" prize="3 months Power tier + mystery physical prize (limited to 5 winners)" highlight />
                </tbody>
              </table>
            </div>
          </section>

          {/* Rules */}
          <section>
            <SectionHeading>Rules</SectionHeading>
            <ul style={{
              ...paragraphStyle,
              paddingLeft: '20px',
              listStyleType: 'disc',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}>
              <li>One prize per level per person. Your highest level reached determines your prize.</li>
              <li>Level 7 is limited to five (5) winners total, awarded first-come first-served.</li>
              <li>Automated and bot entries are prohibited. Attempts are rate limited to 30 per hour per IP address.</li>
              <li>All attempts are logged and monitored for integrity.</li>
              <li>Flip-ly reserves the right to disqualify any entry deemed suspicious, fraudulent, or in violation of these rules.</li>
              <li>Winners will be contacted via the email address registered during the claim process.</li>
              <li>Physical prizes (Level 7) will be shipped within 30 days to US addresses. International winners will receive a digital equivalent of comparable value.</li>
              <li>Prizes have no cash value and are non-transferable.</li>
              <li>By entering, participants agree to allow their agent name and level reached to be displayed on the public leaderboard.</li>
              <li>The contest may be modified, suspended, or cancelled at the Sponsor&apos;s discretion with notice posted on this page.</li>
              <li>Void where prohibited by law.</li>
            </ul>
          </section>

          {/* Odds */}
          <section>
            <SectionHeading>Odds of Winning</SectionHeading>
            <p style={paragraphStyle}>
              This is a skill-based challenge, not a random drawing. Odds depend on the participant&apos;s ability to solve each level&apos;s puzzle. Each level is progressively harder than the last.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <SectionHeading>Privacy</SectionHeading>
            <ul style={{
              ...paragraphStyle,
              paddingLeft: '20px',
              listStyleType: 'disc',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}>
              <li>Email addresses collected during the claim process are used for prize fulfillment and Flip-ly account creation.</li>
              <li>Participants may unsubscribe from marketing emails at any time via the one-click unsubscribe link included in every email.</li>
              <li>IP addresses are logged for rate limiting and fraud prevention only.</li>
              <li>Agent names and levels reached are displayed publicly on the leaderboard.</li>
            </ul>
            <p style={{ ...paragraphStyle, marginTop: 'var(--space-3)' }}>
              See our <Link href="/privacy" style={linkStyle}>Privacy Policy</Link> for full details.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <SectionHeading>Governing Law</SectionHeading>
            <p style={paragraphStyle}>
              This contest is governed by the laws of the State of Texas. Any disputes arising from or related to this contest shall be resolved in the courts of Dallas County, Texas.
            </p>
          </section>

          {/* Contact */}
          <section>
            <SectionHeading>Contact</SectionHeading>
            <p style={paragraphStyle}>
              Questions about these rules or the contest: <span style={{ color: 'var(--accent-green)' }}>hello@flip-ly.net</span>
            </p>
            <p style={{ ...paragraphStyle, color: 'var(--text-dim)', marginTop: 'var(--space-2)' }}>
              AetherCoreAI, Dallas, TX
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div style={{
          marginTop: 'var(--space-12)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          fontSize: '13px',
        }}>
          <Link href="/terms" style={linkStyle}>Terms of Service</Link>
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
          <Link href="/lobster-hunt" style={linkStyle}>Leaderboard</Link>
          <Link href="/about" style={linkStyle}>About</Link>
        </div>
        <p style={{
          marginTop: 'var(--space-4)',
          fontSize: '12px',
          color: 'var(--text-dim)',
        }}>
          &copy; 2026 Flip-ly.net &middot; AetherCoreAI
        </p>
      </main>
    </div>
  )
}


/* ── Shared styles ─────────────────────────────────────── */

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-green)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  background: 'var(--bg-surface)',
  padding: '2px 6px',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)',
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  textAlign: 'center',
  borderBottom: '1px solid var(--border-default)',
}


/* ── Sub-components ────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '17px',
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-3)',
    }}>
      {children}
    </h3>
  )
}

function PrizeRow({ level, prize, highlight }: { level: string; prize: string; highlight?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{
        padding: '10px 16px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: '14px',
        color: highlight ? 'var(--accent-green)' : 'var(--text-primary)',
      }}>
        {level}
      </td>
      <td style={{
        padding: '10px 16px',
        fontSize: '14px',
        color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: highlight ? 500 : 400,
      }}>
        {prize}
      </td>
    </tr>
  )
}
