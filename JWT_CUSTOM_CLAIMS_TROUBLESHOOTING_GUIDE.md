# 🔧 JWT Custom Claims Troubleshooting Guide

## 📋 Overview

This guide helps diagnose and fix the "JWT custom claim user_role not found" error that super_admin users may encounter.

**Last Updated:** 2025-10-01  
**Issue:** Super admin users getting JWT claim errors despite proper role in database

---

## 🔍 Quick Diagnosis

### Step 1: Run the Verification Script

```bash
npm run verify:jwt
```

This script will:
- ✅ Check if JWT contains `user_role` custom claim
- ✅ Compare JWT role with database role
- ✅ Verify `custom_access_token_hook` function exists
- ✅ Display comprehensive diagnostics

### Step 2: Check Supabase Logs

1. Go to Supabase Dashboard > Logs
2. Filter by "postgres_logs"
3. Search for: `custom_access_token_hook`
4. Look for LOG/WARNING messages from the hook

---

## 🐛 Common Issues & Solutions

### Issue 1: Hook Function Not Configured

**Symptoms:**
- JWT missing `user_role` claim
- Backend logs show: "user_role claim not found in JWT"
- Hook function exists but not invoked

**Diagnosis:**
```sql
-- Check if hook is configured (run in Supabase SQL Editor)
SELECT parameter, value 
FROM auth.config 
WHERE parameter LIKE '%hook%';
```

**Solution:**

**Option A: Supabase Dashboard**
1. Go to Dashboard → Authentication → Hooks
2. Enable "Custom Access Token" hook
3. Select `custom_access_token_hook` function
4. Click "Save"

**Option B: Supabase CLI**
```bash
supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"
```

**Option C: SQL (Self-hosted only)**
```sql
INSERT INTO auth.config (parameter, value)
VALUES ('auth.hook.custom_access_token.uri', 'pg-functions://postgres/public/custom_access_token_hook')
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;
```

---

### Issue 2: Hook Function Missing or Broken

**Symptoms:**
- Hook is configured but not working
- Postgres logs show errors from hook
- Users getting default 'user' role instead of their actual role

**Diagnosis:**
```sql
-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'custom_access_token_hook';

-- Test the hook manually
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'YOUR_USER_ID_HERE',
    'claims', '{}'::jsonb
  )
);
```

**Solution:**
Run the fix migration:
```bash
# Apply the verification/fix migration
supabase db push migrations/20250932000000_verify_and_fix_custom_access_token_hook.sql
```

Or run it directly in Supabase SQL Editor.

---

### Issue 3: Old JWT Tokens (Most Common)

**Symptoms:**
- Hook is configured correctly
- New logins work fine
- Existing users still get errors
- User role was recently changed

**Root Cause:**
JWT tokens are issued at login time and contain a snapshot of user data. If the hook was configured AFTER users logged in, or if a user's role was changed, their existing JWT won't have the updated claims.

**Solution:**
```typescript
// Option 1: Force user logout (recommended)
await supabase.auth.signOut();
// User must login again

// Option 2: Refresh session (only works if refresh token is new)
const { error } = await supabase.auth.refreshSession();
// ⚠️ This may NOT work if refresh token was issued before hook configuration
```

**Best Practice:**
After configuring the hook or changing user roles, users MUST:
1. Fully logout
2. Login again
3. Do NOT just refresh the page or close/reopen browser

---

### Issue 4: Profile Missing or Incomplete

**Symptoms:**
- JWT contains default 'user' role
- Database has NULL role for user
- User exists but profile is incomplete

**Diagnosis:**
```sql
-- Check user profile
SELECT id, email, role, organization_id, created_at
FROM profiles
WHERE email = 'user@example.com';

-- Check for NULL roles
SELECT COUNT(*) as users_with_null_role
FROM profiles
WHERE role IS NULL;
```

**Solution:**
```sql
-- Set role for specific user
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';

-- Set default role for all NULL roles
UPDATE profiles
SET role = 'user'
WHERE role IS NULL;
```

After updating, user must logout and login again.

---

### Issue 5: Hook Failing Silently

**Symptoms:**
- Hook is configured
- No error logs visible
- JWT still missing claims
- Postgres logs empty

**Diagnosis:**
```sql
-- Enable more verbose logging
ALTER FUNCTION public.custom_access_token_hook
SET log_min_messages TO 'log';

-- Check function security settings
SELECT proname, prosecdef, proconfig
FROM pg_proc
WHERE proname = 'custom_access_token_hook';
```

**Solution:**
Re-create the hook with enhanced error handling:
```bash
supabase db push migrations/20250932000000_verify_and_fix_custom_access_token_hook.sql
```

The updated hook includes:
- ✅ Comprehensive logging
- ✅ Exception handling
- ✅ Fallback to default role on error
- ✅ Detailed diagnostics

---

## 🛠️ Backend Fallback Mechanism

The system now includes a **database fallback** in `validateSuperAdmin`:

```typescript
// If JWT claim is missing, query database as fallback
if (!userRole) {
  console.warn('user_role claim not found - attempting database fallback');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  userRole = profile.role;
}
```

**Benefits:**
- ✅ System continues to work even if JWT claims are missing
- ✅ Graceful degradation instead of hard failure
- ✅ Logs warning to alert admins of configuration issue
- ✅ Allows time to fix hook configuration

**Note:** This is a **safety net**, not the primary mechanism. The JWT claims should still be configured properly for optimal performance.

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **JWT Claim Presence Rate**
   - Track how many requests have `user_role` in JWT
   - Alert if rate drops below 95%

2. **Database Fallback Usage**
   - Count how often fallback is triggered
   - Should be near zero in production

3. **Hook Execution Errors**
   - Monitor postgres logs for hook warnings/errors
   - Alert on any EXCEPTION from hook

### Log Queries

**Check recent hook invocations:**
```sql
-- This requires log analysis tools
-- Example for postgres logs
SELECT * FROM postgres_logs
WHERE message LIKE '%custom_access_token_hook%'
ORDER BY timestamp DESC
LIMIT 100;
```

**Check database fallback usage:**
```javascript
// Look for this in edge function logs:
"user_role claim not found - attempting database fallback"
```

---

## 🧪 Testing Checklist

After making any changes, verify:

- [ ] Hook function exists in database
- [ ] Hook is configured in Supabase Auth settings
- [ ] New user signup creates profile with role
- [ ] New login generates JWT with `user_role` claim
- [ ] Existing user can logout and login successfully
- [ ] Super admin can access super admin routes
- [ ] Regular user cannot access super admin routes
- [ ] Role change triggers logout requirement
- [ ] Verification script (`npm run verify:jwt`) passes

---

## 📚 Related Documentation

- [JWT_CUSTOM_CLAIMS_IMPLEMENTATION.md](./JWT_CUSTOM_CLAIMS_IMPLEMENTATION.md) - Full implementation guide
- [ROLE_CHANGE_HANDLING.md](./ROLE_CHANGE_HANDLING.md) - Role change behavior
- [Supabase Auth Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)

---

## 🆘 Still Having Issues?

### Collect Diagnostic Information

Run these commands and share the output:

```bash
# 1. Verify JWT claims
npm run verify:jwt > jwt-diagnostics.txt

# 2. Check function in database
supabase db dump --schema public --data-only --table profiles > profiles-sample.sql

# 3. Check Supabase configuration
supabase status
```

### Check Backend Logs

1. Go to Supabase Dashboard → Logs
2. Select "Edge Functions" logs
3. Filter by function: `superadmin-*`
4. Look for validation failures
5. Copy relevant log entries

### Common Log Patterns

**✅ Working correctly:**
```
[getUserFromJWT] JWT Payload Diagnostics:
  hasUserRole: true
  userRole: super_admin
[validateSuperAdmin] SUCCESS - Super admin validated
  source: JWT
```

**❌ Hook not configured:**
```
[getUserFromJWT] WARNING: user_role custom claim is MISSING
[validateSuperAdmin] WARNING: user_role claim not found - attempting database fallback
[validateSuperAdmin] DATABASE FALLBACK SUCCESS
```

**❌ Hook configured but user needs re-login:**
```
[getUserFromJWT] hasUserRole: false
[api.ts] JWT Custom Claim Error detected
"Please logout and login again to refresh your session"
```

---

## 🔐 Security Considerations

### Why JWT Claims Are Secure

- JWT is cryptographically signed by Supabase Auth
- Claims cannot be modified without invalidating signature
- Backend always verifies JWT signature before trusting claims
- Hook runs server-side during token generation

### Why Database Fallback Is Safe

- Fallback uses service role key (bypasses RLS)
- User ID comes from verified JWT, not client input
- Fallback is read-only operation
- Logged for audit purposes

### Best Practices

1. ✅ Always use JWT claims when available (primary method)
2. ✅ Use database fallback only as safety net
3. ✅ Monitor fallback usage to detect configuration issues
4. ✅ Fix hook configuration rather than relying on fallback
5. ✅ Log all super admin actions for audit trail

---

## 📞 Support

For additional help:
- Check GitHub Issues
- Review Supabase Dashboard logs
- Run diagnostic scripts
- Contact development team with diagnostic output

**Remember:** After ANY changes to hook configuration or user roles, affected users MUST logout and login again!
