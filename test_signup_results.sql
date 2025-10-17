-- ============================================================================
-- TEST SIGNUP RESULTS VERIFICATION SCRIPT
-- ============================================================================
-- Use this script in Supabase SQL Editor to verify signup test results
--
-- USAGE:
-- 1. Replace 'test-email@example.com' with actual test email
-- 2. Run script in Supabase SQL Editor
-- 3. Verify all components were created correctly

-- Test emails to check:
-- test-insurance-success@example.com (Insurance vertical)
-- test-standard-success@example.com (Standard vertical)

-- ============================================================================
-- 1. CHECK AUTH USER
-- ============================================================================
SELECT 
    'AUTH USER' as component,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'test-insurance-success@example.com'  -- Change email here
ORDER BY created_at DESC;

-- ============================================================================
-- 2. CHECK PROFILE
-- ============================================================================
SELECT 
    'PROFILE' as component,
    id,
    name,
    vertical,
    user_role,
    organization_id,
    created_at
FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'test-insurance-success@example.com'  -- Change email here
);

-- ============================================================================
-- 3. CHECK ORGANIZATION
-- ============================================================================
SELECT 
    'ORGANIZATION' as component,
    o.id,
    o.name,
    o.vertical,
    o.created_at,
    'linked_to_profile' as status
FROM organizations o
JOIN profiles p ON p.organization_id = o.id
WHERE p.id IN (
    SELECT id FROM auth.users 
    WHERE email = 'test-insurance-success@example.com'  -- Change email here
);

-- ============================================================================
-- 4. COMPLETE SIGNUP VERIFICATION
-- ============================================================================
-- This query shows the complete signup result in one view
SELECT 
    u.email,
    u.email_confirmed_at,
    u.raw_user_meta_data,
    p.name as profile_name,
    p.vertical as profile_vertical,
    p.user_role,
    o.name as org_name,
    o.vertical as org_vertical,
    CASE 
        WHEN p.id IS NOT NULL AND o.id IS NOT NULL THEN '✅ COMPLETE'
        WHEN p.id IS NOT NULL AND o.id IS NULL THEN '⚠️ PROFILE ONLY'
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        ELSE '❌ UNKNOWN'
    END as signup_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE u.email = 'test-insurance-success@example.com'  -- Change email here
ORDER BY u.created_at DESC;

-- ============================================================================
-- 5. CHECK FOR ORPHANED DATA (CLEANUP VERIFICATION)
-- ============================================================================
-- Check for auth users without profiles (should be 0 for successful signups)
SELECT 
    'ORPHANED AUTH USERS' as issue_type,
    COUNT(*) as count,
    ARRAY_AGG(email) as emails
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
AND u.email LIKE 'test-%@example.com';

-- Check for profiles without organizations (should be 0 for successful signups)
SELECT 
    'PROFILES WITHOUT ORG' as issue_type,
    COUNT(*) as count,
    ARRAY_AGG(u.email) as emails
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.organization_id IS NULL
AND u.email LIKE 'test-%@example.com';

-- ============================================================================
-- EXPECTED RESULTS FOR SUCCESSFUL SIGNUP:
-- ============================================================================
-- AUTH USER: ✅ 1 row with email, metadata including user_role, vertical, name
-- PROFILE: ✅ 1 row with matching id, correct vertical, user_role='user'
-- ORGANIZATION: ✅ 1 row with correct vertical, linked to profile
-- SIGNUP STATUS: ✅ COMPLETE
-- ORPHANED DATA: ✅ 0 rows in both checks