import { supabase } from '../lib/supabase'
import { displayNames } from '../lib/names'
import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import WishlistClient, { Wish } from '../components/wishlist/WishlistClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Wishlist — The Hearth', robots: { index: false, follow: false } }

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
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Wishlist" />
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              The <span className="text-ember">Wishlist</span>
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
              Tell the radar what you&apos;re hunting. When a matching deal appears,
              the family gets pinged.
            </p>
          </header>
          <WishlistClient initialWishes={wishes} initialNames={names} />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
