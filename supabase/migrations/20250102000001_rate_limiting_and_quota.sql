-- =====================================================
-- Rate Limiting & Quota Management Schema
-- Phase 1: Foundation + Quick Win Enterprise
-- =====================================================

-- =====================================================
-- 1. API Rate Limiting Table
-- =====================================================
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_duration_minutes INTEGER NOT NULL DEFAULT 60,
    window_end TIMESTAMPTZ GENERATED ALWAYS AS (window_start + (window_duration_minutes || ' minutes')::INTERVAL) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_org_endpoint ON api_rate_limits(organization_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON api_rate_limits(window_start);

-- =====================================================
-- 2. Quota Policies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS quota_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name TEXT NOT NULL UNIQUE,
    description TEXT,
    endpoint_pattern TEXT NOT NULL,
    max_requests_per_hour INTEGER NOT NULL DEFAULT 1000,
    max_requests_per_day INTEGER NOT NULL DEFAULT 10000,
    max_requests_per_month INTEGER NOT NULL DEFAULT 100000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applies_to_role TEXT, -- null means all roles, or specify 'user', 'super_admin', etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default policies for different endpoint types
INSERT INTO quota_policies (policy_name, description, endpoint_pattern, max_requests_per_hour, max_requests_per_day, max_requests_per_month, applies_to_role)
VALUES 
    ('ai_generation_default', 'AI content generation endpoints', '/generate-%', 100, 1000, 10000, 'user'),
    ('calendar_operations', 'Calendar CRUD operations', '/%-google-event', 200, 2000, 20000, 'user'),
    ('email_sending', 'Email sending operations', '/send-email%', 50, 500, 5000, 'user'),
    ('superadmin_operations', 'Super admin operations', '/superadmin-%', 500, 5000, 50000, 'super_admin'),
    ('public_api_default', 'Default policy for public APIs', '/%', 1000, 10000, 100000, null)
ON CONFLICT (policy_name) DO NOTHING;

-- =====================================================
-- 3. Organization Quota Override Table
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_quota_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES quota_policies(id) ON DELETE CASCADE,
    max_requests_per_hour INTEGER,
    max_requests_per_day INTEGER,
    max_requests_per_month INTEGER,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(organization_id, policy_id)
);

-- =====================================================
-- 4. Quota Alerts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS quota_alerts (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'warning', 'critical', 'exceeded'
    policy_name TEXT NOT NULL,
    current_usage INTEGER NOT NULL,
    limit_value INTEGER NOT NULL,
    percentage_used NUMERIC(5,2),
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_alerts_org ON quota_alerts(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quota_alerts_unacknowledged ON quota_alerts(is_acknowledged, created_at DESC) WHERE is_acknowledged = false;

-- =====================================================
-- 5. API Usage Statistics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS api_usage_statistics (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL, -- GET, POST, etc.
    status_code INTEGER,
    response_time_ms INTEGER,
    was_rate_limited BOOLEAN NOT NULL DEFAULT false,
    was_quota_exceeded BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_org_date ON api_usage_statistics(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_statistics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_rate_limited ON api_usage_statistics(was_rate_limited, created_at DESC) WHERE was_rate_limited = true;

-- Partition by month for performance (optional, can be enabled later)
-- CREATE INDEX IF NOT EXISTS idx_api_usage_created_month ON api_usage_statistics(date_trunc('month', created_at));

-- =====================================================
-- 6. Enable Row Level Security
-- =====================================================
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_quota_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_statistics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- api_rate_limits: Only super admins can view
CREATE POLICY "Super admins can view all rate limits" ON api_rate_limits
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- quota_policies: Super admins full access, users can read
CREATE POLICY "Super admins full access to quota policies" ON quota_policies
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Users can view quota policies" ON quota_policies
    FOR SELECT
    TO public
    USING (is_active = true);

-- organization_quota_overrides: Super admins only
CREATE POLICY "Super admins can manage quota overrides" ON organization_quota_overrides
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- quota_alerts: Users see their org's alerts, super admins see all
CREATE POLICY "Users can view their organization quota alerts" ON quota_alerts
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE profiles.id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can manage all quota alerts" ON quota_alerts
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- api_usage_statistics: Users see their org's stats, super admins see all
CREATE POLICY "Users can view their organization api stats" ON api_usage_statistics
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE profiles.id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 8. Helper Functions
-- =====================================================

-- Function to check if rate limit is exceeded
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_organization_id UUID,
    p_user_id UUID,
    p_endpoint TEXT,
    p_max_requests INTEGER,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    SELECT COALESCE(SUM(request_count), 0)
    INTO v_current_count
    FROM api_rate_limits
    WHERE organization_id = p_organization_id
    AND (user_id = p_user_id OR user_id IS NULL)
    AND endpoint = p_endpoint
    AND window_start > v_window_start;
    
    RETURN v_current_count >= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record API usage
CREATE OR REPLACE FUNCTION record_api_usage(
    p_organization_id UUID,
    p_user_id UUID,
    p_endpoint TEXT,
    p_method TEXT DEFAULT 'POST',
    p_status_code INTEGER DEFAULT 200,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_was_rate_limited BOOLEAN DEFAULT false,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO api_usage_statistics (
        organization_id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        was_rate_limited,
        error_message
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_endpoint,
        p_method,
        p_status_code,
        p_response_time_ms,
        p_was_rate_limited,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quota usage for organization
CREATE OR REPLACE FUNCTION get_quota_usage(
    p_organization_id UUID,
    p_period TEXT DEFAULT 'hour' -- 'hour', 'day', 'month'
) RETURNS TABLE(
    endpoint TEXT,
    request_count BIGINT,
    unique_users BIGINT,
    avg_response_time NUMERIC,
    error_rate NUMERIC
) AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    v_interval := CASE p_period
        WHEN 'hour' THEN '1 hour'::INTERVAL
        WHEN 'day' THEN '1 day'::INTERVAL
        WHEN 'month' THEN '1 month'::INTERVAL
        ELSE '1 hour'::INTERVAL
    END;
    
    RETURN QUERY
    SELECT 
        aus.endpoint,
        COUNT(*)::BIGINT as request_count,
        COUNT(DISTINCT aus.user_id)::BIGINT as unique_users,
        ROUND(AVG(aus.response_time_ms)::NUMERIC, 2) as avg_response_time,
        ROUND((COUNT(*) FILTER (WHERE aus.status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as error_rate
    FROM api_usage_statistics aus
    WHERE aus.organization_id = p_organization_id
    AND aus.created_at > NOW() - v_interval
    GROUP BY aus.endpoint
    ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Cleanup job function (to be called periodically)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_data() RETURNS void AS $$
BEGIN
    -- Delete rate limit records older than 7 days
    DELETE FROM api_rate_limits
    WHERE window_start < NOW() - INTERVAL '7 days';
    
    -- Delete old usage statistics (keep 90 days)
    DELETE FROM api_usage_statistics
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete acknowledged alerts older than 30 days
    DELETE FROM quota_alerts
    WHERE is_acknowledged = true
    AND acknowledged_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, UUID, TEXT, INTEGER, INTEGER) TO public;
GRANT EXECUTE ON FUNCTION record_api_usage(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) TO public;
GRANT EXECUTE ON FUNCTION get_quota_usage(UUID, TEXT) TO public;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limit_data() TO public;

-- =====================================================
-- 11. Comments for documentation
-- =====================================================
COMMENT ON TABLE api_rate_limits IS 'Tracks API request counts per organization/user/endpoint for rate limiting';
COMMENT ON TABLE quota_policies IS 'Defines quota policies for different API endpoints';
COMMENT ON TABLE organization_quota_overrides IS 'Custom quota overrides for specific organizations';
COMMENT ON TABLE quota_alerts IS 'Alerts triggered when quota thresholds are reached';
COMMENT ON TABLE api_usage_statistics IS 'Detailed API usage statistics for analytics and monitoring';
COMMENT ON FUNCTION check_rate_limit IS 'Check if rate limit is exceeded for given parameters';
COMMENT ON FUNCTION record_api_usage IS 'Record API usage for analytics and rate limiting';
COMMENT ON FUNCTION get_quota_usage IS 'Get aggregated quota usage statistics for an organization';
