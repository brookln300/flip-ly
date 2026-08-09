import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import RadarBoard from '../components/radar/RadarBoard'
import { DEAL_LISTING_COLUMNS, DealListing } from '../components/radar/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deal Radar — The Hearth', robots: { index: false, follow: false } }

/**
 * Deal Radar — the FB-groups / Craigslist ingestion pipeline, scored by AI.
 * Server component fetches the freshest 100 scored/alerted finds; the
 * client board handles filtering and copy-to-reply.
 */
async function getListings(): Promise<DealListing[]> {
  const { data, error } = await supabase
    .from('deal_listings')
    .select(DEAL_LISTING_COLUMNS)
    .in('status', ['scored', 'alerted'])
    .order('score', { ascending: false, nullsFirst: false })
    .order('ingested_at', { ascending: false })
    .limit(100)
  if (error) return []
  return (data as DealListing[]) || []
}

export default async function RadarPage() {
  const listings = await getListings()

  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Radar" />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Deal <span className="text-ember">Radar</span>
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
              Every find from the groups and Craigslist, scored the moment it lands. Copy the
              suggested reply, tap out to the listing, go get it first.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Tap 👍/👎 on finds — the scorer reads your verdicts and calibrates itself.
            </p>
          </header>
          <RadarBoard listings={listings} />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
