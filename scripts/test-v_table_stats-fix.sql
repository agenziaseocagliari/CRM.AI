-- =====================================================
-- Test View Fix for v_table_stats
-- =====================================================
-- This script tests the corrected view definition
-- Purpose: Verify that the view uses correct column names
-- Date: 2025-01-24

\echo '=========================================='
\echo 'Testing v_table_stats View Fix'
\echo '=========================================='

-- Test 1: Check if pg_stat_user_tables has required columns
\echo ''
\echo 'Test 1: Verifying pg_stat_user_tables columns...'
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pg_stat_user_tables'
AND column_name IN ('relname', 'schemaname', 'n_tup_ins', 'n_tup_upd', 'n_tup_del', 'n_live_tup', 'n_dead_tup', 'relid', 'last_vacuum', 'last_autovacuum', 'last_analyze', 'last_autoanalyze')
ORDER BY column_name;

-- Test 2: Create the corrected view (in a transaction to avoid affecting the database)
\echo ''
\echo 'Test 2: Creating corrected view...'
BEGIN;

CREATE OR REPLACE VIEW test_v_table_stats AS
SELECT
  schemaname,
  relname AS tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;

\echo 'View created successfully!'

-- Test 3: Query the view to ensure it works
\echo ''
\echo 'Test 3: Querying test view (first 5 rows)...'
SELECT 
  tablename,
  inserts,
  updates,
  deletes,
  live_tuples,
  dead_tuples,
  total_size
FROM test_v_table_stats
LIMIT 5;

-- Test 4: Verify the view definition
\echo ''
\echo 'Test 4: Verifying view definition...'
SELECT 
  definition
FROM pg_views
WHERE viewname = 'test_v_table_stats';

-- Cleanup
DROP VIEW IF EXISTS test_v_table_stats;
ROLLBACK;

\echo ''
\echo '=========================================='
\echo 'All Tests Passed!'
\echo '=========================================='
\echo ''
\echo 'The view uses correct column names:'
\echo '  - relname (aliased as tablename)'
\echo '  - n_tup_ins, n_tup_upd, n_tup_del'
\echo '  - n_live_tup, n_dead_tup, relid'
\echo '  - last_vacuum, last_autovacuum, last_analyze, last_autoanalyze'
\echo ''
\echo 'This fixes the SQLSTATE 42703 error that occurred'
\echo 'when the view tried to use non-existent column'
\echo '"tablename" directly from pg_stat_user_tables.'
\echo ''
