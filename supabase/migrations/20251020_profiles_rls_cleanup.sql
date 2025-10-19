-- ====================================================================
-- PROFILES RLS POLICY CLEANUP AND OPTIMIZATION
-- ====================================================================
-- This script removes duplicate/conflicting RLS policies on the profiles table
-- and establishes a single, clear set of policies for better performance and clarity.
--
-- Date: October 20, 2025
-- Target: profiles table RLS policies
-- ====================================================================

-- Step 1: Drop all existing SELECT policies on profiles (we'll recreate the essential ones)
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view organization profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Step 2: Drop duplicate INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Step 3: Drop duplicate UPDATE policies  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Step 4: Drop duplicate DELETE policies
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Step 5: Drop overly permissive policy
DROP POLICY IF EXISTS "Users can manage profiles" ON profiles;

-- ====================================================================
-- RECREATE OPTIMIZED RLS POLICIES
-- ====================================================================

-- Policy 1: SELECT - Allow users to view their own profile OR profiles in their organization OR super_admin can view all
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can always view their own profile
    auth.uid() = id
    OR
    -- Super admins can view all profiles
    COALESCE(
      auth.jwt() ->> 'user_role',
      (auth.jwt() -> 'user_metadata') ->> 'user_role'
    ) = 'super_admin'
    OR
    -- Users can view profiles in their organization (if they have one)
    (
      organization_id IS NOT NULL AND
      organization_id IN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

-- Policy 2: INSERT - Allow users to insert their own profile OR super_admin can insert any
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can insert their own profile
    auth.uid() = id
    OR
    -- Super admins can insert any profile
    COALESCE(
      auth.jwt() ->> 'user_role',
      (auth.jwt() -> 'user_metadata') ->> 'user_role'
    ) = 'super_admin'
  );

-- Policy 3: UPDATE - Allow users to update their own profile OR super_admin can update any
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update their own profile
    auth.uid() = id
    OR
    -- Super admins can update any profile
    COALESCE(
      auth.jwt() ->> 'user_role',
      (auth.jwt() -> 'user_metadata') ->> 'user_role'
    ) = 'super_admin'
  )
  WITH CHECK (
    -- Same conditions for the updated data
    auth.uid() = id
    OR
    COALESCE(
      auth.jwt() ->> 'user_role',
      (auth.jwt() -> 'user_metadata') ->> 'user_role'
    ) = 'super_admin'
  );

-- Policy 4: DELETE - Only super_admin can delete profiles (users cannot delete their own)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() ->> 'user_role',
      (auth.jwt() -> 'user_metadata') ->> 'user_role'
    ) = 'super_admin'
  );

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Verify policies are correctly set
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Permette visualizzazione profili'
    WHEN cmd = 'INSERT' THEN 'Permette creazione profili'
    WHEN cmd = 'UPDATE' THEN 'Permette aggiornamento profili'
    WHEN cmd = 'DELETE' THEN 'Permette cancellazione profili'
    ELSE 'Altro'
  END as descrizione
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY cmd, policyname;

-- Count profiles by vertical
SELECT 
  vertical,
  COUNT(*) as count,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as without_org
FROM profiles
GROUP BY vertical
ORDER BY count DESC;

-- ====================================================================
-- NOTES:
-- ====================================================================
-- 1. These policies ensure users can always access their own profile
-- 2. Organization-scoped access allows viewing colleagues' profiles
-- 3. NULL organization_id is handled gracefully (no error, just no org access)
-- 4. Super admins have full access to all profiles
-- 5. Regular users cannot delete profiles (only super_admin can)
-- ====================================================================
