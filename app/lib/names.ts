import { supabase } from './supabase'

/**
 * Resolve family display names for a set of emails via fliply_profiles.
 * Falls back to the email prefix — same default a fresh profile gets.
 */
export async function displayNames(emails: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(emails.filter((e): e is string => !!e).map(e => e.toLowerCase())))
  const names: Record<string, string> = {}
  for (const e of unique) names[e] = e.split('@')[0]
  if (unique.length === 0) return names

  const { data } = await supabase.from('fliply_profiles').select('email, display_name').in('email', unique)
  for (const p of data || []) {
    if (p.display_name) names[p.email.toLowerCase()] = p.display_name
  }
  return names
}

/** Single-email convenience for write paths that stamp author_name. */
export async function displayName(email: string): Promise<string> {
  const names = await displayNames([email])
  return names[email.toLowerCase()]
}
