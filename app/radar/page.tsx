import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import RadarBoard from '../components/radar/RadarBoard'
import { DEAL_LISTING_COLUMNS, DealListing } from '../components/radar/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'radar — flip-ly', robots: { index: false, follow: false } }

/**
 * Deal Radar deep view — the freshest 100 scored/alerted/claimed finds,
 * best score first. The home feed is the glance; this is the dig.
 */
async function getListings(): Promise<DealListing[]> {
  const { data, error } = await supabase
    .from('deal_listings')
    .select(DEAL_LISTING_COLUMNS)
    .in('status', ['scored', 'alerted', 'claimed'])
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
      <ZenShell>
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">radar — deep view</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            every scored find, best first. [reply] copies the suggested reply · [claim] calls dibs ·
            [good]/[bad] teaches the scorer.
          </p>
        </header>
        <RadarBoard listings={listings} />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
