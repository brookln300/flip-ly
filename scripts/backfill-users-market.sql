-- Backfill existing users to their market
-- Run AFTER: 008 migration + import-cl-markets.ts

-- 1. Find the Dallas market ID
-- All 8 current users are DFW area (zips: 75072, 75024, 75201)
-- The CL import creates it with cl_subdomain = 'dallas'

-- 2. Assign all existing users to Dallas market
UPDATE fliply_users
SET market_id = (
  SELECT id FROM fliply_markets WHERE cl_subdomain = 'dallas' LIMIT 1
)
WHERE market_id IS NULL;

-- 3. Activate Dallas market and set user count
UPDATE fliply_markets
SET is_active = true,
    user_count = (SELECT COUNT(*) FROM fliply_users WHERE market_id = fliply_markets.id)
WHERE cl_subdomain = 'dallas';

-- 4. Verify
SELECT u.email, u.city, u.state, m.name as market_name, m.cl_subdomain
FROM fliply_users u
LEFT JOIN fliply_markets m ON u.market_id = m.id;
