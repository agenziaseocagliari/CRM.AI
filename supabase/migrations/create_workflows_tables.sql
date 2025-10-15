-- Enable RLS on workflows and workflow_executions tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS workflow_executions;

DROP TABLE IF EXISTS workflows;

-- Create workflows table
CREATE TABLE workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_executions table for logging
CREATE TABLE workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    results JSONB DEFAULT '[]'::jsonb,
    success BOOLEAN DEFAULT false,
    error_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    trigger_data JSONB
);

-- Create indexes for better performance
CREATE INDEX workflows_user_id_idx ON workflows (user_id);

CREATE INDEX workflows_active_idx ON workflows (is_active)
WHERE
    is_active = true;

CREATE INDEX workflow_executions_workflow_id_idx ON workflow_executions (workflow_id);

CREATE INDEX workflow_executions_executed_at_idx ON workflow_executions (executed_at);

-- RLS Policies for workflows table
CREATE POLICY "Users can view their own workflows" ON workflows FOR
SELECT TO public USING (auth.uid () = user_id);

CREATE POLICY "Users can create their own workflows" ON workflows FOR
INSERT TO public
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own workflows" ON workflows FOR
UPDATE TO public USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can delete their own workflows" ON workflows FOR DELETE TO public USING (auth.uid () = user_id);

-- RLS Policies for workflow_executions table
CREATE POLICY "Users can view executions of their workflows" ON workflow_executions FOR
SELECT TO public USING (
        EXISTS (
            SELECT 1
            FROM workflows w
            WHERE
                w.id = workflow_executions.workflow_id
                AND w.user_id = auth.uid ()
        )
    );

CREATE POLICY "System can insert workflow executions" ON workflow_executions FOR
INSERT TO public
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM workflows w
            WHERE
                w.id = workflow_executions.workflow_id
                AND w.user_id = auth.uid ()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions to public (RLS policies control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON workflows TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_executions TO public;

-- Insert sample workflow for testing (optional)
INSERT INTO workflows (user_id, name, description, nodes, edges, is_active)
SELECT 
    auth.uid(),
    'Sample Lead Scoring Workflow',
    'Automatically score new leads using DataPizza AI and send email notifications',
    '[
        {
            "id": "trigger-1",
            "type": "form_submit",
            "position": {"x": 100, "y": 100},
            "data": {"formId": "contact-form"}
        },
        {
            "id": "action-1", 
            "type": "ai_score",
            "position": {"x": 300, "y": 100},
            "data": {}
        },
        {
            "id": "action-2",
            "type": "send_email",
            "position": {"x": 500, "y": 100}, 
            "data": {
                "subject": "New High-Value Lead",
                "template": "lead-notification"
            }
        }
    ]'::jsonb,
    '[
        {
            "id": "edge-1",
            "source": "trigger-1",
            "target": "action-1"
        },
        {
            "id": "edge-2", 
            "source": "action-1",
            "target": "action-2"
        }
    ]'::jsonb,
    false
WHERE auth.uid() IS NOT NULL;