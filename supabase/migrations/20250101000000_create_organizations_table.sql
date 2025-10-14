-- Organizations Table Creation (Missing Dependency Fix)
-- This table is referenced by other migrations but was never created
-- Date: 2025-10-14

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Add RLS policy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Basic policy for now (can be refined later)
CREATE POLICY IF NOT EXISTS "Organizations are readable by authenticated users" 
ON organizations FOR SELECT 
TO authenticated
USING (true);

-- Add comment
COMMENT ON TABLE organizations IS 'Organizations table - created to resolve migration dependencies';