-- FB "free stuff" groups → Telegram pipeline
-- See docs/planning/FB-GROUPS-TO-TELEGRAM.md
--
-- Posts captured from Facebook groups (via the user-operated browser extension)
-- land here as status='pending', get classified/summarized by the
-- fb-free-digest cron, and are delivered to Telegram as status='sent'.

CREATE TABLE IF NOT EXISTS fb_free_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash  TEXT UNIQUE NOT NULL,      -- sha256(group_id + author + text) for dedupe
  group_id      TEXT,
  group_name    TEXT,
  post_url      TEXT,
  author_name   TEXT,
  raw_text      TEXT NOT NULL,
  image_urls    TEXT[],
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- filled by the classify step
  is_free       BOOLEAN,
  item_summary  TEXT,
  location_hint TEXT,
  pickup_note   TEXT,
  ai_reason     TEXT,

  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'ready', 'sent', 'rejected')),
  tg_message_id BIGINT,
  processed_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ
);

-- Drives both cron passes: pull pending oldest-first, then ready oldest-first.
CREATE INDEX IF NOT EXISTS idx_fb_free_status ON fb_free_posts (status, captured_at);

-- Lock the table down: only the server's service-role key touches it (which
-- bypasses RLS). No policies = anon/authenticated get no access.
ALTER TABLE fb_free_posts ENABLE ROW LEVEL SECURITY;
