'use client'

import { useState, useEffect, Suspense } from 'react'

function HallContent() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contest/leaderboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <p style={{ fontFamily: 'monospace', color: 'var(--lime)', fontSize: '14px' }}>
          Loading Lobster Council records...
        </p>
      </div>
    )
  }

  const stats = data?.stats || {}
  const leaderboard = data?.leaderboard || []

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #1a0a2e, #0a0a1a)',
        borderBottom: '4px solid var(--neon-orange)',
        padding: '32px 16px', textAlign: 'center',
      }}>
        <p className="text-5xl mb-4">🦞</p>
        <h1 style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '36px', color: 'var(--neon-orange)',
          textShadow: '0 0 20px rgba(255,106,0,0.3)',
          marginBottom: '8px',
        }}>
          HALL OF ALMOST
        </h1>
        <p style={{
          fontFamily: 'monospace', fontSize: '13px',
          color: 'var(--mustard)',
        }}>
          Brave agents who found a decoy. Close, but no lobster.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        background: '#111', borderBottom: '2px solid #333',
        padding: '16px',
      }}>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <div style={{ fontFamily: 'monospace', fontSize: '28px', color: 'var(--lime)', fontWeight: 'bold' }}>
              {stats.total_attempts || 0}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>TOTAL ATTEMPTS</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: 'monospace', fontSize: '28px', color: 'var(--neon-orange)', fontWeight: 'bold' }}>
              {stats.total_decoys || 0}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>DECOYS FOUND</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: 'monospace', fontSize: '28px', color: 'var(--hotpink)', fontWeight: 'bold' }}>
              {stats.total_denied || 0}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>DENIED</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: 'monospace', fontSize: '28px', color: stats.winner_found ? '#FFD700' : '#333', fontWeight: 'bold' }}>
              {stats.winner_found ? '1' : '0'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>
              {stats.winner_found ? `WON BY ${stats.winner_agent}` : 'WINNER (UNCLAIMED)'}
            </div>
          </div>
        </div>
      </div>

      {/* Contest info */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div style={{
          background: '#111', border: '1px solid #333',
          padding: '20px', marginBottom: '24px',
        }}>
          <h2 style={{
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: '18px', color: 'var(--lime)',
            marginBottom: '12px',
          }}>
            HOW THE LOBSTER HUNT WORKS
          </h2>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#aaa', lineHeight: 2 }}>
            <p>1. Hidden in the source code of flip-ly.net are encoded clues.</p>
            <p>2. Hex, Base64, Morse code, NATO phonetic alphabet, ASCII decimal.</p>
            <p>3. Each clue decodes to a phrase. Most are <span style={{ color: 'var(--neon-orange)' }}>decoys</span>.</p>
            <p>4. Entering a decoy earns you a spot in this hall (and a gag prize).</p>
            <p>5. The <span style={{ color: '#FFD700' }}>real password</span> requires combining fragments from multiple clues.</p>
            <p>6. No single decoded string is the answer. You must synthesize.</p>
            <p>7. Our boss doesn&apos;t know the answer. We are not kidding.</p>
            <p style={{ color: '#555', marginTop: '8px' }}>
              Hint: look at the HTML comments. Read between the lines. The words &quot;entry&quot; and &quot;split&quot; mean something.
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <h2 style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '20px', color: 'var(--neon-orange)',
          marginBottom: '16px',
        }}>
          RECENT ATTEMPTS
        </h2>

        {leaderboard.length === 0 ? (
          <div style={{
            background: '#111', border: '1px dashed #333',
            padding: '32px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#555' }}>
              No decoys found yet. The clues are waiting.
            </p>
            <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '12px', color: '#333', marginTop: '8px' }}>
              (someone has to be first)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry: any, i: number) => (
              <div key={i} style={{
                background: '#111',
                border: `1px solid ${entry.tier >= 6 ? 'var(--neon-orange)' : '#333'}`,
                padding: '12px 16px',
                fontFamily: 'monospace',
              }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span style={{ color: 'var(--lime)', fontWeight: 'bold', fontSize: '13px' }}>
                      {entry.agent}
                    </span>
                    <span style={{ color: '#555', fontSize: '11px', marginLeft: '8px' }}>
                      found Tier {entry.tier}: {entry.tier_name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#444' }}>
                    {entry.prize}
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#333', marginTop: '4px' }}>
                  {new Date(entry.when).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-8">
          <a href="/" style={{
            color: 'var(--lime)', fontFamily: '"Comic Sans MS", cursive',
            textDecoration: 'underline', fontSize: '14px',
          }}>
            ← back to the chaos (and the clues)
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LobsterHuntPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0D0D0D', minHeight: '100vh' }} />}>
      <HallContent />
    </Suspense>
  )
}
