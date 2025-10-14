-- Default Pipeline Stages
-- Insert default sales pipeline stages that work for most businesses

-- First, let's create a function to get the first organization ID
-- This is a temporary solution for seeding data
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization (or create one if none exists)
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  -- If no organization exists, we'll insert stages without organization_id
  -- and they can be updated later when organizations are properly set up
  
  -- Insert default pipeline stages
  INSERT INTO pipeline_stages (name, order_index, color, organization_id) VALUES
    ('Lead', 1, '#94a3b8', default_org_id),
    ('Qualificato', 2, '#3b82f6', default_org_id),
    ('Proposta', 3, '#f59e0b', default_org_id),
    ('Negoziazione', 4, '#8b5cf6', default_org_id),
    ('Vinto', 5, '#10b981', default_org_id),
    ('Perso', 6, '#ef4444', default_org_id)
  ON CONFLICT (name, organization_id) DO NOTHING;
  
  -- If no organization was found, insert without organization_id
  IF default_org_id IS NULL THEN
    INSERT INTO pipeline_stages (name, order_index, color) VALUES
      ('Lead', 1, '#94a3b8'),
      ('Qualificato', 2, '#3b82f6'),
      ('Proposta', 3, '#f59e0b'),
      ('Negoziazione', 4, '#8b5cf6'),
      ('Vinto', 5, '#10b981'),
      ('Perso', 6, '#ef4444')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;