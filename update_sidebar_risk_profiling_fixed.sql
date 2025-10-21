-- Update sidebar configuration to add Risk Profiling menu item
-- Fixed to use correct column name: 'vertical' not 'vertical_type'

BEGIN;

-- Get current sidebar_config for insurance vertical
DO $$
DECLARE
  current_config JSONB;
  new_modules JSONB;
BEGIN
  -- Fetch current config
  SELECT sidebar_config INTO current_config
  FROM vertical_configurations
  WHERE vertical = 'insurance';

  -- Add Risk Profiling module after Scadenziario (renewals)
  -- Extract existing modules and add the new one
  new_modules := current_config->'modules';
  
  -- Add Risk Profiling module
  new_modules := new_modules || jsonb_build_array(
    jsonb_build_object(
      'id', 'risk-profiling',
      'label', 'Valutazione Rischio',
      'icon', 'Shield',
      'path', '/dashboard/assicurazioni/valutazione-rischio',
      'description', 'Sistema di valutazione rischio multi-dimensionale per clienti assicurativi',
      'order', 50
    )
  );

  -- Update the configuration
  UPDATE vertical_configurations
  SET sidebar_config = jsonb_set(
    sidebar_config,
    '{modules}',
    new_modules
  ),
  updated_at = NOW()
  WHERE vertical = 'insurance';

  RAISE NOTICE 'Sidebar configuration updated successfully for insurance vertical';
END $$;

COMMIT;

-- Verify the update
SELECT 
  vertical,
  jsonb_pretty(sidebar_config->'modules') as modules
FROM vertical_configurations
WHERE vertical = 'insurance';
