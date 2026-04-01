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
        <p style={{ fontFamily: '"Courier New", monospace', color: '#00ff00', fontSize: '14px' }}>
          &gt; Loading Lobster Council records..._
        </p>
      </div>
    )
  }

  const stats = data?.stats || {}
  const leaderboard = data?.leaderboard || []
  const wallOfShame = data?.wall_of_shame || []

  return (
    <div className="min-h-screen" style={{
      background: '#0D0D0D',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,106,0,0.02) 0%, transparent 70%)',
    }}>
      {/* ═══ HEADER — hand-coded geocities energy ═══ */}
      <div style={{
        background: '#000',
        borderBottom: '3px solid #ff6a00',
        padding: '24px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🦞</div>
        <h1 style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '32px',
          color: '#ff6a00',
          textShadow: '2px 2px 0px #000, 0 0 10px rgba(255,106,0,0.4)',
          marginBottom: '4px',
          letterSpacing: '3px',
        }}>
          HALL OF ALMOST
        </h1>
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '12px',
          color: '#888',
        }}>
          Brave agents who found a decoy. Close, but no lobster.
        </p>
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          color: '#333',
          marginTop: '8px',
          fontStyle: 'italic',
        }}>
          Last updated by the webmaster (it was a long night)
        </p>
      </div>

      {/* ═══ RAINBOW HR ═══ */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)',
      }} />

      {/* ═══ STATS — old-school hit counter style ═══ */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #222',
        padding: '12px 16px',
        textAlign: 'center',
        fontFamily: '"Courier New", monospace',
      }}>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center" style={{ gap: '24px' }}>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#00ff00', fontWeight: 'bold',
              fontFamily: '"Courier New", monospace',
              background: '#000', border: '2px inset #444',
              padding: '2px 12px', display: 'inline-block',
            }}>
              {String(stats.total_attempts || 0).padStart(5, '0')}
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textTransform: 'uppercase' }}>Total Attempts</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#ff6a00', fontWeight: 'bold',
              fontFamily: '"Courier New", monospace',
              background: '#000', border: '2px inset #444',
              padding: '2px 12px', display: 'inline-block',
            }}>
              {String(stats.total_decoys || 0).padStart(5, '0')}
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textTransform: 'uppercase' }}>Decoys Found</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', color: '#ff1070', fontWeight: 'bold',
              fontFamily: '"Courier New", monospace',
              background: '#000', border: '2px inset #444',
              padding: '2px 12px', display: 'inline-block',
            }}>
              {String(stats.total_denied || 0).padStart(5, '0')}
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textTransform: 'uppercase' }}>Denied</div>
          </div>
          <div className="text-center">
            <div style={{
              fontSize: '24px', fontWeight: 'bold',
              color: stats.winner_found ? '#FFD700' : '#222',
              fontFamily: '"Courier New", monospace',
              background: '#000', border: '2px inset #444',
              padding: '2px 12px', display: 'inline-block',
            }}>
              {stats.winner_found ? '00001' : '00000'}
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textTransform: 'uppercase' }}>
              {stats.winner_found ? `WON BY ${stats.winner_agent}` : 'WINNER (UNCLAIMED)'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* How it works — looks like it was typed in notepad */}
        <div style={{
          background: '#0a0a0a',
          border: '2px outset #333',
          padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: '16px',
            color: '#00ff00',
            marginBottom: '8px',
            borderBottom: '1px dashed #333',
            paddingBottom: '8px',
          }}>
            &gt; HOW THE LOBSTER HUNT WORKS
          </h2>
          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#999', lineHeight: 2.2 }}>
            <p>1. Hidden in the source code of flip-ly.net are encoded clues.</p>
            <p>2. Hex, Base64, Morse code, NATO phonetic alphabet, ASCII decimal.</p>
            <p>3. Each clue decodes to a phrase. Most are <span style={{ color: '#ff6a00' }}>decoys</span>.</p>
            <p>4. Entering a decoy earns you a spot in this hall (and a gag prize).</p>
            <p>5. The <span style={{ color: '#FFD700' }}>real password</span> requires combining fragments from multiple clues.</p>
            <p>6. No single decoded string is the answer. You must synthesize.</p>
            <p>7. Our boss doesn&apos;t know the answer. We are not kidding.</p>
            <p style={{ color: '#444', marginTop: '8px' }}>
              Hint: look at the HTML comments. Read between the lines. The words &quot;entry&quot; and &quot;split&quot; mean something.
            </p>
          </div>
        </div>

        {/* ═══ RAINBOW HR ═══ */}
        <div style={{
          height: '2px', marginBottom: '24px',
          background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)',
        }} />

        {/* ═══ DECOY HUNTERS — HTML TABLE LEADERBOARD ═══ */}
        <h2 style={{
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '18px', color: '#ff6a00',
          marginBottom: '12px',
        }}>
          🏆 DECOY HUNTERS
        </h2>

        {leaderboard.length === 0 ? (
          <div style={{
            background: '#0a0a0a', border: '1px dashed #333',
            padding: '32px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#444' }}>
              No decoys found yet. The clues are waiting.
            </p>
            <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '11px', color: '#2a2a2a', marginTop: '8px' }}>
              7 decoy passwords hide in the source code.
            </p>
            <p style={{ fontFamily: '"Courier New", monospace', fontSize: '9px', color: '#1a1a1a', marginTop: '12px' }}>
              Hint: inspect the HTML. Decode the hex. Read the morse. The lobster is watching.
            </p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            border: '2px outset #555',
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            marginBottom: '8px',
          }}>
            <thead>
              <tr style={{ background: '#1a1a1a' }}>
                <th style={{ border: '1px inset #444', padding: '6px 8px', color: '#ff6a00', textAlign: 'left', fontSize: '10px' }}>#</th>
                <th style={{ border: '1px inset #444', padding: '6px 8px', color: '#ff6a00', textAlign: 'left', fontSize: '10px' }}>AGENT</th>
                <th style={{ border: '1px inset #444', padding: '6px 8px', color: '#ff6a00', textAlign: 'left', fontSize: '10px' }}>TIER</th>
                <th style={{ border: '1px inset #444', padding: '6px 8px', color: '#ff6a00', textAlign: 'left', fontSize: '10px' }}>PRIZE</th>
                <th style={{ border: '1px inset #444', padding: '6px 8px', color: '#ff6a00', textAlign: 'right', fontSize: '10px' }}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry: any, i: number) => (
                <tr key={i} style={{
                  background: i % 2 === 0 ? '#0a0a0a' : '#111',
                  ...(entry.tier >= 6 ? { borderLeft: '2px solid #ff6a00' } : {}),
                }}>
                  <td style={{ border: '1px inset #333', padding: '5px 8px', color: '#555', fontSize: '11px' }}>
                    {i + 1}
                  </td>
                  <td style={{ border: '1px inset #333', padding: '5px 8px', color: '#00ff00', fontWeight: 'bold', fontSize: '11px' }}>
                    {entry.agent}
                    {i === 0 && <span style={{ color: '#FFD700', marginLeft: '6px', fontSize: '9px' }}>&larr; NEW!</span>}
                  </td>
                  <td style={{ border: '1px inset #333', padding: '5px 8px', color: '#888', fontSize: '11px' }}>
                    T{entry.tier}: {entry.tier_name}
                  </td>
                  <td style={{ border: '1px inset #333', padding: '5px 8px', fontSize: '11px' }}>
                    {entry.prize}
                  </td>
                  <td style={{ border: '1px inset #333', padding: '5px 8px', color: '#333', fontSize: '9px', textAlign: 'right' }}>
                    {new Date(entry.when).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ═══ RAINBOW HR ═══ */}
        <div style={{
          height: '2px', margin: '28px 0',
          background: 'linear-gradient(90deg, #ff0088, #8800ff, #0088ff, #00ff00, #ffff00, #ff8800, #ff0000)',
        }} />

        {/* ═══ WALL OF SHAME — guestbook style ═══ */}
        {wallOfShame.length > 0 && (
          <>
            <h2 style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: '18px', color: '#ff1070',
              marginBottom: '4px',
            }}>
              💀 WALL OF SHAME
            </h2>
            <p style={{
              fontFamily: '"Courier New", monospace', fontSize: '10px',
              color: '#444', marginBottom: '16px',
            }}>
              Agents who guessed wrong. Passphrases redacted to preserve what little dignity remains.
            </p>
            <div style={{
              border: '2px outset #333',
              background: '#0a0a0a',
            }}>
              {wallOfShame.map((entry: any, i: number) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderBottom: i < wallOfShame.length - 1 ? '1px solid #1a1a1a' : 'none',
                  fontFamily: '"Courier New", monospace',
                }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span style={{ color: '#00ff00', fontSize: '11px', fontWeight: 'bold' }}>
                        {entry.agent}
                      </span>
                      <span style={{ color: '#333', fontSize: '10px', marginLeft: '8px' }}>
                        tried &quot;{entry.guess}&quot;
                      </span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#222' }}>
                      {new Date(entry.when).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#442222', marginTop: '2px', fontStyle: 'italic' }}>
                    {entry.reaction}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ RAINBOW HR ═══ */}
        <div style={{
          height: '2px', margin: '28px 0',
          background: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)',
        }} />

        {/* ═══ UNDER CONSTRUCTION + GUESTBOOK BUTTONS ═══ */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: '14px',
            color: '#ffff00',
            marginBottom: '12px',
          }}>
            🚧 MORE FEATURES UNDER CONSTRUCTION 🚧
          </p>
          <p style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            color: '#333',
            marginBottom: '16px',
          }}>
            The webmaster is learning JavaScript. Please be patient.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/" style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: '#000',
              background: '#ccc',
              border: '2px outset #eee',
              padding: '4px 12px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}>
              [ 🔑 Find the Entry Point ]
            </a>
            <a href="/lobster-hunt" style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: '#000',
              background: '#ccc',
              border: '2px outset #eee',
              padding: '4px 12px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}>
              [ 📖 View Guestbook ]
            </a>
          </div>
        </div>

        {/* ═══ FAKE WEBRING ═══ */}
        <div style={{
          border: '2px outset #444',
          background: '#111',
          padding: '10px',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <p style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#666', marginBottom: '6px' }}>
            This site is part of the 🦞 <span style={{ color: '#ff6a00' }}>Lobster Council WebRing</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#444', cursor: 'pointer' }}>[&larr; Prev]</span>
            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#444', cursor: 'pointer' }}>[Random]</span>
            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#444', cursor: 'pointer' }}>[Next &rarr;]</span>
          </div>
        </div>

        {/* ═══ BACK LINK ═══ */}
        <div className="text-center mb-4">
          <a href="/" style={{
            color: '#00ff00', fontFamily: '"Comic Sans MS", cursive',
            textDecoration: 'underline', fontSize: '14px',
          }}>
            &larr; back to the chaos (and the clues)
          </a>
        </div>

        {/* ═══ BEST VIEWED IN ═══ */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontFamily: '"Courier New", monospace', fontSize: '8px', color: '#222' }}>
            Best viewed in Netscape Navigator 4.0 at 800x600
          </p>
          <p style={{ fontFamily: '"Courier New", monospace', fontSize: '8px', color: '#1a1a1a', marginTop: '4px' }}>
            &lt;!-- TODO: fix this table before Keith sees it --&gt;
          </p>
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
