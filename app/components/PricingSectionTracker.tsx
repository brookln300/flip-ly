'use client'

import { useEffect, useRef } from 'react'
import { useSignup } from './SignupContext'
import { trackFunnelEvent } from '../lib/analytics-client'

export default function PricingSectionTracker() {
  const { loggedInUser, authLoading } = useSignup()
  const ref = useRef<HTMLDivElement | null>(null)
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!ref.current || authLoading || trackedRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || trackedRef.current) return

        trackedRef.current = true
        trackFunnelEvent('pricing_viewed', {
          surface: 'landing_pricing',
          logged_in: !!loggedInUser,
        })

        fetch('/api/founding')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.active) {
              trackFunnelEvent('founding_badge_shown', {
                surface: 'landing_pricing',
                slots_remaining: typeof data.slotsRemaining === 'number' ? data.slotsRemaining : -1,
                days_remaining: data.timeRemaining?.days ?? 0,
                logged_in: !!loggedInUser,
              })
            }
          })
          .catch(() => {})

        observer.disconnect()
      },
      { threshold: 0.35 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [authLoading, loggedInUser])

  return <div ref={ref} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', pointerEvents: 'none' }} />
}
