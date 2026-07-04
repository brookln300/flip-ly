export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * The constellation feed — every lantern, its look, and its presence.
 * Read-open to the family circle (site is allowlist-gated for anything personal;
 * this returns only what members chose to put on their lantern).
 */
export async function GET() {
  const { data, error } = await supabase
    .from('fliply_profiles')
    .select('email, display_name, sigil, lantern_hue, flame_style, status_text, status_emoji, birthday, household, last_active, story, favorites, allergies, sizes')
    .order('display_name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const today = new Date()
  const members = (data || []).map(p => {
    const last = p.last_active ? now - new Date(p.last_active).getTime() : Infinity
    const activity = last < 3600e3 ? 1 : last < 86400e3 ? 0.7 : last < 7 * 86400e3 ? 0.4 : 0.2
    let isBirthday = false
    let birthdaySoon: string | null = null
    if (p.birthday) {
      const b = new Date(p.birthday)
      isBirthday = b.getUTCMonth() === today.getUTCMonth() && b.getUTCDate() === today.getUTCDate()
      const next = new Date(today.getFullYear(), b.getUTCMonth(), b.getUTCDate())
      if (next < today) next.setFullYear(next.getFullYear() + 1)
      const days = Math.round((next.getTime() - today.getTime()) / 86400e3)
      if (days > 0 && days <= 30) birthdaySoon = `${days}d`
    }
    return { ...p, activity, isBirthday, birthdaySoon }
  })

  return NextResponse.json({ members })
}
