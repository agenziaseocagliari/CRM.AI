-- Fix duplicate Impostazioni in Insurance sidebar
-- This removes any duplicates and ensures only one Impostazioni entry exists

UPDATE vertical_configurations
SET sidebar_config = jsonb_set(
    sidebar_config,
    '{sections,2,items}',
    '[
        {"name": "Sistema Crediti", "path": "/universal-credits", "icon": "Coins"},
        {"name": "Prezzi", "path": "/pricing", "icon": "DollarSign"},
        {"name": "Impostazioni", "path": "/dashboard/settings", "icon": "Settings"}
    ]'::jsonb
)
WHERE vertical = 'insurance';

-- Verify - should show exactly 3 items, no duplicates
SELECT
    item->>'name' as module_name,
    item->>'path' as module_path
FROM vertical_configurations,
jsonb_array_elements(sidebar_config->'sections'->2->'items') AS item
WHERE vertical = 'insurance'
ORDER BY ordinality;