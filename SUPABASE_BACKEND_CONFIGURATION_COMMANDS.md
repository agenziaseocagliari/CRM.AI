# 🔧 Supabase Backend Configuration Commands

## Overview

This document contains ready-to-run SQL commands to diagnose and fix JWT custom claims issues in Supabase.

**Use Case:** Super admin users getting "JWT custom claim user_role not found" error

---

## 🔍 Step 1: Verify Current State

Run these commands in **Supabase Dashboard → SQL Editor**:

### Check if Hook Function Exists

```sql
-- Check if custom_access_token_hook function exists
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security,
  l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE p.proname = 'custom_access_token_hook'
  AND n.nspname = 'public';
```

**Expected Result:** One row showing the function exists

**If empty:** Function doesn't exist, skip to Step 2

---

### Check Hook Configuration

```sql
-- Check if hook is configured in auth.config
SELECT parameter, value 
FROM auth.config 
WHERE parameter LIKE '%hook%'
  OR parameter LIKE '%custom_access_token%';
```

**Expected Result:** Row with `auth.hook.custom_access_token.uri` = `pg-functions://postgres/public/custom_access_token_hook`

**If empty:** Hook exists but not configured (see Step 3)

---

### Check Profiles Table Structure

```sql
-- Verify profiles table has required columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'role', 'organization_id')
ORDER BY ordinal_position;
```

**Expected Result:** Three rows showing id, role, and organization_id columns

---

### Check for Users with NULL Roles

```sql
-- Find users with NULL or missing roles
SELECT 
  id,
  email,
  role,
  organization_id,
  created_at
FROM profiles
WHERE role IS NULL
   OR role = ''
ORDER BY created_at DESC;
```

**Expected Result:** Ideally empty, or shows users needing role assignment

---

### Test Hook Function with Sample User

```sql
-- Test the hook with your super admin user
-- Replace 'YOUR_EMAIL_HERE' with actual super admin email
DO $$
DECLARE
  test_user_id uuid;
  test_event jsonb;
  result jsonb;
BEGIN
  -- Get your user ID
  SELECT id INTO test_user_id
  FROM profiles
  WHERE email = 'YOUR_EMAIL_HERE';  -- ⚠️ REPLACE THIS
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found';
    RETURN;
  END IF;
  
  -- Create test event
  test_event := jsonb_build_object(
    'user_id', test_user_id::text,
    'claims', '{}'::jsonb
  );
  
  -- Call hook
  result := public.custom_access_token_hook(test_event);
  
  -- Display results
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Result: %', result::text;
  RAISE NOTICE 'user_role claim: %', result->'claims'->'user_role';
  RAISE NOTICE 'organization_id claim: %', result->'claims'->'organization_id';
  
  IF result->'claims'->'user_role' IS NULL THEN
    RAISE WARNING '❌ Hook did NOT add user_role claim';
  ELSE
    RAISE NOTICE '✅ Hook added user_role: %', result->'claims'->'user_role';
  END IF;
END $$;
```

---

## 🔧 Step 2: Create/Update Hook Function

If the function doesn't exist or needs fixing, run this:

```sql
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Create enhanced hook function with comprehensive logging
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
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RAISE LOG '[custom_access_token_hook] Set default role: user';
    RETURN event;
  END IF;
  
  -- Query the user's role and organization_id
  SELECT role, organization_id
  INTO user_role, user_organization_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  RAISE LOG '[custom_access_token_hook] Profile found - role: %, org_id: %', 
    COALESCE(user_role, 'NULL'), COALESCE(user_organization_id::text, 'NULL');
  
  -- Add user_role claim
  IF user_role IS NOT NULL THEN
    event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));
    RAISE LOG '[custom_access_token_hook] Added user_role claim: %', user_role;
  ELSE
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RAISE WARNING '[custom_access_token_hook] Role was NULL, set default: user';
  END IF;
  
  -- Add organization_id claim if exists
  IF user_organization_id IS NOT NULL THEN
    event := jsonb_set(event, '{claims,organization_id}', to_jsonb(user_organization_id::text));
    RAISE LOG '[custom_access_token_hook] Added organization_id claim';
  END IF;
  
  RAISE LOG '[custom_access_token_hook] Successfully added custom claims';
  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[custom_access_token_hook] EXCEPTION: % - %', SQLERRM, SQLSTATE;
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RETURN event;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Add comment
COMMENT ON FUNCTION public.custom_access_token_hook IS 
'Enhanced custom access token hook that adds user_role and organization_id to JWT claims. Updated: 2025-10-01';

-- Verify creation
SELECT 'Hook function created successfully' AS status;
```

---

## 🔌 Step 3: Configure Hook in Supabase Auth

### Option A: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Hooks**
3. Find "Custom Access Token" section
4. Click **"Enable Hook"**
5. Select `custom_access_token_hook` from dropdown
6. Click **"Save"**

### Option B: SQL Command (Self-hosted only)

```sql
-- Configure hook via SQL (only works on self-hosted Supabase)
INSERT INTO auth.config (parameter, value)
VALUES ('auth.hook.custom_access_token.uri', 'pg-functions://postgres/public/custom_access_token_hook')
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;

-- Verify configuration
SELECT parameter, value 
FROM auth.config 
WHERE parameter = 'auth.hook.custom_access_token.uri';
```

**Note:** For Supabase Cloud, you MUST use the Dashboard (Option A)

---

## 🔍 Step 4: Verify Configuration

After configuring the hook, verify it's working:

```sql
-- Check hook is registered
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.config 
      WHERE parameter = 'auth.hook.custom_access_token.uri'
    ) THEN '✅ Hook is configured'
    ELSE '❌ Hook is NOT configured'
  END AS hook_status;

-- Check hook function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'custom_access_token_hook'
    ) THEN '✅ Hook function exists'
    ELSE '❌ Hook function NOT found'
  END AS function_status;
```

---

## 👤 Step 5: Fix User Roles

If specific users have NULL or incorrect roles:

```sql
-- Set super_admin role for specific user
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL

-- Verify update
SELECT id, email, role, organization_id
FROM profiles
WHERE email = 'admin@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL
```

Set default role for all users with NULL:

```sql
-- Set 'user' role for all NULL roles
UPDATE profiles
SET role = 'user'
WHERE role IS NULL;

-- Show how many were updated
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') AS total_super_admins,
  (SELECT COUNT(*) FROM profiles WHERE role IS NULL) AS users_with_null_role;
```

---

## 🧪 Step 6: Test with Real User

After configuration, have a super admin user:

1. **Fully logout** from the application
2. **Login again** (refresh won't work!)
3. Try accessing super admin dashboard

Then verify their JWT contains claims:

```sql
-- Check recent auth events (if available)
-- This shows if users are logging in after hook configuration
SELECT 
  created_at,
  event_type,
  user_id,
  json_extract_path_text(raw_user_meta_data::text, 'email') as email
FROM auth.audit_log_entries
WHERE event_type IN ('login', 'token_refreshed')
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 Step 7: Monitor Hook Execution

Enable detailed logging to monitor hook execution:

```sql
-- Enable detailed logging for hook function
ALTER FUNCTION public.custom_access_token_hook
SET log_min_messages TO 'log';

-- To view logs after this, check:
-- Supabase Dashboard → Logs → Postgres Logs
-- Filter by: "custom_access_token_hook"
```

---

## 🚨 Emergency Rollback

If something goes wrong, disable the hook:

```sql
-- Remove hook configuration (self-hosted only)
DELETE FROM auth.config 
WHERE parameter = 'auth.hook.custom_access_token.uri';

-- For Supabase Cloud: Go to Dashboard → Authentication → Hooks → Disable
```

The system will continue to work using the database fallback mechanism.

---

## ✅ Final Verification Checklist

Run this comprehensive check:

```sql
-- Comprehensive verification query
SELECT 
  '1. Hook Function' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'custom_access_token_hook')
    THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
UNION ALL
SELECT 
  '2. Hook Configuration',
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.config WHERE parameter = 'auth.hook.custom_access_token.uri')
    THEN '✅ Configured'
    ELSE '❌ Not Configured'
  END
UNION ALL
SELECT 
  '3. Super Admin Users',
  CAST(COUNT(*) AS TEXT) || ' found'
FROM profiles
WHERE role = 'super_admin'
UNION ALL
SELECT 
  '4. Users with NULL role',
  CAST(COUNT(*) AS TEXT) || CASE WHEN COUNT(*) > 0 THEN ' ⚠️ Need fixing' ELSE ' ✅' END
FROM profiles
WHERE role IS NULL
UNION ALL
SELECT 
  '5. Total Users',
  CAST(COUNT(*) AS TEXT)
FROM profiles;
```

---

## 🔐 Security Notes

- The hook function runs with `SECURITY DEFINER` (elevated privileges)
- Only `supabase_auth_admin` role can execute it
- Hook is invoked automatically by Supabase Auth during token generation
- Hook has exception handling to prevent auth failures
- All operations are logged for audit purposes

---

## 📞 Support

If issues persist after following all steps:

1. Run `npm run verify:jwt` in your local environment
2. Check Supabase Dashboard → Logs for errors
3. Share diagnostic output with development team
4. Review [JWT_CUSTOM_CLAIMS_TROUBLESHOOTING_GUIDE.md](./JWT_CUSTOM_CLAIMS_TROUBLESHOOTING_GUIDE.md)

**Important:** After ANY configuration changes, users MUST logout and login again. Simply refreshing the page or session will NOT add missing JWT claims!
