-- ============================================================================
-- Phase 3 - M02: Enhanced Audit Logging with Search & Filtering
-- ============================================================================
-- This migration creates an enhanced audit logging system with full-text
-- search, filtering, and comprehensive event tracking.
--
-- Features:
-- - Comprehensive event tracking (user actions, system events, security events)
-- - Full-text search on event descriptions and metadata
-- - Advanced filtering by user, event type, severity, date range
-- - IP address and user agent tracking
-- - JSON metadata for flexible event data
-- - Export functionality support
-- - Data retention policies
-- ============================================================================

-- Create enum for event severity levels
DO $$ BEGIN
    CREATE TYPE audit_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL', 'SECURITY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enhanced audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- e.g., 'user.login', 'contact.created', 'workflow.executed'
    event_category TEXT NOT NULL, -- e.g., 'authentication', 'data_management', 'workflow'
    severity audit_severity DEFAULT 'INFO',
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    resource_type TEXT, -- e.g., 'contact', 'workflow', 'user'
    resource_id TEXT, -- ID of the affected resource
    ip_address INET,
    user_agent TEXT,
    request_id TEXT, -- For correlating related events
    session_id TEXT,
    duration_ms INTEGER, -- Operation duration in milliseconds
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search vector for full-text search
    search_vector tsvector
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success) WHERE success = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_audit_logs_search ON audit_logs USING GIN(search_vector);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN(details);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Create audit_log_exports table for tracking export requests
CREATE TABLE IF NOT EXISTS audit_log_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filters JSONB DEFAULT '{}'::jsonb,
    format TEXT DEFAULT 'csv', -- 'csv', 'json', 'pdf'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_url TEXT,
    row_count INTEGER,
    file_size_bytes BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_log_exports_org ON audit_log_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_user ON audit_log_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_status ON audit_log_exports(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_created ON audit_log_exports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON audit_logs;CREATE POLICY "Users can view audit logs for their organization" ON audit_logs
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only system can insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only superadmins can delete audit logs (for GDPR compliance)
DROP POLICY IF EXISTS "Superadmins can delete audit logs" ON audit_logs;CREATE POLICY "Superadmins can delete audit logs" ON audit_logs
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- RLS Policies for audit_log_exports
DROP POLICY IF EXISTS "Users can view their own exports" ON audit_log_exports;CREATE POLICY "Users can view their own exports" ON audit_log_exports
    FOR SELECT
    TO public
    USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

DROP POLICY IF EXISTS "Users can create exports for their organization" ON audit_log_exports;

CREATE POLICY "Users can create exports for their organization" ON audit_log_exports
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update their own exports" ON audit_log_exports;

CREATE POLICY "Users can update their own exports" ON audit_log_exports
    FOR UPDATE
    TO public
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_audit_log_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.event_type, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.event_category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.details::text, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain search vector
CREATE TRIGGER audit_log_search_vector_update
    BEFORE INSERT OR UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_log_search_vector();

-- Function to search audit logs with filters
CREATE OR REPLACE FUNCTION search_audit_logs(
    p_organization_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_event_types TEXT[] DEFAULT NULL,
    p_event_categories TEXT[] DEFAULT NULL,
    p_severities audit_severity[] DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_success BOOLEAN DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    organization_id UUID,
    user_id UUID,
    event_type TEXT,
    event_category TEXT,
    severity audit_severity,
    description TEXT,
    details JSONB,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    created_at TIMESTAMPTZ,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.organization_id,
        al.user_id,
        al.event_type,
        al.event_category,
        al.severity,
        al.description,
        al.details,
        al.resource_type,
        al.resource_id,
        al.ip_address,
        al.user_agent,
        al.success,
        al.created_at,
        CASE 
            WHEN p_search_query IS NOT NULL THEN
                ts_rank(al.search_vector, plainto_tsquery('english', p_search_query))
            ELSE
                0
        END as relevance
    FROM audit_logs al
    WHERE al.organization_id = p_organization_id
        AND (p_search_query IS NULL OR al.search_vector @@ plainto_tsquery('english', p_search_query))
        AND (p_user_id IS NULL OR al.user_id = p_user_id)
        AND (p_event_types IS NULL OR al.event_type = ANY(p_event_types))
        AND (p_event_categories IS NULL OR al.event_category = ANY(p_event_categories))
        AND (p_severities IS NULL OR al.severity = ANY(p_severities))
        AND (p_start_date IS NULL OR al.created_at >= p_start_date)
        AND (p_end_date IS NULL OR al.created_at <= p_end_date)
        AND (p_success IS NULL OR al.success = p_success)
        AND (p_resource_type IS NULL OR al.resource_type = p_resource_type)
    ORDER BY 
        CASE WHEN p_search_query IS NOT NULL THEN relevance ELSE 0 END DESC,
        al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_log_stats(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    total_events BIGINT,
    events_by_severity JSONB,
    events_by_category JSONB,
    events_by_user JSONB,
    success_rate NUMERIC,
    avg_duration_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_events,
        jsonb_object_agg(
            COALESCE(al.severity::text, 'UNKNOWN'),
            count
        ) as events_by_severity,
        jsonb_object_agg(
            COALESCE(al.event_category, 'UNKNOWN'),
            count
        ) as events_by_category,
        jsonb_object_agg(
            COALESCE(p.email, 'system'),
            count
        ) as events_by_user,
        ROUND((SUM(CASE WHEN al.success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate,
        ROUND(AVG(al.duration_ms), 2) as avg_duration_ms
    FROM audit_logs al
    LEFT JOIN auth.users u ON u.id = al.user_id
    LEFT JOIN profiles p ON p.id = al.user_id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM audit_logs al2
        WHERE al2.organization_id = al.organization_id
            AND al2.severity = al.severity
            AND (p_start_date IS NULL OR al2.created_at >= p_start_date)
            AND (p_end_date IS NULL OR al2.created_at <= p_end_date)
    ) severity_counts ON TRUE
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM audit_logs al3
        WHERE al3.organization_id = al.organization_id
            AND al3.event_category = al.event_category
            AND (p_start_date IS NULL OR al3.created_at >= p_start_date)
            AND (p_end_date IS NULL OR al3.created_at <= p_end_date)
    ) category_counts ON TRUE
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM audit_logs al4
        WHERE al4.organization_id = al.organization_id
            AND al4.user_id = al.user_id
            AND (p_start_date IS NULL OR al4.created_at >= p_start_date)
            AND (p_end_date IS NULL OR al4.created_at <= p_end_date)
    ) user_counts ON TRUE
    WHERE al.organization_id = p_organization_id
        AND (p_start_date IS NULL OR al.created_at >= p_start_date)
        AND (p_end_date IS NULL OR al.created_at <= p_end_date)
    GROUP BY al.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs (retention: 90 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
        AND severity NOT IN ('CRITICAL', 'SECURITY'); -- Keep critical and security logs longer
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Helper function to log an audit event
CREATE OR REPLACE FUNCTION log_audit_event(
    p_organization_id UUID,
    p_user_id UUID,
    p_event_type TEXT,
    p_event_category TEXT,
    p_description TEXT,
    p_severity audit_severity DEFAULT 'INFO',
    p_details JSONB DEFAULT '{}'::jsonb,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        event_type,
        event_category,
        severity,
        description,
        details,
        resource_type,
        resource_id,
        success,
        duration_ms
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_event_type,
        p_event_category,
        p_severity,
        p_description,
        p_details,
        p_resource_type,
        p_resource_id,
        p_success,
        p_duration_ms
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample event categories for documentation
COMMENT ON TABLE audit_logs IS 'Enhanced audit logging with full-text search and filtering';
COMMENT ON COLUMN audit_logs.event_type IS 'Specific event type (e.g., user.login, contact.created)';
COMMENT ON COLUMN audit_logs.event_category IS 'Event category (e.g., authentication, data_management, workflow)';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity level (INFO, WARNING, ERROR, CRITICAL, SECURITY)';
COMMENT ON COLUMN audit_logs.search_vector IS 'Full-text search vector (automatically maintained)';
COMMENT ON FUNCTION search_audit_logs IS 'Advanced search with full-text and filters';
COMMENT ON FUNCTION get_audit_log_stats IS 'Get aggregated statistics for audit logs';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Clean up audit logs older than specified days';
COMMENT ON FUNCTION log_audit_event IS 'Helper function to create audit log entries';
