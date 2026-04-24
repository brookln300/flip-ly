'use client'

import { CSSProperties } from 'react'
import { useSignup } from './SignupContext'
import { trackFunnelEvent } from '../lib/analytics-client'

type PricingLinkProps = {
  href: string
  label: string
  tier: 'pro' | 'power'
  surface: string
  className?: string
  style?: CSSProperties
}

export default function PricingLink({ href, label, tier, surface, className, style }: PricingLinkProps) {
  const { loggedInUser } = useSignup()

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={() => {
        trackFunnelEvent('plan_selected', {
          tier,
          surface,
          logged_in: !!loggedInUser,
        })
      }}
    >
      {label}
    </a>
  )
}
