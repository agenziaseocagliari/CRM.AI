-- =====================================================
-- Enhanced Workflow Orchestration System
-- Phase 2: Enterprise Core & Security Upgrade (P0)
-- =====================================================

-- =====================================================
-- 1. Workflow Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'customer_engagement', 'lead_management', 'support', 'marketing', 'custom'
    icon TEXT,
    template_json JSONB NOT NULL, -- Template structure
    variables JSONB DEFAULT '{}', -- Configurable variables
    is_public BOOLEAN DEFAULT true,
    use_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public) WHERE is_public = true;

-- =====================================================
-- 2. Workflow Conditions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    condition_type TEXT NOT NULL, -- 'field_equals', 'field_contains', 'field_greater_than', 'field_less_than', 'custom_logic'
    field_name TEXT,
    operator TEXT, -- 'equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'
    value JSONB,
    next_step_on_true INTEGER,
    next_step_on_false INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_conditions_workflow ON workflow_conditions(workflow_id);

-- =====================================================
-- 3. Workflow Actions Table (Step Details)
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'send_email', 'send_sms', 'send_whatsapp', 'create_task', 'update_contact', 'ai_generate', 'webhook', 'delay', 'condition'
    action_config JSONB NOT NULL DEFAULT '{}', -- Action-specific configuration
    retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}',
    timeout_seconds INTEGER DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow ON workflow_actions(workflow_id, step_index);

-- =====================================================
-- 4. Workflow Triggers Table (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL, -- 'webhook', 'schedule', 'event', 'manual', 'api_call'
    trigger_config JSONB NOT NULL DEFAULT '{}',
    webhook_url TEXT, -- Generated webhook URL for this trigger
    webhook_secret TEXT, -- Secret for webhook validation
    schedule_cron TEXT, -- Cron expression for scheduled triggers
    event_name TEXT, -- Event name for event-based triggers
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_active ON workflow_triggers(is_active, trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_webhook ON workflow_triggers(webhook_url) WHERE webhook_url IS NOT NULL;

-- =====================================================
-- 5. Workflow Versions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    workflow_json JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workflow_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON workflow_versions(workflow_id, version_number DESC);

-- =====================================================
-- 6. Workflow Variables Table (Runtime Variables)
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    variable_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'json', 'secret'
    default_value JSONB,
    is_required BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workflow_id, variable_name)
);

CREATE INDEX IF NOT EXISTS idx_workflow_variables_workflow ON workflow_variables(workflow_id);

-- =====================================================
-- 7. Enhanced Workflow Execution Logs
-- =====================================================
-- Add columns to existing workflow_execution_logs table
ALTER TABLE workflow_execution_logs 
ADD COLUMN IF NOT EXISTS trigger_id UUID REFERENCES workflow_triggers(id),
ADD COLUMN IF NOT EXISTS trigger_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS steps_details JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- =====================================================
-- 8. Workflow Execution Steps Table (Detailed Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_log_id BIGINT REFERENCES workflow_execution_logs(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    action_id UUID REFERENCES workflow_actions(id),
    status TEXT NOT NULL, -- 'pending', 'running', 'success', 'failed', 'skipped', 'timeout'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_log ON workflow_execution_steps(execution_log_id, step_index);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_steps_status ON workflow_execution_steps(status);

-- =====================================================
-- 9. Enable Row Level Security
-- =====================================================
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS Policies
-- =====================================================

-- Workflow templates - public can view, admins can manage
CREATE POLICY "Anyone can view public templates" ON workflow_templates
    FOR SELECT
    TO public
    USING (is_public = true);

CREATE POLICY "Super admins can manage all templates" ON workflow_templates
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Workflow conditions - same as parent workflow
CREATE POLICY "Users can view workflow conditions" ON workflow_conditions
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Workflow actions - same as parent workflow
CREATE POLICY "Users can view workflow actions" ON workflow_actions
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Workflow triggers
CREATE POLICY "Users can view workflow triggers" ON workflow_triggers
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Workflow versions
CREATE POLICY "Users can view workflow versions" ON workflow_versions
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Workflow variables
CREATE POLICY "Users can view workflow variables" ON workflow_variables
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Workflow execution steps
CREATE POLICY "Users can view their execution steps" ON workflow_execution_steps
    FOR SELECT
    TO public
    USING (
        execution_log_id IN (
            SELECT id FROM workflow_execution_logs
            WHERE workflow_id IN (
                SELECT id FROM workflow_definitions
                WHERE organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            )
        )
    );

-- =====================================================
-- 11. Helper Functions
-- =====================================================

-- Function to create workflow version
CREATE OR REPLACE FUNCTION create_workflow_version(
    p_workflow_id UUID,
    p_workflow_json JSONB,
    p_change_summary TEXT,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_version_number INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM workflow_versions
    WHERE workflow_id = p_workflow_id;
    
    -- Insert new version
    INSERT INTO workflow_versions (
        workflow_id,
        version_number,
        workflow_json,
        change_summary,
        created_by
    ) VALUES (
        p_workflow_id,
        v_version_number,
        p_workflow_json,
        p_change_summary,
        p_user_id
    );
    
    RETURN v_version_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log workflow step execution
CREATE OR REPLACE FUNCTION log_workflow_step(
    p_execution_log_id BIGINT,
    p_step_index INTEGER,
    p_action_id UUID,
    p_status TEXT,
    p_duration_ms INTEGER DEFAULT NULL,
    p_output_data JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_step_id UUID;
BEGIN
    INSERT INTO workflow_execution_steps (
        execution_log_id,
        step_index,
        action_id,
        status,
        completed_at,
        duration_ms,
        output_data,
        error_message
    ) VALUES (
        p_execution_log_id,
        p_step_index,
        p_action_id,
        p_status,
        CASE WHEN p_status IN ('success', 'failed', 'timeout', 'skipped') THEN NOW() ELSE NULL END,
        p_duration_ms,
        p_output_data,
        p_error_message
    ) RETURNING id INTO v_step_id;
    
    RETURN v_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate webhook URL and secret
CREATE OR REPLACE FUNCTION generate_workflow_webhook(
    p_workflow_id UUID
) RETURNS TABLE(webhook_url TEXT, webhook_secret TEXT) AS $$
DECLARE
    v_webhook_id UUID;
    v_webhook_secret TEXT;
BEGIN
    v_webhook_id := gen_random_uuid();
    v_webhook_secret := encode(gen_random_bytes(32), 'hex');
    
    RETURN QUERY SELECT
        'https://your-domain.com/webhook/workflow/' || v_webhook_id::text,
        v_webhook_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export workflow
CREATE OR REPLACE FUNCTION export_workflow(
    p_workflow_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_workflow RECORD;
    v_actions JSONB;
    v_conditions JSONB;
    v_triggers JSONB;
    v_variables JSONB;
BEGIN
    -- Get workflow definition
    SELECT * INTO v_workflow
    FROM workflow_definitions
    WHERE id = p_workflow_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workflow not found';
    END IF;
    
    -- Get actions
    SELECT jsonb_agg(to_jsonb(wa.*)) INTO v_actions
    FROM workflow_actions wa
    WHERE wa.workflow_id = p_workflow_id;
    
    -- Get conditions
    SELECT jsonb_agg(to_jsonb(wc.*)) INTO v_conditions
    FROM workflow_conditions wc
    WHERE wc.workflow_id = p_workflow_id;
    
    -- Get triggers
    SELECT jsonb_agg(to_jsonb(wt.*)) INTO v_triggers
    FROM workflow_triggers wt
    WHERE wt.workflow_id = p_workflow_id;
    
    -- Get variables
    SELECT jsonb_agg(to_jsonb(wv.*)) INTO v_variables
    FROM workflow_variables wv
    WHERE wv.workflow_id = p_workflow_id;
    
    RETURN jsonb_build_object(
        'version', '1.0',
        'workflow', to_jsonb(v_workflow),
        'actions', COALESCE(v_actions, '[]'::jsonb),
        'conditions', COALESCE(v_conditions, '[]'::jsonb),
        'triggers', COALESCE(v_triggers, '[]'::jsonb),
        'variables', COALESCE(v_variables, '[]'::jsonb),
        'exported_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. Triggers
-- =====================================================

-- Trigger to auto-version workflows on update
CREATE OR REPLACE FUNCTION auto_version_workflow()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.workflow_json IS DISTINCT FROM NEW.workflow_json THEN
        PERFORM create_workflow_version(
            NEW.id,
            OLD.workflow_json,
            'Auto-versioned on update',
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_version_workflow ON workflow_definitions;
CREATE TRIGGER trigger_auto_version_workflow
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION auto_version_workflow();

-- =====================================================
-- 13. Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION create_workflow_version TO public;
GRANT EXECUTE ON FUNCTION log_workflow_step TO public;
GRANT EXECUTE ON FUNCTION generate_workflow_webhook TO public;
GRANT EXECUTE ON FUNCTION export_workflow TO public;

-- =====================================================
-- 14. Insert Default Workflow Templates
-- =====================================================
INSERT INTO workflow_templates (name, description, category, template_json, variables) VALUES
(
    'Welcome Email Sequence',
    'Automated welcome email sequence for new customers',
    'customer_engagement',
    '{
        "steps": [
            {"type": "delay", "duration": 0, "action": "send_email", "template": "welcome_email"},
            {"type": "delay", "duration": 86400, "action": "send_email", "template": "onboarding_tips"},
            {"type": "delay", "duration": 259200, "action": "send_email", "template": "feature_highlight"}
        ]
    }',
    '{"customer_name": {"type": "string", "required": true}, "company_name": {"type": "string", "required": false}}'
),
(
    'Lead Nurturing Campaign',
    'Automated lead nurturing with scoring and follow-up',
    'lead_management',
    '{
        "steps": [
            {"type": "score_lead", "criteria": {"opens": 1, "clicks": 2, "visits": 5}},
            {"type": "condition", "field": "lead_score", "operator": "greater_than", "value": 50},
            {"type": "send_email", "template": "high_value_lead"},
            {"type": "create_task", "assignee": "sales_team", "priority": "high"}
        ]
    }',
    '{"lead_source": {"type": "string", "required": true}}'
),
(
    'Support Ticket Escalation',
    'Automatically escalate unresolved support tickets',
    'support',
    '{
        "steps": [
            {"type": "delay", "duration": 3600, "action": "check_ticket_status"},
            {"type": "condition", "field": "status", "operator": "equals", "value": "open"},
            {"type": "escalate", "to": "supervisor"},
            {"type": "send_notification", "channel": "slack"}
        ]
    }',
    '{"ticket_id": {"type": "string", "required": true}, "priority": {"type": "string", "required": true}}'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. Comments for documentation
-- =====================================================
COMMENT ON TABLE workflow_templates IS 'Reusable workflow templates';
COMMENT ON TABLE workflow_conditions IS 'Conditional logic for workflow steps';
COMMENT ON TABLE workflow_actions IS 'Detailed action configuration for workflow steps';
COMMENT ON TABLE workflow_triggers IS 'Trigger definitions for workflows';
COMMENT ON TABLE workflow_versions IS 'Version history for workflows';
COMMENT ON TABLE workflow_variables IS 'Configurable variables for workflows';
COMMENT ON TABLE workflow_execution_steps IS 'Detailed execution logs for each workflow step';
COMMENT ON FUNCTION create_workflow_version IS 'Create a new version of a workflow';
COMMENT ON FUNCTION log_workflow_step IS 'Log execution of a workflow step';
COMMENT ON FUNCTION generate_workflow_webhook IS 'Generate webhook URL and secret for workflow trigger';
COMMENT ON FUNCTION export_workflow IS 'Export complete workflow definition as JSON';
