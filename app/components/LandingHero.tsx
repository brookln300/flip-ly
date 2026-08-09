'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useSignup } from './SignupContext'
import EmberButton from './ui/EmberButton'

/**
 * Logged-out front door — one dark hero, one CTA. The site is private
 * (allowlist + noindex), so this says just enough for family and nothing
 * for anyone else.
 */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

export default function LandingHero() {
  const { openSignup } = useSignup()

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Ember glow behind the mark */}
        <div
          aria-hidden="true"
          className="ember-halo pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2"
        />

        <motion.div {...fadeUp(0)} className="relative">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-300/30 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-[0_8px_40px_rgba(249,115,22,0.45)]">
            <Flame className="h-8 w-8 text-white" aria-hidden="true" />
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.12)}
          className="relative mt-8 font-display text-5xl font-semibold tracking-tight text-slate-50 sm:text-6xl"
        >
          flip-ly
        </motion.h1>

        <motion.p {...fadeUp(0.22)} className="relative mt-3 text-lg text-slate-400 sm:text-xl">
          the family <span className="text-ember font-semibold">deal radar</span>
        </motion.p>

        <motion.p
          {...fadeUp(0.32)}
          className="relative mt-5 max-w-md text-[14px] leading-relaxed text-slate-500"
        >
          A private hub for our family — the deals worth chasing, the gatherings worth planning,
          and the people worth both.
        </motion.p>

        <motion.div {...fadeUp(0.44)} className="relative mt-9">
          <EmberButton onClick={openSignup}>Sign in</EmberButton>
        </motion.div>
      </section>

      <motion.footer
        {...fadeUp(0.6)}
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/[0.06] px-6 py-5 text-xs text-slate-600"
      >
        <span>The Hearth · a private family hub</span>
        <span aria-hidden="true">·</span>
        <span>DFW</span>
        <span aria-hidden="true">·</span>
        <span>{new Date().getFullYear()}</span>
      </motion.footer>
    </div>
  )
}
