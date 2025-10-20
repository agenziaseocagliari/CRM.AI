# 🧪 PRODUCTION TESTING GUIDE - Profile Lookup Fix Verification

**Date**: October 20, 2025  
**Fix Applied**: Eliminated circular dependency in RLS SELECT policy  
**Migration**: `20251020_fix_rls_circular_dependency.sql`  
**Status**: ✅ Ready for Testing

---

## 🎯 WHAT WAS FIXED

### The Problem
The `profiles_select_policy` RLS policy had a **circular dependency** that caused deadlock:
- Policy condition checked: `organization_id IN (SELECT organization_id FROM profiles WHERE...)`
- That subquery triggered the same RLS policy → infinite recursion → query blocked

### The Solution
- **Removed subquery** from RLS policy
- **Direct JWT claim access**: Reads `organization_id` from JWT payload (no table access)
- **No recursion possible**: Policy no longer references the profiles table

### Expected Result
✅ Profile lookups should work **100% of the time** with no intermittent failures

---

## 🧪 TEST PLAN

### Test 1: Incognito Mode Fresh Login (High Priority)

**Why**: This scenario most reliably triggered the circular dependency bug

**Steps**:
1. Open browser in **Incognito/Private mode**
2. Navigate to: https://your-app-domain.com
3. Login with **insurance user**:
   - Email: `primassicurazionibari@gmail.com`
   - Password: [your password]
4. **Immediately after login**, open browser console (F12)
5. Look for logs starting with `🔍 [loadVerticalConfig]`

**Success Criteria**:
✅ No "Profile lookup failed" error
✅ Console shows: `✅ [loadVerticalConfig] Profilo recuperato con successo`
✅ Dashboard loads with insurance vertical
✅ User sees: "Prima Assicurazioni Bari" profile name

**Expected Console Output**:
```javascript
🔍 [loadVerticalConfig] START { retryCount: 0 }
🔍 [loadVerticalConfig] getUser result: {id: "c623942a-...", email: "primassicurazionibari@gmail.com"}
🔑 [JWT] Complete JWT Payload: {sub: "c623942a-...", email: "...", user_metadata: {...}}
🔑 [JWT] organization_id from user_metadata: "dcfbec5c-6049-4d4d-ba80-a1c412a5861d"
🔍 [loadVerticalConfig] Querying profiles table...
🔍 [loadVerticalConfig] Profile query result: {vertical: "insurance", organization_id: "dcfbec5c-...", ...}
✅ [loadVerticalConfig] Profilo recuperato con successo: {vertical: "insurance", ...}
```

**Failure Indicators** (should NOT appear):
❌ `❌ [loadVerticalConfig] RLS POLICY BLOCKED`
❌ `❌ [loadVerticalConfig] Errore durante il recupero del profilo`
❌ `Error code: PGRST116`
❌ `⏳ [loadVerticalConfig] Tentativo 2/3` (retry should not be needed)

---

### Test 2: Token Refresh Simulation

**Why**: Token refresh was another common trigger for the bug

**Steps**:
1. Login normally to the application
2. Wait for **60 minutes** (or force token refresh)
3. Perform any action that loads profile (e.g., navigate to Settings)
4. Check console for profile reload

**Success Criteria**:
✅ Profile reloads without errors
✅ No retry attempts logged
✅ Application continues working normally

---

### Test 3: Multi-User Organization Access

**Why**: Verifies the organization-based access still works with JWT claims

**Steps**:
1. Login as **enterprise user**: `webproseoid@gmail.com`
2. Navigate to Team/Organization section
3. Verify you can see other users in your organization

**Expected Behavior**:
✅ Can see own profile
✅ Can see other users in organization `2aab4d72-ca5b-438f-93ac-b4c2fe2f8353`
✅ Cannot see users from different organizations

**SQL Verification** (if needed):
```sql
-- Verify organization memberships
SELECT 
  p.id,
  u.email,
  p.organization_id,
  p.vertical,
  p.user_role
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.organization_id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353'
ORDER BY u.email;
```

---

### Test 4: Super Admin Access

**Why**: Verifies super_admin still has full access

**Steps**:
1. Login as **super admin**: `agenziaseocagliari@gmail.com`
2. Navigate to Admin → Users section
3. Verify you can see ALL users across ALL organizations

**Expected Behavior**:
✅ See all 3 users:
  - agenziaseocagliari@gmail.com (super_admin)
  - webproseoid@gmail.com (enterprise)
  - primassicurazionibari@gmail.com (user)

---

### Test 5: New User Signup

**Why**: New users don't have profile yet - most vulnerable to circular dependency

**Steps**:
1. Create new test user account
2. Complete signup process
3. Verify profile is created and loaded

**Success Criteria**:
✅ Profile created in database
✅ User sees their profile immediately after signup
✅ No RLS policy errors during profile creation

---

## 🔍 MONITORING & VERIFICATION

### Real-time Console Monitoring

**What to Watch**:
```javascript
// ✅ GOOD - Profile loaded successfully
🔍 [loadVerticalConfig] Profile query result: {...}
✅ [loadVerticalConfig] Profilo recuperato con successo

// ❌ BAD - Should NOT see these
❌ [loadVerticalConfig] RLS POLICY BLOCKED
⏳ [loadVerticalConfig] Tentativo 2/3 - Riprovo tra 2000ms
```

### Database Verification

**Check RLS Policy**:
```sql
-- Verify the new policy is active
SELECT 
  policyname,
  cmd,
  qual AS using_clause
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname = 'profiles_select_policy';

-- Expected: No subquery in USING clause
-- Should see: organization_id::text = COALESCE(auth.jwt() ->> 'organization_id', ...)
```

**Verify JWT Claims**:
```sql
-- Check user metadata contains organization_id
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'organization_id' as org_id_from_jwt,
  raw_user_meta_data ->> 'user_role' as role_from_jwt,
  raw_user_meta_data ->> 'vertical' as vertical_from_jwt
FROM auth.users
WHERE email = 'primassicurazionibari@gmail.com';

-- Expected: All fields populated
```

---

## 📊 SUCCESS METRICS

### Primary Metrics (Must Pass)
- ✅ **Zero profile lookup errors** in incognito mode
- ✅ **Zero retry attempts** logged in console
- ✅ **100% profile load success rate** across all test scenarios
- ✅ **No PGRST116 errors** in logs

### Secondary Metrics (Should Improve)
- ⚡ **Faster profile load times** (no subquery overhead)
- 📉 **Reduced database queries** (no recursive policy checks)
- ✅ **Consistent behavior** across fresh/cached sessions

---

## 🐛 TROUBLESHOOTING

### If Errors Still Occur

**1. Check Migration Applied**:
```sql
SELECT * FROM _migrations 
WHERE name = '20251020_fix_rls_circular_dependency.sql';
```

**2. Verify Policy Code**:
```sql
\d+ profiles  -- Should show new policy without subquery
```

**3. Check JWT Structure**:
```javascript
// In browser console after login:
const session = await supabase.auth.getSession();
const token = session.data.session.access_token;
const [, payload] = token.split('.');
console.log('JWT:', JSON.parse(atob(payload)));
```

**Expected JWT**:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "user_metadata": {
    "organization_id": "uuid-here",
    "user_role": "role-here",
    "vertical": "insurance"
  }
}
```

**4. Force Policy Refresh**:
```sql
-- If needed, recreate policy
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
-- Then run migration again
```

---

## 📞 SUPPORT

### If Tests Fail

**Collect Diagnostics**:
1. Browser console full output (copy all logs)
2. Network tab → Filter "profiles" → Copy response
3. Screenshot of error message
4. User email that failed
5. Timestamp of failure

**SQL Diagnostics**:
```sql
-- Check user's profile exists
SELECT * FROM profiles WHERE id = 'user-id-here';

-- Check user's JWT metadata
SELECT raw_user_meta_data FROM auth.users WHERE id = 'user-id-here';

-- Test RLS policy directly
SET request.jwt.claim.sub = 'user-id-here';
SELECT * FROM profiles WHERE id = 'user-id-here';
```

---

## ✅ SIGN-OFF CHECKLIST

Before marking this fix as **production-ready**, verify:

- [ ] Test 1 (Incognito) passed - No profile lookup errors
- [ ] Test 2 (Token refresh) passed - No intermittent failures  
- [ ] Test 3 (Multi-user org) passed - Organization access works
- [ ] Test 4 (Super admin) passed - Full access maintained
- [ ] Test 5 (New user) passed - Signup profile creation works
- [ ] Console logs show complete JWT payload
- [ ] No retry attempts in normal operation
- [ ] RLS policy verified with no subquery
- [ ] All 3 existing users tested successfully

**Tester Name**: ___________________  
**Date Tested**: ___________________  
**Result**: ✅ PASS / ❌ FAIL  
**Notes**: ___________________

---

## 🚀 ROLLOUT PLAN

### Phase 1: Staging Testing (Current)
- ✅ Migration applied to staging
- ⏳ Run all 5 tests
- ⏳ Monitor for 24 hours

### Phase 2: Production Deployment
- Apply migration: `psql ... -f supabase/migrations/20251020_fix_rls_circular_dependency.sql`
- Monitor error rates for 1 hour
- Test with real user accounts

### Phase 3: Validation
- Zero RLS policy errors for 48 hours
- User satisfaction feedback
- Mark as **permanently resolved**

---

**Last Updated**: October 20, 2025  
**Next Review**: After production testing complete
