-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Purpose: Diagnose why Polizze and Report modules show no data
-- Instructions: Run these queries in Supabase SQL Editor one by one
-- ============================================================================

-- ===========================================
-- STEP 1: Get Your User's Organization ID
-- ===========================================
-- IMPORTANT: Replace 'your.email@example.com' with your actual login email
SELECT 
  id as user_id,
  email,
  organization_id,
  vertical,
  created_at
FROM profiles
WHERE email = 'your.email@example.com'; -- ⚠️ REPLACE THIS WITH YOUR EMAIL

-- Expected Result: Should return 1 row with your organization_id
-- Copy the organization_id value - you'll need it below!


-- ===========================================
-- STEP 2: Check Insurance Policies Data
-- ===========================================
-- Check if any policies exist in the database
SELECT 
  COUNT(*) as total_policies,
  organization_id,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_policies
FROM insurance_policies
GROUP BY organization_id;

-- Expected Result: 
-- - If COUNT = 0 → No demo data exists (need to seed data)
-- - If organization_id doesn't match yours → Data mismatch (need to update org_id)

-- View actual policy details
SELECT 
  id,
  policy_number,
  type,
  status,
  client_name,
  premium,
  organization_id,
  start_date,
  end_date
FROM insurance_policies
ORDER BY created_at DESC
LIMIT 10;


-- ===========================================
-- STEP 3: Check Opportunities Data
-- ===========================================
-- Check if any opportunities exist
SELECT 
  COUNT(*) as total_opportunities,
  organization_id,
  SUM(value) as total_value,
  COUNT(CASE WHEN stage = 'Won' THEN 1 END) as won_deals,
  COUNT(CASE WHEN stage = 'Lost' THEN 1 END) as lost_deals
FROM opportunities
GROUP BY organization_id;

-- Expected Result:
-- - If COUNT = 0 → No demo data (Report will show €0)
-- - If organization_id doesn't match yours → Data mismatch

-- View actual opportunities
SELECT 
  id,
  contact_name as title,
  value,
  stage,
  organization_id,
  created_at
FROM opportunities
ORDER BY created_at DESC
LIMIT 10;


-- ===========================================
-- STEP 4: Check Contacts Data
-- ===========================================
SELECT 
  COUNT(*) as total_contacts,
  organization_id
FROM contacts
GROUP BY organization_id;


-- ===========================================
-- STEP 5: Verify RLS Policies Are Active
-- ===========================================
-- Check if Row Level Security is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('insurance_policies', 'opportunities', 'contacts')
ORDER BY tablename;

-- Expected Result: rls_enabled should be TRUE for all tables


-- ===========================================
-- DIAGNOSTIC SUMMARY
-- ===========================================
-- Run this to see all data counts by organization
SELECT 
  'insurance_policies' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM insurance_policies
GROUP BY organization_id

UNION ALL

SELECT 
  'opportunities' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM opportunities
GROUP BY organization_id

UNION ALL

SELECT 
  'contacts' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM contacts
GROUP BY organization_id

ORDER BY table_name, organization_id;


-- ============================================================================
-- NEXT STEPS BASED ON RESULTS:
-- ============================================================================
-- 
-- CASE A: No data found (COUNT = 0)
--   → Use FIX_OPTION_1_SEED_DEMO_DATA.sql to create demo data
--
-- CASE B: Data exists but organization_id doesn't match yours
--   → Use FIX_OPTION_2_UPDATE_ORG_ID.sql to fix organization_id mismatches
--
-- CASE C: Data exists with correct org_id but still not showing
--   → Check RLS policies with FIX_OPTION_3_RLS_POLICIES.sql
--
-- ============================================================================
