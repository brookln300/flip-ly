-- Migration 006: Contest anti-bot security
-- Adds device fingerprint tracking and indexes for rate limiting queries

ALTER TABLE fliply_contest_attempts ADD COLUMN IF NOT EXISTS device_hash text;

CREATE INDEX IF NOT EXISTS idx_contest_attempts_ip_time
  ON fliply_contest_attempts (ip_address, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_contest_attempts_device_time
  ON fliply_contest_attempts (device_hash, attempted_at DESC)
  WHERE device_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contest_attempts_result
  ON fliply_contest_attempts (result, attempted_at DESC);
