-- Fix Standard CRM sidebar to match Insurance setup
-- Update "Crediti" module (index 9) to "Crediti Extra" 
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
    sidebar_config, 
    '{sections,9,label}', 
    '"Crediti Extra"'::jsonb
) 
WHERE vertical = 'standard';

-- Update path to /crediti-extra
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
    sidebar_config, 
    '{sections,9,path}', 
    '"/crediti-extra"'::jsonb
) 
WHERE vertical = 'standard';

-- Remove Store module (index 10) as it's redundant
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
    sidebar_config, 
    '{sections}', 
    (sidebar_config->'sections') - 10
) 
WHERE vertical = 'standard';

-- Verify the changes
SELECT 
    item->>'label' as label,
    item->>'path' as path
FROM vertical_configurations,
     jsonb_array_elements(sidebar_config->'sections') AS item
WHERE vertical = 'standard' 
  AND (item->>'label' = 'Crediti Extra' OR item->>'path' = '/crediti-extra');