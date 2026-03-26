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
    // Spawn popups randomly
    const spawn = () => {
      const types: Popup['type'][] = ['limewire', 'icq', 'aol', 'clippy']
      const type = types[Math.floor(Math.random() * types.length)]
      const id = nextId
      setNextId(n => n + 1)
      setPopups(prev => [...prev.slice(-3), { // max 4 at once
        id,
        type,
        x: Math.random() * 60 + 10,
        y: Math.random() * 50 + 20,
      }])
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== id))
      }, 6000)
    }

    // First popup after 8 seconds, then every 12-18 seconds
    const first = setTimeout(spawn, 8000)
    const interval = setInterval(spawn, 12000 + Math.random() * 6000)
    return () => { clearTimeout(first); clearInterval(interval) }
  }, [nextId])

  const dismiss = (id: number) => setPopups(prev => prev.filter(p => p.id !== id))

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {popups.map(popup => (
        <div key={popup.id} className="pointer-events-auto absolute fall-in"
          style={{ left: `${popup.x}%`, top: `${popup.y}%`, transform: `rotate(${Math.random() * 4 - 2}deg)` }}>

          {popup.type === 'limewire' && (
            <div className="win98-window" style={{ width: '280px' }}>
              <div className="win98-titlebar" style={{ background: 'linear-gradient(90deg, #006600, #00aa00)' }}>
                <span className="win98-titlebar-text">🍋 LimeWire 4.18.8</span>
                <button className="win98-btn" onClick={() => dismiss(popup.id)}>✕</button>
              </div>
              <div className="win98-body" style={{ fontSize: '11px' }}>
                <p className="font-bold mb-1">📥 Downloading:</p>
                <p style={{ color: '#006600', fontSize: '10px', wordBreak: 'break-all' }}>
                  {LIMEWIRE_FILES[Math.floor(Math.random() * LIMEWIRE_FILES.length)]}
                </p>
                <div className="mt-2 mb-1" style={{ background: '#ddd', height: '12px', border: '1px inset #999' }}>
                  <div style={{
                    width: `${Math.floor(Math.random() * 60 + 20)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0FFF50, #00aa00)',
                  }} />
                </div>
                <p style={{ fontSize: '9px', color: '#666' }}>
                  {(Math.random() * 3 + 0.1).toFixed(1)} KB/s — 56k modem detected
                </p>
              </div>
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
