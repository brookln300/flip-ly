import { SignupProvider } from '../../components/SignupContext'
import MissionControlNav from '../../components/MissionControlNav'
import AuthModals from '../../components/AuthModals'
import AccessManager from '../../components/AccessManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Access — flip-ly', robots: { index: false, follow: false } }

export default function AccessPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="" />
        <div style={{ maxWidth: '46rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Family access</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.6 }}>
            Add or remove who can log into fliply.net. Simple — one email per family member.
          </p>
          <AccessManager />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
