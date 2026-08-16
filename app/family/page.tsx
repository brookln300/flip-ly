import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'family — flip-ly', robots: { index: false, follow: false } }

export default async function FamilyPage() {
  const { data } = await supabase
    .from('fliply_profiles')
    .select('email, display_name, sigil, status_text, status_emoji, birthday, household, story, favorites, sizes, allergies')
    .order('household')
    .order('display_name')
  const members = data || []
  const now = new Date()

  return (
    <SignupProvider>
      <ZenShell active="Family">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">family</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            who&apos;s who — birthdays, favorites, sizes. the things that make gift time easy and gatherings safe.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {members.map((m: any) => {
            const b = m.birthday ? new Date(m.birthday) : null
            const isBday = !!b && b.getUTCMonth() === now.getUTCMonth() && b.getUTCDate() === now.getUTCDate()
            const bdayStr = b ? b.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toLowerCase() : null
            return (
              <div key={m.email} id={m.email} className={`border p-3 ${isBday ? 'border-zen-accent/50' : 'border-zen-line'}`}>
                <div className="text-[13.5px] font-semibold text-zen-text">
                  {m.sigil ? `${m.sigil} ` : ''}{m.display_name || m.email.split('@')[0]}{isBday ? ' 🎂' : ''}
                </div>
                {m.status_text && (
                  <div className="mt-0.5 text-[12px] text-zen-muted">
                    {m.status_emoji ? `${m.status_emoji} ` : ''}{m.status_text}
                  </div>
                )}
                {m.story && <p className="mt-1.5 text-[12.5px] leading-relaxed text-zen-muted">{m.story}</p>}
                <div className="mt-1.5 text-[12px] leading-relaxed text-zen-muted">
                  {bdayStr && <span>🎂 {bdayStr}</span>}
                  {m.favorites?.food && <span>{bdayStr ? ' · ' : ''}🍽 {m.favorites.food}</span>}
                  {m.favorites?.hobby && <span> · ♥ {m.favorites.hobby}</span>}
                  {m.sizes?.shirt && <span> · 👕 {m.sizes.shirt}</span>}
                  {m.sizes?.shoe && <span> · 👟 {m.sizes.shoe}</span>}
                  {m.allergies && <span className="text-amber-400"> · ⚠ {m.allergies}</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <a
            href="/family/me"
            className="inline-block border border-zen-line px-4 py-1.5 text-[13px] text-zen-text no-underline transition-colors hover:border-zen-accent hover:text-zen-accent"
          >
            edit my profile
          </a>
        </div>
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
