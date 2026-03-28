-- Track how users were acquired for segmented marketing
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS acquisition_source TEXT DEFAULT 'signup';
-- Values: 'signup', 'twitter', 'contest_decoy', 'contest_winner', 'contest_denied'

-- Track contest-specific metadata
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS contest_agent_name TEXT;
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS contest_highest_tier INTEGER;

-- Index for segmented email queries
CREATE INDEX IF NOT EXISTS idx_fliply_users_acquisition ON fliply_users(acquisition_source);
