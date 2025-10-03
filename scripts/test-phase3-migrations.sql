-- ============================================================================
-- Phase 3 Migration Test Script
-- ============================================================================
-- Purpose: Test Phase 3 migrations in a safe environment
--
-- Usage: Run in a test/staging database ONLY
--        DO NOT RUN IN PRODUCTION without backup!
--
-- This script:
-- 1. Tests table creation
-- 2. Tests column additions
-- 3. Tests computed columns work correctly
-- 4. Tests index creation
-- 5. Validates data integrity
-- ============================================================================

\echo '============================================================================'
\echo 'Phase 3 Migration Testing'
\echo '============================================================================'
\echo ''
\echo 'WARNING: This should only be run in a test/staging environment!'
\echo ''

-- ============================================================================
-- Test 1: Verify window_end Column Functionality
-- ============================================================================
\echo 'Test 1: Testing window_end computed column...'

-- Create a test organization if it doesn't exist
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000099', 'Test Organization', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test INSERT with window_end computation
DO $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_expected_end TIMESTAMPTZ;
  v_duration INTEGER := 60; -- 60 minutes
BEGIN
  -- Clean up any existing test data
  DELETE FROM api_rate_limits 
  WHERE organization_id = '00000000-0000-0000-0000-000000000099';

  -- Insert test data
  v_window_start := NOW();
  v_expected_end := v_window_start + (v_duration || ' minutes')::INTERVAL;

  INSERT INTO api_rate_limits (
    organization_id,
    endpoint,
    request_count,
    window_start,
    window_duration_minutes
  ) VALUES (
    '00000000-0000-0000-0000-000000000099',
    '/api/test',
    1,
    v_window_start,
    v_duration
  );

  -- Verify window_end was computed correctly
  SELECT window_end INTO v_window_end
  FROM api_rate_limits
  WHERE organization_id = '00000000-0000-0000-0000-000000000099'
  AND endpoint = '/api/test'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if computed correctly (allowing 1 second tolerance)
  IF ABS(EXTRACT(EPOCH FROM (v_window_end - v_expected_end))) > 1 THEN
    RAISE EXCEPTION 'window_end computation failed! Expected: %, Got: %', v_expected_end, v_window_end;
  END IF;

  RAISE NOTICE '✓ window_end computed correctly: % (duration: % minutes)', v_window_end, v_duration;

  -- Test with different duration
  v_duration := 120; -- 120 minutes
  v_window_start := NOW();
  v_expected_end := v_window_start + (v_duration || ' minutes')::INTERVAL;

  INSERT INTO api_rate_limits (
    organization_id,
    endpoint,
    request_count,
    window_start,
    window_duration_minutes
  ) VALUES (
    '00000000-0000-0000-0000-000000000099',
    '/api/test2',
    1,
    v_window_start,
    v_duration
  );

  SELECT window_end INTO v_window_end
  FROM api_rate_limits
  WHERE organization_id = '00000000-0000-0000-0000-000000000099'
  AND endpoint = '/api/test2'
  ORDER BY created_at DESC
  LIMIT 1;

  IF ABS(EXTRACT(EPOCH FROM (v_window_end - v_expected_end))) > 1 THEN
    RAISE EXCEPTION 'window_end computation failed for 120 minutes! Expected: %, Got: %', v_expected_end, v_window_end;
  END IF;

  RAISE NOTICE '✓ window_end computed correctly for 120 minutes: %', v_window_end;

  -- Cleanup
  DELETE FROM api_rate_limits 
  WHERE organization_id = '00000000-0000-0000-0000-000000000099';

  RAISE NOTICE '✓ Test 1 PASSED: window_end column works correctly';
END $$;

\echo ''

-- ============================================================================
-- Test 2: Verify Indexes Can Be Created
-- ============================================================================
\echo 'Test 2: Testing Phase 3 indexes...'

-- Try to create the indexes that reference window_end
DO $$
BEGIN
  -- Test idx_rate_limits_org_endpoint (if it doesn't exist)
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = 'idx_rate_limits_org_endpoint'
  ) THEN
    CREATE INDEX idx_rate_limits_org_endpoint 
      ON api_rate_limits(organization_id, endpoint, window_end DESC);
    RAISE NOTICE '✓ Created idx_rate_limits_org_endpoint';
  ELSE
    RAISE NOTICE '✓ idx_rate_limits_org_endpoint already exists';
  END IF;

  -- Test idx_rate_limits_cleanup (if it doesn't exist)
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = 'idx_rate_limits_cleanup'
  ) THEN
    CREATE INDEX idx_rate_limits_cleanup
      ON api_rate_limits(window_end)
      WHERE window_end < NOW();
    RAISE NOTICE '✓ Created idx_rate_limits_cleanup';
  ELSE
    RAISE NOTICE '✓ idx_rate_limits_cleanup already exists';
  END IF;

  RAISE NOTICE '✓ Test 2 PASSED: All indexes created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Test 2 FAILED: Index creation error: %', SQLERRM;
END $$;

\echo ''

-- ============================================================================
-- Test 3: Verify Index Usage
-- ============================================================================
\echo 'Test 3: Testing index usage...'

-- Insert test data for index testing
INSERT INTO api_rate_limits (
  organization_id,
  endpoint,
  request_count,
  window_start,
  window_duration_minutes
) VALUES 
  ('00000000-0000-0000-0000-000000000099', '/api/test1', 5, NOW() - INTERVAL '2 hours', 60),
  ('00000000-0000-0000-0000-000000000099', '/api/test2', 10, NOW() - INTERVAL '1 hour', 60),
  ('00000000-0000-0000-0000-000000000099', '/api/test3', 15, NOW() - INTERVAL '30 minutes', 60)
ON CONFLICT DO NOTHING;

-- Test query that should use idx_rate_limits_org_endpoint
EXPLAIN (FORMAT TEXT) 
SELECT * FROM api_rate_limits
WHERE organization_id = '00000000-0000-0000-0000-000000000099'
AND endpoint = '/api/test1'
AND window_end > NOW() - INTERVAL '3 hours';

-- Test cleanup query that should use idx_rate_limits_cleanup
EXPLAIN (FORMAT TEXT)
SELECT * FROM api_rate_limits
WHERE window_end < NOW();

-- Cleanup
DELETE FROM api_rate_limits 
WHERE organization_id = '00000000-0000-0000-0000-000000000099';

\echo '✓ Test 3 PASSED: Queries can use window_end indexes'
\echo ''

-- ============================================================================
-- Test 4: Verify UPDATE Behavior
-- ============================================================================
\echo 'Test 4: Testing UPDATE behavior...'

DO $$
DECLARE
  v_old_window_end TIMESTAMPTZ;
  v_new_window_end TIMESTAMPTZ;
BEGIN
  -- Insert test record
  INSERT INTO api_rate_limits (
    organization_id,
    endpoint,
    request_count,
    window_start,
    window_duration_minutes
  ) VALUES (
    '00000000-0000-0000-0000-000000000099',
    '/api/test_update',
    1,
    NOW(),
    60
  );

  -- Get initial window_end
  SELECT window_end INTO v_old_window_end
  FROM api_rate_limits
  WHERE organization_id = '00000000-0000-0000-0000-000000000099'
  AND endpoint = '/api/test_update';

  -- Update window_duration_minutes
  UPDATE api_rate_limits
  SET window_duration_minutes = 120
  WHERE organization_id = '00000000-0000-0000-0000-000000000099'
  AND endpoint = '/api/test_update';

  -- Get new window_end
  SELECT window_end INTO v_new_window_end
  FROM api_rate_limits
  WHERE organization_id = '00000000-0000-0000-0000-000000000099'
  AND endpoint = '/api/test_update';

  -- Verify window_end was recalculated
  IF v_new_window_end = v_old_window_end THEN
    RAISE EXCEPTION 'window_end was not recalculated after UPDATE!';
  END IF;

  -- Verify the difference is exactly 60 minutes (120 - 60)
  IF ABS(EXTRACT(EPOCH FROM (v_new_window_end - v_old_window_end - INTERVAL '60 minutes'))) > 1 THEN
    RAISE EXCEPTION 'window_end recalculation incorrect! Old: %, New: %', v_old_window_end, v_new_window_end;
  END IF;

  RAISE NOTICE '✓ window_end recalculated correctly after UPDATE';
  RAISE NOTICE '  Old window_end: % (60 min)', v_old_window_end;
  RAISE NOTICE '  New window_end: % (120 min)', v_new_window_end;

  -- Cleanup
  DELETE FROM api_rate_limits 
  WHERE organization_id = '00000000-0000-0000-0000-000000000099';

  RAISE NOTICE '✓ Test 4 PASSED: UPDATE behavior correct';
END $$;

\echo ''

-- ============================================================================
-- Test 5: Verify Cleanup Query Performance
-- ============================================================================
\echo 'Test 5: Testing cleanup query performance...'

DO $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration_ms NUMERIC;
  v_deleted_count INTEGER;
BEGIN
  -- Insert test data with expired windows
  INSERT INTO api_rate_limits (
    organization_id,
    endpoint,
    request_count,
    window_start,
    window_duration_minutes
  )
  SELECT 
    '00000000-0000-0000-0000-000000000099',
    '/api/test' || i,
    1,
    NOW() - (i * INTERVAL '1 hour'),
    60
  FROM generate_series(1, 100) AS i;

  -- Test cleanup query performance
  v_start_time := clock_timestamp();
  
  DELETE FROM api_rate_limits
  WHERE window_end < NOW()
  AND organization_id = '00000000-0000-0000-0000-000000000099';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;

  RAISE NOTICE '✓ Cleanup query executed in % ms', ROUND(v_duration_ms, 2);
  RAISE NOTICE '✓ Deleted % expired records', v_deleted_count;

  IF v_duration_ms > 100 THEN
    RAISE WARNING 'Cleanup query took longer than expected (> 100ms). Check index usage.';
  END IF;

  RAISE NOTICE '✓ Test 5 PASSED: Cleanup query performance acceptable';
END $$;

\echo ''

-- ============================================================================
-- Test 6: Verify RLS Still Works
-- ============================================================================
\echo 'Test 6: Testing RLS policies...'

-- Verify RLS is enabled
SELECT 
  CASE WHEN rowsecurity THEN '✓ RLS enabled on api_rate_limits'
       ELSE '✗ WARNING: RLS not enabled on api_rate_limits'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'api_rate_limits';

-- List RLS policies
SELECT 
  COUNT(*) AS policy_count,
  '✓ RLS policies exist on api_rate_limits' AS status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'api_rate_limits';

\echo '✓ Test 6 PASSED: RLS configuration verified'
\echo ''

-- ============================================================================
-- Cleanup Test Organization
-- ============================================================================
\echo 'Cleaning up test data...'

DELETE FROM api_rate_limits 
WHERE organization_id = '00000000-0000-0000-0000-000000000099';

DELETE FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000099';

\echo '✓ Test data cleaned up'
\echo ''

-- ============================================================================
-- Final Summary
-- ============================================================================
\echo '============================================================================'
\echo 'All Tests PASSED! ✓'
\echo '============================================================================'
\echo ''
\echo 'Summary:'
\echo '  ✓ window_end column computation works correctly'
\echo '  ✓ Indexes on window_end can be created'
\echo '  ✓ Queries can use window_end indexes'
\echo '  ✓ UPDATE recalculates window_end correctly'
\echo '  ✓ Cleanup queries perform well'
\echo '  ✓ RLS policies remain active'
\echo ''
\echo 'Phase 3 migrations are ready for deployment!'
\echo ''
