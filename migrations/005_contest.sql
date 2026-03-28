-- Lobster Hunt Contest
CREATE TABLE IF NOT EXISTS fliply_contest_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  passphrase TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('decoy', 'winner', 'denied')),
  decoy_tier INTEGER,  -- 1-7 for decoy hits, NULL for denied/winner
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fliply_contest_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  telegram_notified BOOLEAN DEFAULT FALSE,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fliply_contest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fliply_contest_winners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_contest_attempts') THEN
    CREATE POLICY "service_contest_attempts" ON fliply_contest_attempts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_contest_winners') THEN
    CREATE POLICY "service_contest_winners" ON fliply_contest_winners FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contest_attempts_time ON fliply_contest_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_contest_attempts_result ON fliply_contest_attempts(result);
