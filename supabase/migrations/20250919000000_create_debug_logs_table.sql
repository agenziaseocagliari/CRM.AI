-- Create debug_logs table for diagnostics
CREATE TABLE IF NOT EXISTS debug_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    log_level TEXT NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    message TEXT NOT NULL,
    context JSONB,
    stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_debug_logs_organization_id ON debug_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_id ON debug_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for organization access
CREATE POLICY "Users can view debug logs for their organization" ON debug_logs
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Only authenticated users can insert debug logs (typically via edge functions)
CREATE POLICY "Authenticated users can insert debug logs" ON debug_logs
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IS NOT NULL);
