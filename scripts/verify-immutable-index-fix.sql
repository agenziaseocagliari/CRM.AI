-- ============================================================================
-- Verification Script: Non-IMMUTABLE Index Predicates Fix
-- ============================================================================
-- Purpose: Verify that all indexes have been corrected and do not use
--          non-IMMUTABLE functions in their WHERE predicates
-- Date: 2025-10-03
-- ============================================================================

\echo '============================================================'
\echo 'Verification: Non-IMMUTABLE Index Predicates Fix'
\echo '============================================================'
\echo ''

-- ============================================================================
-- 1. Verify Fixed Indexes Exist and Have Correct Definitions
-- ============================================================================
\echo '1. Checking fixed indexes exist with correct definitions...'
\echo ''

SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexdef LIKE '%NOW()%' THEN '❌ STILL HAS NOW()'
    WHEN indexdef LIKE '%CURRENT_TIMESTAMP%' THEN '❌ STILL HAS CURRENT_TIMESTAMP'
    ELSE '✅ OK'
  END as status,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_rate_limits_cleanup',
  'idx_upcoming_events',
  'idx_sessions_expired',
  'idx_audit_old_entries'
)
ORDER BY tablename, indexname;

\echo ''
\echo '============================================================'

-- ============================================================================
-- 2. Check for ANY Indexes with Non-IMMUTABLE Functions
-- ============================================================================
\echo '2. Searching for any indexes with non-IMMUTABLE functions...'
\echo ''

SELECT 
  schemaname,
  tablename,
  indexname,
  '❌ PROBLEMATIC' as status,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexdef LIKE '%NOW()%' 
  OR indexdef LIKE '%CURRENT_TIMESTAMP%'
  OR indexdef LIKE '%CURRENT_DATE%'
  OR indexdef LIKE '%CURRENT_TIME%'
  OR indexdef LIKE '%LOCALTIME%'
  OR indexdef LIKE '%LOCALTIMESTAMP%'
)
ORDER BY tablename, indexname;

\echo ''
\echo 'If no rows returned above, all indexes are clean! ✅'
\echo ''
\echo '============================================================'

-- ============================================================================
-- 3. Verify Index Sizes (Optional Performance Check)
-- ============================================================================
\echo '3. Index sizes (for performance monitoring)...'
\echo ''

SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_rate_limits_cleanup',
  'idx_upcoming_events',
  'idx_sessions_expired',
  'idx_audit_old_entries'
)
ORDER BY pg_relation_size(indexrelid) DESC;

\echo ''
\echo '============================================================'

-- ============================================================================
-- 4. Test Index Usage with Sample Queries
-- ============================================================================
\echo '4. Testing index usage with EXPLAIN (if tables exist)...'
\echo ''

-- Test idx_rate_limits_cleanup
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_rate_limits') THEN
    RAISE NOTICE 'Testing idx_rate_limits_cleanup...';
    RAISE NOTICE 'Expected: Should use index scan on idx_rate_limits_cleanup';
  END IF;
END $$;

-- Note: Actual EXPLAIN queries would need data to be meaningful
-- These can be run manually in production:
/*
EXPLAIN ANALYZE
SELECT * FROM api_rate_limits 
WHERE window_end < NOW() - INTERVAL '7 days'
LIMIT 100;

EXPLAIN ANALYZE
SELECT * FROM crm_events 
WHERE organization_id = 'some-org-id' 
AND start_time > NOW()
LIMIT 100;

EXPLAIN ANALYZE
SELECT * FROM sessions 
WHERE expires_at < NOW()
LIMIT 100;

EXPLAIN ANALYZE
SELECT * FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days'
LIMIT 100;
*/

\echo ''
\echo '============================================================'
\echo 'Verification Complete!'
\echo ''
\echo 'Summary:'
\echo '  ✅ All indexes should be listed in section 1'
\echo '  ✅ Section 2 should return 0 rows (no problematic indexes)'
\echo '  ℹ️  Section 3 shows index sizes (slightly larger without predicates)'
\echo '  ℹ️  Section 4 provides sample queries for manual testing'
\echo '============================================================'
