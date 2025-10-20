-- Migration: Fix Circular Dependency in profiles RLS SELECT Policy
-- Date: 2025-01-20
-- Issue: The profiles_select_policy has a circular dependency that can block profile lookups
-- Root Cause: The organization_id subquery requires reading profiles table, which triggers the same RLS policy
-- Solution: Simplify policy to rely on auth.uid() = id OR user_role = 'super_admin' for individual access

-- ============================================================================
-- CRITICAL FIX: Remove Circular Dependency from profiles_select_policy
-- ============================================================================

-- Step 1: Drop the problematic SELECT policy with circular dependency
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Step 2: Create a simplified SELECT policy without circular dependency
-- Users can read:
--   1. Their own profile (auth.uid() = id) - ALWAYS WORKS
--   2. Any profile if they're super_admin
--   3. Profiles in their organization (uses app_metadata.organization_id from JWT, not subquery)
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  TO public
  USING (
    -- Allow users to see their own profile (primary condition, no recursion)
    (auth.uid() = id)
    OR
    -- Allow super admins to see all profiles
    (
      COALESCE(
        (auth.jwt() ->> 'user_role'::text),
        ((auth.jwt() -> 'user_metadata'::text) ->> 'user_role'::text)
      ) = 'super_admin'::text
    )
    OR
    -- Allow users to see profiles in the same organization
    -- CRITICAL: Use JWT claim directly, not a subquery that creates circular dependency
    (
      organization_id IS NOT NULL
      AND organization_id::text = COALESCE(
        (auth.jwt() ->> 'organization_id'::text),
        ((auth.jwt() -> 'user_metadata'::text) ->> 'organization_id'::text)
      )
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the new policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'profiles_select_policy';

-- Test policy logic explanation
COMMENT ON POLICY "profiles_select_policy" ON profiles IS 
  'Fixed RLS policy without circular dependency. Users can read: (1) own profile via auth.uid(), (2) all profiles if super_admin, (3) same-org profiles via JWT organization_id claim (no subquery).';

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- To rollback, restore the old policy with circular dependency:
-- DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
-- CREATE POLICY "profiles_select_policy" ON profiles
--   FOR SELECT TO public USING (
--     (auth.uid() = id) OR
--     (COALESCE((auth.jwt() ->> 'user_role'), ((auth.jwt() -> 'user_metadata') ->> 'user_role')) = 'super_admin') OR
--     (organization_id IS NOT NULL AND organization_id IN (
--       SELECT profiles_1.organization_id FROM profiles profiles_1
--       WHERE profiles_1.id = auth.uid() AND profiles_1.organization_id IS NOT NULL
--     ))
--   );
