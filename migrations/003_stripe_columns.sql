-- Add Stripe subscription columns to fliply_users
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE fliply_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_fliply_users_stripe_customer ON fliply_users(stripe_customer_id);
