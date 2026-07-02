import { supabase } from '../lib/supabase'
import { SignupProvider } from '../components/SignupContext'
import MissionControlNav from '../components/MissionControlNav'
import AuthModals from '../components/AuthModals'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'System — flip-ly', robots: { index: false, follow: false } }

const DFW_MARKET_ID = '08170240-45d0-47cf-8b6d-7fdbc3443dbe'
const AI_CAP = parseInt(process.env.ENRICH_DAILY_AI_CAP || '3000', 10)

const CAT_LABELS: Record<string, string> = {
  gms: 'Garage sales', ela: 'Electronics', sya: 'Computers', tla: 'Tools', cba: 'Collectibles',
  vga: 'Video gaming', msa: 'Musical', pha: 'Photo & video', ata: 'Antiques', jwa: 'Jewelry',
  hva: 'Heavy equip', ppa: 'Appliances', fua: 'Furniture', sga: 'Sporting goods', bia: 'Bikes',
  taa: 'Toys & games', moa: 'Cell phones', ema: 'Media', foa: 'General', hsa: 'Household',
  pta: 'Auto parts', zip: 'Free stuff',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

async function getData() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toISOString().split('T')[0]
  const [srcRes, totalRes, scoredRes, hotRes, new24Res, backlogRes, usageRes, frozenSrcRes, frozenMktRes] = await Promise.all([
    supabase.from('fliply_sources').select('name, config, last_scraped_at, last_result_count, consecutive_failures, scrape_error, is_active').eq('market_id', DFW_MARKET_ID).eq('source_type', 'craigslist_rss').eq('is_active', true),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).not('deal_score', 'is', null),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).gte('deal_score', 8),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).gte('scraped_at', dayAgo),
    supabase.from('fliply_listings').select('id', { count: 'exact', head: true }).eq('market_id', DFW_MARKET_ID).is('enriched_at', null),
    supabase.from('fliply_ai_usage').select('ai_enriched').eq('day', today).maybeSingle(),
    supabase.from('fliply_sources').select('id', { count: 'exact', head: true }).neq('market_id', DFW_MARKET_ID).eq('is_active', false),
    supabase.from('fliply_markets').select('id', { count: 'exact', head: true }).neq('id', DFW_MARKET_ID).not('local_sources_researched_at', 'is', null),
  ])

  const sources = (srcRes.data || []).map((s: any) => ({
    label: CAT_LABELS[s.config?.search_path || 'gms'] || (s.config?.search_path || s.name),
    lastScrape: s.last_scraped_at,
    count: s.last_result_count ?? 0,
    fails: s.consecutive_failures ?? 0,
    error: s.scrape_error,
  })).sort((a, b) => (b.count) - (a.count))

  return {
    sources,
    total: totalRes.count || 0,
    scored: scoredRes.count || 0,
    hot: hotRes.count || 0,
    new24h: new24Res.count || 0,
    backlog: backlogRes.count || 0,
    aiUsed: usageRes.data?.ai_enriched || 0,
    frozenSources: frozenSrcRes.count || 0,
    frozenMarkets: frozenMktRes.count || 0,
    lastScrape: sources.reduce((acc: string | null, s) => {
      if (!s.lastScrape) return acc
      if (!acc || new Date(s.lastScrape) > new Date(acc)) return s.lastScrape
      return acc
    }, null as string | null),
  }
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {value}{sub && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>{sub}</span>}
      </div>
    </div>
  )
}

export default async function SystemPage() {
  const d = await getData()
  const errored = d.sources.filter(s => s.fails > 0 || s.error)
  const aiPct = Math.min(100, Math.round((d.aiUsed / AI_CAP) * 100))
  const scoredPct = d.total ? Math.round((d.scored / d.total) * 100) : 0
  const estCost = (d.aiUsed * 0.0009).toFixed(2)

  return (
    <SignupProvider>
      <main id="main" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <MissionControlNav active="System" />
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-12)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>System</h1>
            <span style={{ fontSize: '12px', color: errored.length ? 'var(--accent-amber)' : 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {errored.length ? `${errored.length} source(s) need attention` : 'all systems healthy'} · last scrape {timeAgo(d.lastScrape)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: 'var(--space-6)' }}>
            <Stat label="DFW listings" value={d.total.toLocaleString()} />
            <Stat label="Scored" value={`${scoredPct}%`} sub={` · ${d.scored.toLocaleString()}`} />
            <Stat label="Hot (≥8)" value={d.hot.toLocaleString()} />
            <Stat label="New 24h" value={d.new24h.toLocaleString()} />
            <Stat label="Enrich backlog" value={d.backlog.toLocaleString()} />
          </div>

          {/* AI spend */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>AI budget today</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.aiUsed.toLocaleString()} / {AI_CAP.toLocaleString()} · ~${estCost}</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-card)', overflow: 'hidden' }}>
              <div style={{ width: `${aiPct}%`, height: '100%', background: aiPct >= 90 ? 'var(--accent-amber)' : 'var(--accent-green)' }} />
            </div>
          </div>

          {/* Category health */}
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Craigslist categories ({d.sources.length} live)</h2>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)', marginBottom: 'var(--space-6)' }}>
            {d.sources.map((s, i) => (
              <div key={s.label + i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', borderBottom: i === d.sources.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: (s.fails > 0 || s.error) ? 'var(--accent-amber)' : 'var(--accent-green)' }} />
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{s.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{s.count} last</span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', minWidth: '64px', textAlign: 'right' }}>{timeAgo(s.lastScrape)}</span>
              </div>
            ))}
          </div>

          {/* Guardrails */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.frozenSources}</span> non-DFW sources frozen</span>
            <span><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.frozenMarkets}</span> non-DFW markets discovery-stopped</span>
            <span>DFW-only lockdown active</span>
          </div>
        </div>
        <AuthModals />
      </main>
    </SignupProvider>
  )
}
