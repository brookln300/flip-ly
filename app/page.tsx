import { supabase } from './lib/supabase'
import { SignupProvider } from './components/SignupContext'
import MissionControlNav from './components/MissionControlNav'
import AuthModals from './components/AuthModals'

export const dynamic = 'force-dynamic'

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const AI_CAP = parseInt(process.env.ENRICH_DAILY_AI_CAP || '3000', 10)

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

async function getCommandData() {
  const nowIso = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toISOString().split('T')[0]
  const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, new24Res, hot24Res, catsRes, usageRes, lastScrapeRes, backlogRes, hotDealsRes, invRes] = await Promise.all([
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).gte('scraped_at', dayAgo),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).gte('deal_score', 8).gte('scraped_at', dayAgo),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).eq('is_active', true).eq('source_type', 'craigslist_rss'),
    supabase.from('fliply_ai_usage').select('ai_enriched').eq('day', today).maybeSingle(),
    supabase.from('fliply_sources').select('last_scraped_at').eq('market_id', DFW_MARKET_ID).eq('is_active', true).not('last_scraped_at', 'is', null).order('last_scraped_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).is('enriched_at', null),
    supabase.from('fliply_listings')
      .select('id, title, price_text, deal_score, deal_score_reason, ai_tags, city, event_type')
      .eq('market_id', DFW_MARKET_ID)
      .gte('deal_score', 8)
      .is('duplicate_of', null)
      .or(`event_date.is.null,event_date.gte.${today}`)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .gte('scraped_at', maxAge)
      .order('deal_score', { ascending: false })
      .order('scraped_at', { ascending: false })
      .limit(60),
    supabase.from('fliply_inventory').select('status, bought_cents, sold_cents, fees_cents'),
  ])

  const hotDeals = diversifyByCategory(hotDealsRes.data || [], 12)

  const inv = invRes.data || []
  const invActive = inv.filter((r: any) => r.status === 'bought' || r.status === 'listed')
  const invSold = inv.filter((r: any) => r.status === 'sold')
  const flips = {
    active: invActive.length,
    invested: invActive.reduce((s: number, r: any) => s + (r.bought_cents || 0), 0),
    sold: invSold.length,
    profit: invSold.reduce((s: number, r: any) => s + ((r.sold_cents || 0) - (r.bought_cents || 0) - (r.fees_cents || 0)), 0),
  }
  return {
    total: totalRes.count || 0,
    new24h: new24Res.count || 0,
    hot24h: hot24Res.count || 0,
    cats: catsRes.count || 0,
    aiUsed: usageRes.data?.ai_enriched || 0,
    lastScrape: lastScrapeRes.data?.last_scraped_at || null,
    backlog: backlogRes.count || 0,
    hotDeals,
    topScore: hotDeals[0]?.deal_score || 0,
    flips,
  }
}

const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`

// Spread the hot feed across categories (round-robin) so one high-margin
// category doesn't monopolize it — a garage-saler wants variety, not 12 TVs.
// Input is score-desc; categories are ordered by their best score, then we
// take the top remaining item from each in rotation.
function diversifyByCategory(deals: any[], slots: number): any[] {
  const byCat = new Map<string, any[]>()
  for (const d of deals) {
    const cat = (d.ai_tags && d.ai_tags[0]) || d.event_type || 'other'
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat)!.push(d)
  }
  const lists = Array.from(byCat.values()) // each already score-desc; groups in best-score order (Map preserves insertion = first-seen = highest score)
  const out: any[] = []
  let i = 0
  while (out.length < slots && lists.some(l => l.length)) {
    const l = lists[i % lists.length]
    if (l.length) out.push(l.shift())
    i++
  }
  return out
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent-green)' : 'var(--text-primary)', lineHeight: 1.2 }}>
        {value}{sub && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{sub}</span>}
      </div>
    </div>
  )
}

export default async function CommandCenter() {
  const d = await getCommandData()

  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="Command" />

        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>

          {/* Snapshot */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Command center</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Dallas–Fort Worth · live</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: 'var(--space-8)' }}>
            <Metric label="New today" value={d.new24h.toLocaleString()} />
            <Metric label="Hot deals 24h" value={d.hot24h.toLocaleString()} accent />
            <Metric label="Top score" value={String(d.topScore)} sub="/10" />
            <Metric label="Categories live" value={String(d.cats)} />
            <Metric label="AI budget" value={d.aiUsed.toLocaleString()} sub={`/${(AI_CAP / 1000).toFixed(AI_CAP % 1000 === 0 ? 0 : 1)}k`} />
          </div>

          {/* Hot deals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              Hot deals right now
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>score ≥ 8</span>
          </div>

          {d.hotDeals.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No hot deals in the current window. Scrapers are running — check back shortly.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
              {d.hotDeals.map((deal: any, i: number) => {
                const tag = (deal.ai_tags && deal.ai_tags[0]) || deal.event_type || 'listing'
                return (
                  <div key={deal.id} style={{
                    display: 'flex', gap: '12px', padding: '13px 15px', alignItems: 'flex-start',
                    borderBottom: i === d.hotDeals.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                  }}>
                    <div style={{
                      minWidth: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'var(--accent-green)',
                    }}>{deal.deal_score}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{deal.title}</div>
                      {deal.deal_score_reason && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '3px' }}>{deal.deal_score_reason}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{deal.price_text || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tag}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pipeline pulse */}
          <div style={{
            marginTop: 'var(--space-6)', padding: '12px 16px', background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap',
            fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          }}>
            <span style={{ color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              scrapers healthy
            </span>
            <span>last scrape {timeAgo(d.lastScrape)}</span>
            <span>{d.total.toLocaleString()} DFW listings · {d.backlog} backlog</span>
            <span>{d.cats} categories expanding</span>
          </div>

          {/* Flips — inventory + eBay */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-8)', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Flips & inventory</h2>
            <a href="/inventory" style={{ fontSize: '12px', color: 'var(--accent-green)', textDecoration: 'none' }}>Manage inventory →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <Metric label="In inventory" value={String(d.flips.active)} />
            <Metric label="Invested" value={money(d.flips.invested)} />
            <Metric label="Sold" value={String(d.flips.sold)} />
            <Metric label="Net profit" value={money(d.flips.profit)} accent={d.flips.profit >= 0} />
          </div>

          <footer style={{ marginTop: 'var(--space-12)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>flip-ly · DFW dealfinder · Duskfall Ventures LLC</span>
            <a href="/privacy" style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>Privacy</a>
          </footer>
        </div>

        <AuthModals />
      </main>
    </SignupProvider>
  )
}
