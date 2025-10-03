# Migration Fix: Integrations Configuration Column

## Problem

During migration deployment, the following error occurred:

```
column 'configuration' of relation 'integrations' does not exist (SQLSTATE 42703)
```

## Root Cause

The migration file `20250122000000_create_integrations_table.sql` used `CREATE TABLE IF NOT EXISTS` which doesn't modify existing tables. If the `integrations` table already existed from a previous migration attempt or manual creation, it wouldn't have the `configuration` column. However, the migration still tried to add a COMMENT to this non-existent column, causing the error.

## Solution

Added conditional `ALTER TABLE` statements before the COMMENT commands to ensure the columns exist:

```sql
-- Add configuration column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'configuration'
    ) THEN
        ALTER TABLE integrations ADD COLUMN configuration JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add credentials column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'credentials'
    ) THEN
        ALTER TABLE integrations ADD COLUMN credentials JSONB DEFAULT '{}';
    END IF;
END $$;
```

## Changes Made

### 1. Migration File
**File**: `supabase/migrations/20250122000000_create_integrations_table.sql`

- Added section "3. Ensure columns exist (for existing tables)"
- Added conditional ALTER TABLE for `configuration` column
- Added conditional ALTER TABLE for `credentials` column (defensive programming)
- These statements run BEFORE the COMMENT commands
- Uses `information_schema.columns` to check column existence

### 2. TypeScript Types
**File**: `src/types.ts`

Added the `Integration` interface for the organization-level integrations table:

```typescript
export interface Integration {
    id: string;
    organization_id: string;
    integration_type: string;
    is_active: boolean;
    configuration: Record<string, any>;
    credentials: Record<string, any>;
    status: 'active' | 'inactive' | 'error' | 'rate_limited';
    last_sync_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}
```

This is separate from the `APIIntegration` interface which is for super-admin level integrations.

## Expected Behavior

The migration will now:

1. Create the `integrations` table if it doesn't exist (with all columns)
2. If the table already exists:
   - Check if `configuration` column exists
   - Add it if missing
   - Check if `credentials` column exists  
   - Add it if missing
3. Add COMMENT to columns (which now definitely exist)

## Testing

### Pre-Deployment Testing

Run these SQL queries in Supabase SQL Editor to verify:

```sql
-- Check if integrations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'integrations'
);

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'integrations'
ORDER BY ordinal_position;
```

### Post-Deployment Verification

```sql
-- Verify configuration column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'integrations'
AND column_name = 'configuration';

-- Should return:
-- column_name  | data_type
-- configuration| jsonb

-- Verify credentials column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'integrations'
AND column_name = 'credentials';

-- Should return:
-- column_name | data_type
-- credentials | jsonb
```

## Migration Order

The migrations execute in this order:

1. `20250122000000_create_integrations_table.sql` - Creates integrations table
2. `20250122235959_add_organization_id_to_workflow_execution_logs.sql`
3. `20250123000000_phase3_performance_indexes.sql`
4. `20250123000001_phase3_system_health_monitoring.sql`
5. `20250123000002_phase3_security_hardening.sql`

## Impact

- **No breaking changes**: The fix is backward compatible
- **Safe for existing deployments**: Checks if columns exist before adding them
- **Type safety**: Added TypeScript interface for frontend/backend code
- **Documentation**: Column comments are now correctly applied

## Deployment

This fix is ready for deployment. Simply push the changes and run the migration:

```bash
git push origin main
# Supabase will automatically run migrations
```

## Related Documentation

- [PHASE_3_MIGRATION_DEPLOYMENT.md](PHASE_3_MIGRATION_DEPLOYMENT.md)
- [IMPLEMENTATION_SUMMARY_PHASE3_MIGRATIONS.md](IMPLEMENTATION_SUMMARY_PHASE3_MIGRATIONS.md)
- [PHASE_3_DEPLOYMENT_READY.md](PHASE_3_DEPLOYMENT_READY.md)
