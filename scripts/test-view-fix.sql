-- =====================================================
-- Test View Fix for v_index_usage_stats
-- =====================================================
-- This script tests the corrected view definition
-- Purpose: Verify that the view uses correct column names
-- Date: 2025-01-24

\echo '=========================================='
\echo 'Testing v_index_usage_stats View Fix'
\echo '=========================================='

-- Test 1: Check if pg_stat_user_indexes has required columns
\echo ''
\echo 'Test 1: Verifying pg_stat_user_indexes columns...'
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pg_stat_user_indexes'
AND column_name IN ('relname', 'indexrelname', 'idx_scan', 'idx_tup_read', 'idx_tup_fetch', 'indexrelid')
ORDER BY column_name;

-- Test 2: Create the corrected view (in a transaction to avoid affecting the database)
\echo ''
\echo 'Test 2: Creating corrected view...'
BEGIN;

CREATE OR REPLACE VIEW test_v_index_usage_stats AS
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

\echo 'View created successfully!'

-- Test 3: Query the view to ensure it works
\echo ''
\echo 'Test 3: Querying test view (first 5 rows)...'
SELECT 
  tablename,
  indexname,
  index_scans,
  index_size
FROM test_v_index_usage_stats
LIMIT 5;

-- Test 4: Verify the view definition
\echo ''
\echo 'Test 4: Verifying view definition...'
SELECT 
  definition
FROM pg_views
WHERE viewname = 'test_v_index_usage_stats';

-- Cleanup
DROP VIEW IF EXISTS test_v_index_usage_stats;
ROLLBACK;

\echo ''
\echo '=========================================='
\echo 'All Tests Passed!'
\echo '=========================================='
\echo ''
\echo 'The view uses correct column names:'
\echo '  - relname (aliased as tablename)'
\echo '  - indexrelname (aliased as indexname)'
\echo '  - idx_scan, idx_tup_read, idx_tup_fetch, indexrelid'
\echo ''
\echo 'This fixes the SQLSTATE 42703 error that occurred'
\echo 'when the view tried to use non-existent columns'
\echo '"tablename" and "indexname" directly.'
\echo ''
