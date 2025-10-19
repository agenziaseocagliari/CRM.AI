-- ===========================================
-- WORKFLOWS TABLE MIGRATION
-- Date: October 16, 2025
-- Purpose: Create workflows table for saved automation workflows
-- ===========================================

-- Create workflows table if doesn't exist
CREATE TABLE IF NOT EXISTS workflows (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users (id),
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows (organization_id);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows (created_by);

CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows (is_active);

CREATE INDEX IF NOT EXISTS idx_workflows_created ON workflows (created_at DESC);

-- =======================
-- ROW LEVEL SECURITY
-- =======================

-- Enable RLS on workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- =======================
-- RLS POLICIES
-- =======================

-- Policy for SELECT: Users can see workflows from their organization
DROP POLICY IF EXISTS "org_workflows_select" ON workflows;

CREATE POLICY "org_workflows_select" ON workflows FOR
SELECT TO public USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

-- Policy for INSERT: Users can create workflows in their organization
DROP POLICY IF EXISTS "org_workflows_insert" ON workflows;

CREATE POLICY "org_workflows_insert" ON workflows FOR
INSERT
    TO public
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND created_by = auth.uid ()
    );

-- Policy for UPDATE: Users can only update their own workflows
DROP POLICY IF EXISTS "own_workflows_update" ON workflows;

CREATE POLICY "own_workflows_update" ON workflows FOR
UPDATE TO public USING (created_by = auth.uid ());

-- Policy for DELETE: Users can only delete their own workflows
DROP POLICY IF EXISTS "own_workflows_delete" ON workflows;

CREATE POLICY "own_workflows_delete" ON workflows FOR DELETE TO public USING (created_by = auth.uid ());

-- =======================
-- TRIGGER FOR AUTO-UPDATING
-- =======================

-- Update timestamp trigger for workflows
DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
DROP FUNCTION IF EXISTS update_workflows_updated_at();
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflows_updated_at();

-- =======================
-- VERIFICATION QUERIES
-- =======================

-- Test table was created
SELECT 'workflows table created successfully ✅' AS status;

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'workflows'
ORDER BY ordinal_position;