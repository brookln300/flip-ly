'use client'

import { useState, useEffect, useRef } from 'react'

const PLAYLIST = [
  { title: 'Dial-Up Dealz (56k Banger)', duration: '3:42' },
  { title: 'Flip That Couch (Pirate 128kbps Remix)', duration: '4:20' },
  { title: 'Modem Screech Anthem (feat. G1TC#)', duration: '2:56' },
  { title: 'LimeWire Lamp Finds Vol. 420', duration: '5:01' },
  { title: 'estate_sale_mckinney_FINAL_v2.mp3', duration: '3:33' },
  { title: 'craigslist_hustle_lofi_beats.wma', duration: '6:09' },
]

function EQBar({ color, maxH }: { color: string; maxH: number }) {
  const [h, setH] = useState(4)
  useEffect(() => {
    const i = setInterval(() => setH(Math.random() * maxH + 2), 120)
    return () => clearInterval(i)
  }, [maxH])
  return <div style={{ width: '3px', height: `${h}px`, background: color, transition: 'height 0.1s' }} />
}

export default function WinampPlayer() {
  const [playing, setPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [connected, setConnected] = useState(false)
  const [showConnectPopup, setShowConnectPopup] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!playing) return
    const i = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(i)
  }, [playing])

  const handleConnect = () => {
    setShowConnectPopup(true)
    setTimeout(() => {
      setConnected(true)
      setShowConnectPopup(false)
      setPlaying(true)
      // Show toast after connecting
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    }, 3000)
  }

  const nextTrack = () => {
    setCurrentTrack(t => (t + 1) % PLAYLIST.length)
    setElapsed(0)
  }

  const prevTrack = () => {
    setCurrentTrack(t => t === 0 ? PLAYLIST.length - 1 : t - 1)
    setElapsed(0)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[80] cursor-pointer" onClick={() => setMinimized(false)}
        style={{
          background: '#232323', border: '2px solid #404040', padding: '4px 12px',
          fontFamily: 'Tahoma, sans-serif', fontSize: '10px', color: '#0FFF50',
        }}>
        ▶ Winamp {playing ? '(playing)' : '(paused)'}
      </div>
    )
  }

  return (
    <>
      {/* Connected toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] px-6 py-3" style={{
          background: '#000', border: '2px solid #0FFF50',
          boxShadow: '0 0 20px rgba(15, 255, 80, 0.3), 4px 4px 0 rgba(0,0,0,0.4)',
          fontFamily: '"Comic Sans MS", cursive',
          animation: 'fallIn 0.4s ease-out',
        }}>
          <p className="text-sm font-bold" style={{ color: '#0FFF50' }}>
            📡 Connected at 56,000 bps
          </p>
          <p className="text-xs" style={{ color: '#FFB81C' }}>
            69 new chaotic listings found in your area
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#555' }}>
            (none of them are real)
          </p>
        </div>
      )}

      {/* Connect popup */}
      {showConnectPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="win98-window" style={{ width: '320px' }}>
            <div className="win98-titlebar">
              <span className="win98-titlebar-text">Connecting...</span>
            </div>
            <div className="win98-body text-center py-6">
              <p className="text-sm mb-2" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                📡 Connecting at 56,000 bps...
              </p>
              <p className="text-xs" style={{ color: '#666' }}>
                ██████████░░░░░ 67%
              </p>
              <p className="text-xs mt-2 blink" style={{ color: 'green' }}>
                CARRIER DETECTED
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Winamp window — hidden on mobile to prevent overlap */}
      <div className="fixed right-3 top-20 z-[80] select-none hidden md:block" style={{
        width: '275px',
        backgroundImage: 'url(/assets/winamp-skin.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(180deg, #3a3a3a 0%, #232323 40%, #1a1a1a 100%)',
          border: '1px solid #505050',
          borderBottom: 'none',
          padding: '2px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="flex gap-1">
            <button onClick={() => setMinimized(true)} style={{ width: '9px', height: '9px', background: '#FFB81C', border: '1px solid #806000', fontSize: '0', cursor: 'pointer' }} />
            <button onClick={() => setMinimized(true)} style={{ width: '9px', height: '9px', background: '#FF10F0', border: '1px solid #800080', fontSize: '0', cursor: 'pointer' }} />
          </div>
          <span className="blink" style={{
            fontFamily: 'Tahoma, sans-serif', fontSize: '8px', color: '#0FFF50',
            letterSpacing: '0.5px', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px',
          }}>
            Winamp 2.91 — ILLEGAL DEALS @ 56k
          </span>
          <button onClick={() => setMinimized(true)} style={{
            width: '9px', height: '9px', background: '#FF6600', border: '1px solid #804000',
            fontSize: '0', cursor: 'pointer',
          }} />
        </div>

        {/* Main display */}
        <div style={{
          background: '#000', border: '1px solid #505050',
          borderTop: '1px solid #303030', padding: '8px',
        }}>
          {/* Track info display */}
          <div style={{
            background: '#0a0a0a', border: '1px inset #333',
            padding: '6px 8px', marginBottom: '6px',
          }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#0FFF50' }}>
                {playing ? '▶' : '■'} {currentTrack + 1}/{PLAYLIST.length}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0FFF50' }}>
                {formatTime(elapsed)}
              </span>
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '9px', color: '#0FFF50',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {PLAYLIST[currentTrack].title}
            </div>
            <div className="flex items-center gap-1 mt-1" style={{ fontSize: '8px', color: '#006600' }}>
              <span>128kbps</span>
              <span>44kHz</span>
              <span>stereo</span>
              {connected && <span style={{ color: '#0FFF50' }}>● 56k</span>}
            </div>
          </div>

          {/* Equalizer */}
          <div style={{
            background: '#0a0a0a', border: '1px inset #333',
            padding: '4px 6px', marginBottom: '6px',
            display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px',
          }}>
            {playing ? (
              Array.from({ length: 20 }).map((_, i) => (
                <EQBar key={i} color={i % 3 === 0 ? '#FF10F0' : '#0FFF50'} maxH={20} />
              ))
            ) : (
              Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ width: '3px', height: '3px', background: '#003300' }} />
              ))
            )}
          </div>

          {/* Transport controls */}
          <div className="flex items-center justify-center gap-1">
            {[
              { label: '⏮', action: prevTrack },
              { label: playing ? '⏸' : '▶', action: () => { setPlaying(!playing); if (!connected) handleConnect() } },
              { label: '⏹', action: () => { setPlaying(false); setElapsed(0) } },
              { label: '⏭', action: nextTrack },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{
                width: '28px', height: '18px',
                background: 'linear-gradient(180deg, #4a4a4a, #2a2a2a)',
                border: '1px solid', borderColor: '#606060 #1a1a1a #1a1a1a #606060',
                color: '#ccc', fontSize: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {btn.label}
              </button>
            ))}
            <button onClick={handleConnect} style={{
              padding: '2px 8px', marginLeft: '8px',
              background: connected ? '#003300' : 'linear-gradient(180deg, #4a4a4a, #2a2a2a)',
              border: '1px solid', borderColor: '#606060 #1a1a1a #1a1a1a #606060',
              color: connected ? '#0FFF50' : '#FFB81C',
              fontSize: '8px', fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
              fontWeight: 700,
            }}>
              {connected ? '● ONLINE' : 'CONNECT'}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 mt-1 px-1">
            <span style={{ fontSize: '8px', color: '#666' }}>VOL</span>
            <div style={{ flex: 1, height: '4px', background: '#1a1a1a', border: '1px inset #333', position: 'relative' }}>
              <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #0FFF50, #FFB81C)' }} />
            </div>
          </div>
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <div style={{
            background: '#0a0a0a', border: '1px solid #505050',
            borderTop: '1px solid #303030', maxHeight: '120px', overflowY: 'auto',
          }}>
            <div style={{
              background: '#1a1a1a', padding: '2px 6px',
              borderBottom: '1px solid #333',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '8px', color: '#0FFF50', fontFamily: 'Tahoma, sans-serif' }}>
                PLAYLIST ({PLAYLIST.length} tracks)
              </span>
              <button onClick={() => setShowPlaylist(false)} style={{
                background: 'none', border: 'none', color: '#666', fontSize: '8px', cursor: 'pointer',
              }}>▾</button>
            </div>
            {PLAYLIST.map((track, i) => (
              <div key={i} onClick={() => { setCurrentTrack(i); setElapsed(0) }}
                className="flex justify-between items-center px-2 py-0.5 cursor-pointer"
                style={{
                  background: i === currentTrack ? '#003300' : 'transparent',
                  borderBottom: '1px solid #1a1a1a',
                }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '9px',
                  color: i === currentTrack ? '#0FFF50' : '#888',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {i + 1}. {track.title}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', flexShrink: 0 }}>
                  {track.duration}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
