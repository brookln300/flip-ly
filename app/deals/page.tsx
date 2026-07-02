import { SignupProvider } from '../components/SignupContext'
import MissionControlNav from '../components/MissionControlNav'
import AuthModals from '../components/AuthModals'
import DealsExplorer from '../components/DealsExplorer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Deals — flip-ly DFW dealfinder',
  robots: { index: false, follow: false },
}

export default function DealsPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="Deals" />
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Deals</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Dallas–Fort Worth · filter anything</span>
          </div>
          <DealsExplorer />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
