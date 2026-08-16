import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import CalendarBoard from '../components/CalendarBoard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'calendar — flip-ly', robots: { index: false, follow: false } }

export default function CalendarPage() {
  return (
    <SignupProvider>
      <ZenShell active="Calendar">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">calendar</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            gatherings, games, birthdays. rsvp with a tap — or ask the bot &quot;what&apos;s coming up?&quot;
          </p>
        </header>
        <CalendarBoard />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
