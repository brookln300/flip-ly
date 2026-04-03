-- 009: Pre-seed Craigslist + Eventbrite sources for all 414 markets
-- These are known infrastructure — no need for fire-and-forget discovery.
-- Sources are inserted as is_active=false; they activate when a user signs up
-- in that market (via increment_market_user_count RPC).

-- ── 1. Add center_lat/lng if missing (needed for Eventbrite geo search) ──
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS center_lat DOUBLE PRECISION;
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS center_lng DOUBLE PRECISION;

-- ── 2. Add pending_source_ids array for Telegram approval numbering ──
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS pending_source_ids UUID[];

-- ── 3. Add local_sources_researched_at for cron-based discovery ──
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS local_sources_researched_at TIMESTAMP WITH TIME ZONE;

-- ── 4. Unique constraint on (market_id, name) for sources upsert ──
-- The discovery code uses onConflict: 'market_id,name' — needs a unique index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fliply_sources_market_name'
  ) THEN
    CREATE UNIQUE INDEX idx_fliply_sources_market_name ON fliply_sources(market_id, name);
  END IF;
END $$;

-- ── 5. Pre-seed Craigslist sources for all markets with a cl_subdomain ──
INSERT INTO fliply_sources (market_id, name, source_type, config, discovery_method, confidence, ai_confidence, trust_level, scrape_frequency_hours, is_active, is_approved)
SELECT
  m.id,
  'Craigslist ' || COALESCE(m.display_name, m.name) || ' Garage Sales',
  'craigslist_rss',
  jsonb_build_object(
    'rss_url', 'https://' || m.cl_subdomain || '.craigslist.org/search/gms?format=rss',
    'hostname', m.cl_subdomain,
    'area_id', m.cl_area_id
  ),
  'auto_craigslist',
  1.0,
  10,
  'approved',
  12,
  false,   -- inactive until a user signs up in this market
  true     -- pre-approved (known good source)
FROM fliply_markets m
WHERE m.cl_subdomain IS NOT NULL
ON CONFLICT (market_id, name) DO NOTHING;

-- ── 6. Pre-seed Eventbrite sources for all markets with lat/lng ──
INSERT INTO fliply_sources (market_id, name, source_type, config, discovery_method, confidence, ai_confidence, trust_level, scrape_frequency_hours, is_active, is_approved)
SELECT
  m.id,
  'Eventbrite ' || COALESCE(m.display_name, m.name) || ' Events',
  'eventbrite_api',
  jsonb_build_object(
    'latitude', m.center_lat,
    'longitude', m.center_lng,
    'radius', '30mi',
    'keywords', '["garage sale","estate sale","flea market","swap meet"]'::jsonb,
    'city_slug', LOWER(m.state) || '--' || LOWER(REGEXP_REPLACE(COALESCE(m.display_name, m.name), '[^a-zA-Z0-9]+', '-', 'g'))
  ),
  'auto_eventbrite',
  1.0,
  10,
  'approved',
  24,
  false,   -- inactive until a user signs up
  true     -- pre-approved
FROM fliply_markets m
WHERE m.center_lat IS NOT NULL AND m.center_lng IS NOT NULL
ON CONFLICT (market_id, name) DO NOTHING;

-- ── 7. Mark all markets as "CL/EB discovered" so discovery doesn't re-run ──
-- Only set sources_discovered_at on markets that don't already have it
UPDATE fliply_markets
SET sources_discovered_at = NOW()
WHERE sources_discovered_at IS NULL;
