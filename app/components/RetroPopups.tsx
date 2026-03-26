'use client'

import { useState, useEffect } from 'react'

interface Popup {
  id: number
  type: 'limewire' | 'icq' | 'aol' | 'clippy'
  x: number
  y: number
}

const LIMEWIRE_FILES = [
  'EstateSale_McKinney_DEALS.zip',
  'garage_sale_plano_FREE_NO_VIRUS.exe',
  'vintage_furniture_dallas_128kbps.mp3',
  'totally_legal_couch_flip_guide.pdf',
  'craigslist_scraper_v4.20.rar',
]

const ICQ_MESSAGES = [
  'New garage sale match in your area!',
  'G1TC# wants to chat about a $5 lamp',
  'Someone outbid you on that vintage table',
  '🔥 Estate sale alert: McKinney, TX',
  'Your saved search found 3 new listings',
]

const AOL_SUBJECTS = [
  'You\'ve Got Deals!',
  'RE: RE: FWD: AMAZING GARAGE SALE THIS SAT',
  'Weekly Flip Report — $847 profit this week',
]

export default function RetroPopups() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [nextId, setNextId] = useState(0)

  useEffect(() => {
    // Spawn popups — stabilized: max 1 at a time, slower cadence
    const spawn = () => {
      const types: Popup['type'][] = ['limewire', 'icq', 'aol', 'clippy']
      const type = types[Math.floor(Math.random() * types.length)]
      const id = nextId
      setNextId(n => n + 1)
      setPopups([{ // only 1 at a time
        id,
        type,
        x: Math.random() * 50 + 15,
        y: Math.random() * 40 + 25,
      }])
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== id))
      }, 5000)
    }

    // First popup after 15 seconds, then every 20-25 seconds
    const first = setTimeout(spawn, 15000)
    const interval = setInterval(spawn, 20000 + Math.random() * 5000)
    return () => { clearTimeout(first); clearInterval(interval) }
  }, [nextId])

  const dismiss = (id: number) => setPopups(prev => prev.filter(p => p.id !== id))

  return (
    <div className="pointer-events-none fixed inset-0 z-[40]">
      {popups.map(popup => (
        <div key={popup.id} className="pointer-events-auto absolute fall-in"
          style={{ left: `${popup.x}%`, top: `${popup.y}%`, transform: `rotate(${Math.random() * 4 - 2}deg)` }}>

          {popup.type === 'limewire' && (
            <div style={{ width: '260px', position: 'relative', cursor: 'pointer' }} onClick={() => dismiss(popup.id)}>
              <img src="/assets/limewire-popup.jpg" alt="LimeWire Download"
                style={{
                  width: '100%', borderRadius: '4px',
                  boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
                  border: '2px solid #FFB81C',
                }}
              />
              {/* Overlay with actual filename */}
              <div style={{
                position: 'absolute', bottom: '30%', left: '50%', transform: 'translateX(-50%)',
                fontFamily: 'Tahoma, sans-serif', fontSize: '9px', color: '#000',
                background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '2px',
                whiteSpace: 'nowrap',
              }}>
                {LIMEWIRE_FILES[Math.floor(Math.random() * LIMEWIRE_FILES.length)]}
              </div>
              <button onClick={(e) => { e.stopPropagation(); dismiss(popup.id) }} style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '16px', height: '16px', background: '#c0c0c0',
                border: '1px solid #808080', fontSize: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          )}

          {popup.type === 'icq' && (
            <div style={{
              background: '#FFFFC0', border: '2px solid #808000',
              padding: '8px 12px', width: '220px',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '16px' }}>🌸</span>
                <span style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '10px', fontWeight: 700, color: '#006600' }}>
                  ICQ — Uh-Oh!
                </span>
                <button onClick={() => dismiss(popup.id)} style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  fontSize: '12px', cursor: 'pointer', color: '#800000',
                }}>✕</button>
              </div>
              <p style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', color: '#333' }}>
                {ICQ_MESSAGES[Math.floor(Math.random() * ICQ_MESSAGES.length)]}
              </p>
            </div>
          )}

          {popup.type === 'aol' && (
            <div className="win98-window" style={{ width: '260px' }}>
              <div className="win98-titlebar" style={{ background: 'linear-gradient(90deg, #000080, #4040c0)' }}>
                <span className="win98-titlebar-text">📧 AOL Mail</span>
                <button className="win98-btn" onClick={() => dismiss(popup.id)}>✕</button>
              </div>
              <div className="win98-body">
                <p className="font-bold mb-1" style={{ fontSize: '13px', color: '#000080' }}>
                  📬 You&apos;ve Got Deals!
                </p>
                <p style={{ fontSize: '10px', color: '#333' }}>
                  {AOL_SUBJECTS[Math.floor(Math.random() * AOL_SUBJECTS.length)]}
                </p>
                <button onClick={() => dismiss(popup.id)} className="mt-2 px-4 py-1 text-xs" style={{
                  border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                  background: '#c0c0c0', cursor: 'pointer', fontFamily: 'Tahoma, sans-serif',
                }}>
                  Read Mail
                </button>
              </div>
            </div>
          )}

          {popup.type === 'clippy' && (
            <div style={{
              background: '#FFFFCC', border: '2px solid #999',
              padding: '10px 14px', width: '200px', borderRadius: '8px',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
            }}>
              <div className="flex items-start gap-2">
                <span className="text-2xl">📎</span>
                <div>
                  <p style={{ fontFamily: 'Tahoma, sans-serif', fontSize: '11px', color: '#333' }}>
                    It looks like you&apos;re trying to find garage sales. Would you like help?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => dismiss(popup.id)} className="px-3 py-0.5 text-xs" style={{
                      border: '1px solid #999', background: '#e0e0e0',
                      fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
                    }}>
                      Yes please
                    </button>
                    <button onClick={() => dismiss(popup.id)} className="px-3 py-0.5 text-xs" style={{
                      border: '1px solid #999', background: '#e0e0e0',
                      fontFamily: 'Tahoma, sans-serif', cursor: 'pointer',
                    }}>
                      Go away
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
