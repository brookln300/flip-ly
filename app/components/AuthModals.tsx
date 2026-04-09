'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSignup } from './SignupContext'
import { trackGoogleAdsConversion, trackGA4Event } from './GoogleAnalytics'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
)

export default function AuthModals() {
  const { showSignup, closeSignup, sourceGateOpen, closeSourceGate, openSignup } = useSignup()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signingUp, setSigningUp] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)

  // Capture UTM params + signup intent
  const [utmSource, setUtmSource] = useState<string | null>(null)
  const [signupIntent, setSignupIntent] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source')
    if (source) {
      sessionStorage.setItem('fliply_utm_source', source)
      sessionStorage.setItem('fliply_utm_medium', params.get('utm_medium') || '')
      sessionStorage.setItem('fliply_utm_campaign', params.get('utm_campaign') || '')
      setUtmSource(source)
    } else {
      const saved = sessionStorage.getItem('fliply_utm_source')
      if (saved) setUtmSource(saved)
    }
    const intent = params.get('signup')
    if (intent === 'pro') {
      sessionStorage.setItem('fliply_signup_intent', 'pro')
      setSignupIntent('pro')
      openSignup()
    } else {
      const savedIntent = sessionStorage.getItem('fliply_signup_intent')
      if (savedIntent) setSignupIntent(savedIntent)
    }
  }, [openSignup])

  /** Return the right post-auth destination and clear stored intent */
  const getPostAuthUrl = () => {
    const intent = signupIntent || sessionStorage.getItem('fliply_signup_intent')
    if (intent === 'pro') {
      sessionStorage.removeItem('fliply_signup_intent')
      return '/pro'
    }
    return '/dashboard'
  }

  /** Call signIn('google') with the correct callbackUrl based on intent */
  const handleGoogleSignIn = () => {
    const url = getPostAuthUrl()
    signIn('google', { callbackUrl: url })
  }

  const handleClose = () => {
    closeSignup()
    setSubmitted(false)
    setSignupError('')
    setEmail('')
    setPassword('')
    setIsLoginMode(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          utm_source: sessionStorage.getItem('fliply_utm_source') || undefined,
          utm_medium: sessionStorage.getItem('fliply_utm_medium') || undefined,
          utm_campaign: sessionStorage.getItem('fliply_utm_campaign') || undefined,
          gclid: sessionStorage.getItem('fliply_gclid') || undefined,
          fbclid: sessionStorage.getItem('fliply_fbclid') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data.error || 'Signup failed')
        setSigningUp(false)
        return
      }
      setSubmitted(true)
      trackGA4Event('sign_up', { method: 'email' })
      trackGoogleAdsConversion('YYhjCIqC4pQcENWFh4MD')
      const dest = getPostAuthUrl()
      setTimeout(() => { window.location.href = dest }, 2000)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSigningUp(true)
    setSignupError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data.error || 'Login failed')
        setSigningUp(false)
        return
      }
      setSubmitted(true)
      const dest = getPostAuthUrl()
      setTimeout(() => { window.location.href = dest }, 1500)
    } catch {
      setSignupError('Something went wrong. Please try again.')
      setSigningUp(false)
    }
  }

  return (
    <>
      {/* SOURCE GATE OVERLAY */}
      {sourceGateOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label="Sign up for source links"
          onClick={closeSourceGate} style={{ background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
          <div className="w-full max-w-sm relative" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', borderRadius: '16px', cursor: 'default', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '32px 28px', textAlign: 'center',
          }}>
            <button onClick={closeSourceGate} aria-label="Close dialog"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              X
            </button>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Sign up free for scores + source links
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Get direct links to listings, full AI scores, and a weekly digest of the best deals near you.
            </p>
            <button
              onClick={() => { closeSourceGate(); handleGoogleSignIn() }}
              style={{
                width: '100%', padding: '12px', background: '#fff', color: 'var(--text-primary)',
                border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer', marginBottom: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              onClick={() => { closeSourceGate(); openSignup() }}
              style={{
                width: '100%', padding: '12px', background: 'var(--accent-green)', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Sign up with email
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>
              Free forever. No credit card needed.
            </p>
          </div>
        </div>
      )}

      {/* SIGNUP MODAL */}
      {showSignup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label={isLoginMode ? 'Log in' : 'Sign up'}
          onClick={handleClose} style={{ background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', border: '1px solid var(--border-default)',
            borderRadius: '16px', cursor: 'default', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <button onClick={handleClose} aria-label="Close dialog"
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              &#10005;
            </button>
            <div style={{ padding: 'var(--space-6)' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>
                    {isLoginMode ? 'Welcome Back' : 'You\'re In'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                    {isLoginMode ? 'Redirecting to your dashboard...' : 'Welcome. Check your email for confirmation.'}
                  </p>
                  {!isLoginMode && <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>(check spam too)</p>}
                  <button onClick={handleClose} style={{
                    marginTop: 'var(--space-6)', padding: '8px 24px',
                    background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>Continue</button>
                </div>
              ) : isLoginMode ? (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome Back</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Log in to your account.</p>
                  <button onClick={() => handleGoogleSignIn()} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', cursor: 'pointer',
                  }}>
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                  </div>
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="cl-input" aria-label="Email address" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" required className="cl-input" aria-label="Password" />
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>{signingUp ? 'Logging in...' : 'Log In'}</button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(false); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>Don&apos;t have an account? Sign up</button>
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Create Your Account</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Free. 15 searches/day. No credit card.</p>
                  <button onClick={() => handleGoogleSignIn()} type="button" style={{
                    width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', cursor: 'pointer',
                  }}>
                    <GoogleIcon />
                    Sign up with Google
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or email</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-active)' }} />
                  </div>
                  <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="cl-input" aria-label="Email address" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password (6+ chars)" required minLength={6} className="cl-input" aria-label="Password" />
                    {signupError && <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{signupError}</p>}
                    <button type="submit" disabled={signingUp} style={{
                      width: '100%', padding: '12px', fontWeight: 700, fontSize: '16px',
                      background: signingUp ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
                      border: 'none', borderRadius: '6px', cursor: signingUp ? 'wait' : 'pointer',
                    }}>{signingUp ? 'Creating account...' : 'Get Started Free'}</button>
                  </form>
                  <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                    <button onClick={() => { setIsLoginMode(true); setSignupError('') }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px',
                    }}>Already have an account? Log in</button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
