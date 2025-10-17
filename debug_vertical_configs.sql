-- ============================================================================
-- DEBUG: VERTICAL CONFIGURATION SYSTEM
-- ============================================================================
-- Run this in Supabase SQL Editor to check if vertical configurations exist

-- 1. Check all vertical configurations
SELECT
    vertical,
    display_name,
    is_active,
    jsonb_array_length (sidebar_config -> 'sections') as sidebar_items_count,
    enabled_modules
FROM vertical_configurations
ORDER BY vertical;

-- 2. Check Insurance vertical configuration specifically
SELECT
    'INSURANCE CONFIG' as component,
    vertical,
    display_name,
    description,
    is_active,
    is_public,
    sidebar_config,
    dashboard_config,
    enabled_modules
FROM vertical_configurations
WHERE
    vertical = 'insurance';

-- 3. Check Standard vertical configuration
SELECT
    'STANDARD CONFIG' as component,
    vertical,
    display_name,
    description,
    is_active,
    is_public,
    sidebar_config,
    dashboard_config,
    enabled_modules
FROM vertical_configurations
WHERE
    vertical = 'standard';

-- 4. Check Insurance user profile
SELECT
    'INSURANCE USER PROFILE' as component,
    u.email,
    p.vertical as profile_vertical,
    u.raw_user_meta_data -> 'vertical' as metadata_vertical,
    o.vertical as org_vertical
FROM
    auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN organizations o ON o.id = p.organization_id
WHERE
    u.email = 'primassicurazionibari@gmail.com';

-- 5. Check if Insurance vertical configuration query would work
SELECT
    'INSURANCE CONFIG QUERY TEST' as test,
    COUNT(*) as config_count,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ Config exists and unique'
        WHEN COUNT(*) = 0 THEN '❌ No config found'
        ELSE '⚠️ Multiple configs found'
    END as status
FROM vertical_configurations
WHERE
    vertical = 'insurance'
    AND is_active = true;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Insurance config should exist with:
-- - display_name: 'CRM Assicurazioni'
-- - sidebar_config: 9 sections (Polizze, Sinistri, etc.)
-- - is_active: true
--
-- User profile should show:
-- - profile_vertical: 'insurance'
-- - metadata_vertical: 'insurance'
-- - org_vertical: 'insurance'