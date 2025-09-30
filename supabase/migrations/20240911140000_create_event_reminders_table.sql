-- Create event_reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    crm_event_id BIGINT NOT NULL REFERENCES crm_events(id) ON DELETE CASCADE,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('Email', 'WhatsApp')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
    message TEXT,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_reminders_organization_id ON event_reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_crm_event_id ON event_reminders(crm_event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_contact_id ON event_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON event_reminders(status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled_at ON event_reminders(scheduled_at);

-- Enable Row Level Security
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for organization access
CREATE POLICY "Users can view reminders in their organization" ON event_reminders
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reminders in their organization" ON event_reminders
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update reminders in their organization" ON event_reminders
    FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reminders in their organization" ON event_reminders
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
