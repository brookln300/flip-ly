import { supabase } from './lib/supabase'
import { getSession } from './lib/auth'
import { isAdmin } from './lib/allowlist'
import { SignupProvider } from './components/SignupContext'
import AuthModals from './components/AuthModals'
import ZenShell from './components/zen/ZenShell'
import ZenSection from './components/zen/ZenSection'
import ZenLanding from './components/zen/ZenLanding'
import HomeFeed from './components/zen/HomeFeed'
import { DEAL_LISTING_COLUMNS, DealListing, timeAgo } from './components/radar/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'flip-ly — the family deal radar' }

/** Start of a Chicago calendar day (offsetDays back), as UTC ISO. */
function chicagoDayStart(offsetDays = 0): string {
  const now = new Date()
  const chiNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
  const chiMidnight = new Date(chiNow)
  chiMidnight.setHours(0, 0, 0, 0)
  chiMidnight.setDate(chiMidnight.getDate() - offsetDays)
  const tzOffset = now.getTime() - chiNow.getTime()
  return new Date(chiMidnight.getTime() + tzOffset).toISOString()
}

async function getHomeData() {
  const todayStart = chicagoDayStart(0)
  const yesterdayStart = chicagoDayStart(1)

  const [
    fbLastRes, clLastRes, newRes, alertsRes, groupsRes, searchesRes,
    alertsOnRes, feedRes, nearRes, boardRes, listsRes, itemsRes, wishRes, eventRes,
  ] = await Promise.all([
    supabase.from('deal_listings').select('ingested_at').eq('source', 'fb_group').order('ingested_at', { ascending: false }).limit(1),
    supabase.from('deal_listings').select('ingested_at').eq('source', 'craigslist').order('ingested_at', { ascending: false }).limit(1),
    supabase.from('deal_listings').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('deal_listings').select('id', { count: 'exact', head: true }).gte('alerted_at', todayStart),
    supabase.from('monitored_groups').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('monitored_searches').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('settings').select('value').eq('key', 'alerts_enabled').maybeSingle(),
    supabase.from('deal_listings').select(DEAL_LISTING_COLUMNS)
      .in('status', ['scored', 'alerted', 'claimed'])
      .order('ingested_at', { ascending: false })
      .limit(40),
    supabase.from('deal_listings').select(DEAL_LISTING_COLUMNS)
      .in('status', ['scored', 'alerted'])
      .gte('score', 65).lte('score', 74)
      .gte('ingested_at', yesterdayStart)
      .order('ingested_at', { ascending: false })
      .limit(30),
    supabase.from('fliply_board_posts').select('id, title, body, author_name, author_email')
      .order('created_at', { ascending: false }).limit(2),
    supabase.from('fliply_lists').select('id, name, emoji').order('created_at', { ascending: true }),
    supabase.from('fliply_list_items').select('list_id').eq('done', false),
    supabase.from('grail_list').select('name').eq('active', true).order('created_at', { ascending: false }).limit(6),
    supabase.from('fliply_events').select('title, emoji, starts_at, location')
      .gte('starts_at', new Date().toISOString()).order('starts_at').limit(1),
  ])

  const openByList: Record<string, number> = {}
  for (const i of itemsRes.data || []) openByList[i.list_id] = (openByList[i.list_id] || 0) + 1

  return {
    pulse: {
      fbLast: fbLastRes.data?.[0]?.ingested_at ?? null,
      clLast: clLastRes.data?.[0]?.ingested_at ?? null,
      waiting: newRes.count ?? 0,
      alertsToday: alertsRes.count ?? 0,
      groups: groupsRes.count ?? 0,
      searches: searchesRes.count ?? 0,
    },
    alertsEnabled: typeof alertsOnRes.data?.value === 'boolean' ? alertsOnRes.data.value : true,
    feed: (feedRes.data as DealListing[]) || [],
    nearMisses: (nearRes.data as DealListing[]) || [],
    board: boardRes.data || [],
    lists: (listsRes.data || []).map(l => ({ ...l, open: openByList[l.id] || 0 })),
    wishes: (wishRes.data || []).map(w => w.name),
    nextEvent: eventRes.data?.[0] || null,
  }
}

/** A pulse stat, amber + "quiet" when the source has gone stale (>2h). */
function SourceStat({ label, last }: { label: string; last: string | null }) {
  const stale = !last || Date.now() - new Date(last).getTime() > 2 * 3600e3
  return (
    <span className={stale ? 'text-amber-400' : ''}>
      {label}: {last ? `last ${timeAgo(last)}` : 'nothing yet'}{stale ? ' · quiet' : ''}
    </span>
  )
}

function fmtEventWhen(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Chicago' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })
  ).toLowerCase()
}

export default async function HomePage() {
  const session = await getSession()

  // ── Logged out: one line, one button ──
  if (!session) {
    return (
      <SignupProvider>
        <main id="main" className="zen min-h-screen bg-zen-bg text-zen-text">
          <ZenLanding />
          <AuthModals />
        </main>
      </SignupProvider>
    )
  }

  // ── Logged in: everything at a glance ──
  const [d, admin] = await Promise.all([getHomeData(), isAdmin(session.email)])
  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Chicago' })
    .toLowerCase()

  const sep = <span aria-hidden="true"> · </span>

  return (
    <SignupProvider>
      <ZenShell active="Home">
        <p className="mb-3 text-[12px] text-zen-muted">{today} · signed in as {session.email.split('@')[0]}</p>

        {/* 1 · pulse strip */}
        <div className="mb-3 border border-zen-line px-3 py-1.5 font-data text-[12px] leading-relaxed text-zen-text">
          <SourceStat label="fb" last={d.pulse.fbLast} />
          {sep}
          <SourceStat label="cl" last={d.pulse.clLast} />
          {sep}
          <span>scorer: {d.pulse.waiting} waiting</span>
          {sep}
          <span>alerts today: <span className={d.pulse.alertsToday > 0 ? 'text-zen-accent' : ''}>{d.pulse.alertsToday}</span></span>
          {sep}
          <span>watching: {d.pulse.groups} groups + {d.pulse.searches} searches</span>
        </div>

        {/* 2 · quick bar, 3 · the feed, 4 · near misses */}
        <HomeFeed rows={d.feed} nearMisses={d.nearMisses} admin={admin} alertsEnabled={d.alertsEnabled} />

        {/* 5 · family strips */}
        <div className="mb-3 flex flex-col gap-2">
          <ZenSection label="board" action="open →" actionHref="/board">
            {d.board.length === 0 ? (
              <span className="text-[13px] text-zen-muted">the board is bare — <a href="/board" className="underline hover:text-zen-accent">post something</a></span>
            ) : (
              <span className="text-[13px]">
                {d.board.map((p: any, i: number) => (
                  <span key={p.id}>
                    {i > 0 && sep}
                    <a href="/board" className="text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent">
                      {p.title || p.body?.slice(0, 60) || 'untitled'}
                    </a>
                    <span className="text-zen-muted"> — {p.author_name || p.author_email?.split('@')[0]}</span>
                  </span>
                ))}
              </span>
            )}
          </ZenSection>

          <ZenSection label="lists" action="open →" actionHref="/lists">
            {d.lists.length === 0 ? (
              <span className="text-[13px] text-zen-muted">no lists yet</span>
            ) : (
              <span className="text-[13px]">
                {d.lists.map((l, i) => (
                  <span key={l.id}>
                    {i > 0 && sep}
                    <a href="/lists" className="text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent">
                      {l.name.toLowerCase()}
                    </a>
                    <span className={l.open > 0 ? 'font-data text-zen-accent' : 'font-data text-zen-muted'}> {l.open}</span>
                  </span>
                ))}
              </span>
            )}
          </ZenSection>

          <ZenSection label="wishlist" action="open →" actionHref="/wishlist">
            {d.wishes.length === 0 ? (
              <span className="text-[13px] text-zen-muted">nobody&apos;s hunting anything — <a href="/wishlist" className="underline hover:text-zen-accent">add a wish</a></span>
            ) : (
              <span className="text-[13px]">
                <span className="text-zen-muted">hunting: </span>
                {d.wishes.map((w, i) => (
                  <span key={w}>
                    {i > 0 && ', '}
                    <a href="/wishlist" className="text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent">{w.toLowerCase()}</a>
                  </span>
                ))}
              </span>
            )}
          </ZenSection>

          {d.nextEvent && (
            <ZenSection label="calendar" action="open →" actionHref="/calendar">
              <span className="text-[13px]">
                <span className="text-zen-muted">{fmtEventWhen(d.nextEvent.starts_at)}</span>
                {' · '}
                <a href="/calendar" className="text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent">
                  {d.nextEvent.emoji ? `${d.nextEvent.emoji} ` : ''}{d.nextEvent.title}
                </a>
                {d.nextEvent.location && <span className="text-zen-muted"> @ {d.nextEvent.location}</span>}
              </span>
            </ZenSection>
          )}
        </div>

        {/* 6 · footer */}
        <p className="border-t border-zen-line pt-3 text-[12px] text-zen-muted">
          radar runs itself · reply /check to any alert to re-scan a post · flip-ly
        </p>

        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
