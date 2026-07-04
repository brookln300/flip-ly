import { SignupProvider } from '../components/SignupContext'
import MissionControlNav from '../components/MissionControlNav'
import AuthModals from '../components/AuthModals'
import InventoryBoard from '../components/InventoryBoard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Inventory — flip-ly', robots: { index: false, follow: false } }

export default function InventoryPage() {
  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="Inventory" />
        <div style={{ maxWidth: '60rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Inventory & flips</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>bought · listed · sold · profit</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            Every buy → resale → sale. Track cost, list price, fees, and real profit; generate eBay-ready drafts. The ROI here is the training signal that sharpens scoring over time.
          </p>
          <InventoryBoard />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
