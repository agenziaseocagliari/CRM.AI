-- Create debug_logs table for tracking Edge Function debugging
CREATE TABLE debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    logged_at timestamp with time zone DEFAULT now(),
    function_name text NOT NULL,
    organization_id text,
    request_payload jsonb,
    google_auth_token_value jsonb,
    step text,
    error_message text,
    error_stack text,
    extra jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX idx_debug_logs_logged_at ON debug_logs(logged_at DESC);
CREATE INDEX idx_debug_logs_function_name ON debug_logs(function_name);
CREATE INDEX idx_debug_logs_organization_id ON debug_logs(organization_id);

-- Enable RLS (Row Level Security)
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage debug_logs"
    ON debug_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE debug_logs IS 'Debug logging table for Edge Function troubleshooting';
COMMENT ON COLUMN debug_logs.function_name IS 'Name of the Edge Function that created this log entry';
COMMENT ON COLUMN debug_logs.organization_id IS 'Organization ID if applicable';
COMMENT ON COLUMN debug_logs.request_payload IS 'Full request payload received by the function';
COMMENT ON COLUMN debug_logs.google_auth_token_value IS 'Raw Google auth token data for debugging';
COMMENT ON COLUMN debug_logs.step IS 'Current step/phase when logging occurred';
COMMENT ON COLUMN debug_logs.error_message IS 'Error message if any';
COMMENT ON COLUMN debug_logs.error_stack IS 'Full error stack trace if any';
COMMENT ON COLUMN debug_logs.extra IS 'Additional debugging data in JSON format';