-- ============================================================================
-- FIX EXISTING USER: primassicurazionibari@gmail.com
-- ============================================================================
-- This script fixes the existing user who was affected by the signup bug
-- Execute in Supabase SQL Editor after the code fix is deployed

-- User ID: c623942a-d4b2-4d93-b944-b8e681679704
-- Email: primassicurazionibari@gmail.com
-- Issue: Profile was never created during signup

-- ============================================================================
-- STEP 1: CREATE MISSING PROFILE
-- ============================================================================
INSERT INTO
    profiles (
        id,
        name,
        user_role,
        vertical,
        created_at,
        updated_at
    )
VALUES (
        'c623942a-d4b2-4d93-b944-b8e681679704',
        'Claudio Comunale', -- Name from auth metadata
        'user',
        'insurance',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE ORGANIZATION FOR INSURANCE VERTICAL
-- ============================================================================
INSERT INTO
    organizations (
        name,
        vertical,
        created_at,
        updated_at
    )
VALUES (
        'Claudio Comunale''s Agenzia',
        'insurance',
        NOW(),
        NOW()
    ) RETURNING id;

-- ⚠️ IMPORTANT: Copy the organization ID from the result above
-- and use it in STEP 3 below

-- ============================================================================
-- STEP 3: LINK PROFILE TO ORGANIZATION
-- ============================================================================
-- Replace 'ORGANIZATION_ID_HERE' with the actual ID from STEP 2
UPDATE profiles
SET
    organization_id = 'ORGANIZATION_ID_HERE', -- ← REPLACE WITH ACTUAL ID
    updated_at = NOW()
WHERE
    id = 'c623942a-d4b2-4d93-b944-b8e681679704';

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================
-- Run this to verify the fix worked
SELECT
    'VERIFICATION' as status,
    u.email,
    u.raw_user_meta_data,
    p.name as profile_name,
    p.vertical as profile_vertical,
    p.user_role,
    o.name as org_name,
    o.vertical as org_vertical,
    CASE
        WHEN p.id IS NOT NULL
        AND o.id IS NOT NULL THEN '✅ FIXED'
        WHEN p.id IS NOT NULL
        AND o.id IS NULL THEN '⚠️ PROFILE ONLY'
        WHEN p.id IS NULL THEN '❌ STILL BROKEN'
        ELSE '❌ UNKNOWN'
    END as fix_status
FROM
    auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN organizations o ON o.id = p.organization_id
WHERE
    u.id = 'c623942a-d4b2-4d93-b944-b8e681679704';

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- fix_status should show: ✅ FIXED
-- User should now be able to login without TOKEN DEFECT error