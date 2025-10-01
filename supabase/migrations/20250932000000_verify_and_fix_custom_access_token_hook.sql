-- =====================================================
-- JWT Custom Claims Hook Verification & Fix
-- =====================================================
-- This migration verifies and fixes the custom_access_token_hook
-- to ensure JWT tokens contain user_role and organization_id claims
--
-- Run this if super_admin users are getting JWT claim errors
-- =====================================================

-- =====================================================
-- 1. Verify the hook function exists
-- =====================================================
DO $$
DECLARE
  hook_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'custom_access_token_hook'
  ) INTO hook_exists;
  
  IF hook_exists THEN
    RAISE NOTICE '✅ custom_access_token_hook function exists';
  ELSE
    RAISE WARNING '❌ custom_access_token_hook function NOT FOUND - will be created';
  END IF;
END $$;

-- =====================================================
-- 2. Drop and recreate the function with enhanced logging
-- =====================================================
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_organization_id uuid;
  user_exists boolean;
BEGIN
  -- Enhanced logging for debugging
  RAISE LOG '[custom_access_token_hook] Invoked for user: %', (event->>'user_id');
  
  -- Check if user exists in profiles table
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = (event->>'user_id')::uuid
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE WARNING '[custom_access_token_hook] User % not found in profiles table', (event->>'user_id');
    -- Set default role for users without profiles
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RAISE LOG '[custom_access_token_hook] Set default role: user';
    RETURN event;
  END IF;
  
  -- Query the user's role and organization_id from the profiles table
  SELECT role, organization_id
  INTO user_role, user_organization_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- Log what was found
  RAISE LOG '[custom_access_token_hook] Profile found - role: %, org_id: %', 
    COALESCE(user_role, 'NULL'), COALESCE(user_organization_id::text, 'NULL');
  
  -- Add custom claims to the JWT
  IF user_role IS NOT NULL THEN
    event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));
    RAISE LOG '[custom_access_token_hook] Added user_role claim: %', user_role;
  ELSE
    -- If role is NULL in database, set default
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RAISE WARNING '[custom_access_token_hook] Role was NULL in database, set default: user';
  END IF;
  
  -- Add organization_id if it exists
  IF user_organization_id IS NOT NULL THEN
    event := jsonb_set(event, '{claims,organization_id}', to_jsonb(user_organization_id::text));
    RAISE LOG '[custom_access_token_hook] Added organization_id claim: %', user_organization_id;
  ELSE
    RAISE LOG '[custom_access_token_hook] organization_id is NULL (may be expected for super_admin)';
  END IF;
  
  RAISE LOG '[custom_access_token_hook] Successfully added custom claims';
  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the authentication
    RAISE WARNING '[custom_access_token_hook] EXCEPTION: % - %', SQLERRM, SQLSTATE;
    -- Set default role on error
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RETURN event;
END;
$$;

-- =====================================================
-- 3. Grant necessary permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

RAISE NOTICE '✅ Permissions granted to supabase_auth_admin';

-- =====================================================
-- 4. Add/update comment
-- =====================================================
COMMENT ON FUNCTION public.custom_access_token_hook IS 
'ENHANCED custom access token hook that adds user_role and organization_id from profiles table to JWT claims.
This hook is automatically called by Supabase Auth when generating access tokens.
Includes enhanced error handling and logging for debugging JWT claim issues.
Updated: 2025-10-01';

-- =====================================================
-- 5. Verify profiles table structure
-- =====================================================
DO $$
DECLARE
  role_column_exists boolean;
  org_id_column_exists boolean;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO role_column_exists;
  
  -- Check if organization_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'organization_id'
  ) INTO org_id_column_exists;
  
  IF role_column_exists THEN
    RAISE NOTICE '✅ profiles.role column exists';
  ELSE
    RAISE WARNING '❌ profiles.role column NOT FOUND';
  END IF;
  
  IF org_id_column_exists THEN
    RAISE NOTICE '✅ profiles.organization_id column exists';
  ELSE
    RAISE WARNING '❌ profiles.organization_id column NOT FOUND';
  END IF;
END $$;

-- =====================================================
-- 6. Test the hook function with a sample user
-- =====================================================
DO $$
DECLARE
  test_event jsonb;
  result jsonb;
  sample_user_id uuid;
BEGIN
  -- Get a sample user ID from profiles
  SELECT id INTO sample_user_id FROM public.profiles LIMIT 1;
  
  IF sample_user_id IS NULL THEN
    RAISE WARNING 'No users found in profiles table to test hook';
    RETURN;
  END IF;
  
  -- Create a test event
  test_event := jsonb_build_object(
    'user_id', sample_user_id::text,
    'claims', '{}'::jsonb
  );
  
  -- Call the hook
  result := public.custom_access_token_hook(test_event);
  
  -- Check if user_role was added
  IF result->'claims'->'user_role' IS NOT NULL THEN
    RAISE NOTICE '✅ Hook test PASSED - user_role added: %', result->'claims'->'user_role';
  ELSE
    RAISE WARNING '❌ Hook test FAILED - user_role NOT added to claims';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Hook test FAILED with error: % - %', SQLERRM, SQLSTATE;
END $$;

-- =====================================================
-- 7. Check for users with NULL roles
-- =====================================================
DO $$
DECLARE
  null_role_count integer;
  super_admin_count integer;
BEGIN
  -- Count users with NULL role
  SELECT COUNT(*) INTO null_role_count
  FROM public.profiles
  WHERE role IS NULL;
  
  -- Count super_admin users
  SELECT COUNT(*) INTO super_admin_count
  FROM public.profiles
  WHERE role = 'super_admin';
  
  IF null_role_count > 0 THEN
    RAISE WARNING '⚠️  Found % users with NULL role - these will get default "user" role', null_role_count;
  ELSE
    RAISE NOTICE '✅ All users have a role assigned';
  END IF;
  
  RAISE NOTICE 'ℹ️  Found % super_admin users', super_admin_count;
END $$;

-- =====================================================
-- IMPORTANT: Manual Configuration Still Required
-- =====================================================
-- After running this migration, you MUST configure the hook in Supabase:
-- 
-- OPTION 1: Supabase Dashboard
-- 1. Go to Dashboard > Authentication > Hooks
-- 2. Enable the "Custom Access Token" hook
-- 3. Select "custom_access_token_hook" function
-- 4. Save configuration
-- 
-- OPTION 2: Supabase CLI
-- supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"
-- 
-- OPTION 3: SQL (self-hosted only)
-- INSERT INTO auth.config (parameter, value)
-- VALUES ('auth.hook.custom_access_token.uri', 'pg-functions://postgres/public/custom_access_token_hook')
-- ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;
--
-- IMPORTANT: After configuration, ALL users must logout and login again
-- to get JWTs with the new custom claims!
-- =====================================================

RAISE NOTICE '';
RAISE NOTICE '=======================================================';
RAISE NOTICE 'Migration Complete - custom_access_token_hook updated';
RAISE NOTICE '=======================================================';
RAISE NOTICE '';
RAISE NOTICE 'NEXT STEPS:';
RAISE NOTICE '1. Configure hook in Supabase Dashboard (see above)';
RAISE NOTICE '2. Have all users logout and login again';
RAISE NOTICE '3. Run verification script: npm run verify:jwt';
RAISE NOTICE '';
