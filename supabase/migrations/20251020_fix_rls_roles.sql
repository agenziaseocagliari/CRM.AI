-- Migration: Fix RLS policies to use public instead of deprecated roles
-- Date: 2025-10-20
-- Description: Replace authenticated and service_role with public in all policies

-- ============================================
-- FIX PROFILES TABLE POLICIES
-- ============================================

-- Drop old policies with deprecated roles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Recreate with TO public
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  TO public
  USING (
    id = auth.uid() 
    OR 
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  TO public
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  TO public
  USING (id = auth.uid());

-- ============================================
-- FIX CRM_EVENTS TABLE POLICIES
-- ============================================

-- Drop old service_role policy
DROP POLICY IF EXISTS "Allow service_role insert eventsAllow service_role insert event" ON crm_events;
DROP POLICY IF EXISTS "Allow service_role insert events" ON crm_events;

-- Recreate with TO public and proper auth check
CREATE POLICY "crm_events_insert_policy" ON crm_events
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow if user is creating event for their organization
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Ensure other crm_events policies exist with TO public
DROP POLICY IF EXISTS "crm_events_select_policy" ON crm_events;
CREATE POLICY "crm_events_select_policy" ON crm_events
  FOR SELECT
  TO public
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crm_events_update_policy" ON crm_events;
CREATE POLICY "crm_events_update_policy" ON crm_events
  FOR UPDATE
  TO public
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crm_events_delete_policy" ON crm_events;
CREATE POLICY "crm_events_delete_policy" ON crm_events
  FOR DELETE
  TO public
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Add comment for tracking
COMMENT ON TABLE profiles IS 'User profiles with RLS policies updated to use public role (2025-10-20)';
COMMENT ON TABLE crm_events IS 'CRM events with RLS policies updated to use public role (2025-10-20)';
