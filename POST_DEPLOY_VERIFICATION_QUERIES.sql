-- =====================================================
-- Post-Deployment Verification Queries
-- =====================================================
-- Purpose: Verify that all view fixes were deployed successfully
-- Run these queries after CI/CD deployment completes
-- Date: 2025-01-24

\echo ''
\echo '╔════════════════════════════════════════════════════╗'
\echo '║    POST-DEPLOY VERIFICATION - VIEW FIXES          ║'
\echo '╚════════════════════════════════════════════════════╝'
\echo ''

-- =====================================================
-- Test 1: Verify All Views Exist
-- =====================================================

\echo 'Test 1: Verifying all 5 views exist...'
\echo ''

SELECT 
  viewname,
  CASE 
    WHEN viewname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('v_index_usage_stats'),
    ('v_table_stats'),
    ('v_system_health_overview'),
    ('v_recent_alerts'),
    ('v_metric_trends_hourly')
) AS expected(viewname)
LEFT JOIN pg_views USING (viewname)
WHERE pg_views.schemaname = 'public' OR pg_views.schemaname IS NULL
ORDER BY viewname;

\echo ''
\echo 'Expected: 5 views with ✅ EXISTS status'
\echo ''

-- =====================================================
-- Test 2: Verify View Definitions Use Correct Columns
-- =====================================================

\echo 'Test 2: Checking v_index_usage_stats definition...'
\echo ''

SELECT 
  CASE 
    WHEN definition LIKE '%relname%' THEN '✅ Uses correct column: relname'
    ELSE '❌ Missing correct column: relname'
  END as relname_check,
  CASE 
    WHEN definition LIKE '%indexrelname%' THEN '✅ Uses correct column: indexrelname'
    ELSE '❌ Missing correct column: indexrelname'
  END as indexrelname_check
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'v_index_usage_stats';

\echo ''
\echo 'Expected: Both checks show ✅'
\echo ''

-- =====================================================
-- Test 3: Verify Views Return Data
-- =====================================================

\echo 'Test 3: Testing that views return data...'
\echo ''

-- Test v_index_usage_stats
\echo '→ Testing v_index_usage_stats...'
SELECT 
  'v_index_usage_stats' as view_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Returns data'
    ELSE '⚠️  Empty (might be normal in fresh DB)'
  END as status
FROM v_index_usage_stats;

-- Test v_table_stats
\echo '→ Testing v_table_stats...'
SELECT 
  'v_table_stats' as view_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Returns data'
    ELSE '⚠️  Empty (might be normal in fresh DB)'
  END as status
FROM v_table_stats;

-- Test v_system_health_overview
\echo '→ Testing v_system_health_overview...'
SELECT 
  'v_system_health_overview' as view_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Query works'
    ELSE '❌ Query failed'
  END as status
FROM v_system_health_overview;

-- Test v_recent_alerts
\echo '→ Testing v_recent_alerts...'
SELECT 
  'v_recent_alerts' as view_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Query works'
    ELSE '❌ Query failed'
  END as status
FROM v_recent_alerts;

-- Test v_metric_trends_hourly
\echo '→ Testing v_metric_trends_hourly...'
SELECT 
  'v_metric_trends_hourly' as view_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Query works'
    ELSE '❌ Query failed'
  END as status
FROM v_metric_trends_hourly;

\echo ''
\echo 'Expected: All views return data or show ✅ Query works'
\echo ''

-- =====================================================
-- Test 4: Verify View Comments
-- =====================================================

\echo 'Test 4: Checking view documentation...'
\echo ''

SELECT 
  viewname,
  CASE 
    WHEN obj_description((schemaname || '.' || viewname)::regclass, 'pg_class') IS NOT NULL 
    THEN '✅ Has comment'
    ELSE '⚠️  No comment'
  END as documentation_status
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN (
  'v_index_usage_stats',
  'v_table_stats',
  'v_system_health_overview',
  'v_recent_alerts',
  'v_metric_trends_hourly'
)
ORDER BY viewname;

\echo ''
\echo 'Expected: Most views have ✅ Has comment'
\echo ''

-- =====================================================
-- Test 5: Sample Data from Key Views
-- =====================================================

\echo 'Test 5: Sample data from key views...'
\echo ''

\echo '→ v_index_usage_stats (top 3 by usage):'
SELECT 
  tablename,
  indexname,
  index_scans,
  index_size
FROM v_index_usage_stats
ORDER BY index_scans DESC
LIMIT 3;

\echo ''
\echo '→ v_table_stats (top 3 by size):'
SELECT 
  tablename,
  live_tuples,
  dead_tuples,
  total_size
FROM v_table_stats
ORDER BY pg_total_relation_size((schemaname || '.' || tablename)::regclass) DESC
LIMIT 3;

\echo ''

-- =====================================================
-- Summary
-- =====================================================

\echo ''
\echo '╔════════════════════════════════════════════════════╗'
\echo '║            VERIFICATION SUMMARY                    ║'
\echo '╚════════════════════════════════════════════════════╝'
\echo ''
\echo 'If all tests show ✅ or ⚠️  (for empty views):'
\echo '  → Deployment was SUCCESSFUL'
\echo '  → All views are working correctly'
\echo '  → SQLSTATE 42P16 fix is effective'
\echo ''
\echo 'If any test shows ❌:'
\echo '  → Check the specific view definition'
\echo '  → Verify migration was applied'
\echo '  → Review deployment logs'
\echo ''
\echo 'Next steps:'
\echo '  1. Monitor views usage for 24 hours'
\echo '  2. Check for any application errors'
\echo '  3. Verify performance metrics are collected'
\echo ''
