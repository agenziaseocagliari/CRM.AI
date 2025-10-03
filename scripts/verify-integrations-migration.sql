-- =====================================================
-- Integrations Table Migration Verification Script
-- =====================================================
-- This script verifies that the integrations table has
-- been created correctly with all required columns.
-- Run this in Supabase SQL Editor after deployment.

-- =====================================================
-- 1. Check if integrations table exists
-- =====================================================
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ integrations table exists';
    ELSE
        RAISE EXCEPTION '✗ integrations table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 2. Verify all required columns exist
-- =====================================================
DO $$
DECLARE
    config_exists BOOLEAN;
    creds_exists BOOLEAN;
BEGIN
    -- Check configuration column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'configuration'
    ) INTO config_exists;
    
    -- Check credentials column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'credentials'
    ) INTO creds_exists;
    
    IF config_exists THEN
        RAISE NOTICE '✓ configuration column exists';
    ELSE
        RAISE EXCEPTION '✗ configuration column does NOT exist';
    END IF;
    
    IF creds_exists THEN
        RAISE NOTICE '✓ credentials column exists';
    ELSE
        RAISE EXCEPTION '✗ credentials column does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 3. Display complete table structure
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'integrations'
ORDER BY ordinal_position;

-- =====================================================
-- 4. Verify indexes
-- =====================================================
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'integrations'
ORDER BY indexname;

-- =====================================================
-- 5. Verify RLS is enabled
-- =====================================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'integrations';

-- =====================================================
-- 6. List RLS policies
-- =====================================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'integrations'
ORDER BY policyname;

-- =====================================================
-- 7. Verify column comments
-- =====================================================
SELECT 
    cols.column_name,
    pg_catalog.col_description(c.oid, cols.ordinal_position::int) AS column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
WHERE cols.table_schema = 'public' 
AND cols.table_name = 'integrations'
AND pg_catalog.col_description(c.oid, cols.ordinal_position::int) IS NOT NULL
ORDER BY cols.ordinal_position;

-- =====================================================
-- 8. Test basic operations (optional)
-- =====================================================
-- Uncomment to test if you have an organization_id

-- INSERT INTO integrations (
--     organization_id,
--     integration_type,
--     is_active,
--     configuration,
--     credentials,
--     status
-- ) VALUES (
--     'YOUR_ORG_ID_HERE',
--     'test',
--     false,
--     '{"test": true}'::jsonb,
--     '{"api_key": "test"}'::jsonb,
--     'inactive'
-- );

-- SELECT * FROM integrations WHERE integration_type = 'test';

-- DELETE FROM integrations WHERE integration_type = 'test';

-- =====================================================
-- Expected Results Summary
-- =====================================================
-- ✓ integrations table exists
-- ✓ configuration column exists (type: jsonb)
-- ✓ credentials column exists (type: jsonb)
-- ✓ All 11 columns present: id, organization_id, integration_type, 
--   is_active, configuration, credentials, status, last_sync_at, 
--   last_error, created_at, updated_at
-- ✓ 4 indexes: primary key, idx_integrations_organization_id,
--   idx_integrations_type, idx_integrations_is_active
-- ✓ RLS enabled (rowsecurity = true)
-- ✓ 4 RLS policies: SELECT, INSERT, UPDATE, DELETE
-- ✓ Column comments exist for key columns
