'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getConsent, setConsent, hasConsent } from '../lib/consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(true)

  useEffect(() => {
    if (!hasConsent()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAcceptAll = () => {
    setConsent('accepted')
    setVisible(false)
    window.dispatchEvent(new Event('fliply-consent-change'))
  }

  const handleDeclineAll = () => {
    setConsent('declined')
    setVisible(false)
    window.dispatchEvent(new Event('fliply-consent-change'))
  }

  const handleSavePrefs = () => {
    setConsent(analyticsOn ? 'accepted' : 'declined')
    setVisible(false)
    window.dispatchEvent(new Event('fliply-consent-change'))
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-default)',
        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '16px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              flex: '1 1 auto',
              minWidth: 240,
            }}
          >
            We use cookies for authentication and, with your consent, analytics.{' '}
            <Link
              href="/privacy"
              style={{
                color: 'var(--accent-green)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Privacy Policy
            </Link>
          </p>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowPrefs(v => !v)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                lineHeight: 1,
              }}
            >
              Customize
            </button>
            <button
              onClick={handleDeclineAll}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                lineHeight: 1,
              }}
            >
              Decline
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent-green)',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                lineHeight: 1,
              }}
            >
              Accept
            </button>
          </div>
        </div>

        {/* Granular preferences panel */}
        {showPrefs && (
          <div style={{
            marginTop: 14,
            padding: '14px 16px',
            background: 'var(--bg-surface)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Essential — always on */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Essential</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Authentication, preferences</span>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(22,163,74,0.08)', color: 'var(--accent-green)',
                }}>Always on</span>
              </div>

              {/* Analytics — toggleable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Analytics</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Google Analytics, Vercel Analytics</span>
                </div>
                <button
                  onClick={() => setAnalyticsOn(v => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: analyticsOn ? 'var(--accent-green)' : 'var(--border-default)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: analyticsOn ? 20 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSavePrefs}
              style={{
                marginTop: 12, padding: '8px 20px', fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: 'none', background: 'var(--accent-green)',
                color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
