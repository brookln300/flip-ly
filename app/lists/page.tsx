import { supabase } from '../lib/supabase'
import { displayNames } from '../lib/names'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import ListsClient, { HubList, ListItem } from '../components/lists/ListsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'lists — flip-ly', robots: { index: false, follow: false } }

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
      <ZenShell active="Lists">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">lists</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            one list per errand — everyone adds, whoever&apos;s at the store checks things off.
          </p>
        </header>
        <ListsClient initialLists={lists} initialItems={items} initialNames={names} />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
