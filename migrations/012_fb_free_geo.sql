-- FB free-stuff pipeline: home-location distance filtering + captured settings.
-- See docs/planning/FB-GROUPS-TO-TELEGRAM.md

ALTER TABLE fb_free_posts
  ADD COLUMN IF NOT EXISTS home_zip     TEXT,     -- user's home ZIP at capture time
  ADD COLUMN IF NOT EXISTS radius_mi    INTEGER,  -- max distance filter in miles
  ADD COLUMN IF NOT EXISTS location_zip TEXT,     -- ZIP parsed from the post (if any)
  ADD COLUMN IF NOT EXISTS distance_mi  NUMERIC;  -- computed home→post distance (miles)
