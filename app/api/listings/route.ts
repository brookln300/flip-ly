export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { getSession } from '../../lib/auth'
import { getClientIp } from '../../lib/get-ip'

const FREE_SEARCH_LIMIT = 10  // per day
const FREE_RESULTS_CAP = 10   // max results per query for free users

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const marketSlug = searchParams.get('market') || ''
  const hot = searchParams.get('hot') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  // ── Price range filters (Pro feature, cents) ──
  const priceMin = searchParams.get('price_min') ? parseInt(searchParams.get('price_min')!) * 100 : null
  const priceMax = searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!) * 100 : null

  // ── Auth + Premium check ──
  const session = await getSession()
  let isPremium = false
  let userId: string | null = null

  if (session?.userId) {
    userId = session.userId
    const { data: user } = await supabase
      .from('fliply_users')
      .select('is_premium')
      .eq('id', session.userId)
      .single()
    isPremium = user?.is_premium || false
  }

  // ── Rate limiting for non-premium users ──
  const isSearch = !!query // only count actual searches, not browses
  let searchesUsed = 0
  let searchesRemaining = FREE_SEARCH_LIMIT

  if (isSearch && !isPremium) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    if (userId) {
      const { count } = await supabase
        .from('fliply_search_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('searched_at', todayStart.toISOString())
      searchesUsed = count || 0
    } else {
      const ip = getClientIp(req)
      const { count } = await supabase
        .from('fliply_search_log')
        .select('*', { count: 'exact', head: true })
        .eq('anon_ip', ip)
        .gte('searched_at', todayStart.toISOString())
      searchesUsed = count || 0
    }

    searchesRemaining = Math.max(0, FREE_SEARCH_LIMIT - searchesUsed)

    if (searchesUsed >= FREE_SEARCH_LIMIT) {
      trackEvent('search_rate_limited', {
        query,
        searches_today: searchesUsed,
        user_type: userId ? 'free' : 'anonymous',
      }, userId || undefined)

      return NextResponse.json({
        results: [],
        total: 0,
        query,
        offset,
        limit,
        _gate: {
          limited: true,
          reason: 'daily_limit',
          searches_used: searchesUsed,
          searches_remaining: 0,
          searches_max: FREE_SEARCH_LIMIT,
          is_premium: false,
        },
        _meta: { real_data: true, scraped_sources: ['craigslist', 'eventbrite'] },
      })
    }

    // Log this search
    if (userId) {
      await supabase.from('fliply_search_log').insert({ user_id: userId, query })
    } else {
      const ip = getClientIp(req)
      await supabase.from('fliply_search_log').insert({ anon_ip: ip, query })
    }

    searchesUsed += 1
    searchesRemaining = Math.max(0, FREE_SEARCH_LIMIT - searchesUsed)
  }

  // ── Query listings ──
  const effectiveLimit = isPremium ? limit : Math.min(limit, FREE_RESULTS_CAP)

  // Resolve market filter
  let marketId: string | null = null
  if (marketSlug) {
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('id')
      .eq('slug', marketSlug)
      .single()
    if (market) marketId = market.id
  }

  let listings: any[] | null = null
  let count: number | null = null
  let error: any = null

  if (query) {
    // ── Full-text search via Postgres tsvector RPC ──
    // Uses weighted search_vector (title=A, ai_desc+tags=B, desc=C)
    // with ts_rank_cd for relevance scoring. Falls back to ILIKE if RPC fails.
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_listings', {
      search_query: query,
      market_filter: marketId,
      hot_only: hot,
      result_limit: effectiveLimit,
      result_offset: offset,
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      // RPC success — use ranked results
      count = rpcData[0]?.total_count ? parseInt(rpcData[0].total_count) : rpcData.length
      listings = rpcData
    } else {
      // Fallback: ILIKE search (backed by pg_trgm GIN indexes)
      if (rpcError) console.warn('FTS RPC failed, falling back to ILIKE:', rpcError.message)

      let dbQuery = supabase
        .from('fliply_listings')
        .select('*', { count: 'exact' })
        .range(offset, offset + effectiveLimit - 1)

      const safeQuery = query.replace(/%/g, '\\%').replace(/_/g, '\\_')
      dbQuery = dbQuery.or(
        `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,ai_description.ilike.%${safeQuery}%,ai_tags.cs.{${safeQuery.toLowerCase()}}`
      )
      if (marketId) dbQuery = dbQuery.eq('market_id', marketId)
      if (hot) dbQuery = dbQuery.eq('is_hot', true)

      // Filter out expired/past-event listings
      const today = new Date().toISOString().split('T')[0]
      dbQuery = dbQuery.or(`event_date.is.null,event_date.gte.${today}`)
      dbQuery = dbQuery.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

      dbQuery = dbQuery
        .order('is_hot', { ascending: false, nullsFirst: false })
        .order('deal_score', { ascending: false, nullsFirst: false })
        .order('scraped_at', { ascending: false })

      const result = await dbQuery
      listings = result.data
      count = result.count
      error = result.error
    }
  } else {
    // ── Browse mode (no query) ──
    let dbQuery = supabase
      .from('fliply_listings')
      .select('*', { count: 'exact' })
      .range(offset, offset + effectiveLimit - 1)

    if (marketId) dbQuery = dbQuery.eq('market_id', marketId)
    if (hot) dbQuery = dbQuery.eq('is_hot', true)

    // Filter out expired/past-event listings
    const todayBrowse = new Date().toISOString().split('T')[0]
    dbQuery = dbQuery.or(`event_date.is.null,event_date.gte.${todayBrowse}`)
    dbQuery = dbQuery.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

    dbQuery = dbQuery
      .order('is_hot', { ascending: false, nullsFirst: false })
      .order('deal_score', { ascending: false, nullsFirst: false })
      .order('scraped_at', { ascending: false })

    const result = await dbQuery
    listings = result.data
    count = result.count
    error = result.error
  }

  if (error) {
    console.error('Listings query error:', error.message)
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 500 })
  }

  // ── Apply price range filter (post-query for RPC, could be optimized later) ──
  let filtered = listings || []
  if (priceMin !== null || priceMax !== null) {
    filtered = filtered.filter(l => {
      const price = l.price_low_cents
      if (price === null || price === undefined) return false
      if (priceMin !== null && price < priceMin) return false
      if (priceMax !== null && price > priceMax) return false
      return true
    })
  }

  // ── Freshness metadata ──
  const newestListing = filtered.length > 0
    ? new Date(Math.max(...filtered.map((l: any) => new Date(l.scraped_at).getTime())))
    : null
  const oldestListing = filtered.length > 0
    ? new Date(Math.min(...filtered.map((l: any) => new Date(l.scraped_at).getTime())))
    : null

  // ── Format results — gate fields for free users ──
  const results = filtered.map(l => {
    const base = {
      id: l.id,
      title: l.title,
      price: l.price_text || 'Not listed',
      city: [l.city, l.state].filter(Boolean).join(', ') || null,
      zip_code: l.zip_code,
      date: l.event_date || null,
      time: l.event_time_text || null,
      hot: l.is_hot || false,
      source: l.source_type === 'craigslist_rss' ? 'craigslist' : l.source_type === 'eventbrite_api' ? 'eventbrite' : l.source_type,
      posted_at: l.scraped_at,
      enriched: !!l.enriched_at,
    }

    if (isPremium) {
      return {
        ...base,
        description: l.ai_description || l.description || null,
        deal_score: l.deal_score || null,
        deal_reason: l.deal_score_reason || null,
        tags: l.ai_tags || l.tags || [],
        source_url: l.source_url,
        image_url: l.image_url,
        address: l.address,
        lat: l.latitude,
        lng: l.longitude,
        price_cents: l.price_low_cents || null,
      }
    }

    return {
      ...base,
      description: l.ai_description ? l.ai_description.substring(0, 60) + '...' : null,
      deal_score: l.deal_score ? 'gated' : null,
      deal_reason: null,
      tags: (l.ai_tags || l.tags || []).slice(0, 2),
      source_url: null,
      image_url: l.image_url,
      address: null,
      lat: null,
      lng: null,
    }
  })

  trackEvent('listing_search', {
    query: query || 'browse',
    result_count: results.length,
    total_available: count || 0,
    filter_market: marketSlug || 'all',
    filter_hot: hot,
    filter_price_min: priceMin ?? 0,
    filter_price_max: priceMax ?? 0,
    user_type: isPremium ? 'pro' : userId ? 'free' : 'anonymous',
    search_method: query ? 'fts' : 'browse',
  }, userId || undefined)

  return NextResponse.json({
    results,
    total: count || 0,
    query: query || null,
    offset,
    limit: effectiveLimit,
    _gate: {
      limited: false,
      is_premium: isPremium,
      searches_used: isSearch ? searchesUsed : undefined,
      searches_remaining: isSearch ? searchesRemaining : undefined,
      searches_max: FREE_SEARCH_LIMIT,
    },
    _meta: {
      real_data: true,
      scraped_sources: ['craigslist', 'eventbrite'],
      freshness: {
        newest: newestListing?.toISOString() || null,
        oldest: oldestListing?.toISOString() || null,
        age_hours: newestListing ? Math.round((Date.now() - newestListing.getTime()) / (1000 * 60 * 60)) : null,
      },
    },
  })
}
