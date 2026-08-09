import { supabase } from '../lib/supabase'
import { displayNames } from '../lib/names'
import { SignupProvider } from '../components/SignupContext'
import HubNav from '../components/HubNav'
import AuthModals from '../components/AuthModals'
import ListsClient, { HubList, ListItem } from '../components/lists/ListsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Lists — The Hearth', robots: { index: false, follow: false } }

/**
 * Shared checklists — groceries, Costco, whatever run is next. Server
 * component fetches every list + item for a fast first paint; the client
 * handles adds, check-offs, and clears optimistically.
 */
async function getData(): Promise<{ lists: HubList[]; items: ListItem[]; names: Record<string, string> }> {
  const [listsRes, itemsRes] = await Promise.all([
    supabase.from('fliply_lists').select('*').order('created_at', { ascending: true }),
    supabase.from('fliply_list_items').select('*').order('created_at', { ascending: true }),
  ])
  const lists = (listsRes.data || []) as HubList[]
  const items = (itemsRes.data || []) as ListItem[]
  const names = await displayNames(items.flatMap(i => [i.added_by, i.done_by]))
  return { lists, items, names }
}

export default async function ListsPage() {
  const { lists, items, names } = await getData()

  return (
    <SignupProvider>
      <main id="main" className="hearth-bg min-h-screen text-slate-50">
        <HubNav active="Lists" />
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Shared <span className="text-ember">lists</span>
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
              One list per errand, everyone adds, whoever&apos;s at the store checks things off.
            </p>
          </header>
          <ListsClient initialLists={lists} initialItems={items} initialNames={names} />
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
