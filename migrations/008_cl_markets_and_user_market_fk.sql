-- 008: CL-based market system + direct user-to-market FK
-- Replaces zip-code-based market discovery with pre-loaded CL markets

-- ── 1. Add new columns to fliply_markets ──────────────────────
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS cl_subdomain TEXT;
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS cl_area_id INTEGER;
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS user_count INTEGER DEFAULT 0;

-- Index for dropdown queries (state + active)
CREATE INDEX IF NOT EXISTS idx_fliply_markets_state ON fliply_markets(state);
CREATE INDEX IF NOT EXISTS idx_fliply_markets_cl_subdomain ON fliply_markets(cl_subdomain);
CREATE INDEX IF NOT EXISTS idx_fliply_markets_active ON fliply_markets(is_active);

-- ── 2. Add market_id FK to fliply_users ───────────────────────
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES fliply_markets(id);
CREATE INDEX IF NOT EXISTS idx_fliply_users_market ON fliply_users(market_id);

-- ── 3. Add listing expiration support ─────────────────────────
-- (Listings older than 10 days are stale — cleanup cron will use this)
CREATE INDEX IF NOT EXISTS idx_fliply_listings_scraped_at ON fliply_listings(scraped_at);

-- ── 4. Source discovery tracking ──────────────────────────────
-- Track whether Brave/AI source discovery has run for a market
ALTER TABLE fliply_markets ADD COLUMN IF NOT EXISTS sources_discovered_at TIMESTAMP WITH TIME ZONE;

-- ── 5. AI accuracy tracking (for self-learning approval gate) ─
CREATE TABLE IF NOT EXISTS fliply_ai_source_accuracy (
  ai_score INTEGER PRIMARY KEY CHECK (ai_score BETWEEN 1 AND 10),
  total_reviewed INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  auto_approve BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed with scores 1-10
INSERT INTO fliply_ai_source_accuracy (ai_score)
VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10)
ON CONFLICT (ai_score) DO NOTHING;

ALTER TABLE fliply_ai_source_accuracy ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_ai_accuracy') THEN
    CREATE POLICY "service_ai_accuracy" ON fliply_ai_source_accuracy FOR ALL USING (true);
  END IF;
END $$;

-- ── 6. Add ai_confidence + trust fields to fliply_sources ─────
ALTER TABLE fliply_sources ADD COLUMN IF NOT EXISTS ai_confidence INTEGER;
ALTER TABLE fliply_sources ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE fliply_sources ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'pending'
  CHECK (trust_level IN ('pending', 'approved', 'rejected', 'auto_approved'));
ALTER TABLE fliply_sources ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fliply_sources ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
