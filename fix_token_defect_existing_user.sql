-- ====================================================================
-- FIX TOKEN DEFECT FOR EXISTING USER
-- ====================================================================
-- This fixes the user_role missing error for primassicurazionibari@gmail.com
-- User must logout and re-login after running this to get new token
-- ====================================================================

-- Update auth metadata for existing user
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"user_role": "user"}'::jsonb
WHERE id = 'c623942a-d4b2-4d93-b944-b8e681679704'
AND email = 'primassicurazionibari@gmail.com';

-- Verify the update
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'user_role' as user_role_in_metadata,
    raw_user_meta_data->>'vertical' as vertical_in_metadata,
    raw_user_meta_data->>'name' as name_in_metadata
FROM auth.users
WHERE id = 'c623942a-d4b2-4d93-b944-b8e681679704';

-- Expected result:
-- user_role_in_metadata: 'user'
-- vertical_in_metadata: 'insurance'  
-- name_in_metadata: should exist

-- ====================================================================
-- INSTRUCTIONS FOR USER
-- ====================================================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Tell primassicurazionibari@gmail.com to:
--    - Logout completely from the CRM
--    - Clear browser cache (optional but recommended)
--    - Login again
-- 3. Verify: No more "TOKEN DEFECT" error
-- 4. Verify: Sidebar shows 9 Insurance items
-- ====================================================================