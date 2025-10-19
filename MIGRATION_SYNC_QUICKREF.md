# 🔧 Quick Reference: Migration Sync Fix

## Problem
`supabase db push` fails with: "Remote migration versions not found in local migrations directory"

## Root Cause
Remote database has migrations that don't exist as local `.sql` files.

## Solution Summary
**Step 7.5** in `deploy-supabase-robust.sh` now:
1. Fetches remote migration list (JSON)
2. Identifies missing local files
3. Marks remote-only migrations as "applied" locally
4. Allows `supabase db push` to proceed

## Commands Used

### Fetch Remote Migrations
```bash
supabase migration list --json
```

### Parse with jq
```bash
jq -r '.[].version' remote_migrations.json
```

### Mark Migration as Applied
```bash
supabase migration repair --status applied <version> --yes
```

## CI/CD Changes

### GitHub Actions (.github/workflows/deploy-supabase.yml)
- Added: `jq` installation step
- Ensures: JSON parsing capability for migration sync

### Deployment Script (scripts/deploy-supabase-robust.sh)
- Added: Step 7.5 "Synchronize Migration History"
- Updated: TOTAL_STEPS from 8 to 9
- Enhanced: Error handling in Step 8

## Testing Locally

### Prerequisites
```bash
# Install jq
brew install jq  # macOS
sudo apt-get install jq  # Linux
```

### Run Deployment Script
```bash
export SUPABASE_PROJECT_REF=qjtaqrlpronohgpfdxsi
export SUPABASE_ACCESS_TOKEN=<your_token>
bash scripts/deploy-supabase-robust.sh
```

### Expected Output
```
Step 7/9: Check Migration Versions
✅ All migration versions are unique

Step 8/9: Synchronize Migration History
  Retrieving remote migration list...
✅ Remote migration list retrieved
  Checking for remote-only migrations...
✅ All remote migrations exist locally
  (or)
⚠️  Repaired N remote-only migration(s)

Step 9/9: Push Database Migrations
✅ Database migrations pushed successfully
```

## Validation Queries

### Check Remote Migration History
```sql
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC;
```

### Verify Local Files
```bash
ls -1 supabase/migrations/
```

## Success Metrics
- ✅ No "remote migration not found" errors
- ✅ `supabase db push` exits with code 0
- ✅ CI/CD workflow completes successfully
- ✅ All migrations show in remote database

## Rollback Plan
If deployment fails:
1. Check GitHub Actions logs for specific error
2. Verify `SUPABASE_ACCESS_TOKEN` is valid
3. Manually run: `supabase migration list` to check connection
4. Contact DevOps if access token needs rotation

## Resources
- Full Documentation: `MIGRATION_SYNC_SOLUTION.md`
- Deployment Script: `scripts/deploy-supabase-robust.sh`
- CI/CD Workflow: `.github/workflows/deploy-supabase.yml`

---
**Last Updated**: October 20, 2025  
**Status**: ✅ Ready for Deployment
