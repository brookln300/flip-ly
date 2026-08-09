import { CalendarDays, Flame, Gem, MessagesSquare, Package, Activity } from 'lucide-react'
import { supabase } from './lib/supabase'
import { getSession } from './lib/auth'
import { SignupProvider } from './components/SignupContext'
import HubNav from './components/HubNav'
import HearthScene from './components/HearthScene'
import AuthModals from './components/AuthModals'
import LandingHero from './components/LandingHero'
import RadarHomeCard from './components/radar/RadarHomeCard'
import GlassCard from './components/ui/GlassCard'
import SectionHeader from './components/ui/SectionHeader'
import StatNumber from './components/ui/StatNumber'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'The Hearth — our family hub' }

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'

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

/** Compact link-out tile for sections whose data isn't fetched on this page. */
function LinkTile({ href, icon, title, sub, delay }: {
  href: string; icon: React.ReactNode; title: string; sub: string; delay: number
}) {
  return (
    <GlassCard href={href} delay={delay} className="p-5 sm:col-span-1 lg:col-span-2">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-950/50 text-amber-400/90" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold text-slate-50">{title}</div>
          <div className="mt-0.5 truncate text-xs text-slate-400">{sub}</div>
        </div>
      </div>
    </GlassCard>
  )
}

export default async function HearthHome() {
  const session = await getSession()

  // ── Logged out: one elegant front door, nothing else ──
  if (!session) {
    return (
      <SignupProvider>
        <main id="main" className="hearth-bg min-h-screen text-slate-50">
          <LandingHero />
          <AuthModals />
        </main>
      </SignupProvider>
    )
  }

  // ── Logged in: the family operations deck ──
  const d = await getHubData()
  const me = d.members.find(m => m.email === session.email)
  const firstName = (me?.display_name || session.email.split('@')[0]).split(' ')[0]
  const hourCT = parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Chicago' }), 10)
  const greeting = hourCT < 5 ? 'Up late' : hourCT < 12 ? 'Good morning' : hourCT < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Chicago' })

  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Home" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">

          {/* Greeting header */}
          <header className="mb-6">
            <p className="text-[13px] text-slate-400">{today}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting}, <span className="text-ember">{firstName}</span>
              {me?.isBirthday ? ' — happy birthday! 🎂' : ''}
            </h1>
          </header>

          {/* Bento deck */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

            {/* The Hearth scene — the soul of the hub */}
            <GlassCard delay={0.05} className="overflow-hidden p-2 sm:col-span-2 lg:col-span-4">
              <HearthScene members={d.members as any} />
              <p className="px-3 py-2.5 text-center text-xs text-slate-500">
                every lantern is one of us · tap one to say hi
              </p>
            </GlassCard>

            {/* Deal Radar — new pipeline, own server fetch */}
            <RadarHomeCard delay={0.1} className="sm:col-span-2 lg:col-span-2" />

            {/* Calendar preview — existing events fetch */}
            <GlassCard delay={0.15} className="p-5 sm:col-span-1 lg:col-span-3">
              <SectionHeader
                icon={<CalendarDays className="h-4 w-4" />}
                title="Coming up"
                action="Calendar"
                actionHref="/calendar"
              />
              {d.events.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Nothing planned yet — <a href="/calendar" className="text-amber-300 no-underline hover:underline">add the first gathering</a>.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {d.events.map((ev: any) => (
                    <li key={ev.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-2.5">
                      <span className="text-lg" aria-hidden="true">{ev.emoji || '🗓'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-slate-50">{ev.title}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {fmtWhen(ev.starts_at)}{ev.location ? ` · ${ev.location}` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            {/* Family — existing profiles fetch */}
            <GlassCard delay={0.2} className="p-5 sm:col-span-1 lg:col-span-3">
              <SectionHeader
                icon={<Flame className="h-4 w-4" />}
                title="Family"
                action="Who's who"
                actionHref="/family"
              />
              <div className="mt-4 flex items-end justify-between gap-4">
                <StatNumber value={d.members.length} label="lanterns lit" />
                <div className="flex flex-col items-end gap-1.5">
                  {d.birthdaysSoon.length > 0 ? (
                    d.birthdaysSoon.map(b => (
                      <span key={b.name} className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                        🎂 {b.name} {b.days === 0 ? 'today' : `in ${b.days}d`}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">no birthdays in the next 45 days</span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Deal finder — existing hot-deals count */}
            <GlassCard href="/deals" delay={0.25} className="p-5 sm:col-span-1 lg:col-span-2">
              <SectionHeader icon={<Gem className="h-4 w-4" />} title="Deal finder" />
              <StatNumber
                className="mt-4"
                value={d.hotDeals}
                label="hot DFW deals in the last 24h"
                ember={d.hotDeals > 0}
              />
            </GlassCard>

            {/* Link-out tiles — data lives on their own pages */}
            <LinkTile
              href="/messages"
              icon={<MessagesSquare className="h-5 w-5" />}
              title="Messages"
              sub="seller drafts · review & send"
              delay={0.3}
            />
            <LinkTile
              href="/inventory"
              icon={<Package className="h-5 w-5" />}
              title="Inventory"
              sub="bought · listed · sold · profit"
              delay={0.35}
            />

            {/* System health strip */}
            <GlassCard href="/system" delay={0.4} className="px-5 py-3.5 sm:col-span-2 lg:col-span-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-[13px] text-slate-400">
                  <Activity className="h-4 w-4 text-amber-400/90" aria-hidden="true" />
                  <span className="font-medium text-slate-300">System</span>
                  <span className="hidden sm:inline">scrapers · AI budget · pipeline health</span>
                </span>
                <span className="text-xs font-medium text-slate-500">view status →</span>
              </div>
            </GlassCard>
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-5">
            <span className="text-xs text-slate-600">The Hearth · our family, one warm sky</span>
            <a href="/ops" className="text-xs text-slate-600 no-underline transition-colors hover:text-slate-400">Mission Control →</a>
          </footer>
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
