export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
import { isAdmin } from '../../../lib/allowlist'

/**
 * Pipeline settings — the knobs behind the Deal Radar. These rows steer the
 * live n8n workflows directly (workers re-read them within ~2-7 minutes,
 * no deploy). GET is open to any signed-in family member; every write is
 * admin-only (roles handed out on /admin/access).
 */
const SETTING_KEYS = ['alerts_enabled', 'global_min_alert_score', 'quiet_hours', 'pipeline_filters'] as const
type SettingKey = (typeof SETTING_KEYS)[number]

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 })
const dbErr = (msg: string) => NextResponse.json({ error: msg }, { status: 500 })

async function readSetting(key: SettingKey): Promise<any> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
  return data?.value
}

async function writeSetting(key: SettingKey, value: any) {
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
  return error
}

/** Chip lists (blacklist, muted categories): ≤20 short lowercase words, deduped. */
function cleanWordList(v: any): string[] | null {
  if (!Array.isArray(v) || v.length > 20) return null
  const out: string[] = []
  for (const w of v) {
    if (typeof w !== 'string' || w.length > 60) return null
    const t = w.trim().toLowerCase().slice(0, 40)
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

export async function GET() {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })

  const [{ data: rows }, { data: searches }, { data: groups }] = await Promise.all([
    supabase.from('settings').select('key, value').in('key', [...SETTING_KEYS]),
    supabase.from('monitored_searches').select('id, label, url, active, min_alert_score, notes').order('label'),
    supabase.from('monitored_groups').select('id, fb_group_id, name, active, min_alert_score').order('name'),
  ])

  const settings: Record<string, any> = {}
  for (const r of rows || []) settings[r.key] = r.value
  return NextResponse.json({ settings, searches: searches || [], groups: groups || [] })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.email) return NextResponse.json({ error: 'sign in' }, { status: 401 })
  if (!(await isAdmin(session.email))) {
    return NextResponse.json({ error: 'admin only — ask Keith for the keys' }, { status: 403 })
  }

  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return bad('json body required')

  // ── One of the four settings keys ───────────────────────────────────────
  if (typeof b.setting === 'string') {
    const key = b.setting as SettingKey
    if (!SETTING_KEYS.includes(key)) return bad('unknown setting key')
    const v = b.value

    if (key === 'alerts_enabled') {
      if (typeof v !== 'boolean') return bad('alerts_enabled must be true or false')
      const error = await writeSetting(key, v)
      return error ? dbErr(error.message) : NextResponse.json({ ok: true })
    }

    if (key === 'global_min_alert_score') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 50 || v > 95) {
        return bad('score must be an integer between 50 and 95')
      }
      const error = await writeSetting(key, v)
      return error ? dbErr(error.message) : NextResponse.json({ ok: true })
    }

    if (key === 'quiet_hours') {
      if (!v || typeof v !== 'object' || !HHMM.test(v.start ?? '') || !HHMM.test(v.end ?? '')) {
        return bad('quiet_hours needs start and end as HH:MM')
      }
      const current = await readSetting('quiet_hours')
      // tz stays fixed — the workflows think in Central time.
      const error = await writeSetting(key, { start: v.start, end: v.end, tz: current?.tz || 'America/Chicago' })
      return error ? dbErr(error.message) : NextResponse.json({ ok: true })
    }

    // pipeline_filters — partial merge, every provided field type-checked
    if (!v || typeof v !== 'object' || Array.isArray(v)) return bad('pipeline_filters must be an object')
    const patch: Record<string, any> = {}
    for (const money of ['max_price', 'min_profit'] as const) {
      if (money in v) {
        if (v[money] !== null && (typeof v[money] !== 'number' || !Number.isFinite(v[money]) || v[money] < 0)) {
          return bad(`${money} must be a number ≥ 0, or null for off`)
        }
        patch[money] = v[money]
      }
    }
    if ('free_only' in v) {
      if (typeof v.free_only !== 'boolean') return bad('free_only must be true or false')
      patch.free_only = v.free_only
    }
    if ('radius_miles' in v) {
      if (![10, 25, 40].includes(v.radius_miles)) return bad('radius_miles must be 10, 25 or 40')
      patch.radius_miles = v.radius_miles
    }
    for (const list of ['blacklist', 'muted_categories'] as const) {
      if (list in v) {
        const clean = cleanWordList(v[list])
        if (clean === null) return bad(`${list} must be up to 20 short words`)
        patch[list] = clean
      }
    }
    if ('max_alerts_per_hour' in v) {
      if (typeof v.max_alerts_per_hour !== 'number' || !Number.isInteger(v.max_alerts_per_hour)
        || v.max_alerts_per_hour < 1 || v.max_alerts_per_hour > 24) {
        return bad('max_alerts_per_hour must be an integer between 1 and 24')
      }
      patch.max_alerts_per_hour = v.max_alerts_per_hour
    }
    if (Object.keys(patch).length === 0) return bad('no recognized filter fields')
    const current = (await readSetting('pipeline_filters')) || {}
    const error = await writeSetting('pipeline_filters', { ...current, ...patch })
    return error ? dbErr(error.message) : NextResponse.json({ ok: true })
  }

  // ── Per-source tweaks (CL search or FB group) ───────────────────────────
  if (typeof b.search_id === 'string' || typeof b.group_id === 'string') {
    const table = typeof b.search_id === 'string' ? 'monitored_searches' : 'monitored_groups'
    const id = typeof b.search_id === 'string' ? b.search_id : b.group_id
    const patch: Record<string, any> = {}
    if ('active' in b) {
      if (typeof b.active !== 'boolean') return bad('active must be true or false')
      patch.active = b.active
    }
    if ('min_alert_score' in b) {
      if (b.min_alert_score !== null
        && (typeof b.min_alert_score !== 'number' || !Number.isInteger(b.min_alert_score)
          || b.min_alert_score < 0 || b.min_alert_score > 100)) {
        return bad('min_alert_score must be an integer 0-100, or null for the global bar')
      }
      patch.min_alert_score = b.min_alert_score
    }
    if (Object.keys(patch).length === 0) return bad('nothing to change')
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('id')
    if (error) return dbErr(error.message)
    if (!data?.length) return NextResponse.json({ error: 'source not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  // ── New Craigslist search ───────────────────────────────────────────────
  if (b.add_search && typeof b.add_search === 'object') {
    const label = typeof b.add_search.label === 'string' ? b.add_search.label.trim().slice(0, 80) : ''
    if (!label) return bad('give the search a label')
    let u: URL | null = null
    try { u = new URL(typeof b.add_search.url === 'string' ? b.add_search.url.trim() : '') } catch { /* invalid */ }
    if (!u || !/^https?:$/.test(u.protocol) || !u.hostname.endsWith('craigslist.org') || !u.pathname.includes('/search/')) {
      return bad('url must be a full craigslist.org/search/ link')
    }
    const { data, error } = await supabase
      .from('monitored_searches')
      .insert({ label, url: u.toString(), active: true })
      .select('id, label, url, active, min_alert_score, notes')
      .single()
    if (error) return dbErr(error.message)
    return NextResponse.json({ search: data })
  }

  // ── New Facebook group ──────────────────────────────────────────────────
  if (b.add_group && typeof b.add_group === 'object') {
    const name = typeof b.add_group.name === 'string' ? b.add_group.name.trim().slice(0, 80) : ''
    if (!name) return bad('give the group a name')
    const fbId = typeof b.add_group.fb_group_id === 'string' ? b.add_group.fb_group_id.trim() : ''
    if (!/^\d{6,}$/.test(fbId)) return bad('fb_group_id must be the numeric group id (6+ digits)')
    const { data, error } = await supabase
      .from('monitored_groups')
      .upsert(
        { fb_group_id: fbId, name, active: true, notes: 'added via settings' },
        { onConflict: 'fb_group_id', ignoreDuplicates: true }
      )
      .select('id, fb_group_id, name, active, min_alert_score')
    if (error) return dbErr(error.message)
    if (!data?.length) return bad('that group is already on the radar')
    return NextResponse.json({ group: data[0] })
  }

  return bad('unrecognized request')
}
