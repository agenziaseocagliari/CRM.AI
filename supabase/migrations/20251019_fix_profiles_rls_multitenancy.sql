-- Fix RLS policies for profiles table with proper multi-tenancy support
-- Addresses: "Profile lookup failed" error in useVertical hook

-- Drop existing problematic policies (recursive SELECT)
DROP POLICY IF EXISTS "Users can view organization profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile (authenticated)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO public
  USING (auth.uid() = id);

-- Policy 2: Users can view profiles in same organization
-- Uses organization_id from JWT claims for performance (no recursive query)
DROP POLICY IF EXISTS "profiles_select_organization" ON profiles;
CREATE POLICY "profiles_select_organization" ON profiles
  FOR SELECT
  TO public
  USING (
    organization_id = (
      auth.jwt() ->> 'organization_id'
    )::uuid
  );

-- Policy 3: Super admins can view all profiles (no RLS restriction)
-- Assumes is_superadmin or role = 'super_admin' in profiles
DROP POLICY IF EXISTS "profiles_select_superadmin" ON profiles;
CREATE POLICY "profiles_select_superadmin" ON profiles
  FOR SELECT
  TO public
  USING (
    (auth.jwt() ->> 'role') = 'super_admin' 
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Policy 4: Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Policy 5: Users can insert their own profile (during signup)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Policy 6: Super admins can update any profile
DROP POLICY IF EXISTS "profiles_update_superadmin" ON profiles;
CREATE POLICY "profiles_update_superadmin" ON profiles
  FOR UPDATE
  TO public
  USING ((auth.jwt() ->> 'role') = 'super_admin');

-- Policy 7: Super admins can insert profiles
DROP POLICY IF EXISTS "profiles_insert_superadmin" ON profiles;
CREATE POLICY "profiles_insert_superadmin" ON profiles
  FOR INSERT
  TO public
  WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');

-- Optional: Add index on organization_id for query performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_organization_id ON profiles(id, organization_id);