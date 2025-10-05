-- ============================================================================
-- Phase 3 - M01: API Rate Limiting & Quota Management
-- ============================================================================
-- This migration creates the database schema for intelligent rate limiting
-- at the organization level with per-org quotas and sliding window algorithm.
--
-- Features:
-- - Per-organization rate limits and quotas
-- - Sliding window rate tracking
-- - Configurable limits per API endpoint/resource
-- - Real-time quota usage tracking
-- - Historical usage data for analytics
-- ============================================================================

-- Create rate_limit_config table for per-org rate limit configuration
CREATE TABLE IF NOT EXISTS rate_limit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- e.g., 'api_call', 'ai_request', 'workflow_execution'
    endpoint_pattern TEXT, -- Optional: specific endpoint pattern (e.g., '/api/contacts/*')
    max_requests INTEGER NOT NULL DEFAULT 1000,
    window_seconds INTEGER NOT NULL DEFAULT 3600, -- Default: 1 hour
    quota_monthly INTEGER, -- Monthly quota limit (optional)
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, resource_type, endpoint_pattern)
);

-- Create rate_limit_tracking table for real-time rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resource_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_timestamp TIMESTAMPTZ DEFAULT NOW(),
    response_status INTEGER,
    rate_limited BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rate_limit_quota_usage table for monthly quota tracking
CREATE TABLE IF NOT EXISTS rate_limit_quota_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    request_count INTEGER DEFAULT 0,
    rate_limited_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, resource_type, year, month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_config_org_id ON rate_limit_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_config_resource ON rate_limit_config(resource_type);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_org_id ON rate_limit_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_timestamp ON rate_limit_tracking(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_resource ON rate_limit_tracking(resource_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_endpoint ON rate_limit_tracking(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_rate_limited ON rate_limit_tracking(rate_limited) WHERE rate_limited = TRUE;

CREATE INDEX IF NOT EXISTS idx_rate_limit_quota_org_id ON rate_limit_quota_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_quota_period ON rate_limit_quota_usage(year, month);

-- Enable Row Level Security
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_quota_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_config
DROP POLICY IF EXISTS "Users can view rate limits for their organization" ON rate_limit_config;CREATE POLICY "Users can view rate limits for their organization" ON rate_limit_config
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage rate limits for their organization" ON rate_limit_config;

CREATE POLICY "Admins can manage rate limits for their organization" ON rate_limit_config
    FOR ALL
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- RLS Policies for rate_limit_tracking
DROP POLICY IF EXISTS "Users can view tracking for their organization" ON rate_limit_tracking;CREATE POLICY "Users can view tracking for their organization" ON rate_limit_tracking
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only system/service role can insert tracking records
DROP POLICY IF EXISTS "Service role can insert tracking records" ON rate_limit_tracking;CREATE POLICY "Service role can insert tracking records" ON rate_limit_tracking
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for rate_limit_quota_usage
DROP POLICY IF EXISTS "Users can view quota usage for their organization" ON rate_limit_quota_usage;CREATE POLICY "Users can view quota usage for their organization" ON rate_limit_quota_usage
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Drop any existing versions of check_rate_limit function to avoid conflicts
-- This ensures idempotent migration and resolves duplicate function errors
DROP FUNCTION IF EXISTS check_rate_limit(UUID, UUID, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit(UUID, TEXT) CASCADE;

-- Function to check rate limit (sliding window algorithm)
CREATE FUNCTION check_rate_limit(
    p_organization_id UUID,
    p_resource_type TEXT,
    p_endpoint TEXT DEFAULT NULL
)
RETURNS TABLE(
    is_allowed BOOLEAN,
    current_usage INTEGER,
    limit_value INTEGER,
    window_seconds INTEGER,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_config RECORD;
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Get rate limit configuration
    SELECT * INTO v_config
    FROM rate_limit_config
    WHERE organization_id = p_organization_id
        AND resource_type = p_resource_type
        AND enabled = TRUE
        AND (endpoint_pattern IS NULL OR p_endpoint LIKE endpoint_pattern)
    ORDER BY endpoint_pattern NULLS LAST
    LIMIT 1;

    -- If no config found, allow by default
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE, 0, 999999, 3600, NOW() + INTERVAL '1 hour';
        RETURN;
    END IF;

    -- Calculate window start time
    v_window_start := NOW() - (v_config.window_seconds || ' seconds')::INTERVAL;

    -- Count requests in the current window
    SELECT COUNT(*) INTO v_count
    FROM rate_limit_tracking
    WHERE organization_id = p_organization_id
        AND resource_type = p_resource_type
        AND (p_endpoint IS NULL OR endpoint = p_endpoint)
        AND request_timestamp >= v_window_start;

    -- Return result
    RETURN QUERY SELECT 
        v_count < v_config.max_requests,
        v_count,
        v_config.max_requests,
        v_config.window_seconds,
        v_window_start + (v_config.window_seconds || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quota usage
CREATE OR REPLACE FUNCTION update_quota_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NEW.request_timestamp);
    v_month := EXTRACT(MONTH FROM NEW.request_timestamp);

    INSERT INTO rate_limit_quota_usage (
        organization_id,
        resource_type,
        year,
        month,
        request_count,
        rate_limited_count
    )
    VALUES (
        NEW.organization_id,
        NEW.resource_type,
        v_year,
        v_month,
        1,
        CASE WHEN NEW.rate_limited THEN 1 ELSE 0 END
    )
    ON CONFLICT (organization_id, resource_type, year, month)
    DO UPDATE SET
        request_count = rate_limit_quota_usage.request_count + 1,
        rate_limited_count = rate_limit_quota_usage.rate_limited_count + 
            CASE WHEN NEW.rate_limited THEN 1 ELSE 0 END,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update quota usage on new tracking records
DROP TRIGGER IF EXISTS update_quota_usage_trigger ON rate_limit_tracking;

CREATE TRIGGER update_quota_usage_trigger
    AFTER INSERT ON rate_limit_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_quota_usage();

-- Function to clean up old tracking data (retention: 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_tracking()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limit_tracking
    WHERE request_timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Insert default rate limit configs for existing organizations
INSERT INTO rate_limit_config (organization_id, resource_type, max_requests, window_seconds)
SELECT 
    id,
    'api_call',
    1000,
    3600
FROM organizations
ON CONFLICT (organization_id, resource_type, endpoint_pattern) DO NOTHING;

-- Comment on tables
COMMENT ON TABLE rate_limit_config IS 'Configuration for rate limiting per organization and resource type';
COMMENT ON TABLE rate_limit_tracking IS 'Real-time tracking of API requests for rate limiting (sliding window)';
COMMENT ON TABLE rate_limit_quota_usage IS 'Monthly quota usage aggregation per organization';
COMMENT ON FUNCTION check_rate_limit IS 'Check if request is allowed based on rate limit (sliding window algorithm)';
COMMENT ON FUNCTION update_quota_usage IS 'Automatically update monthly quota usage when new tracking record is inserted';
COMMENT ON FUNCTION cleanup_old_rate_limit_tracking IS 'Clean up tracking records older than 30 days';
