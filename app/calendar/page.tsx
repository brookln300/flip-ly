import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import CalendarBoard from '../components/CalendarBoard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar — The Hearth', robots: { index: false, follow: false } }

export default function CalendarPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #12172B 0%, #16213E 60%, #1B2138 100%)', color: '#FFF6EC' }}>
        <HubNav active="Calendar" />
        <div style={{ maxWidth: '54rem', margin: '0 auto', padding: '22px 16px 56px' }}>
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontSize: '26px', fontWeight: 600, marginBottom: '4px' }}>Family calendar</h1>
          <p style={{ fontSize: '13px', color: '#C9BFB2', marginBottom: '20px' }}>Gatherings, games, birthdays. RSVP with a tap — or ask the bot in Telegram &quot;what&apos;s coming up?&quot;</p>
          <CalendarBoard />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
