-- =====================================================
-- Phase 3: Security Hardening - Zero Trust Model
-- =====================================================
-- Description: Enhanced RLS policies, audit logging, and security controls
-- Impact: OWASP Top 10 compliance, zero-trust security model
-- Date: 2025-01-23
-- Version: 1.0

-- =====================================================
-- 1. Enhanced Audit Logging
-- =====================================================

-- Create enhanced audit log table with full-text search
CREATE TABLE IF NOT EXISTS audit_logs_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'execute', 'export'
  resource_type TEXT NOT NULL, -- 'contact', 'workflow', 'agent', 'integration', 'user', 'organization'
  resource_id UUID,
  changes JSONB, -- Before/after state for updates
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  tags TEXT[], -- Searchable tags for categorization
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Generated column for full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(action_type, '') || ' ' || 
      COALESCE(resource_type, '') || ' ' || 
      COALESCE(array_to_string(tags, ' '), '') || ' ' ||
      COALESCE(metadata::text, '')
    )
  ) STORED,
  
  CONSTRAINT valid_action_type CHECK (action_type IN ('create', 'read', 'update', 'delete', 'execute', 'export', 'login', 'logout')),
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes for audit logs
CREATE INDEX idx_audit_enhanced_search ON audit_logs_enhanced USING GIN(search_vector);
CREATE INDEX idx_audit_enhanced_org_time ON audit_logs_enhanced(organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;
CREATE INDEX idx_audit_enhanced_user_time ON audit_logs_enhanced(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_enhanced_risk ON audit_logs_enhanced(risk_level, created_at DESC)
  WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_audit_enhanced_resource ON audit_logs_enhanced(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_enhanced_tags ON audit_logs_enhanced USING GIN(tags)
  WHERE tags IS NOT NULL;

-- =====================================================
-- 2. Security Event Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'failed_login', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'failed_login', 'suspicious_activity', 'rate_limit_exceeded', 
    'unauthorized_access', 'data_export', 'privilege_escalation',
    'unusual_location', 'brute_force_attempt'
  )),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_security_events_time ON security_events(created_at DESC);
CREATE INDEX idx_security_events_unresolved ON security_events(severity, created_at DESC)
  WHERE is_resolved = false;
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_events_org ON security_events(organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

-- =====================================================
-- 3. IP Whitelist Enhancement with CIDR Support
-- =====================================================

-- Enhanced IP whitelist table (if not exists, or add columns)
DO $$
BEGIN
  -- Add CIDR column if table exists and column doesn't
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ip_whitelist'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ip_whitelist' 
    AND column_name = 'cidr_range'
  ) THEN
    ALTER TABLE ip_whitelist ADD COLUMN cidr_range CIDR;
    ALTER TABLE ip_whitelist ADD COLUMN allow_vpn BOOLEAN DEFAULT false;
    ALTER TABLE ip_whitelist ADD COLUMN geolocation_country TEXT;
    ALTER TABLE ip_whitelist ADD COLUMN last_used_at TIMESTAMPTZ;
    
    CREATE INDEX idx_ip_whitelist_cidr ON ip_whitelist USING GIST(cidr_range inet_ops)
      WHERE cidr_range IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 4. Enhanced RLS Policies - Zero Trust Model
-- =====================================================

-- Function to log superadmin access for audit trail
CREATE OR REPLACE FUNCTION log_superadmin_access(
  p_table_name TEXT,
  p_resource_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO audit_logs_enhanced (
    user_id,
    action_type,
    resource_type,
    resource_id,
    risk_level,
    tags,
    metadata
  ) VALUES (
    auth.uid(),
    'read',
    p_table_name,
    p_resource_id,
    'medium',
    ARRAY['superadmin_access'],
    jsonb_build_object(
      'table', p_table_name,
      'timestamp', NOW()
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced contacts RLS with zero-trust
DROP POLICY IF EXISTS "org_isolation_strict" ON contacts;
CREATE POLICY "org_isolation_strict"
ON contacts
FOR ALL
TO authenticated
USING (
  -- User must be active member of the organization
  organization_id IN (
    SELECT uo.organization_id 
    FROM user_organizations uo
    JOIN organizations o ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid() 
    AND uo.status = 'active'
    AND o.status = 'active'
    AND uo.role IN ('owner', 'admin', 'member')
  )
  AND organization_id IS NOT NULL
);

-- Superadmin access with audit logging
DROP POLICY IF EXISTS "superadmin_access_audited" ON contacts;
CREATE POLICY "superadmin_access_audited"
ON contacts
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin' 
  AND log_superadmin_access('contacts', id)
);

-- Similar policies for other critical tables
-- Workflow definitions
DROP POLICY IF EXISTS "workflow_org_isolation" ON workflow_definitions;
CREATE POLICY "workflow_org_isolation"
ON workflow_definitions
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id 
    FROM user_organizations uo
    JOIN organizations o ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid() 
    AND uo.status = 'active'
    AND o.status = 'active'
    AND uo.role IN ('owner', 'admin', 'member')
  )
  AND organization_id IS NOT NULL
);

DROP POLICY IF EXISTS "workflow_superadmin_access" ON workflow_definitions;
CREATE POLICY "workflow_superadmin_access"
ON workflow_definitions
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin' 
  AND log_superadmin_access('workflow_definitions', id)
);

-- =====================================================
-- 5. Data Sensitivity Classification
-- =====================================================

CREATE TABLE IF NOT EXISTS data_sensitivity_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  sensitivity_level TEXT NOT NULL, -- 'public', 'internal', 'confidential', 'restricted', 'pii'
  requires_encryption BOOLEAN DEFAULT false,
  retention_days INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(table_name, column_name),
  CONSTRAINT valid_sensitivity CHECK (sensitivity_level IN ('public', 'internal', 'confidential', 'restricted', 'pii'))
);

-- Classify sensitive data
INSERT INTO data_sensitivity_classifications (table_name, column_name, sensitivity_level, requires_encryption, retention_days, description) VALUES
('contacts', 'email', 'pii', true, 2555, 'Personal email address - GDPR protected'),
('contacts', 'phone', 'pii', true, 2555, 'Personal phone number - GDPR protected'),
('contacts', 'name', 'pii', false, 2555, 'Personal name - GDPR protected'),
('users', 'email', 'pii', true, 2555, 'User email address - GDPR protected'),
('organizations', 'billing_info', 'confidential', true, 2555, 'Sensitive billing information'),
('api_keys', 'key_hash', 'restricted', true, 365, 'API key hashes - security critical'),
('audit_logs_enhanced', 'ip_address', 'internal', false, 365, 'IP addresses for security logging')
ON CONFLICT (table_name, column_name) DO NOTHING;

-- =====================================================
-- 6. Security Functions
-- =====================================================

-- Function to check if IP is whitelisted (with CIDR support)
CREATE OR REPLACE FUNCTION is_ip_whitelisted(
  p_organization_id UUID,
  p_ip_address INET
) RETURNS BOOLEAN AS $$
DECLARE
  v_whitelisted BOOLEAN;
BEGIN
  -- Check if IP whitelisting is enabled for this org
  IF NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = p_organization_id 
    AND ip_whitelist_enabled = true
  ) THEN
    -- IP whitelisting not enabled, allow all
    RETURN true;
  END IF;
  
  -- Check if IP is in whitelist (exact match or CIDR range)
  SELECT EXISTS (
    SELECT 1 FROM ip_whitelist
    WHERE organization_id = p_organization_id
    AND is_active = true
    AND (
      ip_address = p_ip_address
      OR (cidr_range IS NOT NULL AND p_ip_address <<= cidr_range)
    )
  ) INTO v_whitelisted;
  
  -- Update last_used_at if whitelisted
  IF v_whitelisted THEN
    UPDATE ip_whitelist
    SET last_used_at = NOW()
    WHERE organization_id = p_organization_id
    AND (
      ip_address = p_ip_address
      OR (cidr_range IS NOT NULL AND p_ip_address <<= cidr_range)
    );
  END IF;
  
  RETURN v_whitelisted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record security event
CREATE OR REPLACE FUNCTION record_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    user_id,
    organization_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_organization_id,
    p_ip_address,
    p_user_agent,
    p_details
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
  v_failed_logins INTEGER;
  v_unusual_locations INTEGER;
  v_rate_limit_exceeded INTEGER;
  v_suspicious BOOLEAN := false;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count failed login attempts
  SELECT COUNT(*) INTO v_failed_logins
  FROM security_events
  WHERE user_id = p_user_id
    AND event_type = 'failed_login'
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Count unusual location events
  SELECT COUNT(*) INTO v_unusual_locations
  FROM security_events
  WHERE user_id = p_user_id
    AND event_type = 'unusual_location'
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Count rate limit exceeded events
  SELECT COUNT(*) INTO v_rate_limit_exceeded
  FROM security_events
  WHERE user_id = p_user_id
    AND event_type = 'rate_limit_exceeded'
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Evaluate suspicion criteria
  IF v_failed_logins >= 3 THEN
    v_suspicious := true;
    v_reasons := array_append(v_reasons, 'Multiple failed login attempts');
  END IF;
  
  IF v_unusual_locations >= 2 THEN
    v_suspicious := true;
    v_reasons := array_append(v_reasons, 'Unusual location access');
  END IF;
  
  IF v_rate_limit_exceeded >= 5 THEN
    v_suspicious := true;
    v_reasons := array_append(v_reasons, 'Excessive API usage');
  END IF;
  
  -- Return analysis
  RETURN jsonb_build_object(
    'is_suspicious', v_suspicious,
    'reasons', v_reasons,
    'failed_logins', v_failed_logins,
    'unusual_locations', v_unusual_locations,
    'rate_limit_exceeded', v_rate_limit_exceeded,
    'time_window_minutes', p_time_window_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Compliance Functions
-- =====================================================

-- GDPR: Right to be forgotten
CREATE OR REPLACE FUNCTION gdpr_delete_user_data(
  p_user_id UUID,
  p_requesting_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_deleted_records JSONB := '{}'::JSONB;
  v_count INTEGER;
BEGIN
  -- Verify requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_requesting_user_id
    AND raw_user_meta_data->>'role' = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can execute GDPR deletion';
  END IF;
  
  -- Log the deletion request
  INSERT INTO audit_logs_enhanced (
    user_id,
    action_type,
    resource_type,
    resource_id,
    risk_level,
    tags
  ) VALUES (
    p_requesting_user_id,
    'delete',
    'user',
    p_user_id,
    'critical',
    ARRAY['gdpr_deletion', 'right_to_be_forgotten']
  );
  
  -- Anonymize contacts (don't delete, for audit trail)
  UPDATE contacts
  SET 
    name = 'DELETED_USER_' || id,
    email = NULL,
    phone = NULL,
    metadata = '{}'::JSONB
  WHERE created_by = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_records := jsonb_set(v_deleted_records, '{contacts_anonymized}', to_jsonb(v_count));
  
  -- Delete user-specific data that doesn't need retention
  DELETE FROM user_organizations WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_records := jsonb_set(v_deleted_records, '{user_organizations_deleted}', to_jsonb(v_count));
  
  -- Anonymize audit logs (keep for compliance, but remove PII)
  UPDATE audit_logs_enhanced
  SET 
    ip_address = NULL,
    user_agent = NULL,
    metadata = '{}'::JSONB
  WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_records := jsonb_set(v_deleted_records, '{audit_logs_anonymized}', to_jsonb(v_count));
  
  RETURN v_deleted_records;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR: Data export (right to data portability)
CREATE OR REPLACE FUNCTION gdpr_export_user_data(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user_data JSONB;
BEGIN
  -- Log the export request
  INSERT INTO audit_logs_enhanced (
    user_id,
    action_type,
    resource_type,
    resource_id,
    risk_level,
    tags
  ) VALUES (
    p_user_id,
    'export',
    'user',
    p_user_id,
    'medium',
    ARRAY['gdpr_export', 'data_portability']
  );
  
  -- Build comprehensive user data export
  SELECT jsonb_build_object(
    'user_profile', (
      SELECT row_to_json(u) FROM auth.users u WHERE id = p_user_id
    ),
    'organizations', (
      SELECT jsonb_agg(o) FROM organizations o
      WHERE o.id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = p_user_id
      )
    ),
    'contacts_created', (
      SELECT COUNT(*) FROM contacts WHERE created_by = p_user_id
    ),
    'workflows_created', (
      SELECT COUNT(*) FROM workflow_definitions WHERE created_by = p_user_id
    ),
    'export_date', NOW()
  ) INTO v_user_data;
  
  RETURN v_user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. RLS Policies for New Tables
-- =====================================================

-- Audit logs enhanced: Super admins see all, users see their own
ALTER TABLE audit_logs_enhanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_enhanced_superadmin"
ON audit_logs_enhanced
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "audit_enhanced_user_own"
ON audit_logs_enhanced
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "audit_enhanced_org_admins"
ON audit_logs_enhanced
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
);

-- Security events: Super admins only
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events_superadmin_only"
ON security_events
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin');

-- Data sensitivity classifications: Read-only for all authenticated
ALTER TABLE data_sensitivity_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_classifications_read"
ON data_sensitivity_classifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "data_classifications_superadmin_write"
ON data_sensitivity_classifications
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin');

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE audit_logs_enhanced IS 
  'Enhanced audit logging with full-text search, risk levels, and detailed tracking';

COMMENT ON TABLE security_events IS 
  'Tracks security-related events for threat detection and incident response';

COMMENT ON TABLE data_sensitivity_classifications IS 
  'Classifies data sensitivity levels for compliance and data protection';

COMMENT ON FUNCTION is_ip_whitelisted IS 
  'Validates IP address against organization whitelist with CIDR support';

COMMENT ON FUNCTION detect_suspicious_activity IS 
  'Analyzes user activity patterns to detect potential security threats';

COMMENT ON FUNCTION gdpr_delete_user_data IS 
  'Implements GDPR right to be forgotten with proper audit trail';

COMMENT ON FUNCTION gdpr_export_user_data IS 
  'Implements GDPR right to data portability with comprehensive export';
