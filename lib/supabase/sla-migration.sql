-- SLA Management Migration
-- Defines SLA rules per priority and tracks SLA status per ticket

-- SLA Rules table (one per priority level)
CREATE TABLE IF NOT EXISTS sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority TEXT NOT NULL,                           -- low, medium, high, critical
  first_response_hours NUMERIC NOT NULL DEFAULT 24, -- hours to first response
  resolution_hours NUMERIC NOT NULL DEFAULT 72,     -- hours to resolution
  escalation_hours NUMERIC,                         -- hours before auto-escalation
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(priority)
);

-- Per-ticket SLA tracking
CREATE TABLE IF NOT EXISTS ticket_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sla_rule_id UUID REFERENCES sla_rules(id) ON DELETE SET NULL,
  first_response_due TIMESTAMPTZ,
  resolution_due TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,              -- when first response actually happened
  resolved_at TIMESTAMPTZ,                    -- when ticket was actually resolved
  first_response_breached BOOLEAN NOT NULL DEFAULT false,
  resolution_breached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticket_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_sla_ticket_id ON ticket_sla(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_resolution_due ON ticket_sla(resolution_due);
CREATE INDEX IF NOT EXISTS idx_sla_rules_priority ON sla_rules(priority);

-- Enable RLS
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sla ENABLE ROW LEVEL SECURITY;

-- SLA Rules: everyone can read, only admins can modify (via service role or check)
CREATE POLICY "Authenticated users can view SLA rules"
  ON sla_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SLA rules"
  ON sla_rules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update SLA rules"
  ON sla_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ticket SLA: everyone can read, system can insert/update
CREATE POLICY "Authenticated users can view ticket SLA"
  ON ticket_sla FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ticket SLA"
  ON ticket_sla FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update ticket SLA"
  ON ticket_sla FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed default SLA rules
INSERT INTO sla_rules (name, priority, first_response_hours, resolution_hours, escalation_hours)
VALUES
  ('Critical SLA', 'critical', 1, 4, 2),
  ('High SLA', 'high', 4, 24, 8),
  ('Medium SLA', 'medium', 8, 48, 24),
  ('Low SLA', 'low', 24, 120, 72)
ON CONFLICT (priority) DO NOTHING;

-- ============================================================
-- Trigger: auto-create SLA tracking when a ticket is created
-- ============================================================
CREATE OR REPLACE FUNCTION create_ticket_sla()
RETURNS TRIGGER AS $$
DECLARE
  rule sla_rules%ROWTYPE;
BEGIN
  SELECT * INTO rule FROM sla_rules
  WHERE priority = NEW.priority::TEXT AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO ticket_sla (ticket_id, sla_rule_id, first_response_due, resolution_due)
    VALUES (
      NEW.id,
      rule.id,
      NEW.created_at + (rule.first_response_hours || ' hours')::INTERVAL,
      NEW.created_at + (rule.resolution_hours || ' hours')::INTERVAL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ticket_sla_trigger ON tickets;
CREATE TRIGGER ticket_sla_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_sla();

-- ============================================================
-- Trigger: mark SLA as resolved when ticket is closed
-- ============================================================
CREATE OR REPLACE FUNCTION update_ticket_sla_on_close()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    UPDATE ticket_sla
    SET resolved_at = now(),
        resolution_breached = (now() > resolution_due)
    WHERE ticket_id = NEW.id AND resolved_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ticket_sla_close_trigger ON tickets;
CREATE TRIGGER ticket_sla_close_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_sla_on_close();
