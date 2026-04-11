-- Lobster Protocol v2: Shell terminal easter egg attempt tracking
-- Applied 2026-04-10 via Supabase MCP

CREATE TABLE IF NOT EXISTS fliply_shell_attempts (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  level_attempted INTEGER NOT NULL CHECK (level_attempted BETWEEN 1 AND 7),
  password_tried TEXT,
  result TEXT NOT NULL CHECK (result IN ('cleared', 'denied')),
  ip_address TEXT,
  user_agent TEXT,
  partial_reveal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate limiting (IP + time window)
CREATE INDEX idx_shell_attempts_ip_time ON fliply_shell_attempts (ip_address, created_at DESC);

-- Index for per-level attempt counting (IP + level)
CREATE INDEX idx_shell_attempts_ip_level ON fliply_shell_attempts (ip_address, level_attempted, created_at DESC);

-- Index for feed queries (most recent first)
CREATE INDEX idx_shell_attempts_created ON fliply_shell_attempts (created_at DESC);

-- Index for stats (result grouping)
CREATE INDEX idx_shell_attempts_result ON fliply_shell_attempts (result, level_attempted);

-- Index for unique agent counting
CREATE INDEX idx_shell_attempts_agent ON fliply_shell_attempts (agent_name);
