-- ============================================================
-- PulseOps — Ticket Automations
-- Migration: Automation rules engine
-- ============================================================

-- Automation rule types
DO $$ BEGIN
  CREATE TYPE automation_trigger AS ENUM (
    'ticket_created',
    'ticket_updated',
    'status_changed',
    'priority_changed',
    'sla_breached',
    'ticket_idle'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_action AS ENUM (
    'assign_to',
    'change_status',
    'change_priority',
    'add_tag',
    'send_notification',
    'add_comment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger automation_trigger NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  action automation_action NOT NULL,
  action_params JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update timestamps
CREATE OR REPLACE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Execution log
CREATE TABLE IF NOT EXISTS automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  result TEXT NOT NULL DEFAULT 'success',
  details JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_log_rule ON automation_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_ticket ON automation_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_date ON automation_log(executed_at DESC);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;

-- Organization members can view rules
DROP POLICY IF EXISTS "Org members can view automation rules" ON automation_rules;
CREATE POLICY "Org members can view automation rules"
  ON automation_rules FOR SELECT TO authenticated
  USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = automation_rules.organization_id
    )
  );
DROP POLICY IF EXISTS "Staff can manage automation rules" ON automation_rules;
CREATE POLICY "Staff can manage automation rules"
  ON automation_rules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent')
      AND (
        automation_rules.organization_id IS NULL
        OR profiles.organization_id = automation_rules.organization_id
      )
    )
  );

-- Automation log readable by staff
DROP POLICY IF EXISTS "Staff can view automation log" ON automation_log;
CREATE POLICY "Staff can view automation log"
  ON automation_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent')
    )
  );

-- Seed: example automation rules
INSERT INTO automation_rules (name, description, trigger, conditions, action, action_params)
VALUES
  ('Auto-escalate critical tickets', 'Escalate critical tickets to high priority', 'ticket_created',
   '{"priority": "critical"}', 'send_notification',
   '{"message": "Critical ticket created — immediate attention required"}'),
  ('Close stale pending tickets', 'Auto-close tickets pending for 7+ days', 'ticket_idle',
   '{"status": "pending", "idle_days": 7}', 'change_status',
   '{"new_status": "closed"}'),
  ('Tag VPN issues', 'Auto-tag tickets with VPN in title', 'ticket_created',
   '{"title_contains": "VPN"}', 'add_tag',
   '{"tag": "networking"}'),
  ('Notify on SLA breach', 'Send notification when SLA is breached', 'sla_breached',
   '{}', 'send_notification',
   '{"message": "SLA has been breached on this ticket"}')
ON CONFLICT DO NOTHING;
