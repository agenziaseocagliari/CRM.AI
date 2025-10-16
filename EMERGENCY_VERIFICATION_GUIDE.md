# 🚨 EMERGENCY SYSTEM VERIFICATION GUIDE

## CRITICAL DEPLOYMENT STATUS

✅ **Aggressive debug alerts deployed**: Commit `e468d79`
✅ **Forced push successful**: Changes are live on Vercel
✅ **Debug system active**: Multiple verification points added

---

## PHASE 1: DATABASE SCHEMA VERIFICATION (5 MIN)

### Query 1: Check workflows Table Schema

```sql
-- Check table existence and full schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'workflows'
ORDER BY ordinal_position;
```

**Expected Result**: 10 rows with columns:

- id (UUID)
- name (TEXT)
- description (TEXT)
- organization_id (UUID)
- created_by (UUID)
- nodes (JSONB)
- edges (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

---

### Query 2: Check Any Workflows Exist

```sql
-- Check total count
SELECT COUNT(*) as total_workflows FROM workflows;

-- Show all workflows if any exist
SELECT
  id,
  name,
  organization_id,
  created_by,
  jsonb_array_length(nodes) as nodes_count,
  created_at
FROM workflows
ORDER BY created_at DESC;
```

**Report**: Total count and any existing workflows

---

### Query 3: Verify RLS Policies

```sql
-- Check RLS policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'workflows';
```

**Expected Result**: 4 policies:

- `org_workflows_select` (SELECT)
- `org_workflows_insert` (INSERT)
- `own_workflows_update` (UPDATE)
- `own_workflows_delete` (DELETE)

---

### Query 4: Test Current User Context

```sql
-- Get your user ID and organization
SELECT
  id as user_id,
  organization_id
FROM profiles
WHERE id = auth.uid();
```

**Copy these values** for next query.

---

### Query 5: Manual Insert Test

```sql
-- Replace YOUR_ORG_ID with actual value from Query 4
INSERT INTO workflows (
  name,
  organization_id,
  created_by,
  nodes,
  edges,
  is_active
) VALUES (
  'Manual Test Workflow',
  'YOUR_ORG_ID_HERE', -- Replace with actual UUID
  auth.uid(),
  '[{"id":"1","type":"default","data":{"label":"Test"}}]'::jsonb,
  '[]'::jsonb,
  false
);

-- Verify insert worked
SELECT * FROM workflows WHERE name = 'Manual Test Workflow';
```

**Expected**: Insert succeeds, SELECT returns the row

---

## PHASE 2: COMPONENT VERIFICATION (IMMEDIATE)

### Step 1: Open Application

1. Go to automation page: **Hard refresh (Ctrl+Shift+F5)**
2. **IMMEDIATELY** look for alert: `"🔥 DEBUG: SavedWorkflowsPanel loaded!"`

**Results**:

- ✅ **Alert appears**: Component is mounting correctly
- ❌ **No alert**: Component integration issue

---

### Step 2: Test Save Button

1. Click **"Salva Workflow Corrente"** button
2. Look for alerts in this order:
   - `"🔥 DEBUG: Save button clicked!"`
   - `"🔥 DEBUG: handleSaveNew CALLED"`
   - `"🔥 DEBUG: About to prompt for name"`

**Results**:

- ✅ **All 3 alerts appear**: Code is executing
- ❌ **Missing alerts**: JavaScript/deployment issue

---

### Step 3: Console Verification

1. **Open F12 Developer Tools → Console**
2. **Refresh page**, look for:
   - `"🔥 SavedWorkflowsPanel MOUNTED"`
   - `"🔥 Current nodes: X"`
   - `"🔥 Current edges: X"`
   - `"🔥 Loading workflows on mount..."`

3. **Click save button**, look for:
   - `"🔥 Button clicked!"`
   - Console group: `"💾 WORKFLOW SAVE PROCESS"`

---

## PHASE 3: FORCE VERCEL REDEPLOY (IF NEEDED)

### Option 1: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com)
2. Find project → Settings → Deployments
3. Latest deployment → "..." → **Redeploy**
4. **Uncheck "Use existing Build Cache"**
5. Deploy

### Option 2: Empty Commit

```bash
git commit --allow-empty -m "force: redeploy with debug alerts"
git push origin main
```

---

## PHASE 4: COMPLETE TEST SEQUENCE

### Test Sequence:

1. **Page Load**: Hard refresh → Check mount alert
2. **Console Check**: F12 → Look for mount logs
3. **Button Test**: Click save → Check button alerts
4. **Save Process**: Enter name → Check save logs
5. **Database Check**: Run manual queries above

### Success Criteria:

✅ Mount alert appears immediately
✅ Console shows all 🔥 logs
✅ Button click alerts work
✅ Database table exists with correct schema
✅ RLS policies configured
✅ Manual insert/select works

---

## EXPECTED ALERT SEQUENCE (NORMAL FLOW)

```
1. Page loads → "🔥 DEBUG: SavedWorkflowsPanel loaded!"
2. Console: "🔥 SavedWorkflowsPanel MOUNTED"
3. Console: "🔥 Loading workflows on mount..."
4. Console: "📥 WORKFLOW LOAD PROCESS" (group)
5. Click save → "🔥 DEBUG: Save button clicked!"
6. Console: "🔥 Button clicked!"
7. Alert: "🔥 DEBUG: handleSaveNew CALLED"
8. Alert: "🔥 DEBUG: About to prompt for name"
9. Console: "💾 WORKFLOW SAVE PROCESS" (group)
```

---

## FAILURE ANALYSIS

### If NO mount alert:

- **Problem**: Component not rendering/integrating
- **Check**: WorkflowCanvas.tsx integration

### If mount alert but NO button alerts:

- **Problem**: Event handlers not working
- **Check**: JavaScript errors in console

### If button alerts but NO console groups:

- **Problem**: Save function not executing properly
- **Check**: Authentication/database connection

### If all alerts but still no workflows appear:

- **Problem**: Database RLS or organization_id mismatch
- **Solution**: Check database queries above

---

## IMMEDIATE ACTION REQUIRED

1. **Test page load** → Look for mount alert
2. **Test save button** → Check all alerts appear
3. **Run database queries** → Verify schema exists
4. **Report results** → Copy ALL console output

**The debug system is LIVE. Test immediately and report findings.**
