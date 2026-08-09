import { ListChecks } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import GlassCard from '../ui/GlassCard'
import SectionHeader from '../ui/SectionHeader'

/**
 * Home-deck Lists tile — open-item counts per list at a glance. Owns its
 * own fetch (additive) like the other home cards. Server component.
 */
async function getCounts(): Promise<{ id: string; name: string; emoji: string | null; open: number }[]> {
  const [listsRes, openRes] = await Promise.all([
    supabase.from('fliply_lists').select('id, name, emoji').order('created_at', { ascending: true }),
    supabase.from('fliply_list_items').select('list_id').eq('done', false),
  ])
  const counts: Record<string, number> = {}
  for (const i of openRes.data || []) counts[i.list_id] = (counts[i.list_id] || 0) + 1
  return (listsRes.data || []).map(l => ({ ...l, open: counts[l.id] || 0 }))
}

export default async function ListsHomeCard({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const lists = await getCounts()
  const totalOpen = lists.reduce((n, l) => n + l.open, 0)

  return (
    <GlassCard className={`flex flex-col p-5 ${className}`} delay={delay}>
      <SectionHeader
        icon={<ListChecks className="h-4 w-4" />}
        title="Lists"
        action="Open lists"
        actionHref="/lists"
      />

      {lists.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No lists yet — <a href="/lists" className="text-amber-300 no-underline hover:underline">start the first one</a>.
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-1 flex-col gap-2">
            {lists.slice(0, 4).map(l => (
              <li key={l.id}>
                <a
                  href="/lists"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3.5 py-2.5 no-underline transition-colors hover:border-amber-400/30"
                >
                  <span className="min-w-0 truncate text-[13.5px] font-medium text-slate-50">
                    {l.emoji ? `${l.emoji} ` : ''}{l.name}
                  </span>
                  <span className={`shrink-0 font-data text-sm font-bold ${l.open > 0 ? 'text-amber-300' : 'text-slate-600'}`}>
                    {l.open}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            {totalOpen === 0 ? 'everything checked off' : `${totalOpen} open item${totalOpen === 1 ? '' : 's'} across the family`}
          </p>
        </>
      )}
    </GlassCard>
  )
}
