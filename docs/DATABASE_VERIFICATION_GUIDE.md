# Database Verification Guide - Workflow Executions

## Overview

This guide provides steps to verify that the workflow execution system is properly logging data to the Supabase `workflow_executions` table.

## Quick Verification Steps

### 1. Check Table Structure

```sql
-- Verify the workflow_executions table exists and has correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workflow_executions'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (uuid, not null, primary key)
- `organization_id` (uuid, not null)
- `workflow_data` (jsonb)
- `status` (text, default 'completed')
- `execution_time` (timestamp with time zone, default now())
- `created_at` (timestamp with time zone, default now())

### 2. Verify Recent Executions

```sql
-- Check latest workflow executions
SELECT
    id,
    organization_id,
    status,
    execution_time,
    jsonb_pretty(workflow_data) as workflow_details
FROM workflow_executions
ORDER BY execution_time DESC
LIMIT 5;
```

### 3. Check Organization Data

```sql
-- Verify organization_id is being populated correctly
SELECT DISTINCT organization_id, COUNT(*) as execution_count
FROM workflow_executions
GROUP BY organization_id
ORDER BY execution_count DESC;
```

## Debugging Common Issues

### Issue: No Records Found

**Possible Causes:**

1. RLS (Row Level Security) policies blocking access
2. User not authenticated properly
3. Workflow execution failing before database insert

**Solutions:**

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'workflow_executions';

-- Temporarily disable RLS for testing (admin only)
ALTER TABLE workflow_executions DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
```

### Issue: organization_id is NULL

**Possible Causes:**

1. User authentication not working
2. Profile lookup failing
3. Hardcoded fallback organization not set

**Solutions:**

1. Check user authentication in browser console
2. Verify profile table has correct organization_id
3. Check workflowExecutionEngine.ts for proper user data retrieval

### Issue: Workflow Data Not Saving

**Possible Causes:**

1. JSONB format issues
2. Data too large for database
3. Network/connection issues

**Solutions:**

1. Check browser console for Supabase errors
2. Verify workflow data structure is valid JSON
3. Test with smaller workflow first

## Production Monitoring

### Daily Health Check

```sql
-- Check today's workflow executions
SELECT
    DATE(execution_time) as date,
    COUNT(*) as total_executions,
    COUNT(DISTINCT organization_id) as unique_organizations,
    AVG(EXTRACT(EPOCH FROM (created_at - execution_time))) as avg_processing_time_seconds
FROM workflow_executions
WHERE execution_time >= CURRENT_DATE
GROUP BY DATE(execution_time)
ORDER BY date DESC;
```

### Error Rate Monitoring

```sql
-- Check execution status distribution
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM workflow_executions
WHERE execution_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status
ORDER BY count DESC;
```

## Console Log Verification

When testing workflows in the application, look for these console messages:

### Successful Execution

```
🎯 Workflow Execution Started
📊 Workflow Data: [detailed JSON object]
👤 User Organization: [uuid]
✅ Execution saved to database with ID: [uuid]
🎉 Workflow executed successfully!
```

### Error Scenarios

```
❌ Failed to save execution to database: [error details]
⚠️ No organization found for user, using fallback
🔍 Debug - User data: [user object]
```

## Integration with Application

### Frontend Verification

1. Open browser developer tools
2. Navigate to Automation module
3. Create and execute a test workflow
4. Check console for execution logs
5. Verify success message appears to user

### Backend Verification

1. Check Supabase dashboard
2. Navigate to workflow_executions table
3. Verify new record appears with correct data
4. Check organization_id matches authenticated user

## Troubleshooting Checklist

- [ ] Table exists and has correct schema
- [ ] RLS policies allow user access
- [ ] User is properly authenticated
- [ ] Organization ID is correctly retrieved
- [ ] Workflow data is valid JSON
- [ ] Console shows successful database save
- [ ] Records appear in Supabase dashboard
- [ ] Email/SMS/WhatsApp APIs are responding
- [ ] User receives confirmation message

## Performance Considerations

### Indexing

```sql
-- Recommended indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_time
ON workflow_executions(organization_id, execution_time DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
ON workflow_executions(status) WHERE status != 'completed';
```

### Data Retention

```sql
-- Clean up old executions (run monthly)
DELETE FROM workflow_executions
WHERE execution_time < CURRENT_DATE - INTERVAL '6 months'
AND status = 'completed';
```

## Contact Information

For technical support or issues with the workflow execution system:

- Check application console logs first
- Verify database connectivity
- Review this verification guide
- Test with minimal workflow first

Last Updated: October 16, 2025
