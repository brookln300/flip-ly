import { supabase } from './supabase'

/**
 * Family access allowlist — managed from the site (/admin/access), stored in
 * fliply_allowlist. Falls back to the ALLOWED_EMAILS env if set. Access is only
 * "open" when BOTH the table is empty AND no env list exists (avoids lockout
 * before anyone is added).
 */
export async function isEmailAllowed(email?: string | null): Promise<boolean> {
  const envRaw = process.env.ALLOWED_EMAILS
  const envList = envRaw ? envRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : []

  if (email) {
    const e = email.toLowerCase()
    const { data } = await supabase.from('fliply_allowlist').select('email').eq('email', e).maybeSingle()
    if (data) return true
    if (envList.includes(e)) return true
  }

  // Open only if nothing is configured anywhere (bootstrap safety).
  if (envList.length === 0) {
    const { count } = await supabase.from('fliply_allowlist').select('email', { count: 'exact', head: true })
    if ((count || 0) === 0) return true
  }
  return false
}

export async function isAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false
  const { data } = await supabase.from('fliply_allowlist').select('role').eq('email', email.toLowerCase()).maybeSingle()
  return data?.role === 'admin'
}
