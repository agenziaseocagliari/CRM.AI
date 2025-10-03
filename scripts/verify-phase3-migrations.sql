-- =====================================================
-- Phase 3 Migration Verification Script
-- =====================================================
-- Run this script after deploying Phase 3 migrations
-- to verify everything is working correctly
-- =====================================================

-- Set client encoding for proper output
SET client_encoding = 'UTF8';

\echo '=================================================='
\echo 'Phase 3 Migration Verification'
\echo '=================================================='
\echo ''

-- =====================================================
-- 1. Check Integrations Table
-- =====================================================
\echo '1. Checking integrations table...'

DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '   ✓ Table "integrations" exists';
    
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'integrations';
    
    RAISE NOTICE '   ✓ % columns found', column_count;
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'integrations';
    
    RAISE NOTICE '   ✓ % indexes found', index_count;
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'integrations';
    
    RAISE NOTICE '   ✓ % RLS policies found', policy_count;
  ELSE
    RAISE WARNING '   ✗ Table "integrations" does NOT exist';
  END IF;
END $$;

\echo ''

-- =====================================================
-- 2. Check Required Columns
-- =====================================================
\echo '2. Checking required columns...'

DO $$
DECLARE
  required_columns TEXT[] := ARRAY[
    'id', 'organization_id', 'integration_type', 
    'is_active', 'created_at'
  ];
  col TEXT;
  col_exists BOOLEAN;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'integrations'
      AND column_name = col
    ) INTO col_exists;
    
    IF col_exists THEN
      RAISE NOTICE '   ✓ Column "%" exists', col;
    ELSE
      RAISE WARNING '   ✗ Column "%" does NOT exist', col;
    END IF;
  END LOOP;
END $$;

\echo ''

-- =====================================================
-- 3. Check Phase 3 Performance Indexes
-- =====================================================
\echo '3. Checking Phase 3 performance indexes...'

DO $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  -- Check idx_active_integrations
  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'integrations'
    AND indexname = 'idx_active_integrations'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '   ✓ Index "idx_active_integrations" exists';
  ELSE
    RAISE WARNING '   ⚠ Index "idx_active_integrations" does NOT exist (may not be created yet if table was just created)';
  END IF;
  
  -- Check other critical indexes
  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'contacts'
    AND indexname = 'idx_contacts_org_name'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '   ✓ Index "idx_contacts_org_name" exists';
  ELSE
    RAISE WARNING '   ✗ Index "idx_contacts_org_name" does NOT exist';
  END IF;
END $$;

\echo ''

-- =====================================================
-- 4. Check Index Health Views
-- =====================================================
\echo '4. Checking monitoring views and functions...'

DO $$
DECLARE
  view_exists BOOLEAN;
  func_exists BOOLEAN;
BEGIN
  -- Check v_index_usage_stats view
  SELECT EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'v_index_usage_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE '   ✓ View "v_index_usage_stats" exists';
  ELSE
    RAISE WARNING '   ✗ View "v_index_usage_stats" does NOT exist';
  END IF;
  
  -- Check v_table_stats view
  SELECT EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'v_table_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE '   ✓ View "v_table_stats" exists';
  ELSE
    RAISE WARNING '   ✗ View "v_table_stats" does NOT exist';
  END IF;
  
  -- Check get_slow_queries function
  SELECT EXISTS (
    SELECT FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_proc.proname = 'get_slow_queries'
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '   ✓ Function "get_slow_queries" exists';
  ELSE
    RAISE WARNING '   ✗ Function "get_slow_queries" does NOT exist';
  END IF;
  
  -- Check check_index_health function
  SELECT EXISTS (
    SELECT FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_proc.proname = 'check_index_health'
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '   ✓ Function "check_index_health" exists';
  ELSE
    RAISE WARNING '   ✗ Function "check_index_health" does NOT exist';
  END IF;
END $$;

\echo ''

-- =====================================================
-- 5. Test Insert Operation (Dry Run)
-- =====================================================
\echo '5. Testing table structure (dry run)...'

DO $$
BEGIN
  -- Try to prepare an insert statement (doesn't execute)
  -- This will fail if columns are missing
  PREPARE test_insert AS
    INSERT INTO integrations (
      organization_id,
      integration_type,
      is_active
    ) VALUES ($1, $2, $3);
  
  RAISE NOTICE '   ✓ Table structure is valid for INSERT operations';
  
  -- Clean up
  DEALLOCATE test_insert;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '   ✗ Table structure has issues: %', SQLERRM;
END $$;

\echo ''

-- =====================================================
-- 6. Display Index Statistics
-- =====================================================
\echo '6. Index statistics for integrations table:'
\echo ''

SELECT 
  indexname as "Index Name",
  pg_size_pretty(pg_relation_size(indexrelid)) as "Size"
FROM pg_stat_user_indexes
WHERE tablename = 'integrations'
ORDER BY indexname;

\echo ''

-- =====================================================
-- 7. Display RLS Policies
-- =====================================================
\echo '7. RLS policies for integrations table:'
\echo ''

SELECT 
  policyname as "Policy Name",
  cmd as "Command"
FROM pg_policies
WHERE tablename = 'integrations'
ORDER BY cmd, policyname;

\echo ''

-- =====================================================
-- Summary
-- =====================================================
\echo '=================================================='
\echo 'Verification Complete'
\echo '=================================================='
\echo ''
\echo 'Review the output above to ensure:'
\echo '  - integrations table exists with all required columns'
\echo '  - All indexes are created'
\echo '  - RLS policies are active'
\echo '  - Monitoring views and functions exist'
\echo ''
\echo 'If any items show warnings (✗ or ⚠), investigate before proceeding.'
\echo ''
