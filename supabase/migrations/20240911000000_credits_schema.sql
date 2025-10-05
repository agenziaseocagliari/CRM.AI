-- Create organization_credits table
CREATE TABLE IF NOT EXISTS organization_credits (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'free',
    total_credits INTEGER NOT NULL DEFAULT 0,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    cycle_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cycle_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_actions table for action costs configuration
CREATE TABLE IF NOT EXISTS credit_actions (
    action_type TEXT PRIMARY KEY,
    credits_cost INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default credit action costs
INSERT INTO credit_actions (action_type, credits_cost, description) VALUES
    ('create_crm_event', 1, 'Create a CRM event'),
    ('schedule_reminder_email', 1, 'Schedule an email reminder'),
    ('schedule_reminder_whatsapp', 2, 'Schedule a WhatsApp reminder'),
    ('send_email', 1, 'Send an email'),
    ('send_whatsapp', 2, 'Send a WhatsApp message'),
    ('ai_lead_scoring', 5, 'AI-powered lead scoring'),
    ('ai_email_generation', 3, 'AI-generated email content')
ON CONFLICT (action_type) DO NOTHING;

-- Create credit_consumption_logs table for tracking usage
CREATE TABLE IF NOT EXISTS credit_consumption_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL REFERENCES credit_actions(action_type),
    credits_consumed INTEGER NOT NULL,
    credits_remaining INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_credits_org_id ON organization_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_consumption_logs_org_id ON credit_consumption_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_consumption_logs_action_type ON credit_consumption_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_credit_consumption_logs_created_at ON credit_consumption_logs(created_at);

-- Enable Row Level Security
ALTER TABLE organization_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_consumption_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_credits
DROP POLICY IF EXISTS "Users can view credits for their organization" ON organization_credits;CREATE POLICY "Users can view credits for their organization" ON organization_credits
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Create policies for credit_consumption_logs
DROP POLICY IF EXISTS "Users can view consumption logs for their organization" ON credit_consumption_logs;CREATE POLICY "Users can view consumption logs for their organization" ON credit_consumption_logs
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organization_credits
CREATE TRIGGER update_organization_credits_updated_at
    BEFORE UPDATE ON organization_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
