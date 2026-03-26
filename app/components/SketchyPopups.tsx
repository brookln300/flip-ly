'use client'

import { useState, useEffect } from 'react'

const SKETCHY_POPUPS = [
  {
    type: 'virus',
    title: '⚠️ WARNING — YOUR COMPUTER HAS 847 VIRUSES',
    body: 'Your PC has been infected by visiting flip-ly.net. Call 1-800-NOT-REAL to speak with a certified garage sale technician.',
    btn1: 'SCAN NOW (don\'t)',
    btn2: 'Ignore at your own risk',
    color: '#ff0000',
    bg: '#FFFFCC',
  },
  {
    type: 'winner',
    title: '🎉 CONGRATULATIONS!!!',
    body: 'You are the 1,000,000th visitor to flip-ly.net! You have won a FREE vintage lamp (slightly cursed). Click OK to claim your prize!',
    btn1: 'CLAIM PRIZE 🏆',
    btn2: 'I don\'t want a cursed lamp',
    color: '#008000',
    bg: '#FFFFF0',
  },
  {
    type: 'hot',
    title: '🔥 HOT SINGLES GARAGE SALES IN YOUR AREA',
    body: 'There are 47 LONELY GARAGE SALES within 5 miles of you RIGHT NOW. They have VINTAGE FURNITURE and they want YOU to come look at it. No strings attached.*',
    btn1: 'SHOW ME THE SALES 😏',
    btn2: 'I\'m not interested in furniture',
    color: '#CC0066',
    bg: '#FFE0F0',
    fine: '*Strings may be attached to the lamp. The lamp is $3.',
  },
  {
    type: 'fbi',
    title: '🚔 FBI ANTI-PIRACY WARNING',
    body: 'The FBI has detected that you downloaded "garage_sale_deals.mp3" from LimeWire. This is a federal offense. To avoid prosecution, sign up for flip-ly.net immediately.',
    btn1: 'I SURRENDER (sign up)',
    btn2: 'I plead the 5th',
    color: '#000080',
    bg: '#E0E0FF',
  },
  {
    type: 'toolbars',
    title: '📦 INSTALL FLIP-LY TOOLBAR?',
    body: 'The Flip-ly.net Super Toolbar™ will: ✓ Add a search bar to your desktop ✓ Change your homepage ✓ Replace your wallpaper with a lobster ✓ Install 14 other toolbars you didn\'t ask for',
    btn1: 'INSTALL (obviously)',
    btn2: 'Maybe later',
    color: '#006600',
    bg: '#E8FFE8',
  },
  {
    type: 'age',
    title: '🔞 AGE VERIFICATION REQUIRED',
    body: 'You must be at least 18 years old to view... these incredible garage sale deals. Some items are TOO GOOD for minors to see. Are you over 18?',
    btn1: 'Yes, show me the deals',
    btn2: 'No, I\'m a baby',
    color: '#990000',
    bg: '#FFE8E8',
  },
]

export default function SketchyPopups() {
  const [popup, setPopup] = useState<typeof SKETCHY_POPUPS[0] | null>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    // Trigger one random sketchy popup after 45-90 seconds, once per session
    if (sessionStorage.getItem('fliply-sketchy')) return

    const delay = 45000 + Math.random() * 45000 // 45-90 seconds
    const timeout = setTimeout(() => {
      sessionStorage.setItem('fliply-sketchy', 'true')
      const p = SKETCHY_POPUPS[Math.floor(Math.random() * SKETCHY_POPUPS.length)]
      setPopup(p)
      setPosition({
        x: Math.random() * 30 + 20, // 20-50% from left
        y: Math.random() * 20 + 15, // 15-35% from top
      })
      setTriggered(true)
    }, delay)

    return () => clearTimeout(timeout)
  }, [])

  const dismiss = () => setPopup(null)

  if (!popup) return null

  return (
    <div className="fixed inset-0 z-[85]" onClick={dismiss} style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div
        className="absolute fall-in"
        onClick={e => e.stopPropagation()}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: `translate(-50%, -50%) rotate(${Math.random() * 4 - 2}deg)`,
          width: '340px',
          maxWidth: '90vw',
        }}
      >
        {/* Win98 window chrome */}
        <div style={{
          border: '2px solid',
          borderColor: '#ffffff #808080 #808080 #ffffff',
          boxShadow: '3px 3px 0 #000',
        }}>
          {/* Title bar */}
          <div style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            padding: '3px 5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '250px',
            }}>
              {popup.type === 'virus' ? 'Internet Explorer' :
               popup.type === 'winner' ? 'Prize Notification' :
               popup.type === 'hot' ? 'LocalSalesMatch.com' :
               popup.type === 'fbi' ? 'Federal Bureau of Investigation' :
               popup.type === 'toolbars' ? 'flip-ly.net Installer' :
               'Age Gate'}
            </span>
            <button onClick={dismiss} style={{
              width: '16px', height: '14px',
              border: '1px solid', borderColor: '#fff #808080 #808080 #fff',
              background: '#c0c0c0', fontSize: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>✕</button>
          </div>

          {/* Body */}
          <div style={{
            background: popup.bg,
            padding: '16px',
            fontFamily: 'Tahoma, sans-serif',
          }}>
            <div className="flex gap-3 items-start mb-3">
              <span className="text-3xl shrink-0">
                {popup.type === 'virus' ? '⚠️' :
                 popup.type === 'winner' ? '🎊' :
                 popup.type === 'hot' ? '💋' :
                 popup.type === 'fbi' ? '🚔' :
                 popup.type === 'toolbars' ? '📦' : '🔞'}
              </span>
              <div>
                <p className="font-bold mb-2" style={{ fontSize: '12px', color: popup.color }}>
                  {popup.title}
                </p>
                <p style={{ fontSize: '11px', color: '#333', lineHeight: 1.5 }}>
                  {popup.body}
                </p>
                {popup.fine && (
                  <p style={{ fontSize: '9px', color: '#999', marginTop: '6px', fontStyle: 'italic' }}>
                    {popup.fine}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button onClick={dismiss} style={{
                padding: '4px 16px',
                border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                background: '#c0c0c0',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '11px',
                cursor: 'pointer',
              }}>
                {popup.btn2}
              </button>
              <button onClick={dismiss} className="blink" style={{
                padding: '4px 16px',
                border: '2px solid', borderColor: '#fff #808080 #808080 #fff',
                background: popup.type === 'hot' ? '#FF69B4' : popup.type === 'virus' ? '#FF4444' : '#c0c0c0',
                color: (popup.type === 'hot' || popup.type === 'virus') ? '#fff' : '#000',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                {popup.btn1}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
