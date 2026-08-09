'use client'

import { motion } from 'framer-motion'

/**
 * Hearth primitive — frosted glass surface on the dark deck.
 * Gentle mount fade/slide-up (stagger via `delay`), hover lift when
 * interactive. Pass `href` to render the whole card as a link.
 */
type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
  href?: string
  hover?: boolean
}

const SURFACE =
  'rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

export default function GlassCard({ children, className = '', delay = 0, href, hover = false }: Props) {
  const cls = `${SURFACE} ${className}`
  const anim = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
  }
  const lift = href || hover ? { whileHover: { y: -3, transition: { duration: 0.18 } } } : {}

  if (href) {
    return (
      <motion.a
        href={href}
        {...anim}
        {...lift}
        className={`${cls} block no-underline hover:border-white/[0.14] transition-colors`}
      >
        {children}
      </motion.a>
    )
  }
  return (
    <motion.div {...anim} {...lift} className={cls}>
      {children}
    </motion.div>
  )
}
