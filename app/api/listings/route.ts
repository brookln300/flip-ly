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
  const zip = searchParams.get('zip') || ''
  const city = searchParams.get('city') || ''
  const hot = searchParams.get('hot') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

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
      // Logged in free user — rate limit by user ID
      const { count } = await supabase
        .from('fliply_search_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('searched_at', todayStart.toISOString())

      searchesUsed = count || 0
    } else {
      // Anonymous — rate limit by IP
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

  let dbQuery = supabase
    .from('fliply_listings')
    .select('*', { count: 'exact' })
    .order('scraped_at', { ascending: false })
    .range(offset, offset + effectiveLimit - 1)

  if (query) {
    // Escape SQL wildcards in user input
    const safeQuery = query.replace(/%/g, '\\%').replace(/_/g, '\\_')
    dbQuery = dbQuery.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,ai_description.ilike.%${safeQuery}%`)
  }
  if (zip) {
    // Validate zip format
    const safeZip = zip.replace(/[^0-9]/g, '').substring(0, 5)
    if (safeZip) dbQuery = dbQuery.eq('zip_code', safeZip)
  }
  if (city) {
    const safeCity = city.replace(/%/g, '\\%').replace(/_/g, '\\_')
    dbQuery = dbQuery.ilike('city', `%${safeCity}%`)
  }
  if (hot) {
    dbQuery = dbQuery.eq('is_hot', true)
  }

  const { data: listings, count, error } = await dbQuery

  if (error) {
    console.error('Listings query error:', error.message)
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 500 })
  }

  // ── Format results — gate fields for free users ──
  const results = (listings || []).map(l => {
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
      // Pro users get EVERYTHING
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
      }
    }

    // Free users: redacted pro fields
    return {
      ...base,
      description: l.ai_description ? l.ai_description.substring(0, 60) + '...' : null,
      deal_score: l.deal_score ? 'gated' : null,  // frontend shows [██/10]
      deal_reason: null,  // hidden
      tags: (l.ai_tags || l.tags || []).slice(0, 2),  // only 2 tags
      source_url: null,  // hidden — pro only
      image_url: l.image_url,  // images are fine
      address: null,  // hidden
      lat: null,
      lng: null,
    }
  })

  trackEvent('listing_search', {
    query: query || 'browse',
    result_count: results.length,
    total_available: count || 0,
    filter_zip: zip || 'none',
    filter_city: city || 'none',
    filter_hot: hot,
    user_type: isPremium ? 'pro' : userId ? 'free' : 'anonymous',
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
    },
  })
}
