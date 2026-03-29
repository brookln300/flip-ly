import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Override fetch to disable Next.js 14's aggressive data cache.
// Without this, Supabase REST API responses get cached and
// the leaderboard/counters show stale data indefinitely.
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  global: {
    fetch: (url: any, init: any) => fetch(url, { ...init, cache: 'no-store' }),
  },
})
