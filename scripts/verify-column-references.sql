-- =====================================================
-- Verification Script: Column References in Migrations
-- =====================================================
-- Purpose: Verify that all column references in performance indexes exist
-- Date: 2025-01-23
-- Related: Fix Missing Column Error & Full Deploy Alignment
-- =====================================================

\echo '=================================================='
\echo 'Column Reference Verification for Phase 3 Indexes'
\echo '=================================================='
\echo ''

-- =====================================================
-- 1. Check crm_events Table and Columns
-- =====================================================
\echo 'Checking crm_events table...'

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'crm_events'
  ) THEN
    RAISE NOTICE '✓ crm_events table exists';
    
    -- Check for event_start_time column
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'crm_events'
      AND column_name = 'event_start_time'
    ) THEN
      RAISE NOTICE '✓ crm_events.event_start_time column exists';
    ELSE
      RAISE WARNING '✗ crm_events.event_start_time column MISSING';
    END IF;
    
    -- Check for event_end_time column
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'crm_events'
      AND column_name = 'event_end_time'
    ) THEN
      RAISE NOTICE '✓ crm_events.event_end_time column exists';
    ELSE
      RAISE WARNING '✗ crm_events.event_end_time column MISSING';
    END IF;
    
    -- Check that start_time column does NOT exist (old naming)
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'crm_events'
      AND column_name = 'start_time'
    ) THEN
      RAISE WARNING '⚠ crm_events.start_time column exists (should use event_start_time)';
    END IF;
    
  ELSE
    RAISE NOTICE '⊘ crm_events table does not exist (indexes will be skipped)';
  END IF;
END $$;

-- =====================================================
-- 2. Check contacts Table and Columns
-- =====================================================
\echo ''
\echo 'Checking contacts table...'

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'contacts'
  ) THEN
    RAISE NOTICE '✓ contacts table exists';
    
    -- Check for last_contact_date column (optional)
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'last_contact_date'
    ) THEN
      RAISE NOTICE '✓ contacts.last_contact_date column exists (optional - index will be created)';
    ELSE
      RAISE NOTICE 'ℹ contacts.last_contact_date column not found (optional - index will be skipped)';
    END IF;
    
  ELSE
    RAISE NOTICE '⊘ contacts table does not exist (indexes will be skipped)';
  END IF;
END $$;

-- =====================================================
-- 3. Check opportunities Table and Columns
-- =====================================================
\echo ''
\echo 'Checking opportunities table...'

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'opportunities'
  ) THEN
    RAISE NOTICE '✓ opportunities table exists';
    
    -- Check for estimated_value column (optional)
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'estimated_value'
    ) THEN
      RAISE NOTICE '✓ opportunities.estimated_value column exists (optional)';
    ELSE
      RAISE NOTICE 'ℹ opportunities.estimated_value column not found (optional - index will be skipped)';
    END IF;
    
    -- Check for status column (optional)
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'status'
    ) THEN
      RAISE NOTICE '✓ opportunities.status column exists (optional)';
    ELSE
      RAISE NOTICE 'ℹ opportunities.status column not found (optional - index will be skipped)';
    END IF;
    
  ELSE
    RAISE NOTICE '⊘ opportunities table does not exist (indexes will be skipped)';
  END IF;
END $$;

-- =====================================================
-- 4. Check workflow_definitions Table
-- =====================================================
\echo ''
\echo 'Checking workflow_definitions table...'

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'workflow_definitions'
  ) THEN
    RAISE NOTICE '✓ workflow_definitions table exists';
  ELSE
    RAISE NOTICE '⊘ workflow_definitions table does not exist (indexes will be skipped)';
  END IF;
END $$;

-- =====================================================
-- 5. Check audit_logs Table
-- =====================================================
\echo ''
\echo 'Checking audit_logs table...'

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
  ) THEN
    RAISE NOTICE '✓ audit_logs table exists';
  ELSE
    RAISE NOTICE '⊘ audit_logs table does not exist (indexes will be skipped)';
  END IF;
END $$;

-- =====================================================
-- 6. Summary Report
-- =====================================================
\echo ''
\echo '=================================================='
\echo 'Summary Report'
\echo '=================================================='

DO $$
DECLARE
  v_critical_missing BOOLEAN := false;
  v_tables_exist INTEGER := 0;
  v_tables_total INTEGER := 5;
BEGIN
  -- Count existing tables
  SELECT COUNT(*)
  INTO v_tables_exist
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('crm_events', 'contacts', 'opportunities', 'workflow_definitions', 'audit_logs');
  
  RAISE NOTICE 'Tables Found: % of %', v_tables_exist, v_tables_total;
  
  -- Check for critical issues
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'crm_events'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'crm_events'
      AND column_name = 'event_start_time'
    ) THEN
      v_critical_missing := true;
      RAISE WARNING '✗ CRITICAL: crm_events table exists but event_start_time column is MISSING';
    END IF;
  END IF;
  
  IF v_critical_missing THEN
    RAISE EXCEPTION 'CRITICAL ERRORS FOUND - Migration will fail!';
  ELSE
    RAISE NOTICE '✓ No critical errors found';
    RAISE NOTICE 'Migration is ready to deploy';
  END IF;
END $$;

\echo ''
\echo '=================================================='
\echo 'Verification Complete'
\echo '=================================================='
