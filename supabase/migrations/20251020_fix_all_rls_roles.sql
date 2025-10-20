-- Migration: Fix all remaining RLS policies with deprecated roles
-- Date: 2025-10-20
-- Description: Replace all authenticated, anon, service_role, security_admin with public

-- ============================================
-- FIX FORMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Enable public read access for forms" ON forms;

CREATE POLICY "forms_public_read_policy" ON forms
  FOR SELECT
  TO public
  USING (true);  -- Public forms should be readable by anyone

-- ============================================
-- FIX GOOGLE_CREDENTIALS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Enable users to view their own data only" ON google_credentials;

CREATE POLICY "google_credentials_select_policy" ON google_credentials
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "google_credentials_insert_policy" ON google_credentials;
CREATE POLICY "google_credentials_insert_policy" ON google_credentials
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "google_credentials_update_policy" ON google_credentials;
CREATE POLICY "google_credentials_update_policy" ON google_credentials
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "google_credentials_delete_policy" ON google_credentials;
CREATE POLICY "google_credentials_delete_policy" ON google_credentials
  FOR DELETE
  TO public
  USING (user_id = auth.uid());

-- ============================================
-- FIX INSURANCE_POLICIES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their organization's policies" ON insurance_policies;
DROP POLICY IF EXISTS "Users can create policies for their organization" ON insurance_policies;
DROP POLICY IF EXISTS "Users can update their organization's policies" ON insurance_policies;
DROP POLICY IF EXISTS "Users can delete their organization's policies" ON insurance_policies;

CREATE POLICY "insurance_policies_select_policy" ON insurance_policies
  FOR SELECT
  TO public
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "insurance_policies_insert_policy" ON insurance_policies
  FOR INSERT
  TO public
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "insurance_policies_update_policy" ON insurance_policies
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

CREATE POLICY "insurance_policies_delete_policy" ON insurance_policies
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
-- FIX SECURITY_AUDIT_LOG TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "security_admin_audit_log" ON security_audit_log;

CREATE POLICY "security_audit_log_select_policy" ON security_audit_log
  FOR SELECT
  TO public
  USING (
    -- Only super_admin users can view audit logs
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_role = 'super_admin'
    )
  );

CREATE POLICY "security_audit_log_insert_policy" ON security_audit_log
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow system to insert audit logs

-- ============================================
-- FIX SECURITY_FAILED_LOGINS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "security_admin_failed_logins" ON security_failed_logins;

CREATE POLICY "security_failed_logins_select_policy" ON security_failed_logins
  FOR SELECT
  TO public
  USING (
    -- Only super_admin users can view failed login attempts
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_role = 'super_admin'
    )
  );

CREATE POLICY "security_failed_logins_insert_policy" ON security_failed_logins
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow system to track failed logins

-- ============================================
-- VERIFICATION
-- ============================================

COMMENT ON TABLE forms IS 'Public forms with RLS policies updated (2025-10-20)';
COMMENT ON TABLE google_credentials IS 'Google OAuth credentials with RLS policies updated (2025-10-20)';
COMMENT ON TABLE insurance_policies IS 'Insurance policies with RLS policies updated (2025-10-20)';
COMMENT ON TABLE security_audit_log IS 'Security audit log with RLS policies updated (2025-10-20)';
COMMENT ON TABLE security_failed_logins IS 'Failed login tracking with RLS policies updated (2025-10-20)';
