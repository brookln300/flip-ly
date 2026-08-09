/**
 * Pipeline settings — shared shapes for /settings and /api/hub/pipeline-settings.
 * These mirror rows the live n8n workflows read directly (settings,
 * monitored_searches, monitored_groups) — changes land in the pipeline
 * within a few minutes, no deploy.
 */
export type QuietHours = { start: string; end: string; tz: string }

export type PipelineFilters = {
  max_price: number | null
  min_profit: number | null
  free_only: boolean
  radius_miles: number
  blacklist: string[]
  muted_categories: string[]
  max_alerts_per_hour: number
}

export type PipelineSettings = {
  alerts_enabled: boolean
  global_min_alert_score: number
  quiet_hours: QuietHours
  pipeline_filters: PipelineFilters
}

export type MonitoredSearch = {
  id: string
  label: string
  url: string
  active: boolean
  min_alert_score: number | null
  notes: string | null
}

export type MonitoredGroup = {
  id: string
  fb_group_id: string
  name: string
  active: boolean
  min_alert_score: number | null
}

export const DEFAULT_QUIET_HOURS: QuietHours = { start: '23:00', end: '07:00', tz: 'America/Chicago' }

export const DEFAULT_FILTERS: PipelineFilters = {
  max_price: null,
  min_profit: null,
  free_only: false,
  radius_miles: 25,
  blacklist: [],
  muted_categories: [],
  max_alerts_per_hour: 6,
}
