-- =====================================================
-- Automation Agents & API Integrations Schema
-- =====================================================
-- This migration creates tables for automation agents,
-- API integrations, and workflow management for Super Admin

-- =====================================================
-- 1. Automation Agents Table
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'health_monitor', 'payment_revenue', 'support_ticket', 'user_engagement', 'security_watcher'
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    configuration JSONB NOT NULL DEFAULT '{}', -- Stores thresholds, channels, etc.
    status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'running', 'error'
    last_run_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_agents_type ON automation_agents(type);
CREATE INDEX IF NOT EXISTS idx_automation_agents_is_active ON automation_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_agents_status ON automation_agents(status);

-- Enable RLS
ALTER TABLE automation_agents ENABLE ROW LEVEL SECURITY;

-- Only super admins can access agents
CREATE POLICY "Super admins can view all agents" ON automation_agents
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert agents" ON automation_agents
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update agents" ON automation_agents
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete agents" ON automation_agents
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 2. Agent Execution Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES automation_agents(id) ON DELETE CASCADE,
    execution_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    status TEXT NOT NULL, -- 'running', 'success', 'error', 'partial'
    result_summary JSONB,
    error_details TEXT,
    actions_taken JSONB DEFAULT '[]', -- Array of actions performed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agent_id ON agent_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_status ON agent_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON agent_execution_logs(created_at DESC);

-- Enable RLS
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can access agent logs
CREATE POLICY "Super admins can view all agent logs" ON agent_execution_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert agent logs" ON agent_execution_logs
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 3. API Integrations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL, -- 'whatsapp', 'email_mailgun', 'email_sendgrid', 'email_ses', 'telegram', 'openai', 'gemini', 'firebase', 'onesignal', 'custom'
    provider_type TEXT NOT NULL, -- 'messaging', 'email', 'ai', 'push', 'custom'
    display_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted credentials
    configuration JSONB NOT NULL DEFAULT '{}', -- Endpoints, webhooks, etc.
    status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'rate_limited'
    last_ping_at TIMESTAMPTZ,
    last_error TEXT,
    usage_stats JSONB DEFAULT '{}', -- Monthly quota, spend, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider_type ON api_integrations(provider_type);
CREATE INDEX IF NOT EXISTS idx_api_integrations_is_active ON api_integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_api_integrations_status ON api_integrations(status);

-- Enable RLS
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- Only super admins can access API integrations
CREATE POLICY "Super admins can view all integrations" ON api_integrations
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert integrations" ON api_integrations
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update integrations" ON api_integrations
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete integrations" ON api_integrations
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 4. Integration Usage Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS integration_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'send_message', 'send_email', 'ai_request', 'push_notification'
    status TEXT NOT NULL, -- 'success', 'error', 'rate_limited'
    request_details JSONB,
    response_details JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_integration_id ON integration_usage_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_action_type ON integration_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_status ON integration_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_created_at ON integration_usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE integration_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can access integration logs
CREATE POLICY "Super admins can view all integration logs" ON integration_usage_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert integration logs" ON integration_usage_logs
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 5. Workflow Definitions Table (Enhanced Automations)
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    natural_language_prompt TEXT NOT NULL, -- Original user prompt
    workflow_json JSONB NOT NULL, -- Structured workflow definition
    is_active BOOLEAN NOT NULL DEFAULT false,
    trigger_type TEXT NOT NULL, -- 'manual', 'schedule', 'event', 'condition'
    trigger_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_executed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_organization_id ON workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_is_active ON workflow_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_trigger_type ON workflow_definitions(trigger_type);

-- Enable RLS
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;

-- Organization users can view their workflows
CREATE POLICY "Users can view organization workflows" ON workflow_definitions
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Organization admins can insert workflows
CREATE POLICY "Admins can insert workflows" ON workflow_definitions
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Organization admins can update workflows
CREATE POLICY "Admins can update workflows" ON workflow_definitions
    FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Organization admins can delete workflows
CREATE POLICY "Admins can delete workflows" ON workflow_definitions
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 6. Workflow Execution Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    execution_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    status TEXT NOT NULL, -- 'running', 'success', 'error', 'partial'
    trigger_data JSONB,
    execution_result JSONB,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_workflow_id ON workflow_execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_status ON workflow_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_created_at ON workflow_execution_logs(created_at DESC);

-- Enable RLS
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their workflow logs
CREATE POLICY "Users can view workflow logs" ON workflow_execution_logs
    FOR SELECT
    TO public
    USING (
        workflow_id IN (
            SELECT id FROM workflow_definitions WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "System can insert workflow logs" ON workflow_execution_logs
    FOR INSERT
    TO public
    WITH CHECK (true); -- Allow system to log executions

-- =====================================================
-- 7. Helper Functions
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_automation_agents_updated_at ON automation_agents;
CREATE TRIGGER update_automation_agents_updated_at
    BEFORE UPDATE ON automation_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON api_integrations;
CREATE TRIGGER update_api_integrations_updated_at
    BEFORE UPDATE ON api_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON workflow_definitions;
CREATE TRIGGER update_workflow_definitions_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Insert Default Agents
-- =====================================================
INSERT INTO automation_agents (name, type, description, configuration) VALUES
    ('Health Monitor', 'health_monitor', 'Monitora uptime, errori API, anomalie login, warning sicurezza, dashboard health', 
     '{"alert_channels": ["in_app", "email"], "check_interval_minutes": 15, "thresholds": {"error_rate": 5, "uptime_percentage": 99}}'),
    ('Payment/Revenue Agent', 'payment_revenue', 'Monitora pagamenti ricorrenti, crediti, rinnovi, abbonamenti, transazioni failed',
     '{"alert_channels": ["email", "whatsapp"], "check_interval_minutes": 30, "thresholds": {"failed_payment_count": 3}}'),
    ('Support/Ticket Agent', 'support_ticket', 'Classe, smista, risponde alle richieste support incoming con escalation automatica',
     '{"alert_channels": ["in_app", "email"], "auto_response_enabled": true, "escalation_threshold_hours": 24}'),
    ('User Engagement Agent', 'user_engagement', 'Automatizza onboarding clienti, invio remind upgrade, campagne marketing',
     '{"channels": ["email", "whatsapp"], "onboarding_enabled": true, "upgrade_reminder_days": 7}'),
    ('Security Watcher', 'security_watcher', 'Scannerizza log auth/API, segnala anomalie, tentativi login irregolari',
     '{"alert_channels": ["email", "telegram"], "auto_lock_enabled": false, "failed_login_threshold": 5, "anomaly_detection_enabled": true}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. Insert Default API Integration Templates
-- =====================================================
INSERT INTO api_integrations (provider_name, provider_type, display_name, configuration) VALUES
    ('whatsapp_business', 'messaging', 'WhatsApp Business API', 
     '{"webhook_endpoint": "", "phone_id": "", "required_credentials": ["token", "phone_id"]}'),
    ('email_mailgun', 'email', 'Mailgun Email Service',
     '{"api_endpoint": "https://api.mailgun.net/v3", "required_credentials": ["api_key", "domain"]}'),
    ('email_sendgrid', 'email', 'SendGrid Email Service',
     '{"api_endpoint": "https://api.sendgrid.com/v3", "required_credentials": ["api_key"]}'),
    ('email_ses', 'email', 'Amazon SES',
     '{"region": "us-east-1", "required_credentials": ["access_key", "secret_key"]}'),
    ('telegram_bot', 'messaging', 'Telegram Bot',
     '{"api_endpoint": "https://api.telegram.org", "required_credentials": ["bot_token", "chat_id"]}'),
    ('openai_gpt', 'ai', 'OpenAI GPT',
     '{"api_endpoint": "https://api.openai.com/v1", "default_model": "gpt-4o", "required_credentials": ["api_key"]}'),
    ('google_gemini', 'ai', 'Google Gemini',
     '{"api_endpoint": "https://generativelanguage.googleapis.com", "default_model": "gemini-2.5-flash", "required_credentials": ["api_key"]}'),
    ('firebase_fcm', 'push', 'Firebase Cloud Messaging',
     '{"api_endpoint": "https://fcm.googleapis.com/fcm", "required_credentials": ["server_key", "sender_id"]}'),
    ('onesignal', 'push', 'OneSignal Push Notifications',
     '{"api_endpoint": "https://onesignal.com/api/v1", "required_credentials": ["app_id", "api_key"]}')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE automation_agents IS 'Stores configuration and state for automation agents';
COMMENT ON TABLE agent_execution_logs IS 'Logs execution history for automation agents';
COMMENT ON TABLE api_integrations IS 'Stores API provider configurations and credentials';
COMMENT ON TABLE integration_usage_logs IS 'Logs API usage for monitoring and billing';
COMMENT ON TABLE workflow_definitions IS 'Enhanced automation workflows with natural language processing';
COMMENT ON TABLE workflow_execution_logs IS 'Logs workflow execution history';
