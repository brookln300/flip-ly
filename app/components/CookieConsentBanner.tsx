'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getConsent, setConsent, hasConsent } from '../lib/consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasConsent()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setConsent('accepted')
    setVisible(false)
    window.location.reload()
  }

  const handleDecline = () => {
    setConsent('declined')
    setVisible(false)
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
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
          We use cookies to analyze site usage and improve your experience. See our{' '}
          <Link
            href="/privacy"
            style={{
              color: 'var(--accent-green)',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            Privacy Policy
          </Link>{' '}
          for details.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleDecline}
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
            onClick={handleAccept}
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
    </div>
  )
}
