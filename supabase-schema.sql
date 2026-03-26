-- FLIP-LY.NET — Supabase Schema
-- Simple: users sign up with location, get weekly email with listings

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_users') THEN
    CREATE POLICY "service_users" ON users FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_zip ON users(zip_code);

-- Weekly digest log (tracks what was sent)
CREATE TABLE IF NOT EXISTS digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  listing_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped'))
);

ALTER TABLE digest_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_digest_log') THEN
    CREATE POLICY "service_digest_log" ON digest_log FOR ALL USING (true);
  END IF;
END $$;
