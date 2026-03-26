'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DonatedContent() {
  const params = useSearchParams()
  const status = params.get('status')

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
      <div className="text-center px-8 max-w-lg">
        {status === 'success' ? (
          <>
            <p className="text-6xl mb-6">🦞</p>
            <h1 className="text-3xl font-bold mb-4" style={{
              fontFamily: '"Comic Sans MS", cursive', color: 'var(--lime)',
            }}>
              YOU ACTUALLY DONATED.
            </h1>
            <p className="text-base mb-4" style={{ color: '#ccc', fontFamily: '"Courier New", monospace' }}>
              You just paid real money to keep a website with Comic Sans,
              a fake Winamp player, and a lobster cursor alive on the internet.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--mustard)' }}>
              You are now officially a Chaos Patron. This title means nothing
              but we appreciate you more than words can express.
            </p>
            <div className="mb-8 p-4 inline-block" style={{
              border: '3px dashed var(--hotpink)',
              background: '#1a1a1a',
            }}>
              <p style={{ fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)', fontSize: '14px' }}>
                CHAOS PATRON BADGE UNLOCKED 🏆
              </p>
              <p style={{ fontFamily: 'monospace', color: '#666', fontSize: '10px', marginTop: '4px' }}>
                (it does nothing. but it&apos;s yours forever.)
              </p>
            </div>
            <br />
            <a href="/" style={{
              color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive',
              textDecoration: 'underline',
            }}>
              ← return to the chaos
            </a>
          </>
        ) : (
          <>
            <p className="text-6xl mb-6">😢</p>
            <h1 className="text-3xl font-bold mb-4" style={{
              fontFamily: '"Comic Sans MS", cursive', color: 'var(--hotpink)',
            }}>
              YOU CANCELLED.
            </h1>
            <p className="text-base mb-6" style={{ color: '#888', fontFamily: '"Courier New", monospace' }}>
              That&apos;s okay. The lobster understands. The chaos will continue
              regardless. But it will be slightly sadder chaos.
            </p>
            <a href="/" style={{
              color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive',
              textDecoration: 'underline',
            }}>
              ← back to free chaos
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function DonatedPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0D0D0D', minHeight: '100vh' }} />}>
      <DonatedContent />
    </Suspense>
  )
}
