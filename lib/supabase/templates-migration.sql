-- Ticket Templates Migration
-- Pre-defined templates for common ticket types

CREATE TABLE IF NOT EXISTS ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  default_priority TEXT NOT NULL DEFAULT 'medium',   -- low, medium, high, critical
  title_template TEXT NOT NULL DEFAULT '',
  body_template TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_templates_category ON ticket_templates(category);
CREATE INDEX IF NOT EXISTS idx_ticket_templates_active ON ticket_templates(is_active);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS ticket_templates_updated_at ON ticket_templates;
CREATE TRIGGER ticket_templates_updated_at
  BEFORE UPDATE ON ticket_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view templates" ON ticket_templates;
CREATE POLICY "Authenticated users can view templates"
  ON ticket_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert templates" ON ticket_templates;
CREATE POLICY "Authenticated users can insert templates"
  ON ticket_templates FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update templates" ON ticket_templates;
CREATE POLICY "Authenticated users can update templates"
  ON ticket_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete templates" ON ticket_templates;
CREATE POLICY "Authenticated users can delete templates"
  ON ticket_templates FOR DELETE TO authenticated USING (true);

-- Seed some useful default templates
INSERT INTO ticket_templates (name, description, category, default_priority, title_template, body_template) VALUES
(
  'VPN Issue',
  'Report VPN connectivity problems',
  'networking',
  'high',
  'VPN: [Brief description]',
  E'**Issue:** Unable to connect to VPN\n\n**Steps to reproduce:**\n1. \n2. \n3. \n\n**VPN Client:** \n**OS:** \n**Error message (if any):** \n\n**Urgency:** '
),
(
  'New User Setup',
  'Request new user account and access',
  'access',
  'medium',
  'New User Setup: [Employee Name]',
  E'**New employee name:** \n**Start date:** \n**Department:** \n**Manager:** \n\n**Access needed:**\n- [ ] Email account\n- [ ] Active Directory\n- [ ] VPN\n- [ ] Specific applications: \n\n**Hardware needed:**\n- [ ] Laptop\n- [ ] Monitor\n- [ ] Other: '
),
(
  'Password Reset',
  'Reset password for an account',
  'access',
  'medium',
  'Password Reset: [Account/System]',
  E'**Account/System:** \n**Username:** \n**Reason:** \n\n**Account holder confirmed identity:** Yes / No'
),
(
  'Hardware Failure',
  'Report hardware malfunction',
  'hardware',
  'high',
  'Hardware: [Device type] - [Issue]',
  E'**Device type:** (Laptop / Desktop / Monitor / Printer / Other)\n**Asset tag / Serial:** \n**Location:** \n\n**Problem description:**\n\n**When did it start:**\n**Is work blocked:** Yes / No'
),
(
  'Software Installation',
  'Request software installation or update',
  'software',
  'low',
  'Software Install: [App Name]',
  E'**Software name:** \n**Version:** \n**License key (if any):** \n**Business justification:** \n\n**Installation target:**\n- Device: \n- User: '
),
(
  'General Request',
  'Generic IT support request',
  'general',
  'medium',
  '[Brief description of request]',
  E'**Description:**\n\n**Impact:**\n\n**Preferred resolution timeframe:**'
)
ON CONFLICT (name) DO NOTHING;
