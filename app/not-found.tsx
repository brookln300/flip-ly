import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px',
      fontFamily: 'var(--font-primary)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <p style={{
          fontSize: '72px', fontWeight: 800, color: 'var(--accent-green)',
          fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: '8px',
        }}>
          404
        </p>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Page not found
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.5 }}>
          This page doesn't exist or was moved. Try searching for deals instead.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', background: 'var(--accent-green)', color: '#fff',
            borderRadius: '10px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-primary)',
            boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          Search Deals
        </Link>
        <div style={{ marginTop: '16px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            or go home
          </Link>
        </div>
      </div>
    </div>
  )
}
