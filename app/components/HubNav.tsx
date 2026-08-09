'use client'

import { Flame } from 'lucide-react'
import { useSignup } from './SignupContext'

/**
 * The hub's plain, warm, always-there nav. The Hearth scene is the soul;
 * this is the skeleton — nobody ever needs the magic to find the calendar.
 * Dark-deck glass chrome; active link carries the ember accent.
 */
const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Radar', href: '/radar' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Family', href: '/family' },
  { label: 'Deals', href: '/deals' },
  { label: 'Help', href: '/help' },
]

export default function HubNav({ active = 'Home' }: { active?: string }) {
  const { openSignup, loggedInUser } = useSignup()
  return (
    <header className="sticky top-0 z-[80] border-b border-white/[0.08] bg-[#0B0F1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-4 py-3">
        <a href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-[0_0_14px_rgba(249,115,22,0.5)]"
          >
            <Flame className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-slate-50">
            The Hearth
          </span>
        </a>
        <nav aria-label="Hub navigation" className="scrollbar-none flex items-center gap-0.5 overflow-x-auto">
          {LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm no-underline transition-colors ${
                l.label === active
                  ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 font-semibold text-amber-200'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
              }`}
            >
              {l.label}
            </a>
          ))}
          {loggedInUser ? (
            <a
              href="/family/me"
              title="Tend your lantern"
              className="ml-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3.5 py-1.5 text-[13px] font-semibold text-white no-underline shadow-[0_2px_14px_rgba(249,115,22,0.35)] transition-all hover:brightness-110"
            >
              My lantern
            </a>
          ) : (
            <button
              onClick={openSignup}
              className="ml-2 min-h-0 whitespace-nowrap rounded-lg border-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_14px_rgba(249,115,22,0.35)] transition-all hover:brightness-110"
            >
              Come in
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
