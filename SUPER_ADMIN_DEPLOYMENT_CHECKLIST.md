# ✅ Super Admin Deployment Checklist

**Project**: Guardian AI CRM  
**Feature**: Super Admin Security Implementation  
**Version**: 1.0  
**Date**: 30 Settembre 2024

---

## 📦 Pre-Deployment

### 1. Verifica Codice Locale

- [x] ✅ Tutte le edge functions create (8 functions)
- [x] ✅ Database migration pronta
- [x] ✅ Shared utilities implementate
- [x] ✅ Frontend hook aggiornato
- [x] ✅ TypeScript lint passed
- [x] ✅ Build successful
- [x] ✅ Documentazione completa

```bash
# Verifica lint
npm run lint

# Verifica build
npm run build

# Verifica structure
./scripts/verify-sync.sh
```

---

## 🚀 Deployment Steps

### 2. Database Migration

```bash
# Link al progetto
supabase link --project-ref [YOUR_PROJECT_ID]

# Verifica migrations
supabase db diff

# Apply migration
supabase db push
```

**Verifica**:
```sql
-- Check table created
SELECT * FROM superadmin_logs LIMIT 1;

-- Check role column exists
SELECT role FROM profiles LIMIT 1;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'superadmin_logs';
```

- [ ] superadmin_logs table created
- [ ] profiles.role column exists
- [ ] RLS policies applied
- [ ] Helper functions created

---

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy --no-verify-jwt

# OR deploy individually for testing
supabase functions deploy superadmin-dashboard-stats
supabase functions deploy superadmin-list-users
supabase functions deploy superadmin-update-user
supabase functions deploy superadmin-list-organizations
supabase functions deploy superadmin-update-organization
supabase functions deploy superadmin-manage-payments
supabase functions deploy superadmin-create-org
supabase functions deploy superadmin-logs
```

**Verifica**:
```bash
# List deployed functions
supabase functions list

# Check logs
supabase functions logs superadmin-dashboard-stats
```

- [ ] All 8 functions deployed
- [ ] No deployment errors
- [ ] Functions appear in Supabase Dashboard

---

### 4. Configure Environment Secrets

**Supabase Dashboard → Settings → Edge Functions → Secrets**

Add/Verify:
- [ ] `SUPABASE_URL` - Project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key

```bash
# Verify via CLI (if needed)
supabase secrets list
```

---

### 5. Create First Super Admin User

```sql
-- Option 1: Existing user
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-admin@example.com';

-- Option 2: Create new user (via Supabase Auth first, then)
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'user-uuid-from-auth';

-- Verify
SELECT id, email, role 
FROM profiles 
WHERE role = 'super_admin';
```

- [ ] At least 1 super admin user created
- [ ] User can login to frontend
- [ ] User email verified

---

## 🧪 Testing & Validation

### 6. Run Test Suite

```bash
# Set environment variables
export SUPABASE_URL="https://[project-id].supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPER_ADMIN_JWT="jwt-token-from-login"

# Run tests
./scripts/test-superadmin.sh
```

**Expected Results**:
- [ ] All 8 endpoints return 200 for super admin
- [ ] All endpoints return 403 for non-super admin
- [ ] Audit logs are created for each operation
- [ ] No 500 errors

---

### 7. Frontend Testing

**Login as Super Admin user and verify**:

1. **Dashboard**:
   - [ ] Statistics load correctly
   - [ ] No console errors
   - [ ] Charts/widgets display data

2. **Users Management**:
   - [ ] Users list loads
   - [ ] Search/filter works
   - [ ] Can update user (test in dev only)

3. **Organizations**:
   - [ ] Organizations list loads
   - [ ] Credits display correctly
   - [ ] Status badges show correctly

4. **Payments**:
   - [ ] Payments list loads
   - [ ] Transaction details visible

5. **Audit Logs**:
   - [ ] Logs display
   - [ ] Search/filter works
   - [ ] Previous operations visible

---

### 8. Security Validation

```bash
# Test 1: No authentication (should fail)
curl -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 403 Forbidden

# Test 2: Normal user (should fail)
curl -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer $NORMAL_USER_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 403 Forbidden

# Test 3: Super admin (should succeed)
curl -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 200 OK with stats
```

- [ ] Unauthorized access blocked (403)
- [ ] Normal users blocked (403)
- [ ] Super admin access granted (200)
- [ ] Audit logs created for all operations

---

### 9. RLS Policy Testing

```sql
-- Test as normal user (should fail)
SET ROLE authenticated;
SET request.jwt.claims.sub = 'normal-user-uuid';
SELECT * FROM superadmin_logs;
-- Expected: 0 rows (policy blocks access)

-- Test as super admin (should succeed)
SET ROLE authenticated;
SET request.jwt.claims.sub = 'super-admin-uuid';
SELECT * FROM superadmin_logs;
-- Expected: All rows visible
```

- [ ] Normal users cannot access superadmin_logs
- [ ] Super admins can access all data
- [ ] Policies enforce role restrictions

---

## 📊 Post-Deployment Monitoring

### 10. Monitor for 24 Hours

**Check Supabase Dashboard**:

1. **Edge Functions Logs**:
   - [ ] No unexpected errors
   - [ ] Response times < 2s average
   - [ ] No rate limit issues

2. **Database**:
   - [ ] Audit logs being created
   - [ ] No slow queries
   - [ ] No constraint violations

3. **Auth**:
   - [ ] Super admin logins successful
   - [ ] JWT tokens not expiring prematurely

**SQL Monitoring Queries**:
```sql
-- Recent super admin activity
SELECT 
  admin_email,
  action,
  result,
  created_at
FROM superadmin_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;

-- Failed operations
SELECT 
  action,
  error_message,
  COUNT(*) as failure_count
FROM superadmin_logs
WHERE result = 'FAILURE'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action, error_message;

-- Operations by admin
SELECT 
  admin_email,
  COUNT(*) as operations,
  COUNT(*) FILTER (WHERE result = 'SUCCESS') as success_count,
  COUNT(*) FILTER (WHERE result = 'FAILURE') as failure_count
FROM superadmin_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY admin_email;
```

---

## 🔧 Rollback Plan (If Needed)

### If Critical Issues Occur:

1. **Edge Functions Issues**:
```bash
# Rollback specific function
git checkout main -- supabase/functions/[function-name]
supabase functions deploy [function-name]
```

2. **Database Issues**:
```sql
-- Disable RLS temporarily (EMERGENCY ONLY)
ALTER TABLE superadmin_logs DISABLE ROW LEVEL SECURITY;

-- Remove problematic policies
DROP POLICY IF EXISTS "policy-name" ON superadmin_logs;
```

3. **Frontend Issues**:
```bash
# Revert hook changes
git checkout main -- src/hooks/useSuperAdminData.ts
npm run build
# Deploy frontend
```

---

## ✅ Final Sign-Off

### Deployment Completed By:

- [ ] Developer: ___________________ Date: ___________
- [ ] DevOps: ___________________ Date: ___________
- [ ] Security Review: ___________________ Date: ___________

### Verification Completed:

- [ ] All tests passed
- [ ] Security validated
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured

### Post-Deployment:

- [ ] Update CHANGELOG
- [ ] Notify stakeholders
- [ ] Update training materials
- [ ] Schedule review meeting

---

## 📞 Support Contacts

- **Technical Issues**: Check edge function logs in Supabase Dashboard
- **Security Concerns**: Review audit logs immediately
- **Documentation**: See SUPER_ADMIN_IMPLEMENTATION.md
- **Testing**: Run ./scripts/test-superadmin.sh

---

## 📚 Related Documentation

1. [SUPER_ADMIN_IMPLEMENTATION.md](./SUPER_ADMIN_IMPLEMENTATION.md) - Complete architecture
2. [SUPER_ADMIN_API_REFERENCE.md](./SUPER_ADMIN_API_REFERENCE.md) - API quick reference
3. [EDGE_FUNCTIONS_API.md](./EDGE_FUNCTIONS_API.md) - Full API documentation
4. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - General deployment guide

---

**Status**: 🟢 Ready for Production  
**Last Updated**: 30 September 2024  
**Next Review**: After 7 days in production
