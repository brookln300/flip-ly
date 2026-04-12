'use client'

import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getConsent } from '../lib/consent'

export default function ConsentGatedAnalytics() {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const check = () => setAccepted(getConsent() === 'accepted')
    check()
    window.addEventListener('fliply-consent-change', check)
    return () => window.removeEventListener('fliply-consent-change', check)
  }, [])

  if (!accepted) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
