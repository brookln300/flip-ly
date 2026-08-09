import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Family — The Hearth', robots: { index: false, follow: false } }

export default async function FamilyPage() {
  const { data } = await supabase
    .from('fliply_profiles')
    .select('email, display_name, sigil, lantern_hue, status_text, status_emoji, birthday, household, story, favorites, sizes, allergies')
    .order('household')
    .order('display_name')
  const members = data || []
  const now = new Date()

  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Family" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Who&apos;s who</h1>
          <p className="mb-5 mt-1.5 text-[13px] leading-relaxed text-slate-400">Every lantern, every story. Birthdays, favorites, sizes — the things that make gift time easy and gatherings safe.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {members.map((m: any) => {
              const hue = m.lantern_hue ?? 32
              const b = m.birthday ? new Date(m.birthday) : null
              const isBday = !!b && b.getUTCMonth() === now.getUTCMonth() && b.getUTCDate() === now.getUTCDate()
              const bdayStr = b ? b.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) : null
              return (
                <div key={m.email} id={m.email} style={{ borderRadius: '16px', padding: '18px', background: 'rgba(255,246,236,0.055)', border: `1px solid ${isBday ? 'rgba(255,209,102,0.5)' : 'rgba(255,246,236,0.1)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, hsla(${hue},85%,68%,0.85) 0%, hsla(${hue},85%,60%,0) 72%)` }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#FFF6EC' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display), serif', fontSize: '17px', fontWeight: 600 }}>{m.sigil ? `${m.sigil} ` : ''}{m.display_name || m.email.split('@')[0]}{isBday ? ' 🎂' : ''}</div>
                      {m.status_text && <div style={{ fontSize: '12px', color: '#C9BFB2' }}>{m.status_emoji ? `${m.status_emoji} ` : ''}{m.status_text}</div>}
                    </div>
                  </div>
                  {m.story && <p style={{ fontSize: '13px', color: '#DCD3C6', lineHeight: 1.6, marginBottom: '10px' }}>{m.story}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11.5px' }}>
                    {bdayStr && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,209,102,0.12)', color: '#FFD166' }}>🎂 {bdayStr}</span>}
                    {m.favorites?.food && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,246,236,0.08)', color: '#DCD3C6' }}>🍽 {m.favorites.food}</span>}
                    {m.favorites?.hobby && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,246,236,0.08)', color: '#DCD3C6' }}>♥ {m.favorites.hobby}</span>}
                    {m.sizes?.shirt && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,246,236,0.08)', color: '#DCD3C6' }}>👕 {m.sizes.shirt}</span>}
                    {m.sizes?.shoe && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,246,236,0.08)', color: '#DCD3C6' }}>👟 {m.sizes.shoe}</span>}
                    {m.allergies && <span style={{ padding: '3px 9px', borderRadius: '999px', background: 'rgba(231,111,81,0.15)', color: '#F0997B' }}>⚠ {m.allergies}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '22px', textAlign: 'center' }}>
            <a href="/family/me" className="inline-block rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white no-underline shadow-[0_4px_24px_rgba(249,115,22,0.35)] transition-all hover:brightness-110">🏮 Tend your lantern</a>
          </div>
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
