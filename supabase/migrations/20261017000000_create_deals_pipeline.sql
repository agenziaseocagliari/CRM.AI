-- Deals Pipeline Database Schema
-- Create tables for sales opportunity management system

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;

-- Pipeline stages (Kanban columns)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, order_index)
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Insert default pipeline stages (will work for all organizations)
INSERT INTO pipeline_stages (name, order_index, color, organization_id) 
SELECT 
  stage_name,
  stage_order,
  stage_color,
  o.id as org_id
FROM (
  VALUES 
    ('Lead', 1, '#94a3b8'),
    ('Qualified', 2, '#3b82f6'),
    ('Proposal', 3, '#f59e0b'),
    ('Negotiation', 4, '#8b5cf6'),
    ('Won', 5, '#10b981'),
    ('Lost', 6, '#ef4444')
) AS stages(stage_name, stage_order, stage_color)
CROSS JOIN organizations o
ON CONFLICT (organization_id, order_index) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_organization ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org ON pipeline_stages(organization_id);

-- RLS Policies for pipeline_stages
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pipeline stages from their organization" ON pipeline_stages;
CREATE POLICY "Users can view pipeline stages from their organization" 
ON pipeline_stages FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage pipeline stages in their organization" ON pipeline_stages;
CREATE POLICY "Users can manage pipeline stages in their organization" 
ON pipeline_stages FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- RLS Policies for deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deals from their organization" ON deals;
CREATE POLICY "Users can view deals from their organization" 
ON deals FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage deals in their organization" ON deals;
CREATE POLICY "Users can manage deals in their organization" 
ON deals FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at 
    BEFORE UPDATE ON deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at 
    BEFORE UPDATE ON pipeline_stages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();