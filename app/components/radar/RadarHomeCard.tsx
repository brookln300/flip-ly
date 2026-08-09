import { Radar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import GlassCard from '../ui/GlassCard'
import ScoreChip from '../ui/ScoreChip'
import SectionHeader from '../ui/SectionHeader'
import { DEAL_LISTING_COLUMNS, DealListing, fmtEstRange, fmtPrice, sourceLabel, timeAgo } from './types'

/**
 * Home-deck Deal Radar card — top 3 scored finds from the last 24h.
 * Owns its own fetch (additive) so the page's existing queries stay
 * untouched. Server component; degrades to a friendly empty state.
 */
async function getTopFinds(): Promise<DealListing[]> {
  const dayAgo = new Date(Date.now() - 86400e3).toISOString()
  const { data, error } = await supabase
    .from('deal_listings')
    .select(DEAL_LISTING_COLUMNS)
    .in('status', ['scored', 'alerted'])
    .gte('ingested_at', dayAgo)
    .order('score', { ascending: false, nullsFirst: false })
    .order('ingested_at', { ascending: false })
    .limit(3)
  if (error) return []
  return (data as DealListing[]) || []
}

export default async function RadarHomeCard({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const finds = await getTopFinds()

  return (
    <GlassCard className={`flex flex-col p-5 ${className}`} delay={delay}>
      <SectionHeader
        icon={<Radar className="h-4 w-4" />}
        title="Deal Radar"
        action="Open radar"
        actionHref="/radar"
      />

      {finds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Radar className="mb-3 h-7 w-7 text-amber-400/60" aria-hidden="true" />
          <p className="text-sm text-slate-400">
            The radar is watching — nothing scored in the last day.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-3">
          {finds.map(l => (
            <li key={l.id}>
              <a
                href={l.external_url || '/radar'}
                target={l.external_url ? '_blank' : undefined}
                rel={l.external_url ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 no-underline transition-colors hover:border-amber-400/30"
              >
                <ScoreChip score={l.score} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-slate-50">
                    {l.title || 'Untitled listing'}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    <span className={`font-data font-semibold ${l.is_free ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {fmtPrice(l)}
                    </span>
                    {fmtEstRange(l) && <> → est {fmtEstRange(l)}</>}
                    {' · '}
                    {sourceLabel(l.source)}
                    {' · '}
                    {timeAgo(l.posted_at || l.ingested_at)}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}
