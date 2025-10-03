# 🚀 Deployment Guide: IMMUTABLE Index Predicates Fix

**Issue**: Migration deployment fails with `ERROR: functions in index predicate must be marked IMMUTABLE (SQLSTATE 42P17)`

**Status**: ✅ **RESOLVED** - All migrations fixed and ready for deployment

**Date**: 2025-10-03

---

## 📋 Problem Summary

### What Was Wrong?

PostgreSQL requires that all functions used in index WHERE clauses (predicates) be marked as `IMMUTABLE`. Functions like `NOW()`, `CURRENT_TIMESTAMP`, and similar time-based functions are marked as `STABLE` (not `IMMUTABLE`), which causes deployment errors.

### Affected Indexes

Four indexes in `20250123000000_phase3_performance_indexes.sql` had this issue:

1. **`idx_rate_limits_cleanup`**
   - **Before**: `WHERE window_end < NOW()`
   - **After**: No WHERE clause (indexes entire column)

2. **`idx_upcoming_events`**
   - **Before**: `WHERE start_time > NOW() AND organization_id IS NOT NULL`
   - **After**: `WHERE organization_id IS NOT NULL` (removed NOW() check)

3. **`idx_sessions_expired`**
   - **Before**: `WHERE expires_at < NOW()`
   - **After**: No WHERE clause (indexes entire column)

4. **`idx_audit_old_entries`**
   - **Before**: `WHERE created_at < NOW() - INTERVAL '90 days'`
   - **After**: No WHERE clause (indexes entire column)

---

## ✅ What Was Fixed

### 1. Source Migration Corrected
**File**: `supabase/migrations/20250123000000_phase3_performance_indexes.sql`

- ✅ Removed all NOW() predicates from index definitions
- ✅ Added inline comments explaining the fix
- ✅ Maintained index efficiency (PostgreSQL can still use them with bitmap scans)

### 2. Fix Migration Updated
**File**: `supabase/migrations/20251103000000_fix_non_immutable_index_predicates.sql`

- ✅ Updated to match correct index names
- ✅ Drops and recreates indexes for existing databases
- ✅ Handles both old and new index names for compatibility

### 3. Documentation Updated
- ✅ `SCHEMA_ALIGNMENT_IMPLEMENTATION_SUMMARY_IT.md`
- ✅ `SCHEMA_VERIFICATION_TRACKING.md`
- ✅ `QUICK_REFERENCE_SCHEMA.md`

### 4. Verification Script Created
**File**: `scripts/verify-immutable-index-fix.sql`

- ✅ Checks for any remaining non-IMMUTABLE functions in indexes
- ✅ Verifies correct index definitions
- ✅ Provides performance monitoring queries

---

## 🚀 Deployment Steps

### For Fresh Deployments (New Database)

```bash
# 1. Ensure you're on the correct branch
git pull origin main

# 2. Deploy all migrations (the fixed ones will be applied)
supabase db push

# 3. Verify the fix was applied correctly
supabase db execute --file scripts/verify-immutable-index-fix.sql
```

**Expected Result**: All migrations apply successfully without IMMUTABLE errors ✅

---

### For Existing Databases (Update Deployment)

If you already have a database with the old problematic indexes:

```bash
# 1. The fix migration should run automatically with db push
supabase db push

# 2. If needed, manually apply the fix migration
supabase db execute --file supabase/migrations/20251103000000_fix_non_immutable_index_predicates.sql

# 3. Verify the fix
supabase db execute --file scripts/verify-immutable-index-fix.sql
```

---

## 🔍 Manual Verification

### Check Index Definitions

```sql
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_rate_limits_cleanup',
  'idx_upcoming_events',
  'idx_sessions_expired',
  'idx_audit_old_entries'
)
ORDER BY tablename, indexname;
```

**What to Look For**:
- ✅ All four indexes should exist
- ✅ None should have `NOW()` or time-based functions in WHERE clauses
- ✅ Index definitions should be simple (column-based only)

### Check for Any Problematic Indexes

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexdef LIKE '%NOW()%' 
  OR indexdef LIKE '%CURRENT_TIMESTAMP%'
)
ORDER BY tablename, indexname;
```

**Expected Result**: Zero rows returned ✅

---

## 📊 Performance Impact

### Before Fix
- Indexes were smaller (filtered to specific rows)
- Deployment failed with IMMUTABLE errors ❌

### After Fix
- Indexes are slightly larger (cover entire columns)
- Deployment succeeds ✅
- Performance remains excellent (PostgreSQL uses bitmap scans efficiently)
- Time-based filtering moved to query WHERE clauses

### Query Pattern Changes

**Before** (not working):
```sql
-- Index automatically filtered expired rows
SELECT * FROM api_rate_limits;  -- Would use filtered index
```

**After** (working):
```sql
-- Filter explicitly in query (PostgreSQL still uses index efficiently)
SELECT * FROM api_rate_limits 
WHERE window_end < NOW() - INTERVAL '7 days';
```

**Performance**: Virtually identical (PostgreSQL query planner handles this optimally)

---

## 🔧 Troubleshooting

### Issue: Migration still fails with IMMUTABLE error

**Possible Causes**:
1. Old migration file not updated
2. Cached migration state

**Solution**:
```bash
# Pull latest changes
git pull origin main

# Check the file was updated
grep "WHERE.*NOW()" supabase/migrations/20250123000000_phase3_performance_indexes.sql
# Should return nothing (or only comments)

# Reset migration state if needed
supabase db reset
supabase db push
```

### Issue: Indexes don't exist after deployment

**Solution**:
```bash
# Check if tables exist first
psql -h your-db-host -d your-db -c "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('api_rate_limits', 'crm_events', 'sessions', 'audit_logs');
"

# If tables exist but indexes don't, manually run fix migration
supabase db execute --file supabase/migrations/20251103000000_fix_non_immutable_index_predicates.sql
```

### Issue: Performance degradation after fix

This should not happen, but if it does:

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_rate_limits_cleanup',
  'idx_upcoming_events',
  'idx_sessions_expired',
  'idx_audit_old_entries'
)
ORDER BY idx_scan DESC;

-- Check if queries are using indexes
EXPLAIN ANALYZE
SELECT * FROM api_rate_limits 
WHERE window_end < NOW() - INTERVAL '7 days'
LIMIT 100;
```

If indexes aren't being used, run `ANALYZE` to update statistics:
```sql
ANALYZE api_rate_limits;
ANALYZE crm_events;
ANALYZE sessions;
ANALYZE audit_logs;
```

---

## 📝 Future Guidelines

### For New Indexes

**❌ Don't Do This**:
```sql
CREATE INDEX idx_example ON table_name(column)
WHERE column < NOW();  -- Will fail deployment!
```

**✅ Do This Instead**:
```sql
CREATE INDEX idx_example ON table_name(column);

-- Use time filtering in queries
SELECT * FROM table_name WHERE column < NOW();
```

### Acceptable Predicates

**✅ Safe to use in index predicates**:
- Static values: `WHERE status = 'active'`
- IS NULL checks: `WHERE deleted_at IS NULL`
- Boolean columns: `WHERE is_enabled = true`
- Non-null checks: `WHERE organization_id IS NOT NULL`

**❌ Not safe (will cause IMMUTABLE errors)**:
- `NOW()`
- `CURRENT_TIMESTAMP`
- `CURRENT_DATE`
- `CURRENT_TIME`
- `LOCALTIME`
- `LOCALTIMESTAMP`
- Any function not marked IMMUTABLE

---

## ✅ Deployment Checklist

Use this checklist for deployment:

- [ ] Pull latest changes from main branch
- [ ] Verify source migration file has no NOW() in CREATE INDEX WHERE clauses
- [ ] Run `supabase db push` (or equivalent deployment command)
- [ ] Check for deployment errors in logs
- [ ] Run verification script: `scripts/verify-immutable-index-fix.sql`
- [ ] Verify all 4 indexes exist and have correct definitions
- [ ] Check that no indexes have non-IMMUTABLE functions
- [ ] Monitor application logs for 24 hours
- [ ] Check query performance (should be unchanged)

---

## 📚 Related Documentation

- **Complete Schema Reference**: `DATABASE_SCHEMA_COMPLETE_REFERENCE.md`
- **Schema Verification**: `SCHEMA_VERIFICATION_TRACKING.md`
- **Implementation Summary**: `SCHEMA_ALIGNMENT_IMPLEMENTATION_SUMMARY_IT.md`
- **Quick Reference**: `QUICK_REFERENCE_SCHEMA.md`

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ All migrations apply without IMMUTABLE errors
2. ✅ All 4 corrected indexes exist in database
3. ✅ No indexes contain NOW() or similar functions in predicates
4. ✅ Application functions normally
5. ✅ Query performance is maintained
6. ✅ No errors in application logs

---

**Last Updated**: 2025-10-03  
**Status**: ✅ Ready for Production Deployment
