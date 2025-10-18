-- Check current Insurance sidebar structure
SELECT jsonb_pretty (sidebar_config) as current_sidebar
FROM vertical_configurations
WHERE
    vertical = 'insurance';

-- Add Moduli to Insurance sidebar (append at end of section 1)
UPDATE vertical_configurations
SET sidebar_config = jsonb_set(
  sidebar_config,
  '{sections,1,items}',
  (sidebar_config->'sections'->1->'items') || 
  '[{"icon": "FileText", "name": "Moduli", "path": "/moduli"}]'::jsonb
)
WHERE vertical = 'insurance';

-- Verify the addition
SELECT
    item ->> 'name' as name,
    item ->> 'path' as path,
    item ->> 'icon' as icon
FROM
    vertical_configurations,
    jsonb_array_elements (
        sidebar_config -> 'sections' -> 1 -> 'items'
    ) AS item
WHERE
    vertical = 'insurance';