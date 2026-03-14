-- ============================================================
-- PulseOps — Notifications Module
-- Migration: notifications + notification_preferences tables
-- ============================================================

-- Notification types
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('created', 'updated', 'closed', 'assigned', 'comment', 'sla_breach', 'mention');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  ticket_id     UUID REFERENCES tickets(id) ON DELETE CASCADE,
  ticket_title  TEXT,
  link          TEXT,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedupe: remove duplicate (user_id, type, ticket_id) rows before adding unique constraint
DELETE FROM notifications n
  USING notifications n2
  WHERE n.user_id = n2.user_id
    AND n.type = n2.type
    AND n.ticket_id = n2.ticket_id
    AND n.ticket_id IS NOT NULL
    AND n.id > n2.id;

-- Dedupe constraint: prevents duplicate notifications for the same user, type, and ticket
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_type_ticket_uniq
  ON notifications (user_id, type, ticket_id)
  WHERE ticket_id IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ticket_created    BOOLEAN NOT NULL DEFAULT true,
  ticket_updated    BOOLEAN NOT NULL DEFAULT true,
  ticket_closed     BOOLEAN NOT NULL DEFAULT true,
  ticket_assigned   BOOLEAN NOT NULL DEFAULT true,
  ticket_commented  BOOLEAN NOT NULL DEFAULT true,
  sla_breach        BOOLEAN NOT NULL DEFAULT true,
  mention           BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create notification on ticket changes (database trigger)
CREATE OR REPLACE FUNCTION notify_ticket_change()
RETURNS TRIGGER AS $$
DECLARE
  pref_record RECORD;
BEGIN
  -- On INSERT: notify the assigned user (if different from creator)
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.created_by THEN
      SELECT ticket_assigned INTO pref_record
        FROM notification_preferences WHERE user_id = NEW.assigned_to;
      IF NOT FOUND OR pref_record.ticket_assigned THEN
        INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_title, link)
        VALUES (
          NEW.assigned_to,
          'assigned',
          'New ticket assigned to you',
          'Ticket: ' || NEW.title,
          NEW.id,
          NEW.title,
          '/tickets/' || NEW.id
        );
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Status changed to closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
      -- Notify creator
      SELECT ticket_closed INTO pref_record
        FROM notification_preferences WHERE user_id = NEW.created_by;
      IF NOT FOUND OR pref_record.ticket_closed THEN
        INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_title, link)
        VALUES (
          NEW.created_by,
          'closed',
          'Ticket closed',
          'Ticket closed: ' || NEW.title,
          NEW.id,
          NEW.title,
          '/tickets/' || NEW.id
        );
      END IF;

      -- Notify assigned user if different from creator
      IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.created_by THEN
        SELECT ticket_closed INTO pref_record
          FROM notification_preferences WHERE user_id = NEW.assigned_to;
        IF NOT FOUND OR pref_record.ticket_closed THEN
          INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_title, link)
          VALUES (
            NEW.assigned_to,
            'closed',
            'Ticket closed',
            'Ticket closed: ' || NEW.title,
            NEW.id,
            NEW.title,
            '/tickets/' || NEW.id
          );
        END IF;
      END IF;
    END IF;

    -- Assignment changed
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      SELECT ticket_assigned INTO pref_record
        FROM notification_preferences WHERE user_id = NEW.assigned_to;
      IF NOT FOUND OR pref_record.ticket_assigned THEN
        INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_title, link)
        VALUES (
          NEW.assigned_to,
          'assigned',
          'Ticket assigned to you',
          'Ticket: ' || NEW.title,
          NEW.id,
          NEW.title,
          '/tickets/' || NEW.id
        );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS ticket_notify_trigger ON tickets;
CREATE TRIGGER ticket_notify_trigger
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION notify_ticket_change();
