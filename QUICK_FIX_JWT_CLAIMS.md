# 🚀 Quick Fix: JWT Custom Claim Error

## Problem
Super admin getting: `JWT custom claim user_role not found`

## Immediate Solution (3 Steps)

### 1️⃣ Apply SQL Fix (2 minutes)

Copy and run in **Supabase Dashboard → SQL Editor**:

```sql
-- Drop and recreate hook with enhanced logging
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text;
  user_organization_id uuid;
BEGIN
  RAISE LOG '[custom_access_token_hook] Invoked for user: %', (event->>'user_id');
  
  SELECT role, organization_id
  INTO user_role, user_organization_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  IF user_role IS NOT NULL THEN
    event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));
  ELSE
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
  END IF;
  
  IF user_organization_id IS NOT NULL THEN
    event := jsonb_set(event, '{claims,organization_id}', to_jsonb(user_organization_id::text));
  END IF;
  
  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    event := jsonb_set(event, '{claims,user_role}', to_jsonb('user'));
    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```

---

### 2️⃣ Configure Hook (1 minute)

**In Supabase Dashboard:**
1. Go to **Authentication** → **Hooks**
2. Find "Custom Access Token"
3. Click **Enable**
4. Select `custom_access_token_hook`
5. Click **Save**

---

### 3️⃣ User Must Re-login

**IMPORTANT:** Have super admin user:
1. Fully **logout**
2. **Login again**

⚠️ **Note:** Just refreshing won't work!

---

## Verify It Works

Run in your terminal:
```bash
npm run verify:jwt
```

Should show:
```
✅ user_role claim is present!
✅ Current role: super_admin
```

---

## Still Not Working?

The system now has **automatic fallback** - it will query the database if JWT claim is missing.

**Check edge function logs:**
```
[validateSuperAdmin] DATABASE FALLBACK SUCCESS
```

If you see this, the system is working but hook needs configuration.

---

## Files Modified

**Backend (Edge Functions):**
- ✅ `supabase/functions/_shared/superadmin.ts` - Added database fallback
- ✅ `supabase/functions/_shared/supabase.ts` - Enhanced diagnostics

**Database:**
- ✅ `supabase/migrations/20250932000000_verify_and_fix_custom_access_token_hook.sql` - SQL fix

**Documentation:**
- ✅ `ISSUE_FIX_SUMMARY_JWT_CLAIMS.md` - Full details
- ✅ `JWT_CUSTOM_CLAIMS_TROUBLESHOOTING_GUIDE.md` - Troubleshooting
- ✅ `SUPABASE_BACKEND_CONFIGURATION_COMMANDS.md` - SQL commands

---

## Why This Fixes It

1. **Database Fallback** - System works even if JWT claim missing
2. **Enhanced Logging** - Clear diagnostics in logs
3. **Better Hook** - More robust with error handling
4. **Auto-Detection** - Identifies and reports configuration issues

---

## Next Steps (Optional but Recommended)

1. Monitor edge function logs for "DATABASE FALLBACK"
2. If you see fallbacks, ensure hook is configured
3. Run `npm run verify:jwt` periodically
4. Check [JWT_CUSTOM_CLAIMS_TROUBLESHOOTING_GUIDE.md](./JWT_CUSTOM_CLAIMS_TROUBLESHOOTING_GUIDE.md) for details

---

**Status:** ✅ System will work immediately with fallback
**Optimal:** Configure hook for best performance
**Support:** See ISSUE_FIX_SUMMARY_JWT_CLAIMS.md for full details
