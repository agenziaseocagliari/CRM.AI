-- =====================================================
-- Organization Integrations Table
-- =====================================================
-- This migration creates the integrations table for
-- organization-specific integration instances.
-- This table tracks which integrations each organization
-- has activated and configured.

-- =====================================================
-- 1. Integrations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- 'whatsapp', 'email', 'telegram', 'ai', etc.
    is_active BOOLEAN NOT NULL DEFAULT false,
    configuration JSONB DEFAULT '{}', -- Organization-specific configuration
    credentials JSONB DEFAULT '{}', -- Organization-specific credentials
    status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'rate_limited'
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, integration_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Organization users can view their integrations
CREATE POLICY "Users can view organization integrations" ON integrations
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Organization admins can insert integrations
CREATE POLICY "Admins can insert integrations" ON integrations
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'super_admin')
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Organization admins can update integrations
CREATE POLICY "Admins can update integrations" ON integrations
    FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'super_admin')
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Organization admins can delete integrations
CREATE POLICY "Admins can delete integrations" ON integrations
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'super_admin')
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 2. Trigger for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. Ensure columns exist (for existing tables)
-- =====================================================
-- Add configuration column if it doesn't exist
-- This handles cases where table exists from previous migration
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'configuration'
    ) THEN
        ALTER TABLE integrations ADD COLUMN configuration JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add credentials column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'credentials'
    ) THEN
        ALTER TABLE integrations ADD COLUMN credentials JSONB DEFAULT '{}';
    END IF;
END $$;

-- =====================================================
-- 4. Comments
-- =====================================================

COMMENT ON TABLE integrations IS 
    'Organization-specific integration instances. Each organization can activate and configure integrations independently.';
    
COMMENT ON COLUMN integrations.integration_type IS 
    'Type of integration (e.g., whatsapp, email, telegram, ai)';
    
COMMENT ON COLUMN integrations.is_active IS 
    'Whether this integration is currently active for the organization';
    
COMMENT ON COLUMN integrations.configuration IS 
    'Organization-specific configuration (endpoints, settings, etc.)';
    
COMMENT ON COLUMN integrations.credentials IS 
    'Organization-specific encrypted credentials';
