-- Add resale_flag column for Resale Radar feature
ALTER TABLE fliply_listings ADD COLUMN IF NOT EXISTS resale_flag BOOLEAN DEFAULT FALSE;

-- Index for efficient resale radar queries
CREATE INDEX IF NOT EXISTS idx_listings_resale_flag ON fliply_listings (market_id, resale_flag) WHERE resale_flag = TRUE;
