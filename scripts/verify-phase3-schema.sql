-- ============================================================================
-- Phase 3 Schema Validation Script
-- ============================================================================
-- Purpose: Verify that all required columns exist in all tables before
--          running Phase 3 migrations, policies, and indexes.
--
-- Usage: Run this script in Supabase SQL Editor or via psql
--        psql <connection-string> -f scripts/verify-phase3-schema.sql
--
-- Expected: All checks should return TRUE or show ✓
-- ============================================================================

\echo '============================================================================'
\echo 'Phase 3 Schema Validation'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. API Rate Limiting Tables
-- ============================================================================
\echo '1. Checking API Rate Limiting Tables...'
\echo ''

-- Check api_rate_limits table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'api_rate_limits'
  ) AS "✓ api_rate_limits table exists";

-- Check all required columns in api_rate_limits
SELECT 
  COUNT(*) = 10 AS "✓ api_rate_limits has all required columns (10)",
  ARRAY_AGG(column_name ORDER BY column_name) AS columns_found
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'api_rate_limits'
AND column_name IN (
  'id', 'organization_id', 'user_id', 'endpoint', 
  'request_count', 'window_start', 'window_duration_minutes',
  'window_end', 'created_at', 'updated_at'
);

-- Check specific required columns
SELECT 
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_rate_limits'
    AND column_name = 'window_start'
  ) AS "✓ window_start column exists",
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_rate_limits'
    AND column_name = 'window_end'
  ) AS "✓ window_end column exists",
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_rate_limits'
    AND column_name = 'window_duration_minutes'
  ) AS "✓ window_duration_minutes column exists";

-- ============================================================================
-- 2. Rate Limiting Supporting Tables
-- ============================================================================
\echo ''
\echo '2. Checking Rate Limiting Supporting Tables...'
\echo ''

-- Check quota_policies table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'quota_policies'
  ) AS "✓ quota_policies table exists";

-- Check api_usage_statistics table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'api_usage_statistics'
  ) AS "✓ api_usage_statistics table exists";

-- Check rate_limit_config table (Phase 3)
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'rate_limit_config'
  ) AS "✓ rate_limit_config table exists";

-- Check rate_limit_tracking table (Phase 3)
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'rate_limit_tracking'
  ) AS "✓ rate_limit_tracking table exists";

-- ============================================================================
-- 3. Workflow Tables
-- ============================================================================
\echo ''
\echo '3. Checking Workflow Tables...'
\echo ''

-- Check workflow_definitions table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'workflow_definitions'
  ) AS "✓ workflow_definitions table exists";

-- Check workflow_execution_logs table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'workflow_execution_logs'
  ) AS "✓ workflow_execution_logs table exists";

-- Check if workflow_execution_logs has organization_id
SELECT 
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_execution_logs'
    AND column_name = 'organization_id'
  ) AS "✓ workflow_execution_logs.organization_id exists";

-- ============================================================================
-- 4. Audit Logging Tables
-- ============================================================================
\echo ''
\echo '4. Checking Audit Logging Tables...'
\echo ''

-- Check audit_logs table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
  ) AS "✓ audit_logs table exists";

-- Check if audit_logs has action_type column
SELECT 
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'action_type'
  ) AS "✓ audit_logs.action_type exists";

-- Check audit_logs_enhanced table (Phase 3)
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs_enhanced'
  ) AS "✓ audit_logs_enhanced table exists";

-- ============================================================================
-- 5. Security Tables
-- ============================================================================
\echo ''
\echo '5. Checking Security Tables...'
\echo ''

-- Check security_events table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'security_events'
  ) AS "✓ security_events table exists";

-- Check ip_whitelist table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'ip_whitelist'
  ) AS "✓ ip_whitelist table exists";

-- Check data_sensitivity_classifications table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'data_sensitivity_classifications'
  ) AS "✓ data_sensitivity_classifications table exists";

-- ============================================================================
-- 6. Integration Tables
-- ============================================================================
\echo ''
\echo '6. Checking Integration Tables...'
\echo ''

-- Check integrations table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'integrations'
  ) AS "✓ integrations table exists";

-- Check required columns in integrations
SELECT 
  COUNT(*) >= 7 AS "✓ integrations has required columns (min 7)",
  ARRAY_AGG(column_name ORDER BY column_name) AS columns_found
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'integrations'
AND column_name IN (
  'id', 'organization_id', 'integration_type', 
  'is_active', 'configuration', 'created_at', 'updated_at'
);

-- Check api_integrations table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'api_integrations'
  ) AS "✓ api_integrations table exists";

-- ============================================================================
-- 7. Agent and Automation Tables
-- ============================================================================
\echo ''
\echo '7. Checking Agent and Automation Tables...'
\echo ''

-- Check agents table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'agents'
  ) AS "✓ agents table exists";

-- Check agent_executions table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'agent_executions'
  ) AS "✓ agent_executions table exists";

-- Check automation_requests table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'automation_requests'
  ) AS "✓ automation_requests table exists";

-- ============================================================================
-- 8. System Health Monitoring Tables
-- ============================================================================
\echo ''
\echo '8. Checking System Health Monitoring Tables...'
\echo ''

-- Check system_health_metrics table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'system_health_metrics'
  ) AS "✓ system_health_metrics table exists";

-- Check system_alerts table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'system_alerts'
  ) AS "✓ system_alerts table exists";

-- ============================================================================
-- 9. Core CRM Tables
-- ============================================================================
\echo ''
\echo '9. Checking Core CRM Tables...'
\echo ''

-- Check organizations table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
  ) AS "✓ organizations table exists";

-- Check contacts table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'contacts'
  ) AS "✓ contacts table exists";

-- Check opportunities table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'opportunities'
  ) AS "✓ opportunities table exists";

-- Check crm_events table
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'crm_events'
  ) AS "✓ crm_events table exists";

-- ============================================================================
-- 10. Check Required Functions
-- ============================================================================
\echo ''
\echo '10. Checking Required Functions...'
\echo ''

-- Check rate limiting function
SELECT 
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'check_rate_limit'
  ) AS "✓ check_rate_limit function exists";

-- Check quota usage function
SELECT 
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_quota_usage'
  ) AS "✓ get_quota_usage function exists";

-- Check cleanup function
SELECT 
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'cleanup_old_rate_limit_data'
  ) AS "✓ cleanup_old_rate_limit_data function exists";

-- ============================================================================
-- 11. Check Indexes
-- ============================================================================
\echo ''
\echo '11. Checking Critical Indexes...'
\echo ''

-- Check rate limiting indexes
SELECT 
  COUNT(*) >= 2 AS "✓ api_rate_limits has required indexes (min 2)",
  ARRAY_AGG(indexname ORDER BY indexname) AS indexes_found
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'api_rate_limits'
AND indexname IN (
  'idx_api_rate_limits_org_endpoint',
  'idx_api_rate_limits_window_start',
  'idx_rate_limits_org_endpoint',
  'idx_rate_limits_cleanup'
);

-- Check workflow indexes
SELECT 
  EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'workflow_definitions'
    AND indexname = 'idx_workflows_org_active'
  ) AS "✓ idx_workflows_org_active exists (if workflow_definitions exists)";

-- Check audit log indexes
SELECT 
  EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
    AND indexname = 'idx_audit_org_time'
  ) AS "✓ idx_audit_org_time exists (if audit_logs exists)";

-- ============================================================================
-- 12. Summary Report
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'Schema Validation Summary'
\echo '============================================================================'
\echo ''

-- Count total tables
SELECT 
  COUNT(DISTINCT table_name) AS "Total tables found in public schema"
FROM information_schema.tables
WHERE table_schema = 'public';

-- Count total indexes
SELECT 
  COUNT(*) AS "Total indexes in public schema"
FROM pg_indexes
WHERE schemaname = 'public';

-- Count total functions
SELECT 
  COUNT(*) AS "Total functions in public schema"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Check RLS is enabled on critical tables
\echo ''
\echo 'Row Level Security Status:'
\echo ''

SELECT 
  tablename AS "Table Name",
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END AS "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'api_rate_limits',
  'quota_policies',
  'api_usage_statistics',
  'rate_limit_config',
  'rate_limit_tracking',
  'audit_logs',
  'integrations',
  'contacts',
  'opportunities'
)
ORDER BY tablename;

\echo ''
\echo '============================================================================'
\echo 'Validation Complete!'
\echo '============================================================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Review any FALSE or ✗ results above'
\echo '2. Run missing migrations if any tables/columns are missing'
\echo '3. If all checks pass, Phase 3 migrations are ready to deploy'
\echo ''
