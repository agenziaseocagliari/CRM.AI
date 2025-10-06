-- 🛡️ GUARDIAN AI CRM - ENTERPRISE SECURITY SQL
-- ================================================
-- Multi-layer database security implementation

-- 1. 🔐 ADVANCED AUTHENTICATION & AUTHORIZATION
-- ==============================================

-- Revoke all public access (security hardening)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Create security roles hierarchy
DO $$
BEGIN
    -- Create security admin role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'security_admin') THEN
        CREATE ROLE security_admin;
    END IF;
    
    -- Create audit role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_reader') THEN
        CREATE ROLE audit_reader;
    END IF;
    
    -- Create monitoring role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'monitoring_agent') THEN
        CREATE ROLE monitoring_agent;
    END IF;
END $$;

-- 2. 🔐 INTRUSION DETECTION SYSTEM
-- =================================

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS security_failed_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failure_reason TEXT,
    geo_location JSONB,
    is_blocked BOOLEAN DEFAULT FALSE
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID,
    resource_type TEXT,
    resource_id TEXT,
    action_performed TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IP whitelist management
CREATE TABLE IF NOT EXISTS security_ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    ip_address INET NOT NULL,
    ip_range CIDR,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, ip_address)
);

-- 3. 🔐 ADVANCED RLS POLICIES
-- ============================

-- Enable RLS on security tables
ALTER TABLE security_failed_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Security admin can see all failed logins
CREATE POLICY security_admin_failed_logins ON security_failed_logins
    FOR ALL TO security_admin USING (true);

-- RLS Policy: Users can only see their own failed logins
CREATE POLICY user_own_failed_logins ON security_failed_logins
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- RLS Policy: Audit log - security admin access
CREATE POLICY security_admin_audit_log ON security_audit_log
    FOR ALL TO security_admin USING (true);

-- RLS Policy: Organization audit access
CREATE POLICY org_audit_log ON security_audit_log
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: IP whitelist per organization
CREATE POLICY org_ip_whitelist ON security_ip_whitelist
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. 🔐 SECURITY FUNCTIONS
-- =========================

-- Function: Check IP whitelist
CREATE OR REPLACE FUNCTION check_ip_whitelist(
    p_organization_id UUID,
    p_ip_address INET
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_whitelisted BOOLEAN := FALSE;
BEGIN
    -- Check if IP is in whitelist
    SELECT EXISTS(
        SELECT 1 
        FROM security_ip_whitelist 
        WHERE organization_id = p_organization_id
        AND (
            ip_address = p_ip_address 
            OR (ip_range IS NOT NULL AND p_ip_address << ip_range)
        )
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_is_whitelisted;
    
    RETURN v_is_whitelisted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log security event
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_user_id UUID,
    p_organization_id UUID,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_action_performed TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_success BOOLEAN,
    p_error_details JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        event_type, user_id, organization_id, resource_type, resource_id,
        action_performed, ip_address, user_agent, success, 
        error_details, metadata
    ) VALUES (
        p_event_type, p_user_id, p_organization_id, p_resource_type, p_resource_id,
        p_action_performed, p_ip_address, p_user_agent, p_success,
        p_error_details, p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check failed login attempts
CREATE OR REPLACE FUNCTION check_failed_login_attempts(
    p_user_id UUID,
    p_ip_address INET,
    p_threshold INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
    v_failed_count INTEGER;
BEGIN
    -- Count failed attempts in time window
    SELECT COUNT(*)
    INTO v_failed_count
    FROM security_failed_logins
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND attempted_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    -- Return TRUE if threshold exceeded (account should be locked)
    RETURN v_failed_count >= p_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record failed login
CREATE OR REPLACE FUNCTION record_failed_login(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_failure_reason TEXT,
    p_geo_location JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
    v_should_block BOOLEAN;
BEGIN
    -- Check if should block
    SELECT check_failed_login_attempts(p_user_id, p_ip_address) INTO v_should_block;
    
    -- Insert failed login record
    INSERT INTO security_failed_logins (
        user_id, ip_address, user_agent, failure_reason, 
        geo_location, is_blocked
    ) VALUES (
        p_user_id, p_ip_address, p_user_agent, p_failure_reason,
        p_geo_location, v_should_block
    ) RETURNING id INTO v_record_id;
    
    -- Log security event
    PERFORM log_security_event(
        'FAILED_LOGIN',
        p_user_id,
        NULL,
        'AUTH',
        v_record_id::TEXT,
        'LOGIN_ATTEMPT',
        p_ip_address,
        p_user_agent,
        FALSE,
        jsonb_build_object(
            'failure_reason', p_failure_reason,
            'blocked', v_should_block
        )
    );
    
    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 🔐 SECURITY TRIGGERS
-- ========================

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION trigger_audit_log() RETURNS TRIGGER AS $$
BEGIN
    -- Log all data modifications
    PERFORM log_security_event(
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'DATA_INSERT'
            WHEN TG_OP = 'UPDATE' THEN 'DATA_UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DATA_DELETE'
        END,
        auth.uid(),
        COALESCE(NEW.organization_id, OLD.organization_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        inet_client_addr(),
        current_setting('request.headers', true)::JSONB->>'user-agent',
        TRUE,
        NULL,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_organizations ON organizations;
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- 6. 🔐 GRANT PERMISSIONS
-- =======================

-- Grant security admin permissions
GRANT ALL ON security_failed_logins TO security_admin;
GRANT ALL ON security_audit_log TO security_admin;
GRANT ALL ON security_ip_whitelist TO security_admin;

-- Grant audit reader permissions
GRANT SELECT ON security_audit_log TO audit_reader;
GRANT SELECT ON security_failed_logins TO audit_reader;

-- Grant monitoring permissions
GRANT SELECT ON security_audit_log TO monitoring_agent;
GRANT EXECUTE ON FUNCTION check_failed_login_attempts TO monitoring_agent;

-- Grant authenticated user permissions
GRANT SELECT ON security_ip_whitelist TO authenticated;
GRANT EXECUTE ON FUNCTION check_ip_whitelist TO authenticated;
GRANT EXECUTE ON FUNCTION record_failed_login TO authenticated;

-- 7. 🔐 INDEXES FOR PERFORMANCE
-- ==============================

-- Index for failed logins lookup
CREATE INDEX IF NOT EXISTS idx_failed_logins_user_time 
ON security_failed_logins(user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_logins_ip_time 
ON security_failed_logins(ip_address, attempted_at DESC);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_time 
ON security_audit_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
ON security_audit_log(user_id, created_at DESC);

-- Index for IP whitelist
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_org_active 
ON security_ip_whitelist(organization_id, is_active);

-- 8. 🔐 SECURITY VIEWS
-- =====================

-- Security dashboard view
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    'failed_logins_24h' as metric,
    COUNT(*)::TEXT as value,
    'Failed login attempts in last 24 hours' as description
FROM security_failed_logins 
WHERE attempted_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'unique_blocked_ips_24h' as metric,
    COUNT(DISTINCT ip_address)::TEXT as value,
    'Unique blocked IPs in last 24 hours' as description
FROM security_failed_logins 
WHERE attempted_at > NOW() - INTERVAL '24 hours' AND is_blocked = TRUE

UNION ALL

SELECT 
    'security_events_24h' as metric,
    COUNT(*)::TEXT as value,
    'Security events logged in last 24 hours' as description
FROM security_audit_log 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Grant view access
GRANT SELECT ON security_dashboard TO security_admin;
GRANT SELECT ON security_dashboard TO monitoring_agent;