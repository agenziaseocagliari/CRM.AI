-- Phase 3 - M03: IP Whitelisting & Geo-Restrictions
-- Migration: Create IP whitelisting and geo-restriction schema
-- Priority: P1 - High
-- Dependencies: M02 (Enhanced Audit Logging)

-- ============================================================================
-- IP WHITELIST TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    ip_range_start INET,
    ip_range_end INET,
    is_range BOOLEAN DEFAULT false,
    label TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_org ON ip_whitelist(organization_id);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON ip_whitelist(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_expires ON ip_whitelist(expires_at) WHERE expires_at IS NOT NULL;

-- Full-text search on label and description
CREATE INDEX idx_ip_whitelist_search ON ip_whitelist USING GIN(
    to_tsvector('english', COALESCE(label, '') || ' ' || COALESCE(description, ''))
);

COMMENT ON TABLE ip_whitelist IS 'IP addresses and ranges allowed to access the organization';
COMMENT ON COLUMN ip_whitelist.ip_address IS 'Single IP address or CIDR notation';
COMMENT ON COLUMN ip_whitelist.ip_range_start IS 'Start of IP range (for range-based whitelist)';
COMMENT ON COLUMN ip_whitelist.ip_range_end IS 'End of IP range (for range-based whitelist)';

-- ============================================================================
-- GEO-RESTRICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS geo_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (US, GB, IT, etc.)
    restriction_type TEXT NOT NULL CHECK (restriction_type IN ('allow', 'block')),
    label TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, country_code)
);

-- Indexes
CREATE INDEX idx_geo_restrictions_org ON geo_restrictions(organization_id);
CREATE INDEX idx_geo_restrictions_active ON geo_restrictions(organization_id, is_active);

COMMENT ON TABLE geo_restrictions IS 'Geographic restrictions for organization access';
COMMENT ON COLUMN geo_restrictions.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN geo_restrictions.restriction_type IS 'Either allow or block access from this country';

-- ============================================================================
-- IP ACCESS LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ip_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET NOT NULL,
    country_code TEXT,
    city TEXT,
    is_whitelisted BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    endpoint TEXT,
    request_method TEXT,
    user_agent TEXT,
    access_time TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and analytics
CREATE INDEX idx_ip_access_log_org ON ip_access_log(organization_id);
CREATE INDEX idx_ip_access_log_ip ON ip_access_log(ip_address);
CREATE INDEX idx_ip_access_log_blocked ON ip_access_log(organization_id, is_blocked);
CREATE INDEX idx_ip_access_log_time ON ip_access_log(access_time DESC);

-- Partitioning by time (for scalability)
-- Note: In production, consider partitioning by month
COMMENT ON TABLE ip_access_log IS 'Log of all IP access attempts for security monitoring';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_access_log ENABLE ROW LEVEL SECURITY;

-- IP Whitelist Policies
DROP POLICY IF EXISTS "Users can view their organization's IP whitelist" ON ip_whitelist;CREATE POLICY "Users can view their organization's IP whitelist"
    ON ip_whitelist FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can insert IP whitelist entries" ON ip_whitelist;

CREATE POLICY "Admins can insert IP whitelist entries"
    ON ip_whitelist FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can update IP whitelist entries" ON ip_whitelist;

CREATE POLICY "Admins can update IP whitelist entries"
    ON ip_whitelist FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can delete IP whitelist entries" ON ip_whitelist;

CREATE POLICY "Admins can delete IP whitelist entries"
    ON ip_whitelist FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Geo-Restrictions Policies
DROP POLICY IF EXISTS "Users can view their organization's geo-restrictions" ON geo_restrictions;CREATE POLICY "Users can view their organization's geo-restrictions"
    ON geo_restrictions FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage geo-restrictions" ON geo_restrictions;

CREATE POLICY "Admins can manage geo-restrictions"
    ON geo_restrictions FOR ALL
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- IP Access Log Policies
DROP POLICY IF EXISTS "Admins can view their organization's IP access logs" ON ip_access_log;CREATE POLICY "Admins can view their organization's IP access logs"
    ON ip_access_log FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- System can insert access logs (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "System can insert IP access logs" ON ip_access_log;CREATE POLICY "System can insert IP access logs"
    ON ip_access_log FOR INSERT
    TO public
    WITH CHECK (
        -- Allow inserts from SECURITY DEFINER functions (log_ip_access)
        -- These functions run with elevated privileges and handle authorization internally
        true
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if IP is whitelisted
CREATE OR REPLACE FUNCTION check_ip_whitelist(
    p_organization_id UUID,
    p_ip_address INET
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_whitelisted BOOLEAN;
BEGIN
    -- Check if IP is in whitelist (exact match or CIDR range)
    SELECT EXISTS (
        SELECT 1 FROM ip_whitelist
        WHERE organization_id = p_organization_id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            -- Exact IP match
            (NOT is_range AND ip_address = p_ip_address::TEXT)
            OR
            -- CIDR range match
            (NOT is_range AND p_ip_address << ip_address::INET)
            OR
            -- IP range match
            (is_range AND p_ip_address >= ip_range_start AND p_ip_address <= ip_range_end)
        )
    ) INTO v_is_whitelisted;
    
    RETURN v_is_whitelisted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_ip_whitelist IS 'Check if an IP address is whitelisted for an organization';

-- Function to check geo-restrictions
CREATE OR REPLACE FUNCTION check_geo_restriction(
    p_organization_id UUID,
    p_country_code TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_restriction geo_restrictions;
BEGIN
    -- Get the restriction rule for this country
    SELECT * INTO v_restriction
    FROM geo_restrictions
    WHERE organization_id = p_organization_id
    AND country_code = p_country_code
    AND is_active = true
    LIMIT 1;
    
    IF v_restriction IS NULL THEN
        -- No specific rule for this country
        -- Check if there are any allow rules
        IF EXISTS (
            SELECT 1 FROM geo_restrictions
            WHERE organization_id = p_organization_id
            AND restriction_type = 'allow'
            AND is_active = true
        ) THEN
            -- There are allow rules, but this country is not in them = blocked
            v_result := jsonb_build_object(
                'allowed', false,
                'reason', 'Country not in allowed list'
            );
        ELSE
            -- No allow rules, so allow by default
            v_result := jsonb_build_object(
                'allowed', true,
                'reason', 'No geo-restrictions configured'
            );
        END IF;
    ELSE
        -- There is a specific rule for this country
        IF v_restriction.restriction_type = 'allow' THEN
            v_result := jsonb_build_object(
                'allowed', true,
                'reason', 'Country explicitly allowed'
            );
        ELSE
            v_result := jsonb_build_object(
                'allowed', false,
                'reason', 'Country explicitly blocked'
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_geo_restriction IS 'Check if access from a country is allowed for an organization';

-- Function to log IP access
CREATE OR REPLACE FUNCTION log_ip_access(
    p_organization_id UUID,
    p_user_id UUID,
    p_ip_address INET,
    p_country_code TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_is_whitelisted BOOLEAN DEFAULT false,
    p_is_blocked BOOLEAN DEFAULT false,
    p_block_reason TEXT DEFAULT NULL,
    p_endpoint TEXT DEFAULT NULL,
    p_request_method TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO ip_access_log (
        organization_id,
        user_id,
        ip_address,
        country_code,
        city,
        is_whitelisted,
        is_blocked,
        block_reason,
        endpoint,
        request_method,
        user_agent
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_ip_address,
        p_country_code,
        p_city,
        p_is_whitelisted,
        p_is_blocked,
        p_block_reason,
        p_endpoint,
        p_request_method,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_ip_access IS 'Log an IP access attempt with geo and whitelist information';

-- Function to get IP access statistics
CREATE OR REPLACE FUNCTION get_ip_access_stats(
    p_organization_id UUID,
    p_days INT DEFAULT 7
) RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'blocked_requests', COUNT(*) FILTER (WHERE is_blocked = true),
        'whitelisted_requests', COUNT(*) FILTER (WHERE is_whitelisted = true),
        'unique_ips', COUNT(DISTINCT ip_address),
        'top_countries', (
            SELECT jsonb_agg(country_stats)
            FROM (
                SELECT jsonb_build_object(
                    'country_code', country_code,
                    'count', COUNT(*)
                ) as country_stats
                FROM ip_access_log
                WHERE organization_id = p_organization_id
                AND access_time > NOW() - (p_days || ' days')::INTERVAL
                AND country_code IS NOT NULL
                GROUP BY country_code
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) t
        ),
        'top_blocked_ips', (
            SELECT jsonb_agg(ip_stats)
            FROM (
                SELECT jsonb_build_object(
                    'ip_address', ip_address::TEXT,
                    'count', COUNT(*),
                    'reasons', array_agg(DISTINCT block_reason)
                ) as ip_stats
                FROM ip_access_log
                WHERE organization_id = p_organization_id
                AND access_time > NOW() - (p_days || ' days')::INTERVAL
                AND is_blocked = true
                GROUP BY ip_address
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) t
        )
    ) INTO v_stats
    FROM ip_access_log
    WHERE organization_id = p_organization_id
    AND access_time > NOW() - (p_days || ' days')::INTERVAL;
    
    RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_ip_access_stats IS 'Get IP access statistics for an organization';

-- ============================================================================
-- AUTOMATIC CLEANUP (Optional - for data retention)
-- ============================================================================

-- Function to clean up old IP access logs
CREATE OR REPLACE FUNCTION cleanup_old_ip_access_logs(
    p_retention_days INT DEFAULT 90
) RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM ip_access_log
    WHERE access_time < NOW() - (p_retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_ip_access_logs IS 'Delete IP access logs older than specified retention period';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Note: Access control is managed entirely through Row Level Security (RLS) policies.
-- No GRANT statements to system roles (authenticated, service_role) are needed or recommended.
-- All permissions are enforced via RLS policies with TO public and custom profile.role checks.
