import { supabase } from '../lib/supabase'
import { getSession } from '../lib/auth'
import { isAdmin } from '../lib/allowlist'
import { SignupProvider } from '../components/SignupContext'
import AuthModals from '../components/AuthModals'
import ZenShell from '../components/zen/ZenShell'
import SettingsClient from '../components/settings/SettingsClient'
import {
  DEFAULT_FILTERS,
  DEFAULT_QUIET_HOURS,
  MonitoredGroup,
  MonitoredSearch,
  PipelineSettings,
} from '../components/settings/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'settings — flip-ly', robots: { index: false, follow: false } }

/**
 * Pipeline settings — the control room for the Deal Radar. These knobs live
 * in the same Supabase the n8n workflows read, so a change here steers the
 * live pipeline within minutes. Admins turn the dials; everyone else can
 * look. Roles come from the /admin/access allowlist.
 */
async function getData(): Promise<{
  settings: PipelineSettings
  searches: MonitoredSearch[]
  groups: MonitoredGroup[]
}> {
  const [{ data: rows }, { data: searches }, { data: groups }] = await Promise.all([
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['alerts_enabled', 'global_min_alert_score', 'quiet_hours', 'pipeline_filters']),
    supabase
      .from('monitored_searches')
      .select('id, label, url, active, min_alert_score, notes')
      .order('label'),
    supabase
      .from('monitored_groups')
      .select('id, fb_group_id, name, active, min_alert_score')
      .order('name'),
  ])

  const map: Record<string, any> = {}
  for (const r of rows || []) map[r.key] = r.value

  return {
    settings: {
      alerts_enabled: typeof map.alerts_enabled === 'boolean' ? map.alerts_enabled : true,
      global_min_alert_score:
        typeof map.global_min_alert_score === 'number' ? map.global_min_alert_score : 75,
      quiet_hours: { ...DEFAULT_QUIET_HOURS, ...(map.quiet_hours || {}) },
      pipeline_filters: { ...DEFAULT_FILTERS, ...(map.pipeline_filters || {}) },
    },
    searches: (searches as MonitoredSearch[]) || [],
    groups: (groups as MonitoredGroup[]) || [],
  }
}

export default async function SettingsPage() {
  const session = await getSession()
  const signedIn = !!session?.email
  const admin = signedIn ? await isAdmin(session!.email) : false
  const data = signedIn
    ? await getData()
    : { settings: null, searches: [], groups: [] }

  return (
    <SignupProvider>
      <ZenShell active="Settings">
        <header className="mb-4 border-b border-zen-line pb-2">
          <h1 className="text-[15px] font-semibold lowercase">settings</h1>
          <p className="mt-0.5 text-[12.5px] text-zen-muted">
            changes steer the live pipeline — they take effect within a couple of minutes.
          </p>
        </header>
        <SettingsClient
          signedIn={signedIn}
          admin={admin}
          initialSettings={
            data.settings || {
              alerts_enabled: true,
              global_min_alert_score: 75,
              quiet_hours: DEFAULT_QUIET_HOURS,
              pipeline_filters: DEFAULT_FILTERS,
            }
          }
          initialSearches={data.searches}
          initialGroups={data.groups}
        />
        <AuthModals />
      </ZenShell>
    </SignupProvider>
  )
}
