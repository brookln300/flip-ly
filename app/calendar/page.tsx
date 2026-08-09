import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import CalendarBoard from '../components/CalendarBoard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar — The Hearth', robots: { index: false, follow: false } }

export default function CalendarPage() {
  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Calendar" />
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Family calendar</h1>
          <p className="mb-5 mt-1.5 text-[13px] leading-relaxed text-slate-400">Gatherings, games, birthdays. RSVP with a tap — or ask the bot in Telegram &quot;what&apos;s coming up?&quot;</p>
          <CalendarBoard />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
