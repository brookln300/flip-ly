import { supabase } from './lib/supabase'
import { SignupProvider } from './components/SignupContext'
import HubNav from './components/HubNav'
import HearthScene from './components/HearthScene'
import AuthModals from './components/AuthModals'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'The Hearth — our family hub' }

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const NIGHT = { color: '#FFF6EC', bg: 'linear-gradient(180deg, #12172B 0%, #16213E 60%, #1B2138 100%)' }

async function getHubData() {
  const now = new Date()
  const dayAgo = new Date(Date.now() - 86400e3).toISOString()
  const [profRes, evRes, hotRes] = await Promise.all([
    supabase.from('fliply_profiles').select('email, display_name, sigil, lantern_hue, flame_style, status_text, status_emoji, birthday, household, last_active').order('display_name'),
    supabase.from('fliply_events').select('id, title, emoji, starts_at, location, rsvps').gte('starts_at', now.toISOString()).order('starts_at').limit(3),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).gte('deal_score', 8).gte('scraped_at', dayAgo),
  ])

  const nowMs = Date.now()
  const members = (profRes.data || []).map(p => {
    const last = p.last_active ? nowMs - new Date(p.last_active).getTime() : Infinity
    const activity = last < 3600e3 ? 1 : last < 86400e3 ? 0.7 : last < 7 * 86400e3 ? 0.4 : 0.2
    const b = p.birthday ? new Date(p.birthday) : null
    const isBirthday = !!b && b.getUTCMonth() === now.getUTCMonth() && b.getUTCDate() === now.getUTCDate()
    return { ...p, activity, isBirthday }
  })

  const birthdaysSoon = members
    .filter(m => m.birthday)
    .map(m => {
      const b = new Date(m.birthday as string)
      const next = new Date(now.getFullYear(), b.getUTCMonth(), b.getUTCDate())
      if (next < now) next.setFullYear(next.getFullYear() + 1)
      return { name: m.display_name || m.email.split('@')[0], days: Math.round((next.getTime() - now.getTime()) / 86400e3) }
    })
    .filter(x => x.days >= 0 && x.days <= 45)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  return { members, events: evRes.data || [], hotDeals: hotRes.count || 0, birthdaysSoon }
}

function fmtWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function Door({ href, emoji, title, sub }: { href: string; emoji: string; title: string; sub: string }) {
  return (
    <a href={href} style={{
      display: 'block', textDecoration: 'none', padding: '16px 18px', borderRadius: '16px',
      background: 'rgba(255,246,236,0.055)', border: '1px solid rgba(255,246,236,0.1)',
    }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }} aria-hidden="true">{emoji}</div>
      <div style={{ fontFamily: 'var(--font-display), serif', fontSize: '17px', fontWeight: 600, color: '#FFF6EC' }}>{title}</div>
      <div style={{ fontSize: '12.5px', color: '#C9BFB2', marginTop: '3px', lineHeight: 1.5 }}>{sub}</div>
    </a>
  )
}

export default async function HearthHome() {
  const d = await getHubData()
  const next = d.events[0]

  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: NIGHT.bg, color: NIGHT.color }}>
        <HubNav active="Home" />
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '20px 16px 56px' }}>

          <div style={{ textAlign: 'center', margin: '10px 0 18px' }}>
            <h1 style={{ fontFamily: 'var(--font-display), serif', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 600, letterSpacing: '0.01em' }}>Where we gather</h1>
            <p style={{ fontSize: '13px', color: '#C9BFB2', marginTop: '4px' }}>every lantern is one of us · tap one to say hi</p>
          </div>

          <HearthScene members={d.members as any} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '18px' }}>
            <Door href="/calendar" emoji="📅" title="Calendar"
              sub={next ? `Next: ${next.emoji ? next.emoji + ' ' : ''}${next.title} — ${fmtWhen(next.starts_at)}` : 'Nothing planned yet — add the first gathering'} />
            <Door href="/family" emoji="🏮" title="Family"
              sub={d.birthdaysSoon.length ? `🎂 ${d.birthdaysSoon.map(b => `${b.name} in ${b.days}d`).join(' · ')}` : `${d.members.length} lanterns lit · who's who, birthdays, stories`} />
            <Door href="/deals" emoji="💎" title="Deal finder"
              sub={`${d.hotDeals} hot DFW deals found in the last day — the treasure map`} />
            <Door href="/help" emoji="💬" title="How this works"
              sub="New here? Two minutes and you'll have your own lantern glowing." />
          </div>

          <footer style={{ marginTop: '44px', paddingTop: '18px', borderTop: '1px solid rgba(255,246,236,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(201,191,178,0.6)' }}>The Hearth · our family, one warm sky</span>
            <a href="/ops" style={{ fontSize: '12px', color: 'rgba(201,191,178,0.6)', textDecoration: 'none' }}>Mission Control →</a>
          </footer>
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
