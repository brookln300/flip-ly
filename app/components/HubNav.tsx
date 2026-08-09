'use client'

import { useState } from 'react'
import { Flame, MoreHorizontal } from 'lucide-react'
import { useSignup } from './SignupContext'

/**
 * The hub's plain, warm, always-there nav. The Hearth scene is the soul;
 * this is the skeleton — nobody ever needs the magic to find the calendar.
 * Dark-deck glass chrome; active link carries the ember accent. On small
 * screens the everyday links stay visible and the rest fold into "More"
 * (kept outside the scroll strip so the dropdown never clips).
 */
const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Radar', href: '/radar' },
  { label: 'Board', href: '/board' },
  { label: 'Lists', href: '/lists' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Family', href: '/family' },
  { label: 'Deals', href: '/deals' },
  { label: 'Help', href: '/help' },
]

// First N links always visible; the rest collapse behind "More" on mobile.
const PRIMARY_COUNT = 4

export default function HubNav({ active = 'Home' }: { active?: string }) {
  const { openSignup, loggedInUser } = useSignup()
  const [moreOpen, setMoreOpen] = useState(false)
  const overflow = LINKS.slice(PRIMARY_COUNT)
  const activeInOverflow = overflow.some(l => l.label === active)

  const linkCls = (label: string) =>
    `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm no-underline transition-colors ${
      label === active
        ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 font-semibold text-amber-200'
        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
    }`

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
          <span className="hidden font-display text-lg font-semibold tracking-tight text-slate-50 min-[420px]:inline">
            The Hearth
          </span>
        </a>
        <div className="flex min-w-0 items-center gap-0.5">
          <nav aria-label="Hub navigation" className="scrollbar-none flex items-center gap-0.5 overflow-x-auto">
            {LINKS.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`${i >= PRIMARY_COUNT ? 'hidden md:inline-block ' : ''}${linkCls(l.label)}`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Mobile overflow — everything past the everyday four */}
          <span className="relative shrink-0 md:hidden">
            <button
              onClick={() => setMoreOpen(v => !v)}
              aria-label="More pages"
              aria-expanded={moreOpen}
              className={`flex items-center rounded-lg px-2.5 py-1.5 transition-colors ${
                activeInOverflow
                  ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-200'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {moreOpen && (
              <span className="absolute right-0 top-full z-[90] mt-2 flex w-36 flex-col rounded-xl border border-white/[0.1] bg-[#0B0F1A]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                {overflow.map(l => (
                  <a key={l.label} href={l.href} className={linkCls(l.label)}>
                    {l.label}
                  </a>
                ))}
              </span>
            )}
          </span>

          {loggedInUser ? (
            <a
              href="/family/me"
              title="Tend your lantern"
              className="ml-2 shrink-0 whitespace-nowrap rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3.5 py-1.5 text-[13px] font-semibold text-white no-underline shadow-[0_2px_14px_rgba(249,115,22,0.35)] transition-all hover:brightness-110"
            >
              My lantern
            </a>
          ) : (
            <button
              onClick={openSignup}
              className="ml-2 min-h-0 shrink-0 whitespace-nowrap rounded-lg border-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_14px_rgba(249,115,22,0.35)] transition-all hover:brightness-110"
            >
              Come in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
