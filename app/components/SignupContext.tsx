'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { clearAuthIntent, readAuthIntent, trackFunnelEvent } from '../lib/analytics-client'

type SignupContextType = {
  showSignup: boolean
  openSignup: () => void
  closeSignup: () => void
  sourceGateOpen: boolean
  openSourceGate: () => void
  closeSourceGate: () => void
  loggedInUser: any
  authLoading: boolean
}

const SignupContext = createContext<SignupContextType>({
  showSignup: false,
  openSignup: () => {},
  closeSignup: () => {},
  sourceGateOpen: false,
  openSourceGate: () => {},
  closeSourceGate: () => {},
  loggedInUser: null,
  authLoading: true,
})

export function useSignup() {
  return useContext(SignupContext)
}

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [showSignup, setShowSignup] = useState(false)
  const [sourceGateOpen, setSourceGateOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setLoggedInUser(data.user) })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!loggedInUser) return

    const pendingAuth = readAuthIntent()
    if (!pendingAuth) return

    trackFunnelEvent('auth_completed_with_plan_intent', {
      intent: pendingAuth.intent,
      method: pendingAuth.method,
      surface: pendingAuth.surface,
      logged_in: true,
    })
    clearAuthIntent()
  }, [loggedInUser])

  const openSignup = useCallback(() => setShowSignup(true), [])
  const closeSignup = useCallback(() => setShowSignup(false), [])
  const openSourceGate = useCallback(() => setSourceGateOpen(true), [])
  const closeSourceGate = useCallback(() => setSourceGateOpen(false), [])

  return (
    <SignupContext.Provider value={{ showSignup, openSignup, closeSignup, sourceGateOpen, openSourceGate, closeSourceGate, loggedInUser, authLoading }}>
      {children}
    </SignupContext.Provider>
  )
}
