'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type SignupContextType = {
  showSignup: boolean
  openSignup: () => void
  closeSignup: () => void
  sourceGateOpen: boolean
  openSourceGate: () => void
  closeSourceGate: () => void
}

const SignupContext = createContext<SignupContextType>({
  showSignup: false,
  openSignup: () => {},
  closeSignup: () => {},
  sourceGateOpen: false,
  openSourceGate: () => {},
  closeSourceGate: () => {},
})

export function useSignup() {
  return useContext(SignupContext)
}

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [showSignup, setShowSignup] = useState(false)
  const [sourceGateOpen, setSourceGateOpen] = useState(false)

  const openSignup = useCallback(() => setShowSignup(true), [])
  const closeSignup = useCallback(() => setShowSignup(false), [])
  const openSourceGate = useCallback(() => setSourceGateOpen(true), [])
  const closeSourceGate = useCallback(() => setSourceGateOpen(false), [])

  return (
    <SignupContext.Provider value={{ showSignup, openSignup, closeSignup, sourceGateOpen, openSourceGate, closeSourceGate }}>
      {children}
    </SignupContext.Provider>
  )
}
