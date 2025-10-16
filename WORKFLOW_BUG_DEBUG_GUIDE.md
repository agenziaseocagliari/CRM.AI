# 🐛 WORKFLOW BUG DEBUGGING GUIDE

## PROBLEM
Workflows save successfully but don't appear in the SavedWorkflowsPanel list.

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Open Browser Console
1. Press `F12` to open developer tools
2. Go to **Console** tab
3. Clear console (`Ctrl+L`)

### Step 2: Test Workflow Save
1. Create a workflow (add 2 nodes, connect them)
2. Click "Salva Workflow Corrente"
3. **COPY ALL CONSOLE OUTPUT** - especially the grouped logs:
   - `💾 WORKFLOW SAVE PROCESS`
   - `📥 WORKFLOW LOAD PROCESS`

### Step 3: Check Database Directly

**Login to Supabase Dashboard and run these queries:**

#### Query 1: Check if workflow was saved
```sql
-- Check if workflow was actually saved
SELECT
  id,
  name,
  organization_id,
  created_by,
  jsonb_array_length(nodes) as nodes_count,
  jsonb_array_length(edges) as edges_count,
  is_active,
  created_at
FROM workflows
ORDER BY created_at DESC
LIMIT 5;
```

#### Query 2: Test RLS Policies
```sql
-- Test if current user can SELECT workflows
SELECT
  w.*,
  p.organization_id as profile_org_id,
  (w.organization_id = p.organization_id) as org_match
FROM workflows w
CROSS JOIN profiles p
WHERE p.id = auth.uid()
ORDER BY w.created_at DESC;
```

#### Query 3: Temporarily disable RLS (TEST ONLY)
```sql
-- TEMPORARY TEST - Disable RLS
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;

-- Refresh the page and check if workflows appear
-- If they do, RLS is blocking the query

-- IMMEDIATELY re-enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
```

## EXPECTED CONSOLE OUTPUT

When saving workflow, you should see:
```
💾 WORKFLOW SAVE PROCESS
  🔍 Starting workflow save...
  📊 Nodes count: 2
  📊 Edges count: 1
  ✅ User authenticated: [uuid]
  ✅ Organization ID: [uuid]
  💾 SAVE - Organization ID used: [uuid]
  📤 Inserting workflow: { ... }
  ✅ Workflow saved successfully: { ... }
  🔄 Reloading workflows list...
  📥 WORKFLOW LOAD PROCESS
    🔍 Loading workflows...
    ✅ User for loading: [uuid]
    ✅ Loading for organization: [uuid]
    📥 LOAD - Organization ID used: [uuid]
    ✅ Workflows loaded: X workflows
    [TABLE with workflow data]
  🔍 Workflow in list after reload? YES ✅ or NO ❌
  📊 Total workflows in state after save: X
```

## CRITICAL CHECKS

1. **Organization ID Match**: Are the org IDs in SAVE and LOAD identical?
2. **Database Insert**: Does Query 1 show the saved workflow?
3. **RLS Policy**: Does Query 2 return any rows?
4. **State Update**: Does console show "Workflow in list after reload? YES ✅"?

## REPORT TO DEVELOPER

Please provide:
1. **Complete console output** (copy-paste all grouped logs)
2. **Results of SQL Query 1** (number of rows, data)
3. **Results of SQL Query 2** (any rows returned?)
4. **Results of RLS test** (do workflows appear when RLS disabled?)

## POSSIBLE FIXES

Based on the debug output, we can apply one of these fixes:

### Fix 1: Organization ID Mismatch
If SAVE and LOAD org IDs are different:
- Check profile table data
- Verify auth.uid() returns correct user

### Fix 2: RLS Policy Too Strict  
If Query 2 returns no rows:
- Modify RLS policies to be less restrictive
- Check if user profile has organization_id

### Fix 3: State Not Updating
If workflow saves but state doesn't update:
- Force component remount after save
- Check React state management

### Fix 4: Database Query Issue
If Query 1 shows data but Query 2 doesn't:
- RLS policies are blocking the query
- Need to adjust SELECT policy