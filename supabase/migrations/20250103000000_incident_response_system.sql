-- =====================================================
-- Incident Response & Notification System
-- Phase 2: Enterprise Core & Security Upgrade (P0)
-- =====================================================

-- =====================================================
-- 1. Incident Types Enum
-- =====================================================
DO $$ BEGIN
    CREATE TYPE incident_type AS ENUM (
        'api_down',
        'high_error_rate',
        'security_breach',
        'data_anomaly',
        'performance_degradation',
        'quota_exceeded',
        'authentication_failure',
        'database_connection',
        'external_service_failure',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'open',
        'investigating',
        'identified',
        'monitoring',
        'resolved',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM (
        'email',
        'slack',
        'telegram',
        'webhook',
        'in_app'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. Incidents Table
-- =====================================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type incident_type NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'open',
    title TEXT NOT NULL,
    description TEXT,
    affected_service TEXT, -- API endpoint, service name, etc.
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    error_details JSONB,
    stack_trace TEXT,
    auto_created BOOLEAN DEFAULT true,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_organization ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_open ON incidents(status) WHERE status IN ('open', 'investigating');

-- =====================================================
-- 3. Incident Actions/Timeline Table
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_actions (
    id BIGSERIAL PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'notification_sent', 'escalated', 'assigned', 'status_changed', 'comment_added', 'rollback_triggered'
    actor_id UUID REFERENCES auth.users(id),
    actor_type TEXT DEFAULT 'system', -- 'system', 'user', 'automation'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_actions_incident ON incident_actions(incident_id, created_at DESC);

-- =====================================================
-- 4. Notification Rules Table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_conditions JSONB NOT NULL, -- { "incident_types": [], "severities": [], "affected_services": [] }
    notification_channels notification_channel[] NOT NULL,
    recipients JSONB NOT NULL, -- { "emails": [], "slack_channels": [], "telegram_chats": [], "webhooks": [] }
    delay_seconds INTEGER DEFAULT 0, -- Delay before sending notification
    cooldown_minutes INTEGER DEFAULT 60, -- Don't repeat for same incident type
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_rules_org ON notification_rules(organization_id);

-- =====================================================
-- 5. Notification Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES notification_rules(id),
    channel notification_channel NOT NULL,
    recipient TEXT NOT NULL, -- email address, slack channel, etc.
    status TEXT NOT NULL, -- 'pending', 'sent', 'failed', 'delivered'
    message_content TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_incident ON notification_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status, created_at DESC);

-- =====================================================
-- 6. Escalation Rules Table
-- =====================================================
CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_after_minutes INTEGER NOT NULL DEFAULT 30, -- Escalate if not resolved within X minutes
    incident_types incident_type[],
    min_severity incident_severity NOT NULL,
    escalate_to UUID[] NOT NULL, -- Array of user IDs to escalate to
    auto_assign BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_rules_active ON escalation_rules(is_active);

-- =====================================================
-- 7. Rollback Procedures Table
-- =====================================================
CREATE TABLE IF NOT EXISTS rollback_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_conditions JSONB NOT NULL, -- When to trigger rollback
    procedure_type TEXT NOT NULL, -- 'database_restore', 'config_revert', 'service_restart', 'custom_script'
    procedure_config JSONB NOT NULL, -- Configuration for the rollback
    auto_execute BOOLEAN DEFAULT false, -- Execute automatically or wait for approval
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rollback_procedures_active ON rollback_procedures(is_active);

-- =====================================================
-- 8. Rollback Execution Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS rollback_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    procedure_id UUID REFERENCES rollback_procedures(id),
    executed_by UUID REFERENCES auth.users(id),
    execution_type TEXT NOT NULL, -- 'automatic', 'manual'
    status TEXT NOT NULL, -- 'pending', 'executing', 'success', 'failed', 'rolled_back'
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rollback_executions_incident ON rollback_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_rollback_executions_status ON rollback_executions(status, started_at DESC);

-- =====================================================
-- 9. Enable Row Level Security
-- =====================================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollback_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollback_executions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS Policies
-- =====================================================

-- Super admins can see all incidents
DROP POLICY IF EXISTS "Super admins can view all incidents" ON incidents;CREATE POLICY "Super admins can view all incidents" ON incidents
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Super admins can manage all incidents" ON incidents;

CREATE POLICY "Super admins can manage all incidents" ON incidents
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Users can see incidents for their organization
DROP POLICY IF EXISTS "Users can view organization incidents" ON incidents;CREATE POLICY "Users can view organization incidents" ON incidents
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- Incident actions policies
DROP POLICY IF EXISTS "Super admins can view all incident actions" ON incident_actions;CREATE POLICY "Super admins can view all incident actions" ON incident_actions
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "System can insert incident actions" ON incident_actions;

CREATE POLICY "System can insert incident actions" ON incident_actions
    FOR INSERT
    TO public
    WITH CHECK (
        incident_id IN (
            SELECT id FROM incidents
            WHERE organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Notification rules policies
DROP POLICY IF EXISTS "Super admins can manage notification rules" ON notification_rules;CREATE POLICY "Super admins can manage notification rules" ON notification_rules
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Notification logs policies
DROP POLICY IF EXISTS "Super admins can view notification logs" ON notification_logs;CREATE POLICY "Super admins can view notification logs" ON notification_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Escalation rules policies
DROP POLICY IF EXISTS "Super admins can manage escalation rules" ON escalation_rules;CREATE POLICY "Super admins can manage escalation rules" ON escalation_rules
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Rollback procedures policies
DROP POLICY IF EXISTS "Super admins can manage rollback procedures" ON rollback_procedures;CREATE POLICY "Super admins can manage rollback procedures" ON rollback_procedures
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Rollback executions policies
DROP POLICY IF EXISTS "Super admins can view rollback executions" ON rollback_executions;CREATE POLICY "Super admins can view rollback executions" ON rollback_executions
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 11. Helper Functions
-- =====================================================

-- Function to create an incident
CREATE OR REPLACE FUNCTION create_incident(
    p_incident_type incident_type,
    p_severity incident_severity,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_affected_service TEXT DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_incident_id UUID;
BEGIN
    INSERT INTO incidents (
        incident_type,
        severity,
        title,
        description,
        affected_service,
        organization_id,
        metadata,
        status
    ) VALUES (
        p_incident_type,
        p_severity,
        p_title,
        p_description,
        p_affected_service,
        p_organization_id,
        p_metadata,
        'open'
    ) RETURNING id INTO v_incident_id;
    
    -- Log the creation
    INSERT INTO incident_actions (
        incident_id,
        action_type,
        actor_type,
        description,
        metadata
    ) VALUES (
        v_incident_id,
        'incident_created',
        'system',
        'Incident created automatically',
        jsonb_build_object('auto_created', true)
    );
    
    RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log incident action
CREATE OR REPLACE FUNCTION log_incident_action(
    p_incident_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO incident_actions (
        incident_id,
        action_type,
        actor_id,
        actor_type,
        description,
        metadata
    ) VALUES (
        p_incident_id,
        p_action_type,
        p_actor_id,
        CASE WHEN p_actor_id IS NULL THEN 'system' ELSE 'user' END,
        p_description,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if incident should be escalated
CREATE OR REPLACE FUNCTION check_incident_escalation(
    p_incident_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_incident RECORD;
    v_rule RECORD;
    v_time_open INTEGER;
BEGIN
    -- Get incident details
    SELECT * INTO v_incident
    FROM incidents
    WHERE id = p_incident_id
    AND status NOT IN ('resolved', 'closed');
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Calculate minutes since detection
    v_time_open := EXTRACT(EPOCH FROM (NOW() - v_incident.detected_at)) / 60;
    
    -- Check escalation rules
    FOR v_rule IN
        SELECT *
        FROM escalation_rules
        WHERE is_active = true
        AND trigger_after_minutes <= v_time_open
        AND (
            incident_types IS NULL
            OR v_incident.incident_type = ANY(incident_types)
        )
        AND v_incident.severity::text >= min_severity::text
    LOOP
        -- Log escalation
        PERFORM log_incident_action(
            p_incident_id,
            'escalated',
            'Incident escalated per rule: ' || v_rule.name,
            NULL,
            jsonb_build_object('rule_id', v_rule.id, 'escalate_to', v_rule.escalate_to)
        );
        
        RETURN true;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update incident status
CREATE OR REPLACE FUNCTION update_incident_status(
    p_incident_id UUID,
    p_new_status incident_status,
    p_actor_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_old_status incident_status;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status
    FROM incidents
    WHERE id = p_incident_id;
    
    -- Update status
    UPDATE incidents
    SET status = p_new_status,
        resolved_at = CASE WHEN p_new_status IN ('resolved', 'closed') THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_incident_id;
    
    -- Log status change
    PERFORM log_incident_action(
        p_incident_id,
        'status_changed',
        'Status changed from ' || v_old_status::text || ' to ' || p_new_status::text || 
        CASE WHEN p_notes IS NOT NULL THEN ': ' || p_notes ELSE '' END,
        p_actor_id,
        jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. Triggers
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON notification_rules;
DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON notification_rules;

CREATE TRIGGER update_notification_rules_updated_at
    BEFORE UPDATE ON notification_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_escalation_rules_updated_at ON escalation_rules;
DROP TRIGGER IF EXISTS update_escalation_rules_updated_at ON escalation_rules;

CREATE TRIGGER update_escalation_rules_updated_at
    BEFORE UPDATE ON escalation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_rollback_procedures_updated_at ON rollback_procedures;
DROP TRIGGER IF EXISTS update_rollback_procedures_updated_at ON rollback_procedures;

CREATE TRIGGER update_rollback_procedures_updated_at
    BEFORE UPDATE ON rollback_procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

-- =====================================================
-- 13. Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION create_incident TO public;
GRANT EXECUTE ON FUNCTION log_incident_action TO public;
GRANT EXECUTE ON FUNCTION check_incident_escalation TO public;
GRANT EXECUTE ON FUNCTION update_incident_status TO public;

-- =====================================================
-- 14. Insert Default Notification Rules
-- =====================================================
INSERT INTO notification_rules (name, description, trigger_conditions, notification_channels, recipients) VALUES
(
    'Critical Incidents',
    'Immediate notification for critical incidents',
    '{"severities": ["critical"], "incident_types": ["api_down", "security_breach", "database_connection"]}',
    ARRAY['email', 'slack']::notification_channel[],
    '{"emails": ["admin@example.com"], "slack_channels": ["#incidents-critical"]}'
),
(
    'High Priority Incidents',
    'Notification for high priority incidents',
    '{"severities": ["high"], "incident_types": ["high_error_rate", "performance_degradation"]}',
    ARRAY['email', 'slack']::notification_channel[],
    '{"emails": ["admin@example.com"], "slack_channels": ["#incidents"]}'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. Comments for documentation
-- =====================================================
COMMENT ON TABLE incidents IS 'Main incidents tracking table';
COMMENT ON TABLE incident_actions IS 'Timeline of actions taken on incidents';
COMMENT ON TABLE notification_rules IS 'Rules for when and how to send notifications';
COMMENT ON TABLE notification_logs IS 'Log of all notifications sent';
COMMENT ON TABLE escalation_rules IS 'Rules for escalating unresolved incidents';
COMMENT ON TABLE rollback_procedures IS 'Automated rollback procedures';
COMMENT ON TABLE rollback_executions IS 'Log of rollback executions';
COMMENT ON FUNCTION create_incident IS 'Create a new incident and log the creation';
COMMENT ON FUNCTION log_incident_action IS 'Log an action on an incident';
COMMENT ON FUNCTION check_incident_escalation IS 'Check if incident should be escalated';
COMMENT ON FUNCTION update_incident_status IS 'Update incident status and log the change';
