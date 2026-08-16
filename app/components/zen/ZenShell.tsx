'use client'

import { useState } from 'react'

/**
 * Zen shell — the fixed left sidebar + single centered column that every
 * hub page lives in. 2000-era craigslist meets a chat app: a wordmark, a
 * plain nav list, and a small "ask the bot" footer. Below 900px the
 * sidebar folds into a hamburger drawer.
 */
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Board', href: '/board' },
  { label: 'Lists', href: '/lists' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Family', href: '/family' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help', href: '/help' },
]

function SidebarInner({ active }: { active?: string }) {
  return (
    <div className="flex h-full flex-col px-4 py-5">
      <a href="/" className="text-[16px] font-semibold tracking-tight text-zen-text no-underline">
        flip-ly
      </a>
      <nav aria-label="Site" className="mt-5 flex flex-col gap-px">
        {NAV.map(l => (
          <a
            key={l.label}
            href={l.href}
            aria-current={l.label === active ? 'page' : undefined}
            className={`rounded-sm px-1.5 py-1 text-[13.5px] lowercase no-underline transition-colors ${
              l.label === active
                ? 'font-semibold text-zen-accent'
                : 'text-zen-muted hover:text-zen-text hover:underline'
            }`}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className="mt-auto border-t border-zen-line pt-3 text-[12px] leading-relaxed text-zen-muted">
        <div className="font-semibold lowercase">ask the bot</div>
        <div className="mt-1 font-data text-[11.5px]">/today · /free · /check · /addgroup</div>
        <div className="mt-0.5">in the family Telegram</div>
      </div>
    </div>
  )
}

export default function ZenShell({ active, children }: { active?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="zen min-h-screen bg-zen-bg text-zen-text">
      {/* Mobile top bar (<900px) */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-zen-line bg-zen-bg px-4 py-2.5 min-[900px]:hidden">
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className="rounded-sm border border-zen-line px-2 py-0.5 text-[14px] leading-none text-zen-muted hover:text-zen-text"
        >
          ≡
        </button>
        <a href="/" className="text-[15px] font-semibold text-zen-text no-underline">flip-ly</a>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 min-[900px]:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-60 overflow-y-auto border-r border-zen-line bg-zen-bg">
            <SidebarInner active={active} />
          </aside>
        </div>
      )}

      {/* Fixed sidebar (≥900px) */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-52 border-r border-zen-line bg-zen-bg min-[900px]:block">
        <SidebarInner active={active} />
      </aside>

      {/* Content column */}
      <main id="main" className="min-[900px]:pl-52">
        <div className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-5">{children}</div>
      </main>
    </div>
  )
}
