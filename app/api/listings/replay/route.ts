export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getTopSearches, getNewMatches, storeSearchResults, isRedisHealthy } from '../../../lib/redis'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

function sanitizeForPostgrest(text: string): string {
  // Remove characters that break PostgREST .or() filter parsing
  return text.replace(/[,%_().*]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function GET(req: NextRequest) {
  // Authenticate user
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redisUp = await isRedisHealthy()
  if (!redisUp) {
    return NextResponse.json({
      replays: [],
      source: 'unavailable',
      message: 'Search replay requires Redis',
    })
  }

  // Get user's top 5 most-searched queries
  const topSearches = await getTopSearches(session.userId, 5)
  if (topSearches.length === 0) {
    return NextResponse.json({
      replays: [],
      source: 'redis',
      message: 'No search history yet',
    })
  }

  // Get user's market
  const { data: user } = await supabase
    .from('fliply_users')
    .select('market_id')
    .eq('id', session.userId)
    .single()

  if (!user?.market_id) {
    return NextResponse.json({
      replays: [],
      source: 'redis',
      message: 'No market set',
    })
  }

  // For each top query, re-run it and find new matches
  const replays = []
  for (const search of topSearches) {
    // Re-run the search query against current listings
    const safeQuery = sanitizeForPostgrest(search.queryText)
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: currentResults } = await supabase
      .from('fliply_listings')
      .select('id')
      .eq('market_id', user.market_id)
      .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,ai_description.ilike.%${safeQuery}%`)
      .not('deal_score', 'is', null)
      .or(`event_date.is.null,event_date.gte.${today}`)
      .gte('scraped_at', sevenDaysAgo.toISOString())
      .order('deal_score', { ascending: false })
      .limit(50)

    const currentIds = (currentResults || []).map((r: any) => r.id)
    const newMatchIds = await getNewMatches(session.userId, search.queryHash, currentIds)

    // Always refresh the baseline so expired listings don't linger
    storeSearchResults(session.userId, search.queryHash, currentIds).catch(() => {})

    if (newMatchIds.length > 0) {
      // Fetch full listing data for new matches
      const { data: newListings } = await supabase
        .from('fliply_listings')
        .select('id, title, price_text, deal_score, deal_score_reason, ai_tags, source_url, event_date, scraped_at')
        .in('id', newMatchIds.slice(0, 10))
        .order('deal_score', { ascending: false })

      replays.push({
        query: search.queryText,
        searchCount: search.count,
        newMatches: newListings || [],
        totalNew: newMatchIds.length,
      })
    }
  }

  return NextResponse.json({
    replays,
    totalQueries: topSearches.length,
    source: 'redis',
  })
}
