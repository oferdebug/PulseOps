-- Ticket History / Audit Log Migration
-- Tracks every change made to a ticket (status, priority, assignment, title, description, etc.)

-- Create the ticket_history table
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,          -- e.g. 'status', 'priority', 'assigned_to', 'title'
  old_value TEXT,
  new_value TEXT,
  description TEXT,                  -- human-readable summary
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history(created_at);

-- Enable RLS
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read history
CREATE POLICY "Authenticated users can view ticket history"
  ON ticket_history FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert history entries
CREATE POLICY "Authenticated users can insert ticket history"
  ON ticket_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only the user who created the entry (or admins) can delete
CREATE POLICY "Users can delete own history entries"
  ON ticket_history FOR DELETE
  TO authenticated
  USING (changed_by = auth.uid());

-- ============================================================
-- Trigger: auto-log status changes
-- ============================================================
CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (ticket_id, changed_by, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status::TEXT, NEW.status::TEXT,
            'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;

  -- Priority change
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, changed_by, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'priority', OLD.priority::TEXT, NEW.priority::TEXT,
            'Priority changed from ' || OLD.priority || ' to ' || NEW.priority);
  END IF;

  -- Assignment change
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO ticket_history (ticket_id, changed_by, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT,
            'Assignment changed');
  END IF;

  -- Title change
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO ticket_history (ticket_id, changed_by, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'title', OLD.title, NEW.title,
            'Title updated');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS ticket_changes_trigger ON tickets;
CREATE TRIGGER ticket_changes_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_changes();

-- Also log ticket creation
CREATE OR REPLACE FUNCTION log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_history (ticket_id, changed_by, field_name, old_value, new_value, description)
  VALUES (NEW.id, auth.uid(), 'created', NULL, NULL, 'Ticket created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ticket_creation_trigger ON tickets;
CREATE TRIGGER ticket_creation_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_creation();
