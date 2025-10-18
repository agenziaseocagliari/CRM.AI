-- Fix Sidebar: Separate Public Pricing from Internal Credits
-- Step 1: Fix Insurance vertical

UPDATE vertical_configurations
SET sidebar_config = jsonb_set(
    jsonb_set(
        sidebar_config,
        '{sections,2,items,1,name}',
        '"Crediti Extra"'::jsonb
    ),
    '{sections,2,items,1,path}',
    '"/crediti-extra"'::jsonb
)
WHERE vertical = 'insurance';

-- Step 2: Find Prezzi in Standard vertical
SELECT
    s.idx as section_idx,
    s.section->>'title' as section_title,
    i.idx as item_idx,
    i.item->>'name' as item_name,
    i.item->>'path' as item_path
FROM vertical_configurations,
     jsonb_array_elements(sidebar_config->'sections') WITH ORDINALITY AS s(section, idx),
     jsonb_array_elements(s.section->'items') WITH ORDINALITY AS i(item, idx)
WHERE vertical = 'standard'
  AND i.item->>'name' ILIKE '%prezzi%';

-- Step 3: Verify Insurance fix
SELECT
    vertical,
    i.item->>'name' as item_name,
    i.item->>'path' as item_path
FROM vertical_configurations,
     jsonb_array_elements(sidebar_config->'sections') AS s(section),
     jsonb_array_elements(s.section->'items') AS i(item)
WHERE vertical = 'insurance'
  AND (i.item->>'name' ILIKE '%crediti%' OR i.item->>'name' ILIKE '%prezzi%');