import { supabase } from '../lib/supabase'
import { displayNames } from '../lib/names'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import WishlistClient, { Wish } from '../components/wishlist/WishlistClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'wishlist — flip-ly', robots: { index: false, follow: false } }

/**
 * Family wishlist — the human face of the deal pipeline's grail_list.
 * Server component fetches every wish; the client adds, pauses, deletes.
 */
async function getData(): Promise<{ wishes: Wish[]; names: Record<string, string> }> {
  const { data } = await supabase
    .from('grail_list')
    .select('*')
    .order('created_at', { ascending: false })
  const wishes = (data || []) as Wish[]
  const names = await displayNames(wishes.map(w => w.requested_by))
  return { wishes, names }
}

export default async function WishlistPage() {
  const { wishes, names } = await getData()

  return (
    <SignupProvider>
      <ZenShell active="Wishlist">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">wishlist</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            tell the radar what you&apos;re hunting — when a matching deal appears, the family gets pinged.
          </p>
        </header>
        <WishlistClient initialWishes={wishes} initialNames={names} />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
