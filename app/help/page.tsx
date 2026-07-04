import { SignupProvider } from '../components/SignupContext'
import MissionControlNav from '../components/MissionControlNav'
import AuthModals from '../components/AuthModals'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Help — flip-ly', robots: { index: false, follow: false } }

const FAQ: { q: string; a: string }[] = [
  { q: 'What is this?', a: "flip-ly is our family's deal hub for the Dallas–Fort Worth area. An AI scans local listings all day and scores the best flips, deals, and finds. Browse them here or ask the family bot in Telegram." },
  { q: 'How do I find good deals?', a: 'Open Deals, then filter by category (electronics, tools, collectibles, sports…), price, or score. Higher scores = better flip potential. The Command Center shows the hottest picks across every category.' },
  { q: 'What do the scores mean?', a: '1–10 for how good a flip it is. 8–10 = a real steal (well below market). 5–7 = solid. Below 5 = probably not worth the drive. A green "margin" tag means it looks priced under what it resells for.' },
  { q: 'How do I ask the family bot?', a: 'In our Telegram group, just type a question — "best electronics deal", "any sports cards", "tools under $100", "my inventory", "stats". It answers instantly. Each deal gets a short code you can act on.' },
  { q: 'Can I track things I buy?', a: 'Yes — hit "+ bought" on any deal (or add one manually in Inventory). Track what you paid, list price, fees, and see your real profit + ROI as you sell.' },
  { q: 'How do I message a seller?', a: 'Hit the ✉ button on a deal — it drafts a friendly inquiry. Review it under Messages, then send it from the listing. Nothing sends on its own.' },
  { q: 'How do I get access / add family?', a: 'Access is invite-only. The family admin adds your email under Access, then you sign in at fliply.net with that email. Ask in the group if you need in.' },
  { q: 'Is this costing us money?', a: "No — it's a private family tool, not a paid product. The AI scoring runs on our own hardware." },
]

export default function HelpPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="" />
        <div style={{ maxWidth: '46rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Help & FAQ</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: 1.6 }}>Everything you need to use the family deal hub. Quick and simple.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQ.map((f, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{f.q}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.a}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', padding: '16px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Still stuck? Ask in the family Telegram group — the bot (or Keith) will help. More coming soon: family calendar, to-dos, and more.
          </div>
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
