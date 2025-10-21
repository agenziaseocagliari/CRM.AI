-- Update sidebar configuration to add Risk Profiling menu item
-- Add to Assicurazioni section after Scadenzario

BEGIN;

DO $$
DECLARE
  current_config JSONB;
  insurance_section JSONB;
  updated_items JSONB;
BEGIN
  -- Get current sidebar config
  SELECT sidebar_config INTO current_config
  FROM vertical_configurations
  WHERE vertical = 'insurance';

  -- Get the Assicurazioni section (first section)
  insurance_section := current_config->'sections'->0;
  
  -- Get current items
  updated_items := insurance_section->'items';
  
  -- Add Risk Profiling item after Scadenzario
  updated_items := updated_items || jsonb_build_array(
    jsonb_build_object(
      'icon', 'Shield',
      'name', 'Valutazione Rischio',
      'path', '/assicurazioni/valutazione-rischio'
    )
  );
  
  -- Update the items in the section
  insurance_section := jsonb_set(insurance_section, '{items}', updated_items);
  
  -- Update the section in the config
  current_config := jsonb_set(current_config, '{sections,0}', insurance_section);
  
  -- Save the updated config
  UPDATE vertical_configurations
  SET sidebar_config = current_config,
      updated_at = NOW()
  WHERE vertical = 'insurance';

  RAISE NOTICE 'Sidebar configuration updated: Added Valutazione Rischio to Assicurazioni section';
END $$;

COMMIT;

-- Verify the update
SELECT 
  vertical,
  jsonb_pretty(sidebar_config->'sections'->0->'items') as assicurazioni_menu
FROM vertical_configurations
WHERE vertical = 'insurance';
