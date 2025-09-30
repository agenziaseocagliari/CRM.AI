-- Create crm_events table
CREATE TABLE IF NOT EXISTS crm_events (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    event_summary TEXT NOT NULL,
    event_description TEXT,
    event_start_time TIMESTAMPTZ NOT NULL,
    event_end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_events_organization_id ON crm_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_contact_id ON crm_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_status ON crm_events(status);
CREATE INDEX IF NOT EXISTS idx_crm_events_start_time ON crm_events(event_start_time);

-- Enable Row Level Security
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;

-- Create policy for organization access
CREATE POLICY "Users can view events in their organization" ON crm_events
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events in their organization" ON crm_events
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update events in their organization" ON crm_events
    FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete events in their organization" ON crm_events
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
