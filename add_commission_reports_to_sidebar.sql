-- Update Insurance sidebar to add Report Provvigioni item
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
  sidebar_config, 
  '{sections,0,items}', 
  sidebar_config->'sections'->0->'items' || '[{"name": "Report Provvigioni", "path": "/assicurazioni/provvigioni/reports", "icon": "BarChart3"}]'
)
WHERE vertical = 'insurance';

-- Verify the update
SELECT 
  vertical,
  jsonb_array_length(sidebar_config->'sections'->0->'items') as assicurazioni_items_count,
  (sidebar_config->'sections'->0->'items') as assicurazioni_items
FROM vertical_configurations 
WHERE vertical = 'insurance';