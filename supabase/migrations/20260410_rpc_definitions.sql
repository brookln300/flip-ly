-- RPC function definitions exported from live Supabase (2026-04-10)
-- These are the authoritative definitions for search_listings and nearby_listings.
-- Run against Supabase SQL editor or via `supabase db push` to restore/update.

-- =============================================================================
-- search_listings — Full-text search with filters, scoring, and pagination
-- =============================================================================
CREATE OR REPLACE FUNCTION public.search_listings(
  search_query text,
  market_filter uuid DEFAULT NULL::uuid,
  hot_only boolean DEFAULT false,
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0,
  event_type_filter text DEFAULT NULL::text,
  min_score integer DEFAULT NULL::integer,
  date_start date DEFAULT NULL::date,
  date_end date DEFAULT NULL::date,
  price_min_cents integer DEFAULT NULL::integer,
  price_max_cents integer DEFAULT NULL::integer
)
RETURNS TABLE(
  id uuid, title text, description text, ai_description text,
  price_text text, price_low_cents integer, price_high_cents integer,
  city text, state text, zip_code text, address text,
  latitude double precision, longitude double precision,
  event_date date, event_end_date date, event_time_text text,
  source_url text, source_type text, image_url text,
  is_hot boolean, deal_score integer, deal_score_reason text,
  ai_tags text[], tags text[], event_type text,
  scraped_at timestamp with time zone, enriched_at timestamp with time zone,
  market_id uuid, rank real, total_count bigint
)
LANGUAGE plpgsql STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    l.id, l.title, l.description, l.ai_description,
    l.price_text, l.price_low_cents, l.price_high_cents,
    l.city, l.state, l.zip_code, l.address,
    l.latitude::double precision, l.longitude::double precision,
    l.event_date, l.event_end_date, l.event_time_text,
    l.source_url, l.source_type, l.image_url,
    l.is_hot, l.deal_score::integer, l.deal_score_reason,
    l.ai_tags, l.tags, l.event_type,
    l.scraped_at, l.enriched_at, l.market_id,
    CASE
      WHEN search_query IS NOT NULL AND search_query != ''
      THEN ts_rank_cd(l.search_vector, websearch_to_tsquery('english', search_query))
      ELSE 0.0
    END AS rank,
    COUNT(*) OVER() AS total_count
  FROM fliply_listings l
  WHERE
    (search_query IS NULL OR search_query = '' OR l.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (market_filter IS NULL OR l.market_id = market_filter)
    AND (NOT hot_only OR l.is_hot = true)
    AND (event_type_filter IS NULL OR l.event_type = event_type_filter)
    AND (min_score IS NULL OR l.deal_score >= min_score)
    AND (date_start IS NULL OR l.event_date >= date_start)
    AND (date_end IS NULL OR l.event_date <= date_end)
    AND (price_min_cents IS NULL OR l.price_low_cents >= price_min_cents)
    AND (price_max_cents IS NULL OR (l.price_low_cents IS NOT NULL AND l.price_low_cents <= price_max_cents))
    AND (l.event_date IS NULL OR l.event_date >= CURRENT_DATE)
    AND (l.expires_at IS NULL OR l.expires_at >= NOW())
    AND l.scraped_at >= NOW() - INTERVAL '7 days'
  ORDER BY
    l.is_hot DESC NULLS LAST,
    CASE
      WHEN search_query IS NOT NULL AND search_query != ''
      THEN ts_rank_cd(l.search_vector, websearch_to_tsquery('english', search_query))
      ELSE 0.0
    END DESC,
    l.deal_score DESC NULLS LAST,
    l.scraped_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$;

-- =============================================================================
-- nearby_listings — Geo-radius search with Haversine distance calculation
-- =============================================================================
CREATE OR REPLACE FUNCTION public.nearby_listings(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision DEFAULT 30,
  market_filter uuid DEFAULT NULL::uuid,
  hot_only boolean DEFAULT false,
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0,
  event_type_filter text DEFAULT NULL::text,
  date_start date DEFAULT NULL::date,
  date_end date DEFAULT NULL::date
)
RETURNS TABLE(
  id uuid, title text, description text, ai_description text,
  price_text text, price_low_cents integer, price_high_cents integer,
  city text, state text, zip_code text, address text,
  latitude numeric, longitude numeric,
  event_date date, event_end_date date, event_time_text text,
  source_url text, source_type text, image_url text,
  is_hot boolean, deal_score smallint, deal_score_reason text,
  ai_tags text[], tags text[], event_type text,
  scraped_at timestamp with time zone, enriched_at timestamp with time zone,
  market_id uuid, distance_miles double precision, total_count bigint
)
LANGUAGE plpgsql STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT sub.*, COUNT(*) OVER() AS total_count
  FROM (
    SELECT
      l.id, l.title, l.description, l.ai_description,
      l.price_text, l.price_low_cents, l.price_high_cents,
      l.city, l.state, l.zip_code, l.address,
      l.latitude, l.longitude,
      l.event_date, l.event_end_date, l.event_time_text,
      l.source_url, l.source_type, l.image_url,
      l.is_hot, l.deal_score, l.deal_score_reason,
      l.ai_tags, l.tags, l.event_type,
      l.scraped_at, l.enriched_at, l.market_id,
      (3959 * acos(LEAST(1.0,
        cos(radians(user_lat)) * cos(radians(l.latitude::double precision)) *
        cos(radians(l.longitude::double precision) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(l.latitude::double precision))
      ))) AS distance_miles
    FROM fliply_listings l
    WHERE
      l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      AND (market_filter IS NULL OR l.market_id = market_filter)
      AND (NOT hot_only OR l.is_hot = true)
      AND (event_type_filter IS NULL OR l.event_type = event_type_filter)
      AND (date_start IS NULL OR l.event_date >= date_start)
      AND (date_end IS NULL OR l.event_date <= date_end)
      AND (l.event_date IS NULL OR l.event_date >= CURRENT_DATE)
      AND l.scraped_at >= NOW() - INTERVAL '7 days'
      AND l.latitude BETWEEN (user_lat - radius_miles / 69.0)::numeric
                          AND (user_lat + radius_miles / 69.0)::numeric
      AND l.longitude BETWEEN (user_lng - radius_miles / (69.0 * cos(radians(user_lat))))::numeric
                           AND (user_lng + radius_miles / (69.0 * cos(radians(user_lat))))::numeric
  ) sub
  WHERE sub.distance_miles <= radius_miles
  ORDER BY
    sub.is_hot DESC NULLS LAST,
    sub.distance_miles ASC,
    sub.deal_score DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$;

-- =============================================================================
-- Indexes added 2026-04-10 (also applied live via execute_sql)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_listings_market_dealscore
  ON public.fliply_listings (market_id, deal_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_listings_event_date
  ON public.fliply_listings (event_date) WHERE event_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_link_checked
  ON public.fliply_listings (link_checked_at ASC NULLS FIRST);

CREATE INDEX IF NOT EXISTS idx_listings_source_type
  ON public.fliply_listings (source_type);
