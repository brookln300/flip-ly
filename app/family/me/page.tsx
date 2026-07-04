import { SignupProvider } from '../../components/SignupContext'
import HubNav from '../../components/HubNav'
import AuthModals from '../../components/AuthModals'
import LanternEditor from '../../components/LanternEditor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Your lantern — The Hearth', robots: { index: false, follow: false } }

export default function MyLanternPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #12172B 0%, #16213E 60%, #1B2138 100%)', color: '#FFF6EC' }}>
        <HubNav active="Family" />
        <div style={{ maxWidth: '54rem', margin: '0 auto', padding: '22px 16px 56px' }}>
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontSize: '26px', fontWeight: 600, marginBottom: '4px' }}>Tend your lantern</h1>
          <p style={{ fontSize: '13px', color: '#C9BFB2', marginBottom: '20px' }}>
            This is your light on the family hearth — your color, your flame, your mark. Change anything, anytime. The whole family&apos;s sky updates the moment you save.
          </p>
          <LanternEditor />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
