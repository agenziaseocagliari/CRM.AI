# 🔧 SQL MIGRATION REPAIR - Step by Step Execution

**Date**: October 16, 2025  
**Issue**: Original migration only created form_submissions table, missing VIEWs  
**Solution**: 3 separate SQL files for guaranteed execution

---

## 🎯 EXECUTION INSTRUCTIONS

### Step 1: Create dashboard_opportunities VIEW

1. **Open Supabase SQL Editor**
2. **Copy all content** from `01_create_views_opportunities.sql`
3. **Paste and RUN** in SQL Editor
4. **Expected Output**:
   ```
   status: "dashboard_opportunities VIEW created successfully ✅"
   Columns: id, name, stage, value, created_at, updated_at, organization_id
   Record count: [your number]
   ```

---

### Step 2: Create dashboard_events VIEW

1. **Copy all content** from `02_create_views_events.sql`
2. **Paste and RUN** in SQL Editor
3. **Expected Output**:
   ```
   status: "dashboard_events VIEW created successfully ✅"
   Columns: id, title, start_date, created_at, organization_id
   Record count: [your number]
   ```

---

### Step 3: Complete Verification

1. **Copy all content** from `03_verify_all_objects.sql`
2. **Paste and RUN** in SQL Editor
3. **Expected Output**:

   ```
   table_name               | table_type  | object_status
   dashboard_events         | VIEW        | ✅ VIEW
   dashboard_opportunities  | VIEW        | ✅ VIEW
   form_submissions        | BASE TABLE  | ✅ TABLE

   Final status: "🎯 DASHBOARD MIGRATION COMPLETE - Test your dashboard now!"
   ```

---

## ✅ SUCCESS CRITERIA

After completing all 3 steps, you should have:

- ✅ **dashboard_opportunities** VIEW with `name` column (aliased from `contact_name`)
- ✅ **dashboard_events** VIEW with `start_date` column (aliased from `start_time`)
- ✅ **form_submissions** TABLE (already exists from previous run)

---

## 🧪 TESTING

After migration:

1. **Refresh your dashboard**
2. **Check browser console** - should be ZERO errors:
   - ❌ No more 404 errors (form_submissions exists)
   - ❌ No more 400 errors (views provide correct column names)
3. **Dashboard should load all sections correctly**

---

## 📋 REPORT BACK

After execution, please share:

1. **Output from Step 3** (verification results)
2. **Any errors** encountered during execution
3. **Dashboard test results** (console errors cleared?)

---

**Execute the 3 files in order and report results!**
