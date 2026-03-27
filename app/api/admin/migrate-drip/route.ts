export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * Create drip engine tables. Safe to run multiple times (IF NOT EXISTS).
 */
export async function GET(req: NextRequest) {
  const results: string[] = []

  // Table 1: drip_sequences — defines each campaign
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS drip_sequences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        trigger_type TEXT NOT NULL DEFAULT 'signup',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `
  }).single()
  // If rpc doesn't exist, fall back to raw query
  if (e1) {
    // Try direct table creation via Supabase client
    results.push(`drip_sequences: using fallback approach — ${e1.message}`)
  } else {
    results.push('OK: drip_sequences')
  }

  return NextResponse.json({
    message: 'Migration requires running SQL directly in Supabase dashboard',
    instructions: 'Go to Supabase SQL Editor and run the migration SQL below',
    results,
    sql: MIGRATION_SQL,
  })
}

const MIGRATION_SQL = `
-- =============================================
-- DRIP ENGINE TABLES — flip-ly.net
-- Run this in Supabase SQL Editor (safe to re-run)
-- =============================================

-- 1. Drip sequences (campaigns)
CREATE TABLE IF NOT EXISTS drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'signup',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sequence steps (individual emails in order)
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  delay_minutes INT NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  subject_variant_b TEXT,
  template_key TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- 3. Sequence enrollments (user's position in a sequence)
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  variant TEXT DEFAULT 'a',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  UNIQUE(user_id, sequence_id)
);

-- 4. Email sends (per-email log)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES sequence_enrollments(id) ON DELETE SET NULL,
  step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_key TEXT,
  variant TEXT DEFAULT 'a',
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ
);

-- 5. Email events (raw webhook log)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID REFERENCES email_sends(id) ON DELETE SET NULL,
  resend_message_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for the drip processor queries
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON sequence_enrollments(status, sequence_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON sequence_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sends_resend_id ON email_sends(resend_message_id);
CREATE INDEX IF NOT EXISTS idx_sends_user ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_events_resend_id ON email_events(resend_message_id);
CREATE INDEX IF NOT EXISTS idx_steps_sequence ON sequence_steps(sequence_id, step_order);

-- RLS policies (service role bypasses these, but good practice)
ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our API uses service role key)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drip_sequences' AND policyname = 'service_role_all_drip_sequences') THEN
    CREATE POLICY service_role_all_drip_sequences ON drip_sequences FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sequence_steps' AND policyname = 'service_role_all_sequence_steps') THEN
    CREATE POLICY service_role_all_sequence_steps ON sequence_steps FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sequence_enrollments' AND policyname = 'service_role_all_sequence_enrollments') THEN
    CREATE POLICY service_role_all_sequence_enrollments ON sequence_enrollments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_sends' AND policyname = 'service_role_all_email_sends') THEN
    CREATE POLICY service_role_all_email_sends ON email_sends FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_events' AND policyname = 'service_role_all_email_events') THEN
    CREATE POLICY service_role_all_email_events ON email_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`
