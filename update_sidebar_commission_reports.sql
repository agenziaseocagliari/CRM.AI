-- Update insurance vertical sidebar configuration to include Commission Reports
-- This ensures the "Report Provvigioni" link appears in the sidebar from database config

UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
  sidebar_config,
  '{sections,0,items}',
  sidebar_config->'sections'->0->'items' || '[{
    "name": "Report Provvigioni",
    "icon": "FileText", 
    "path": "/assicurazioni/provvigioni/reports"
  }]'::jsonb
)
WHERE vertical = 'insurance'
AND organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';

-- Verify the update
SELECT
    vertical,
    organization_id,
    sidebar_config -> 'sections' -> 0 -> 'items' as insurance_menu_items
FROM vertical_configurations
WHERE
    vertical = 'insurance'
    AND organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';