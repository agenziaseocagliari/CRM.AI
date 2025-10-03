-- ============================================================================
-- Fix Non-IMMUTABLE Function Usage in Index Predicates
-- ============================================================================
-- Purpose: Remove NOW() and time-based comparisons from index WHERE clauses
--          as they are not IMMUTABLE and can cause deployment errors
-- Date: 2025-10-03
-- Related: PHASE_3_SCHEMA_COMPLIANCE_REPORT_IT.md
-- ============================================================================

-- Issue: PostgreSQL requires functions used in index predicates to be IMMUTABLE
-- NOW() and CURRENT_TIMESTAMP are STABLE, not IMMUTABLE, causing errors like:
-- "functions in index predicate must be marked IMMUTABLE"

-- Solution: Remove time-based predicates from indexes or drop and recreate without them

-- ============================================================================
-- 1. Fix api_rate_limits cleanup index
-- ============================================================================
-- Original problematic index:
-- CREATE INDEX idx_rate_limits_cleanup ON api_rate_limits(window_end) WHERE window_end < NOW();

DO $$
BEGIN
  -- Drop the problematic index if it exists
  DROP INDEX IF EXISTS idx_rate_limits_cleanup;
  
  -- Recreate without WHERE clause (index entire column for cleanup queries)
  CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
    ON api_rate_limits(window_end);
    
  RAISE NOTICE 'Fixed idx_rate_limits_cleanup index (removed NOW() predicate)';
END $$;

-- ============================================================================
-- 2. Fix crm_events upcoming events index
-- ============================================================================
-- Original problematic index:
-- CREATE INDEX idx_crm_events_upcoming ON crm_events(organization_id, start_time ASC) 
-- WHERE start_time > NOW() AND organization_id IS NOT NULL;

DO $$
BEGIN
  -- Drop the problematic index if it exists
  DROP INDEX IF EXISTS idx_crm_events_upcoming;
  
  -- Recreate with only the organization_id predicate (removes NOW() comparison)
  CREATE INDEX IF NOT EXISTS idx_crm_events_upcoming
    ON crm_events(organization_id, start_time ASC)
    WHERE organization_id IS NOT NULL;
    
  RAISE NOTICE 'Fixed idx_crm_events_upcoming index (removed NOW() predicate)';
END $$;

-- ============================================================================
-- 3. Fix sessions expiry index
-- ============================================================================
-- Original problematic index:
-- CREATE INDEX idx_sessions_expiry ON sessions(expires_at) WHERE expires_at < NOW();

DO $$
BEGIN
  -- Check if sessions table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sessions'
  ) THEN
    -- Drop the problematic index if it exists
    DROP INDEX IF EXISTS idx_sessions_expiry;
    
    -- Recreate without WHERE clause
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry
      ON sessions(expires_at);
      
    RAISE NOTICE 'Fixed idx_sessions_expiry index (removed NOW() predicate)';
  ELSE
    RAISE NOTICE 'sessions table does not exist, skipping idx_sessions_expiry';
  END IF;
END $$;

-- ============================================================================
-- 4. Fix audit_logs retention index
-- ============================================================================
-- Original problematic index:
-- CREATE INDEX idx_audit_logs_retention ON audit_logs(created_at) 
-- WHERE created_at < NOW() - INTERVAL '90 days';

DO $$
BEGIN
  -- Drop the problematic index if it exists
  DROP INDEX IF EXISTS idx_audit_logs_retention;
  
  -- Recreate without WHERE clause (created_at is already indexed elsewhere)
  -- This index is primarily for cleanup queries, which can filter at query time
  CREATE INDEX IF NOT EXISTS idx_audit_logs_retention
    ON audit_logs(created_at);
    
  RAISE NOTICE 'Fixed idx_audit_logs_retention index (removed NOW() predicate)';
END $$;

-- ============================================================================
-- Note on Query Performance
-- ============================================================================
-- Removing WHERE clauses from indexes means they will be slightly larger,
-- but PostgreSQL can still use them efficiently with bitmap scans.
-- The trade-off is acceptable given the deployment reliability gains.
--
-- For cleanup queries, add the time condition in the WHERE clause:
-- Example:
--   DELETE FROM api_rate_limits WHERE window_end < NOW() - INTERVAL '7 days';
--   DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
--
-- PostgreSQL will still use the indexes efficiently.
-- ============================================================================

-- ============================================================================
-- Verification Query
-- ============================================================================
-- To verify all indexes are now properly created without IMMUTABLE errors:
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_rate_limits_cleanup',
  'idx_crm_events_upcoming',
  'idx_sessions_expiry',
  'idx_audit_logs_retention'
)
ORDER BY tablename, indexname;
*/
