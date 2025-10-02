# 🚀 Phase 1: Quick Start Guide

**Quick deployment and testing guide for Phase 1 features**

---

## ⚡ 5-Minute Deployment

### Prerequisites
- Supabase project configured
- GitHub repository access
- Node.js 20+ installed
- Supabase CLI installed

### Step 1: Deploy Database (2 minutes)

```bash
# Navigate to project
cd /path/to/CRM-AI

# Apply migrations
supabase db push

# Verify tables created (should see 10 new tables)
supabase db query "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'api_%' 
     OR table_name LIKE 'quota_%' 
     OR table_name LIKE 'user_%' 
     OR table_name LIKE 'login_%' 
     OR table_name LIKE 'security_%' 
     OR table_name LIKE 'trusted_%')
ORDER BY table_name
"
```

**Expected Output**: 10 tables listed
- `api_rate_limits`
- `api_usage_statistics`
- `login_attempts`
- `organization_quota_overrides`
- `quota_alerts`
- `quota_policies`
- `security_alerts`
- `trusted_devices`
- `user_2fa_attempts`
- `user_2fa_settings`

### Step 2: Deploy Edge Functions (2 minutes)

```bash
# Deploy quota management
supabase functions deploy superadmin-quota-management

# Deploy system health
supabase functions deploy superadmin-system-health

# Verify deployment
supabase functions list
```

**Expected Output**: Both functions should show as deployed

### Step 3: Deploy Frontend (1 minute)

**⚠️ IMPORTANTE**: Segui la [Vercel Deployment Policy](./VERCEL_DEPLOYMENT_POLICY.md)

```bash
# Build production bundle
npm run build

# Test locally (optional)
npm run preview

# Deploy to production (via Git push to main)
# ✅ Vercel deploya automaticamente quando fai push a main
git add .
git commit -m "chore: deploy phase 1"
git push origin main  # → Deploy automatico su Vercel

# Alternativa: Deploy manuale (NON RACCOMANDATO)
# vercel deploy --prod
```

**Nota**: Con la nuova policy, il deployment avviene automaticamente su push a `main`. Non serve più usare `vercel deploy` manualmente.

---

## ✅ Testing Checklist (10 minutes)

### Test 1: System Health Dashboard (2 minutes)

1. Login as super admin
2. Navigate to `/super-admin/system-health`
3. Verify metrics display:
   - [ ] System status indicator shows
   - [ ] Total requests count visible
   - [ ] Error rate displays
   - [ ] Auto-refresh works (wait 30 seconds)
4. Check browser console for errors (should be none)

**Screenshot Location**: Take screenshot of dashboard

### Test 2: Quota Management (2 minutes)

1. Navigate to `/super-admin/quota-management`
2. Verify display:
   - [ ] Total requests (24h) shows
   - [ ] Active alerts count shows
   - [ ] Default policies table displays
3. Click "Refresh" button
4. Check that data updates

**Expected**: No errors, all data displays correctly

### Test 3: Enhanced Audit Logs (3 minutes)

1. Navigate to `/super-admin/audit-logs`
2. Verify statistics cards show:
   - [ ] Total logs
   - [ ] Successful operations
   - [ ] Failed operations
   - [ ] Unique admins
3. Test filters:
   - [ ] Click "▼ Show" to expand filters
   - [ ] Select an operation type
   - [ ] Set a date range
   - [ ] Click "Clear Filters"
4. Test export:
   - [ ] Click "📥 Export CSV"
   - [ ] Verify file downloads
   - [ ] Click "📥 Export JSON"
   - [ ] Verify JSON file downloads

**Expected**: All filters work, exports download successfully

### Test 4: Rate Limiting (3 minutes)

Test rate limiting by making rapid API calls:

```bash
# Get your access token
ACCESS_TOKEN="your-jwt-token-here"
SUPABASE_URL="your-supabase-url"

# Make multiple rapid requests (should be rate limited after threshold)
for i in {1..150}; do
  curl -X POST "${SUPABASE_URL}/functions/v1/superadmin-system-health" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" &
done
wait
```

**Expected**: Some requests return 429 (Too Many Requests) after exceeding limit

### Test 5: Mobile Responsiveness (2 minutes)

1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1920px)
4. Verify all dashboards remain usable

**Expected**: Layouts adapt properly to all screen sizes

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" errors

**Solution**:
```bash
# Check edge function logs
supabase functions logs superadmin-system-health --tail

# Verify JWT token is valid
# Check browser console for detailed error
```

### Issue: Database tables not created

**Solution**:
```bash
# Check migration status
supabase db diff

# Re-run migrations
supabase db push --force

# Verify connection
supabase db query "SELECT version()"
```

### Issue: Frontend not loading

**Solution**:
```bash
# Check build errors
npm run build

# Check TypeScript errors
npm run lint

# Clear cache and rebuild
rm -rf dist/ .vite/
npm run build
```

### Issue: Rate limiting not working

**Solution**:
```sql
-- Check if policies are seeded
SELECT * FROM quota_policies;

-- Verify usage statistics are being recorded
SELECT COUNT(*) FROM api_usage_statistics 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check for rate limit records
SELECT * FROM api_rate_limits 
WHERE window_start > NOW() - INTERVAL '1 hour';
```

---

## 📊 Quick Health Check

Run this query to verify Phase 1 is working:

```sql
-- Health Check Query
SELECT 
    'quota_policies' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 5 THEN '✅' ELSE '❌' END as status
FROM quota_policies
UNION ALL
SELECT 
    'api_usage_statistics' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM api_usage_statistics
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'api_rate_limits' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END as status
FROM api_rate_limits
UNION ALL
SELECT 
    'quota_alerts' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM quota_alerts
UNION ALL
SELECT 
    'user_2fa_settings' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM user_2fa_settings;
```

**Expected Output**:
```
table_name              | record_count | status
------------------------|--------------|--------
quota_policies          | 5            | ✅
api_usage_statistics    | 10+          | ✅
api_rate_limits         | 0+           | ✅
quota_alerts            | 0+           | ✅
user_2fa_settings       | 0+           | ✅
```

---

## 🔍 Verify Feature Status

### API Rate Limiting
```bash
# Test endpoint
curl -X POST "${SUPABASE_URL}/functions/v1/superadmin-quota-management" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_global_stats"}'
```

**Expected Response**:
```json
{
  "totalRequests24h": 100,
  "activeAlerts": 0
}
```

### System Health
```bash
# Test endpoint
curl -X POST "${SUPABASE_URL}/functions/v1/superadmin-system-health" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "health": {
    "status": "healthy",
    "uptime": 99.9,
    "metrics": {
      "totalRequests24h": 1000,
      "errorRate": 1.2,
      "avgResponseTime": 250
    }
  }
}
```

---

## 📱 Visual Testing Guide

### System Health Dashboard
![System Health](./docs/screenshots/system-health.png)

**What to Check**:
- ✅ Status badge (healthy/warning/critical)
- ✅ Uptime percentage
- ✅ Metrics cards (6 total)
- ✅ Active alerts section (if any)
- ✅ Endpoint health table
- ✅ Recent errors (if any)

### Quota Management
![Quota Management](./docs/screenshots/quota-management.png)

**What to Check**:
- ✅ Total requests counter
- ✅ Active alerts counter
- ✅ Policy table with 5 rows
- ✅ Refresh button works
- ✅ System status info

### Audit Logs
![Audit Logs](./docs/screenshots/audit-logs.png)

**What to Check**:
- ✅ Statistics cards (4 total)
- ✅ Export buttons (CSV, JSON)
- ✅ Search box
- ✅ Advanced filters panel
- ✅ Log table with data
- ✅ Sorting works

---

## 🎯 Success Criteria

Your deployment is successful if:

- [x] Database: 10 tables created
- [x] Edge Functions: 2 functions deployed
- [x] Frontend: 3 new pages accessible
- [x] System Health: Dashboard loads with metrics
- [x] Quota Management: Dashboard shows statistics
- [x] Audit Logs: Filtering and export work
- [x] Rate Limiting: Requests tracked and limited
- [x] No Console Errors: Browser console clean
- [x] Mobile: Responsive on all devices
- [x] Dark Mode: Works correctly

---

## 🆘 Getting Help

### Quick References
- **Full Documentation**: `PHASE_1_IMPLEMENTATION.md`
- **Completion Summary**: `PHASE_1_COMPLETION_SUMMARY.md`
- **API Reference**: See edge function files

### Common Commands
```bash
# View database logs
supabase db logs --tail

# View edge function logs
supabase functions logs superadmin-system-health --tail

# Check build status
npm run lint && npm run build

# Reset and redeploy
supabase db reset
supabase functions deploy --no-verify-jwt
npm run build && git push origin main  # Deploy automatico Vercel
```

### Contact
- **Technical Issues**: Check Supabase Dashboard logs
- **Frontend Issues**: Check browser console
- **Database Issues**: Run health check query
- **Edge Functions**: Check function logs

---

## 🎓 Next Steps

After successful deployment:

1. **Monitor**: Watch system health dashboard for 24h
2. **Test**: Have users test new features
3. **Optimize**: Review quota policies based on usage
4. **Document**: Add custom policies if needed
5. **Train**: Train team on new features

---

## 🏁 Quick Command Reference

```bash
# Deploy everything
supabase db push
supabase functions deploy superadmin-quota-management
supabase functions deploy superadmin-system-health
npm run build && git push origin main  # ✅ Deploy automatico Vercel

# Check status
supabase functions list
npm run lint

# View logs
supabase functions logs superadmin-system-health --tail
supabase db logs --tail

# Rollback (if needed)
git checkout main
supabase db reset
```

**⚠️ Nota Deployment Frontend**: Con la nuova [Vercel Deployment Policy](./VERCEL_DEPLOYMENT_POLICY.md), il deployment avviene automaticamente su push a `main`.

---

**Deployment Time**: ~5 minutes  
**Testing Time**: ~10 minutes  
**Total Time**: ~15 minutes

**Status**: ✅ Ready to Deploy

---

*For detailed information, see `PHASE_1_IMPLEMENTATION.md`*  
*For completion status, see `PHASE_1_COMPLETION_SUMMARY.md`*
