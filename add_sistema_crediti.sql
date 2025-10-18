-- Add Sistema Crediti module to Standard CRM
UPDATE vertical_configurations 
SET sidebar_config = jsonb_set(
    sidebar_config, 
    '{sections}', 
    (sidebar_config->'sections') || 
    '[{
        "id": "universal-credits",
        "icon": "Coins", 
        "path": "/dashboard/universal-credits",
        "label": "Sistema Crediti"
    }]'::jsonb
) 
WHERE vertical = 'standard';

-- Verify both credit modules exist
SELECT 
    item->>'label' as label,
    item->>'path' as path,
    item->>'icon' as icon
FROM vertical_configurations,
     jsonb_array_elements(sidebar_config->'sections') AS item
WHERE vertical = 'standard' 
  AND (item->>'label' ILIKE '%credit%' OR item->>'path' ILIKE '%credit%')
ORDER BY item->>'label';