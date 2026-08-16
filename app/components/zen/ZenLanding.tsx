'use client'

import { useSignup } from '../SignupContext'

/**
 * Logged-out front door, zen edition — one line, one button, nothing else.
 * The site is private (allowlist + noindex), so this says just enough for
 * family and nothing for anyone else.
 */
export default function ZenLanding() {
  const { openSignup } = useSignup()

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zen-text">flip-ly</h1>
        <p className="mt-2 text-[14px] text-zen-muted">the family deal radar</p>
        <button
          onClick={openSignup}
          className="mt-7 border border-zen-line px-5 py-1.5 text-[13.5px] text-zen-text transition-colors hover:border-zen-accent hover:text-zen-accent"
        >
          sign in
        </button>
      </section>
      <footer className="border-t border-zen-line px-6 py-4 text-center text-[12px] text-zen-muted">
        a private family hub · DFW · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
