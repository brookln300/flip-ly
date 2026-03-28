-- Unsubscribe support
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT FALSE;
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_fliply_users_unsubscribed ON fliply_users(unsubscribed);
