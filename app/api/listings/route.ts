export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { getSession } from '../../lib/auth'
import { getClientIp } from '../../lib/get-ip'

const FREE_SEARCH_LIMIT = 15  // per day
const FREE_RESULTS_CAP = 10   // max results per query for free users

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const marketSlug = searchParams.get('market') || ''
  const hot = searchParams.get('hot') === 'true'
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20') || 20, 50))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

  // ── New filter params ──
  const priceMin = searchParams.get('price_min') ? parseInt(searchParams.get('price_min')!) * 100 : null
  const priceMax = searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!) * 100 : null
  const eventType = searchParams.get('event_type') || null      // garage_sale, estate_sale, flea_market, etc.
  const minScore = searchParams.get('min_score') ? parseInt(searchParams.get('min_score')!) : null
  const dateStart = searchParams.get('date_start') || null       // YYYY-MM-DD
  const dateEnd = searchParams.get('date_end') || null           // YYYY-MM-DD
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null

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

  // Resolve market filter — invalid slug returns 0 results instead of all
  let marketId: string | null = null
  if (marketSlug) {
    const { data: market } = await supabase
      .from('fliply_markets')
      .select('id')
      .eq('slug', marketSlug)
      .single()
    if (market) {
      marketId = market.id
    } else {
      return NextResponse.json({
        results: [],
        total: 0,
        query,
        offset,
        limit,
        _gate: {
          limited: false,
          searches_used: searchesUsed,
          searches_remaining: searchesRemaining,
          searches_max: FREE_SEARCH_LIMIT,
          is_premium: isPremium,
        },
        _meta: { real_data: true, scraped_sources: ['craigslist', 'eventbrite'], search_method: 'invalid_market' },
      })
    }
  }

  let listings: any[] | null = null
  let count: number | null = null
  let error: any = null
  let searchMethod = 'browse'

  // ── Geo search via nearby_listings RPC ──
  if (lat !== null && lng !== null) {
    searchMethod = 'nearby'
    const { data: geoData, error: geoError } = await supabase.rpc('nearby_listings', {
      user_lat: lat,
      user_lng: lng,
      radius_miles: radius || (isPremium ? 50 : 15),
      market_filter: marketId,
      hot_only: hot,
      result_limit: effectiveLimit,
      result_offset: offset,
      event_type_filter: eventType,
      date_start: dateStart,
      date_end: dateEnd,
    })

    if (!geoError && geoData) {
      count = geoData[0]?.total_count ? parseInt(geoData[0].total_count) : geoData.length
      listings = geoData
    } else {
      if (geoError) console.warn('Nearby RPC failed:', geoError.message)
      listings = []
      count = 0
    }
  } else if (query) {
    // ── Full-text search via upgraded search_listings RPC ──
    searchMethod = 'fts'
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_listings', {
      search_query: query,
      market_filter: marketId,
      hot_only: hot,
      result_limit: effectiveLimit,
      result_offset: offset,
      event_type_filter: eventType,
      min_score: minScore,
      date_start: dateStart,
      date_end: dateEnd,
      price_min_cents: priceMin,
      price_max_cents: priceMax,
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      count = rpcData[0]?.total_count ? parseInt(rpcData[0].total_count) : rpcData.length
      listings = rpcData
    } else {
      // Fallback: ILIKE search (backed by pg_trgm GIN indexes)
      if (rpcError) console.warn('FTS RPC failed, falling back to ILIKE:', rpcError.message)
      searchMethod = 'ilike_fallback'

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
      if (eventType) dbQuery = dbQuery.eq('event_type', eventType)

      const today = new Date().toISOString().split('T')[0]
      const maxAge = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      dbQuery = dbQuery.or(`event_date.is.null,event_date.gte.${today}`)
      dbQuery = dbQuery.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      dbQuery = dbQuery.gte('scraped_at', maxAge)

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
    // ── Browse mode (no query) — use RPC for filter support ──
    if (eventType || minScore || dateStart || dateEnd || priceMin || priceMax) {
      searchMethod = 'filtered_browse'
      const { data: rpcData, error: rpcError } = await supabase.rpc('search_listings', {
        search_query: '',
        market_filter: marketId,
        hot_only: hot,
        result_limit: effectiveLimit,
        result_offset: offset,
        event_type_filter: eventType,
        min_score: minScore,
        date_start: dateStart,
        date_end: dateEnd,
        price_min_cents: priceMin,
        price_max_cents: priceMax,
      })

      if (!rpcError && rpcData) {
        count = rpcData[0]?.total_count ? parseInt(rpcData[0].total_count) : rpcData.length
        listings = rpcData
      } else {
        if (rpcError) console.warn('Browse RPC failed:', rpcError.message)
        listings = []
        count = 0
      }
    } else {
      // Simple browse — direct query
      let dbQuery = supabase
        .from('fliply_listings')
        .select('*', { count: 'exact' })
        .range(offset, offset + effectiveLimit - 1)

      if (marketId) dbQuery = dbQuery.eq('market_id', marketId)
      if (hot) dbQuery = dbQuery.eq('is_hot', true)

      const todayBrowse = new Date().toISOString().split('T')[0]
      const maxAgeBrowse = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      dbQuery = dbQuery.or(`event_date.is.null,event_date.gte.${todayBrowse}`)
      dbQuery = dbQuery.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      dbQuery = dbQuery.gte('scraped_at', maxAgeBrowse)

      dbQuery = dbQuery
        .order('is_hot', { ascending: false, nullsFirst: false })
        .order('deal_score', { ascending: false, nullsFirst: false })
        .order('scraped_at', { ascending: false })

      const result = await dbQuery
      listings = result.data
      count = result.count
      error = result.error
    }
  }

  if (error) {
    console.error('Listings query error:', error.message)
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 500 })
  }

  const filtered = listings || []

  // ── Freshness metadata ──
  const newestListing = filtered.length > 0
    ? new Date(Math.max(...filtered.map((l: any) => new Date(l.scraped_at).getTime())))
    : null
  const oldestListing = filtered.length > 0
    ? new Date(Math.min(...filtered.map((l: any) => new Date(l.scraped_at).getTime())))
    : null

  // ── Format results — progressive reveal for free users ──
  // Free/anon: first 5 get real scores, first 2 get deal_reason, source_url always gated
  const SCORE_REVEAL_COUNT = 5
  const REASON_REVEAL_COUNT = 2

  const results = filtered.map((l, idx) => {
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
        event_type: l.event_type || null,
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
        distance_miles: l.distance_miles || null,
      }
    }

    // Free/anonymous: progressive reveal
    const showScore = idx < SCORE_REVEAL_COUNT
    const showReason = idx < REASON_REVEAL_COUNT

    return {
      ...base,
      event_type: l.event_type || null,
      description: l.ai_description ? l.ai_description.substring(0, showReason ? 120 : 60) + '...' : null,
      deal_score: showScore ? (l.deal_score || null) : (l.deal_score ? 'gated' : null),
      deal_reason: showReason ? (l.deal_score_reason || null) : null,
      tags: (l.ai_tags || l.tags || []).slice(0, 2),
      source_url: null, // always gated — this is the conversion lever
      image_url: l.image_url,
      address: null,
      lat: null,
      lng: null,
    }
  })

  // ── Log to search analytics table ──
  if (query || eventType || lat) {
    supabase.from('fliply_search_analytics').insert({
      user_id: userId || null,
      query_text: query || null,
      filters: {
        market: marketSlug || null,
        event_type: eventType,
        min_score: minScore,
        date_start: dateStart,
        date_end: dateEnd,
        price_min: priceMin,
        price_max: priceMax,
        lat, lng, radius,
        hot: hot || undefined,
      },
      result_count: count || 0,
      search_method: searchMethod,
      is_premium: isPremium,
    }).then(null, (err: any) => console.warn('Search analytics insert failed:', err.message))
  }

  trackEvent('listing_search', {
    query: query || 'browse',
    result_count: results.length,
    total_available: count || 0,
    filter_market: marketSlug || 'all',
    filter_hot: hot,
    filter_event_type: eventType || 'all',
    filter_price_min: priceMin ?? 0,
    filter_price_max: priceMax ?? 0,
    user_type: isPremium ? 'pro' : userId ? 'free' : 'anonymous',
    search_method: searchMethod,
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
      search_method: searchMethod,
      freshness: {
        newest: newestListing?.toISOString() || null,
        oldest: oldestListing?.toISOString() || null,
        age_hours: newestListing ? Math.round((Date.now() - newestListing.getTime()) / (1000 * 60 * 60)) : null,
      },
    },
  })
}
