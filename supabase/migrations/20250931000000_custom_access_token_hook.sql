-- =====================================================
-- Custom Access Token Hook Migration
-- =====================================================
-- This migration creates a custom access token hook that adds
-- the user's role from the profiles table as a custom JWT claim.
-- This allows frontend and backend to check permissions directly
-- from the JWT without querying the database.
--
-- Supabase Documentation:
-- https://supabase.com/docs/guides/auth/auth-hooks#hook-custom-access-token

-- =====================================================
-- 1. Create the custom access token hook function
-- =====================================================
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
BEGIN
  -- Log the hook invocation for debugging
  RAISE LOG 'custom_access_token_hook invoked for user: %', (event->>'user_id');
  
  -- Query the user's role and organization_id from the profiles table
  SELECT role, organization_id
  INTO user_role, user_organization_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- If profile found, add custom claims to the JWT
  IF user_role IS NOT NULL THEN
    RAISE LOG 'Adding custom claims to JWT: user_role=%, organization_id=%', user_role, user_organization_id;
    
    -- Add the user_role as a custom claim
    event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));
    
    -- Also add organization_id if it exists
    IF user_organization_id IS NOT NULL THEN
      event := jsonb_set(event, '{claims,organization_id}', to_jsonb(user_organization_id::text));
    END IF;
  ELSE
    -- If no profile found, log warning and set default role
    RAISE WARNING 'No profile found for user %, setting default role', (event->>'user_id');
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
  END IF;
  
  RETURN event;
END;
$$;

-- =====================================================
-- 2. Grant necessary permissions
-- =====================================================
-- The hook function needs to be executable by the supabase_auth_admin role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- =====================================================
-- 3. Add comment for documentation
-- =====================================================
COMMENT ON FUNCTION public.custom_access_token_hook IS 
'Custom access token hook that adds user_role and organization_id from profiles table to JWT claims. 
This hook is automatically called by Supabase Auth when generating access tokens.
The custom claims can be accessed as user.user_role and user.organization_id in the JWT.';

-- =====================================================
-- IMPORTANT: Manual Configuration Required
-- =====================================================
-- After running this migration, you MUST configure the hook in Supabase Dashboard:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. Enable the "Custom Access Token" hook
-- 3. Select the "custom_access_token_hook" function from the dropdown
-- 4. Save the configuration
-- 
-- Alternatively, use the Supabase CLI:
-- supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"
-- 
-- Or via SQL (if using self-hosted):
-- INSERT INTO auth.config (parameter, value)
-- VALUES ('auth.hook.custom_access_token.uri', 'pg-functions://postgres/public/custom_access_token_hook')
-- ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;
