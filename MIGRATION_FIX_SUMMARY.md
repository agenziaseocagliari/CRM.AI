# Migration Fix Summary: Supabase Rate Limiting Function Conflict

## Problem Statement

During deployment of migration `20251002000001_create_rate_limiting_schema.sql` to Supabase/Postgres, the operation was blocked with:

```
ERROR: function name "check_rate_limit" is not unique (SQLSTATE 42725)
```

### Root Cause

Two migration files were creating functions with the same name but different signatures:

1. **20250102000001_rate_limiting_and_quota.sql** (older migration):
   - Function: `check_rate_limit(UUID, UUID, TEXT, INTEGER, INTEGER)` 
   - Returns: `BOOLEAN`
   - Parameters: `p_organization_id`, `p_user_id`, `p_endpoint`, `p_max_requests`, `p_window_minutes`

2. **20251002000001_create_rate_limiting_schema.sql** (newer migration):
   - Function: `check_rate_limit(UUID, TEXT, TEXT)`
   - Returns: `TABLE(is_allowed BOOLEAN, current_usage INTEGER, ...)`
   - Parameters: `p_organization_id`, `p_resource_type`, `p_endpoint`

PostgreSQL's function uniqueness is based on the function name AND parameter types. The newer migration was using `CREATE OR REPLACE FUNCTION`, but this only works if the function signature is identical. Since the signatures were different, PostgreSQL treated them as separate overloaded functions, causing the error.

## Solution Implemented

### 1. Added DROP FUNCTION Statements

Added explicit `DROP FUNCTION IF EXISTS` statements for all possible signatures before creating the new function:

```sql
-- Drop any existing versions of check_rate_limit function to avoid conflicts
-- This ensures idempotent migration and resolves duplicate function errors
DROP FUNCTION IF EXISTS check_rate_limit(UUID, UUID, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit(UUID, TEXT) CASCADE;

-- Function to check rate limit (sliding window algorithm)
CREATE FUNCTION check_rate_limit(
    p_organization_id UUID,
    p_resource_type TEXT,
    p_endpoint TEXT DEFAULT NULL
)
RETURNS TABLE(...) AS $$
...
```

### 2. Changed to CREATE FUNCTION

Changed from `CREATE OR REPLACE FUNCTION` to `CREATE FUNCTION` since we're explicitly dropping the function first. This makes the intent clearer and avoids confusion.

### 3. Used CASCADE

The `CASCADE` option in `DROP FUNCTION` ensures that any dependent objects (triggers, views, etc.) are also dropped, preventing cascade errors.

## Verification

### TypeScript Code Compatibility

Verified that the frontend code (`src/lib/rateLimiter.ts`) uses the **new** function signature:

```typescript
const { data, error } = await supabase.rpc('check_rate_limit', {
  p_organization_id: organizationId,
  p_resource_type: resourceType,
  p_endpoint: endpoint || null,
});
```

This matches the new migration's signature ✅

### Test Results

All 19 rate limiter tests passed:

```
✓ src/__tests__/rateLimiter.test.ts (19 tests) 27ms
  Test Files  1 passed (1)
       Tests  19 passed (19)
```

### Idempotency

The migration is now idempotent:
- ✅ Can be run multiple times without errors
- ✅ `DROP FUNCTION IF EXISTS` prevents errors on re-runs
- ✅ No breaking changes to existing functionality

## Impact Analysis

### No Breaking Changes

✅ **Frontend/API**: The TypeScript code already uses the new signature  
✅ **Database**: Old function will be replaced cleanly with new one  
✅ **Edge Functions**: No edge functions call the old signature  
✅ **Tests**: All tests passing with new signature  

### Migration Order

The migration files will be applied in chronological order:
1. `20250102000001_rate_limiting_and_quota.sql` - Creates old function
2. `20251002000001_create_rate_limiting_schema.sql` - Drops old function, creates new one

This ensures a smooth transition from the old to the new implementation.

## Best Practices Applied

1. ✅ **Idempotent Migrations**: Using `DROP ... IF EXISTS` and `CREATE TABLE IF NOT EXISTS`
2. ✅ **Explicit Signatures**: Dropping all possible function signatures to avoid conflicts
3. ✅ **CASCADE**: Cleaning up dependent objects automatically
4. ✅ **Clear Comments**: Documenting why the DROP statements are needed
5. ✅ **Minimal Changes**: Only modified the migration file, no changes to application code needed

## Files Changed

- `supabase/migrations/20251002000001_create_rate_limiting_schema.sql`
  - Added DROP FUNCTION statements (lines 129-133)
  - Changed CREATE OR REPLACE to CREATE (line 136)
  - Added explanatory comments

## Deployment Checklist

- [x] Migration file updated with DROP statements
- [x] Tests passing (19/19)
- [x] TypeScript linting passing
- [x] No breaking changes to frontend/API
- [x] Migration is idempotent
- [x] Documentation updated

## Next Steps

The migration is now ready for deployment to Supabase. The CI/CD pipeline should complete successfully without the function name conflict error.

---

**Author**: GitHub Copilot  
**Date**: 2025-01-21  
**Issue**: Fix Migration - Supabase ERROR function name "check_rate_limit" is not unique
