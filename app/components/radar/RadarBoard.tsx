'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, ExternalLink, MapPin, Radar } from 'lucide-react'
import ScoreChip from '../ui/ScoreChip'
import { DealListing, fmtEstRange, fmtPrice, sourceLabel, timeAgo } from './types'

/**
 * Deal Radar board — client side of /radar. Takes the server-fetched
 * listings and layers on filter chips + copy-to-clipboard replies.
 * Filters are radio-style: All / Free / Under $50 / one source / one category.
 */
type Filter =
  | { kind: 'all' }
  | { kind: 'free' }
  | { kind: 'under50' }
  | { kind: 'source'; value: string }
  | { kind: 'category'; value: string }

function filterKey(f: Filter): string {
  return 'value' in f ? `${f.kind}:${f.value}` : f.kind
}

export default function RadarBoard({ listings }: { listings: DealListing[] }) {
  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const sources = useMemo(
    () => Array.from(new Set(listings.map(l => l.source))).sort(),
    [listings]
  )
  const categories = useMemo(
    () => Array.from(new Set(listings.map(l => l.category).filter((c): c is string => !!c))).sort(),
    [listings]
  )

  const visible = useMemo(() => {
    switch (filter.kind) {
      case 'free':
        return listings.filter(l => l.is_free)
      case 'under50':
        return listings.filter(l => l.is_free || (l.price_listed != null && l.price_listed < 50))
      case 'source':
        return listings.filter(l => l.source === filter.value)
      case 'category':
        return listings.filter(l => l.category === filter.value)
      default:
        return listings
    }
  }, [listings, filter])

  const copyReply = (l: DealListing) => {
    if (!l.suggested_reply) return
    navigator.clipboard
      .writeText(l.suggested_reply)
      .then(() => {
        setCopiedId(l.id)
        setTimeout(() => setCopiedId(prev => (prev === l.id ? null : prev)), 1800)
      })
      .catch(() => {})
  }

  const chips: { label: string; f: Filter }[] = [
    { label: 'All', f: { kind: 'all' } },
    { label: 'Free', f: { kind: 'free' } },
    { label: 'Under $50', f: { kind: 'under50' } },
    ...sources.map(s => ({ label: sourceLabel(s), f: { kind: 'source', value: s } as Filter })),
    ...categories.map(c => ({ label: c, f: { kind: 'category', value: c } as Filter })),
  ]

  return (
    <div>
      {/* Filter chips */}
      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map(({ label, f }) => {
          const active = filterKey(f) === filterKey(filter)
          return (
            <button
              key={filterKey(f)}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                active
                  ? 'border-orange-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200'
                  : 'border-white/[0.08] bg-slate-900/60 text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 px-6 py-16 text-center backdrop-blur-md">
          <Radar className="mx-auto mb-4 h-10 w-10 text-amber-400/70" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-slate-50">
            The radar is watching — nothing scored yet today.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            New finds from the groups and Craigslist land here as soon as they&apos;re scored.
          </p>
        </div>
      )}

      {/* Listing cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((l, i) => (
          <motion.article
            key={l.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-white/[0.14]"
          >
            <div className="flex items-start gap-3.5">
              <ScoreChip score={l.score} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold leading-snug text-slate-50 line-clamp-2">
                  {l.title || 'Untitled listing'}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`font-data text-lg font-bold tracking-tight ${
                      l.is_free ? 'text-emerald-300' : 'text-slate-50'
                    }`}
                  >
                    {fmtPrice(l)}
                  </span>
                  {fmtEstRange(l) && (
                    <span className="text-xs text-slate-400">
                      → est <span className="font-data text-slate-300">{fmtEstRange(l)}</span>
                    </span>
                  )}
                </div>
              </div>
              {l.external_url && (
                <a
                  href={l.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open original listing"
                  className="shrink-0 rounded-lg border border-white/[0.08] p-2 text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Meta rows */}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              {l.category && <span className="capitalize text-slate-300">{l.category}</span>}
              {l.category && l.flip_type && <span aria-hidden="true">·</span>}
              {l.flip_type && <span className="capitalize">{l.flip_type} flip</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              {l.location_text && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {l.location_text}
                </span>
              )}
              {l.location_text && <span aria-hidden="true">·</span>}
              <span>{sourceLabel(l.source)}</span>
              <span aria-hidden="true">·</span>
              <span>{timeAgo(l.posted_at || l.ingested_at)}</span>
            </div>

            {l.reasoning && (
              <p className="mt-3 text-[13px] italic leading-relaxed text-slate-400 line-clamp-3">
                {l.reasoning}
              </p>
            )}

            {l.suggested_reply && (
              <button
                onClick={() => copyReply(l)}
                title="Copy suggested reply"
                className="group mt-3 rounded-xl border border-white/[0.08] bg-slate-950/50 p-3 text-left transition-colors hover:border-amber-400/30"
              >
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {copiedId === l.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 group-hover:text-amber-300" aria-hidden="true" />
                      <span className="group-hover:text-amber-300">Suggested reply — tap to copy</span>
                    </>
                  )}
                </span>
                <span className="block text-[13px] leading-relaxed text-slate-300 line-clamp-2">
                  {l.suggested_reply}
                </span>
              </button>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  )
}
