-- Add "Documenti" menu item to Insurance vertical sidebar
-- This adds the Documents module to the sidebar navigation

-- Step 1: View current sidebar configuration
SELECT 
    vertical,
    jsonb_pretty(sidebar_config -> 'sections' -> 0 -> 'items') as insurance_menu_items
FROM vertical_configurations
WHERE vertical = 'insurance';

-- Step 2: Add Documenti item to the Insurance section (sections[0])
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
  sidebar_config,
  '{sections,0,items}',
  sidebar_config->'sections'->0->'items' || '[{
    "name": "Documenti",
    "path": "/assicurazioni/documenti",
    "icon": "FileText"
  }]'::jsonb
)
WHERE vertical = 'insurance';

-- Step 3: Verify the update
SELECT 
    vertical,
    jsonb_pretty(sidebar_config -> 'sections' -> 0 -> 'items') as updated_menu_items
FROM vertical_configurations
WHERE vertical = 'insurance';

-- Expected result: "Documenti" should appear in the menu items list
-- The sidebar will automatically render with the FileText icon
-- Path: /dashboard/assicurazioni/documenti (auto-prefixed by Sidebar.tsx)
