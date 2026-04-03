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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <p style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#888', fontSize: '14px' }}>
          Loading leaderboard...
        </p>
      </div>
    )
  }

  const stats = data?.stats || {}
  const leaderboard = data?.leaderboard || []
  const wallOfShame = data?.wall_of_shame || []

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Header */}
      <div style={{
        background: '#000',
        borderBottom: '1px solid #222',
        padding: '32px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#x1F99E;</div>
        <h1 style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          The Lobster Hunt
        </h1>
        <p style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: '#888',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          A hidden contest. Decode the clues. Find the password. Win a lobster dinner.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #1a1a1a',
        padding: '16px',
      }}>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center" style={{ gap: '32px' }}>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#22C55E', fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {stats.total_attempts || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', fontFamily: 'system-ui, sans-serif' }}>Total Attempts</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#ff6600', fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {stats.total_decoys || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', fontFamily: 'system-ui, sans-serif' }}>Decoys Found</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#ff4444', fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {stats.total_denied || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', fontFamily: 'system-ui, sans-serif' }}>Denied</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', fontWeight: 700,
              color: stats.winner_found ? '#EAB308' : '#333',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {stats.winner_found ? '1' : '0'}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', fontFamily: 'system-ui, sans-serif' }}>
              {stats.winner_found ? `Won by ${stats.winner_agent}` : 'Winner (Unclaimed)'}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* How it works */}
        <div style={{
          background: '#0a0a0a',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '12px',
          }}>
            How It Works
          </h2>
          <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px', color: '#999', lineHeight: 2 }}>
            <p>1. Hidden in the source code of flip-ly.net are encoded clues.</p>
            <p>2. Clues use hex, Base64, Morse code, NATO phonetic alphabet, and ASCII decimal.</p>
            <p>3. Each clue decodes to a phrase. Most are <span style={{ color: '#ff6600' }}>decoys</span>.</p>
            <p>4. Entering a decoy earns you a spot on this leaderboard.</p>
            <p>5. The <span style={{ color: '#EAB308' }}>real password</span> requires combining fragments from multiple clues.</p>
            <p>6. No single decoded string is the answer. You must synthesize.</p>
          </div>
        </div>

        {/* Decoy Hunters Leaderboard */}
        <h2 style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '20px', fontWeight: 700, color: '#fff',
          marginBottom: '12px',
        }}>
          Decoy Hunters
        </h2>

        {leaderboard.length === 0 ? (
          <div style={{
            background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px',
            padding: '32px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', color: '#666' }}>
              No decoys found yet. The clues are waiting.
            </p>
          </div>
        ) : (
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            {/* Table header */}
            <div className="hidden sm:flex" style={{
              background: '#111',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#666',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #222',
            }}>
              <span style={{ width: '40px' }}>#</span>
              <span style={{ flex: 1 }}>Agent</span>
              <span style={{ width: '140px' }}>Tier</span>
              <span style={{ width: '180px' }}>Prize</span>
              <span style={{ width: '160px', textAlign: 'right' }}>Date</span>
            </div>
            {/* Table rows */}
            {leaderboard.map((entry: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center" style={{
                padding: '10px 16px',
                background: i % 2 === 0 ? 'transparent' : '#0d0d0d',
                borderBottom: i < leaderboard.length - 1 ? '1px solid #1a1a1a' : 'none',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px',
              }}>
                <span style={{ width: '40px', color: '#555', fontWeight: 600 }}>{i + 1}</span>
                <span style={{ flex: 1, color: '#22C55E', fontWeight: 600 }}>
                  {entry.agent}
                  {i === 0 && <span style={{ color: '#EAB308', marginLeft: '8px', fontSize: '10px', fontWeight: 700 }}>LATEST</span>}
                </span>
                <span style={{ width: '140px', color: '#888', fontSize: '12px' }}>T{entry.tier}: {entry.tier_name}</span>
                <span style={{ width: '180px', fontSize: '12px', color: '#ccc' }}>{entry.prize}</span>
                <span style={{ width: '160px', textAlign: 'right', color: '#444', fontSize: '11px' }}>
                  {new Date(entry.when).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Wall of Shame */}
        {wallOfShame.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '20px', fontWeight: 700, color: '#ff4444',
              marginBottom: '4px',
            }}>
              Wall of Shame
            </h2>
            <p style={{
              fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px',
              color: '#666', marginBottom: '16px',
            }}>
              Agents who guessed wrong. Passphrases partially redacted.
            </p>
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              {wallOfShame.map((entry: any, i: number) => (
                <div key={i} style={{
                  padding: '10px 16px',
                  borderBottom: i < wallOfShame.length - 1 ? '1px solid #1a1a1a' : 'none',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span style={{ color: '#22C55E', fontSize: '13px', fontWeight: 600 }}>
                        {entry.agent}
                      </span>
                      <span style={{ color: '#555', fontSize: '12px', marginLeft: '8px' }}>
                        tried &quot;{entry.guess}&quot;
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#333' }}>
                      {new Date(entry.when).toLocaleString()}
                    </div>
                  </div>
                  {entry.reaction && (
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px', fontStyle: 'italic' }}>
                      {entry.reaction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-12 space-y-4">
          <a href="/" style={{
            color: '#22C55E',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textDecoration: 'underline',
            fontSize: '14px',
          }}>
            &larr; Back to Flip-ly
          </a>
          <p style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            color: '#333',
          }}>
            The clues are hidden in the source. Look carefully.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LobsterHuntPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100vh' }} />}>
      <HallContent />
    </Suspense>
  )
}
