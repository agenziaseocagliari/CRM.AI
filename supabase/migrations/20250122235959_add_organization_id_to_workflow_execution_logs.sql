-- =====================================================
-- Add organization_id to workflow_execution_logs
-- =====================================================
-- Description: Add organization_id column to workflow_execution_logs table
--              to support multi-tenancy and organization-based queries
-- Date: 2025-01-22
-- Version: 1.0
-- 
-- This migration MUST run BEFORE 20250123000000_phase3_performance_indexes.sql
-- which creates indexes on this column.

-- =====================================================
-- 1. Add organization_id column
-- =====================================================
ALTER TABLE workflow_execution_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- =====================================================
-- 2. Populate organization_id from workflow_definitions
-- =====================================================
-- Backfill organization_id for existing records by joining with workflow_definitions
UPDATE workflow_execution_logs wel
SET organization_id = wd.organization_id
FROM workflow_definitions wd
WHERE wel.workflow_id = wd.id
AND wel.organization_id IS NULL;

-- =====================================================
-- 3. Create index for performance
-- =====================================================
-- Basic index on organization_id (composite indexes are created in phase3_performance_indexes)
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_organization_id 
ON workflow_execution_logs(organization_id)
WHERE organization_id IS NOT NULL;

-- =====================================================
-- 4. Update RLS policies to use organization_id
-- =====================================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view workflow logs" ON workflow_execution_logs;

-- Recreate policy with direct organization_id check for better performance
DROP POLICY IF EXISTS "Users can view workflow logs" ON workflow_execution_logs;CREATE POLICY "Users can view workflow logs" ON workflow_execution_logs
    FOR SELECT
    TO public
    USING (
        -- Direct organization check for better performance
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Update insert policy
DROP POLICY IF EXISTS "System can insert workflow logs" ON workflow_execution_logs;

DROP POLICY IF EXISTS "System can insert workflow logs" ON workflow_execution_logs;

CREATE POLICY "System can insert workflow logs" ON workflow_execution_logs
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 5. Add comments
-- =====================================================
COMMENT ON COLUMN workflow_execution_logs.organization_id IS 
    'Organization ID for multi-tenancy support and efficient querying';
