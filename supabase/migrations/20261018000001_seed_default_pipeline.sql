-- Default Pipeline Stages
-- Insert default sales pipeline stages that work for most businesses

-- First, let's create a function to get the first organization ID
-- This is a temporary solution for seeding data
DO $$
DECLARE
  default_org_id UUID;
  stage_exists INTEGER;
BEGIN
  -- Get the first organization (or create one if none exists)
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  -- Check if pipeline stages already exist to avoid duplicates
  SELECT COUNT(*) INTO stage_exists FROM pipeline_stages;
  
  -- Only insert if no stages exist yet
  IF stage_exists = 0 THEN
    -- Insert default pipeline stages with organization_id if available
    INSERT INTO pipeline_stages (name, order_index, color, organization_id) VALUES
      ('Lead', 1, '#94a3b8', default_org_id),
      ('Qualificato', 2, '#3b82f6', default_org_id),
      ('Proposta', 3, '#f59e0b', default_org_id),
      ('Negoziazione', 4, '#8b5cf6', default_org_id),
      ('Vinto', 5, '#10b981', default_org_id),
      ('Perso', 6, '#ef4444', default_org_id);
  END IF;
END $$;