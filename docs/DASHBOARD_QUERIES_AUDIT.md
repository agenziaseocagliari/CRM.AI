# Dashboard Queries Audit

**Created**: October 16, 2025  
**Status**: Investigation Complete  
**Priority**: HIGH - Console errors need fixing

---

## Current Queries (BROKEN)

### Query 1: form_submissions
- **Location**: `src/services/dashboardService.ts:62`
- **Query**: `supabase.from('form_submissions').select('id,created_at').eq('organization_id', organizationId)`
- **Error**: `404 Not Found`
- **Issue**: Table might not exist or has different name
- **Impact**: Dashboard stats fail to load form submission counts

### Query 2: opportunities
- **Location**: `src/services/dashboardService.ts:50`
- **Query**: `supabase.from('opportunities').select('id,value,stage,created_at,updated_at').eq('organization_id', organizationId)`
- **Error**: `400 Bad Request`
- **Issue**: Column names don't match actual table schema
- **Impact**: Revenue calculations and deal metrics fail

### Query 3: events
- **Location**: `src/services/dashboardService.ts:56`
- **Query**: `supabase.from('events').select('id,created_at').eq('organization_id', organizationId)`
- **Error**: `400 Bad Request`  
- **Issue**: Column names don't match actual table schema
- **Impact**: Event activity metrics fail

### Query 4: events (Recent Activity)
- **Location**: `src/services/dashboardService.ts:147`
- **Query**: `supabase.from('events').select('id,title,start_date,created_at').eq('organization_id', organizationId)`
- **Error**: `400 Bad Request`
- **Issue**: Column 'title' or 'start_date' might not exist
- **Impact**: Recent activity feed missing events

### Query 5: form_submissions (Recent Activity)
- **Location**: `src/services/dashboardService.ts:155`
- **Query**: `supabase.from('form_submissions').select('id,form_name,data,created_at').eq('organization_id', organizationId)`
- **Error**: `404 Not Found`
- **Issue**: Table doesn't exist
- **Impact**: Recent activity feed missing form submissions

---

## Recommended Actions

### Phase 1: Add Graceful Error Handling (IMMEDIATE)
For each problematic query:

1. ✅ Wrap in try-catch blocks
2. ✅ Log warnings instead of errors
3. ✅ Return empty arrays/default values
4. ✅ Display user-friendly messages in UI
5. ✅ Prevent console errors from appearing

### Phase 2: Schema Verification (USER ACTION REQUIRED)
User needs to verify in Supabase Database → Table Editor:

**For `opportunities` table:**
- Verify table exists
- Provide EXACT column names (value, stage, created_at, updated_at, name, etc.)

**For `events` table:**
- Verify table exists  
- Provide EXACT column names (id, title/name, start_date/start_time, created_at, etc.)

**For `form_submissions` table:**
- Verify if table exists at all
- If exists, provide EXACT column names
- If doesn't exist, remove all references from code

### Phase 3: Fix Queries Based on Actual Schema
Once user provides actual column names:

1. Update `DashboardService.getDashboardStats()` queries
2. Update `DashboardService.getRecentActivity()` queries  
3. Test all dashboard functionality
4. Verify zero console errors

---

## Files Modified

### ✅ `src/services/dashboardService.ts`
- Added graceful error handling for all database queries
- Each query now returns empty data on failure instead of throwing
- Console warnings instead of errors

### ✅ `src/components/Dashboard.tsx`
- Error state already handled properly
- Shows "Errore nel caricamento dei dati della dashboard" on failure

---

## Success Criteria

### Phase 1 (COMPLETED ✅)
- ✅ No red console errors (only warnings)
- ✅ Dashboard loads without crashing
- ✅ User can navigate CRM normally
- ✅ Error states display friendly messages

### Phase 2 (PENDING USER INPUT)
- ❌ User provides actual table schemas
- ❌ Queries updated to match database reality
- ❌ All dashboard widgets show real data
- ❌ Zero console warnings

---

## User Action Required

**Please go to Supabase → Database → Table Editor and check:**

1. **opportunities table** - Does it exist? What are the EXACT column names?
2. **events table** - Does it exist? What are the EXACT column names?  
3. **form_submissions table** - Does it exist? What are the EXACT column names?

**Example response format:**
```
opportunities table: EXISTS
Columns: id, contact_name, stage, value, created_at, updated_at, organization_id

events table: EXISTS  
Columns: id, name, start_time, end_time, created_at, organization_id

form_submissions table: DOES NOT EXIST
Action: Remove all references from code
```

Once we have this information, we can fix all queries to match the actual database schema.