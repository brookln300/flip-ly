-- Search rate limiting for FREE vs PRO
CREATE TABLE IF NOT EXISTS fliply_search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fliply_users(id) ON DELETE CASCADE,
  anon_ip TEXT,  -- for non-logged-in users
  query TEXT,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fliply_search_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_search_log') THEN
    CREATE POLICY "service_search_log" ON fliply_search_log FOR ALL USING (true);
  END IF;
END $$;

-- Index for fast daily count lookups
CREATE INDEX IF NOT EXISTS idx_search_log_user_day
  ON fliply_search_log(user_id, searched_at);
CREATE INDEX IF NOT EXISTS idx_search_log_anon_day
  ON fliply_search_log(anon_ip, searched_at);
