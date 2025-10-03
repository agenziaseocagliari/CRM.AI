# Phase 3 Integrations Table - Testing Guide

## Overview

This document provides comprehensive testing procedures for the new `integrations` table after Phase 3 migrations are deployed.

---

## Pre-Testing Checklist

Before starting tests, ensure:

- [x] Migration `20250122000000_create_integrations_table.sql` deployed successfully
- [x] Migration `20250123000000_phase3_performance_indexes.sql` deployed successfully
- [ ] Verification script executed: `scripts/verify-phase3-migrations.sql`
- [ ] No errors in Supabase logs
- [ ] RLS policies are active

---

## 1. Database Level Testing

### 1.1 Manual SQL Verification

Connect to your Supabase database and run:

```sql
-- Test 1: Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'integrations'
) as table_exists;

-- Test 2: Check all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'integrations'
ORDER BY ordinal_position;

-- Test 3: Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'integrations';

-- Test 4: Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'integrations';

-- Test 5: Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'integrations';
```

**Expected Results**:
- Table exists: `true`
- 11 columns present (id, organization_id, integration_type, is_active, configuration, credentials, status, last_sync_at, last_error, created_at, updated_at)
- 4 indexes (3 regular + 1 partial from Phase 3)
- RLS enabled: `true`
- 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 1.2 Insert Test Data

```sql
-- Test 6: Insert sample integration (replace with real organization_id)
INSERT INTO integrations (
  organization_id,
  integration_type,
  is_active,
  configuration,
  status
) VALUES (
  'YOUR_ORGANIZATION_ID_HERE'::uuid,
  'whatsapp',
  true,
  '{"phone_number": "+1234567890"}'::jsonb,
  'active'
) RETURNING *;

-- Test 7: Query the inserted data
SELECT * FROM integrations 
WHERE integration_type = 'whatsapp';

-- Test 8: Update integration
UPDATE integrations 
SET is_active = false,
    status = 'inactive'
WHERE integration_type = 'whatsapp'
RETURNING *;

-- Test 9: Clean up test data
DELETE FROM integrations 
WHERE integration_type = 'whatsapp';
```

### 1.3 Performance Testing

```sql
-- Test 10: Check index usage on active integrations query
EXPLAIN ANALYZE
SELECT * FROM integrations
WHERE organization_id = 'YOUR_ORGANIZATION_ID_HERE'::uuid
  AND integration_type = 'whatsapp'
  AND is_active = true;

-- Should show "Index Scan using idx_active_integrations" if Phase 3 index is deployed
```

---

## 2. API Level Testing (TypeScript/JavaScript)

### 2.1 Supabase Client Tests

Create a test file: `tests/integrations.test.ts` (or run in browser console)

```typescript
import { supabase } from './lib/supabaseClient';

// Test 1: List all integrations for organization
async function testListIntegrations(organizationId: string) {
  console.log('Test 1: List integrations...');
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId);
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }
  
  console.log('✅ Success:', data);
  return true;
}

// Test 2: Create new integration
async function testCreateIntegration(organizationId: string) {
  console.log('Test 2: Create integration...');
  const { data, error } = await supabase
    .from('integrations')
    .insert({
      organization_id: organizationId,
      integration_type: 'email',
      is_active: true,
      configuration: { provider: 'mailgun' },
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return null;
  }
  
  console.log('✅ Success:', data);
  return data.id;
}

// Test 3: Update integration
async function testUpdateIntegration(integrationId: string) {
  console.log('Test 3: Update integration...');
  const { data, error } = await supabase
    .from('integrations')
    .update({ 
      is_active: false,
      status: 'inactive'
    })
    .eq('id', integrationId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }
  
  console.log('✅ Success:', data);
  return true;
}

// Test 4: Query with filters (should use index)
async function testFilteredQuery(organizationId: string) {
  console.log('Test 4: Filtered query (active integrations)...');
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }
  
  console.log('✅ Success:', data);
  return true;
}

// Test 5: Delete integration
async function testDeleteIntegration(integrationId: string) {
  console.log('Test 5: Delete integration...');
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('id', integrationId);
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }
  
  console.log('✅ Success: Integration deleted');
  return true;
}

// Run all tests
async function runAllTests(organizationId: string) {
  console.log('=== Starting Integration Tests ===\n');
  
  await testListIntegrations(organizationId);
  const integrationId = await testCreateIntegration(organizationId);
  
  if (integrationId) {
    await testUpdateIntegration(integrationId);
    await testFilteredQuery(organizationId);
    await testDeleteIntegration(integrationId);
  }
  
  console.log('\n=== Tests Complete ===');
}

// Export for use in your application
export { runAllTests };
```

### 2.2 RLS Policy Testing

Test that RLS policies work correctly:

```typescript
// Test 6: RLS - User from different organization should not see integrations
async function testRLSIsolation(organizationId: string, otherOrgId: string) {
  console.log('Test 6: RLS isolation...');
  
  // Try to query another organization's integrations
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', otherOrgId);
  
  if (error) {
    console.error('❌ Error:', error);
    return false;
  }
  
  // Should return empty array if RLS is working
  if (data.length === 0) {
    console.log('✅ Success: RLS isolation working correctly');
    return true;
  } else {
    console.error('❌ Failure: RLS not isolating organizations properly');
    return false;
  }
}

// Test 7: RLS - Non-admin cannot create integrations
async function testRLSPermissions() {
  console.log('Test 7: RLS permissions...');
  
  // This should fail for non-admin users
  const { error } = await supabase
    .from('integrations')
    .insert({
      organization_id: 'test-org-id',
      integration_type: 'test',
      is_active: false
    });
  
  if (error && error.message.includes('policy')) {
    console.log('✅ Success: Non-admin blocked as expected');
    return true;
  } else {
    console.error('❌ Failure: Non-admin able to create integration');
    return false;
  }
}
```

---

## 3. Frontend Component Testing

### 3.1 Create Test Component

Create `src/components/test/IntegrationsTest.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Integration {
  id: string;
  organization_id: string;
  integration_type: string;
  is_active: boolean;
  status: string;
  created_at: string;
}

export const IntegrationsTest: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading integrations...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Integrations Test</h2>
      <div className="space-y-2">
        {integrations.length === 0 ? (
          <p>No integrations found</p>
        ) : (
          integrations.map(int => (
            <div key={int.id} className="border p-3 rounded">
              <p><strong>Type:</strong> {int.integration_type}</p>
              <p><strong>Status:</strong> {int.status}</p>
              <p><strong>Active:</strong> {int.is_active ? 'Yes' : 'No'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

### 3.2 Test the Component

Add to your development router or test page:

```typescript
import { IntegrationsTest } from './components/test/IntegrationsTest';

// In your route configuration
<Route path="/test-integrations" element={<IntegrationsTest />} />
```

---

## 4. Performance Testing

### 4.1 Index Performance Verification

```sql
-- Run before and after deploying Phase 3 indexes

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM integrations
WHERE organization_id = 'YOUR_ORG_ID'::uuid
  AND integration_type = 'whatsapp'
  AND is_active = true;
```

**Expected Results**:
- Without index: Sequential Scan
- With index: Index Scan using `idx_active_integrations`
- Execution time should be < 1ms for small datasets

### 4.2 Load Testing

```typescript
// Load test: Create 100 integrations and measure query time
async function loadTest(organizationId: string) {
  console.log('Starting load test...');
  
  // Create test data
  const integrations = Array.from({ length: 100 }, (_, i) => ({
    organization_id: organizationId,
    integration_type: `test_${i % 10}`,
    is_active: i % 2 === 0,
    status: 'active'
  }));
  
  const start = Date.now();
  const { error: insertError } = await supabase
    .from('integrations')
    .insert(integrations);
  
  const insertTime = Date.now() - start;
  console.log(`Insert time: ${insertTime}ms`);
  
  // Query test
  const queryStart = Date.now();
  const { data, error: queryError } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);
  
  const queryTime = Date.now() - queryStart;
  console.log(`Query time: ${queryTime}ms`);
  console.log(`Results: ${data?.length} integrations`);
  
  // Cleanup
  await supabase
    .from('integrations')
    .delete()
    .like('integration_type', 'test_%');
  
  return { insertTime, queryTime };
}
```

---

## 5. Error Scenario Testing

### 5.1 Constraint Violations

```typescript
// Test unique constraint (organization_id + integration_type)
async function testUniqueConstraint(organizationId: string) {
  // Insert first integration
  await supabase
    .from('integrations')
    .insert({
      organization_id: organizationId,
      integration_type: 'whatsapp',
      is_active: true
    });
  
  // Try to insert duplicate (should fail)
  const { error } = await supabase
    .from('integrations')
    .insert({
      organization_id: organizationId,
      integration_type: 'whatsapp',
      is_active: false
    });
  
  if (error) {
    console.log('✅ Unique constraint working:', error.message);
  } else {
    console.error('❌ Unique constraint not enforced');
  }
}
```

### 5.2 Foreign Key Constraints

```typescript
// Test invalid organization_id
async function testForeignKey() {
  const { error } = await supabase
    .from('integrations')
    .insert({
      organization_id: '00000000-0000-0000-0000-000000000000',
      integration_type: 'test',
      is_active: false
    });
  
  if (error && error.message.includes('foreign key')) {
    console.log('✅ Foreign key constraint working');
  } else {
    console.error('❌ Foreign key constraint not working');
  }
}
```

---

## 6. Monitoring & Observability

### 6.1 Check Index Usage

After running tests for a few days:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'integrations'
ORDER BY idx_scan DESC;
```

### 6.2 Query Performance Analysis

```sql
-- Use the built-in function from Phase 3 migration
SELECT * FROM check_index_health()
WHERE table_name = 'integrations';
```

---

## 7. Integration with Existing Features

### 7.1 Test with API Integrations Manager

If you have the `APIIntegrationsManager` component:

1. Navigate to Super Admin dashboard
2. Try to view integrations
3. Verify that `api_integrations` and `integrations` are separate tables
4. Ensure no conflicts between the two tables

### 7.2 Test Organization Switching

```typescript
// Test that integrations change when switching organizations
async function testOrganizationSwitch(org1Id: string, org2Id: string) {
  // Get integrations for org1
  const { data: org1Data } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', org1Id);
  
  // Get integrations for org2
  const { data: org2Data } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', org2Id);
  
  // Verify different results
  console.log('Org 1 integrations:', org1Data?.length);
  console.log('Org 2 integrations:', org2Data?.length);
}
```

---

## Success Criteria

All tests should pass with:

- ✅ Table structure correct
- ✅ All indexes created
- ✅ RLS policies enforcing security
- ✅ CRUD operations working
- ✅ Performance improvement visible
- ✅ No errors in Supabase logs
- ✅ Constraints enforced properly
- ✅ Foreign keys working
- ✅ Unique constraints working

---

## Troubleshooting

### Common Issues

1. **"relation 'integrations' does not exist"**
   - Solution: Run migration `20250122000000_create_integrations_table.sql`

2. **"permission denied for table integrations"**
   - Solution: Check RLS policies are created and user has correct role

3. **"duplicate key value violates unique constraint"**
   - Solution: This is expected - only one integration per type per organization

4. **Slow queries**
   - Solution: Ensure Phase 3 indexes are deployed

5. **RLS blocking legitimate access**
   - Solution: Verify user's organization_id matches the integration's organization_id

---

## Next Steps

After successful testing:

1. Document any issues found
2. Update `PHASE_3_MILESTONE_TRACKING.md`
3. Deploy to production
4. Monitor for 48 hours
5. Mark milestone as complete

---

**Last Updated**: 2025-01-23  
**Status**: Ready for Testing
