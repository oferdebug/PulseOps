    -- ═══════════════════════════════════════════════════════════════════════════════
    -- PulseOps  –  Organization / Multi-tenant extensions
    -- ═══════════════════════════════════════════════════════════════════════════════

    -- Add metadata columns to organizations (if not already present)
    DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_members INTEGER NOT NULL DEFAULT 10;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::JSONB;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END $$;

    -- ─── Invite tokens ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    invited_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Index for lookups
    CREATE INDEX IF NOT EXISTS idx_org_invites_org ON organization_invites(organization_id);
    CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);

    -- ─── RLS ─────────────────────────────────────────────────────────────────────
    ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org members can view invites" ON organization_invites;
    CREATE POLICY "Org members can view invites" ON organization_invites
    FOR SELECT USING (
        EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_invites.organization_id
        )
    );

    DROP POLICY IF EXISTS "Staff can manage invites" ON organization_invites;
    CREATE POLICY "Staff can manage invites" ON organization_invites
    FOR ALL USING (
        EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_invites.organization_id
            AND profiles.role IN ('admin','agent')
        )
    );

    -- ─── Org update policy ──────────────────────────────────────────────────────
    DROP POLICY IF EXISTS "Admins can update org" ON organizations;
    CREATE POLICY "Admins can update org" ON organizations
    FOR UPDATE USING (
        EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organizations.id
            AND profiles.role = 'admin'
        )
    );
