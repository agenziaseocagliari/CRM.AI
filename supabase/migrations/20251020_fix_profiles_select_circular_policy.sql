-- ================================================================
-- Migration: Fix Circular Self-Reference in profiles SELECT Policy
-- Date: 2025-01-20
-- Author: AI Agent
-- 
-- PROBLEM:
-- The current profiles_select_policy contains a self-referential subquery:
--   organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
-- 
-- This creates a CIRCULAR DEPENDENCY:
-- 1. User tries to SELECT from profiles
-- 2. RLS evaluates USING clause
-- 3. Subquery attempts SELECT from profiles WHERE id = auth.uid()
-- 4. This SELECT also triggers RLS evaluation
-- 5. Result: infinite recursion or permission denial → "Profile lookup failed"
--
-- SOLUTION:
-- Split the policy into two separate policies:
-- 1. Direct profile access (no subquery)
-- 2. Organization visibility using JWT claims (bypasses table lookup)
--
-- JWT STRUCTURE (confirmed by sync_auth_metadata_trigger):
-- {
--   "sub": "uuid",
--   "email": "user@example.com",
--   "user_metadata": {
--     "organization_id": "uuid",
--     "user_role": "admin|user|super_admin",
--     "vertical": "insurance|real_estate|standard",
--     "full_name": "..."
--   }
-- }
-- ================================================================

BEGIN;

-- Step 1: Drop the problematic self-referential policy
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Step 2: Create simplified direct access policy
-- Allows users to see their own profile without any subquery
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO public
  USING (id = auth.uid());

-- Step 3: Create organization visibility policy using JWT claims
-- This avoids the circular dependency by reading from JWT instead of querying profiles table
-- The sync_auth_metadata_trigger ensures organization_id is in user_metadata
CREATE POLICY "profiles_select_organization" ON profiles
  FOR SELECT
  TO public
  USING (
    -- Check if organization_id matches the one in JWT user_metadata
    organization_id = (
      (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
  );

-- Step 4: Verify super_admin policies are still intact (they should not be affected)
-- These policies allow super_admins to manage all profiles
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname LIKE '%super_admin%';
  
  IF policy_count < 3 THEN
    RAISE WARNING 'Expected at least 3 super_admin policies on profiles table, found %', policy_count;
  ELSE
    RAISE NOTICE '✅ Super admin policies intact: % policies found', policy_count;
  END IF;
END $$;

-- Step 5: Log the new policy structure
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== NEW PROFILES TABLE RLS POLICIES ===';
  
  FOR policy_record IN
    SELECT polname, polcmd::text, polroles::regrole[]::text[]
    FROM pg_policy
    WHERE polrelid = 'profiles'::regclass
    ORDER BY polname
  LOOP
    RAISE NOTICE 'Policy: % | Command: % | Roles: %', 
      policy_record.polname, 
      policy_record.polcmd, 
      policy_record.polroles;
  END LOOP;
END $$;

-- Step 6: Verify JWT metadata sync trigger exists
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'profiles'::regclass
    AND tgname = 'sync_auth_metadata_trigger';
  
  IF trigger_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL: sync_auth_metadata_trigger not found! JWT claims will not be updated.';
  ELSE
    RAISE NOTICE '✅ sync_auth_metadata_trigger exists and active';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ================================================================

-- Run these commands manually to verify the fix:

-- 1. Check all policies on profiles table
-- SELECT polname, polcmd, polroles::regrole[], 
--        pg_get_expr(polqual, polrelid) as using_clause,
--        pg_get_expr(polwithcheck, polrelid) as with_check_clause
-- FROM pg_policy 
-- WHERE polrelid = 'profiles'::regclass 
-- ORDER BY polname;

-- 2. Verify JWT contains organization_id (requires active session)
-- SELECT auth.uid() as user_id,
--        auth.jwt() -> 'user_metadata' ->> 'organization_id' as org_id_from_jwt,
--        p.organization_id as org_id_from_table
-- FROM profiles p
-- WHERE p.id = auth.uid();

-- 3. Test profile lookup (should succeed without circular dependency)
-- SELECT id, full_name, organization_id, user_role, vertical
-- FROM profiles
-- WHERE id = auth.uid();

-- 4. Count total policies (should be 10: 8 original + 2 new - 1 removed)
-- SELECT COUNT(*) as total_policies
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'profiles';

-- ================================================================
-- EXPECTED RESULTS
-- ================================================================
-- ✅ profiles_select_own: Allows direct profile access (id = auth.uid())
-- ✅ profiles_select_organization: Allows org members visibility via JWT
-- ✅ No circular dependency - JWT lookup is instant, no table query
-- ✅ Super admin policies unchanged (3 policies)
-- ✅ Total policies: 9 (was 8, removed 1, added 2)
-- ✅ Profile lookup succeeds during login flow
-- ================================================================
