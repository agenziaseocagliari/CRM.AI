# Database Schema Discovery - Dashboard Errors Root Cause Analysis

**Date**: October 16, 2025  
**Purpose**: Permanent fix for dashboard console errors

---

## 🔍 PHASE 1: SCHEMA DISCOVERY QUERIES

**USER ACTION REQUIRED**: Run these 3 queries in Supabase SQL Editor and provide the complete output.

### Query 1: Check form_submissions table existence

```sql
-- Check if form_submissions table exists and find any similar tables
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name = 'form_submissions'
     OR table_name LIKE '%form%'
     OR table_name LIKE '%submission%');
```

**Purpose**: Determine if form_submissions table exists or if there's a similar table with different name.

---

### Query 2: Get opportunities table exact schema

```sql
-- Get exact column names and types for opportunities table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'opportunities'
ORDER BY ordinal_position;
```

**Purpose**: Identify actual column names (name vs title, value vs amount, stage vs status, etc.)

---

### Query 3: Get events table exact schema

```sql
-- Get exact column names and types for events table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events'
ORDER BY ordinal_position;
```

**Purpose**: Identify actual column names (title vs name, start_date vs start_time, etc.)

---

### Query 4: Check organization_id column existence

```sql
-- Verify organization_id exists in all tables
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'organization_id'
AND table_name IN ('opportunities', 'events', 'form_submissions', 'contacts')
ORDER BY table_name;
```

**Purpose**: Ensure RLS filtering column exists in all queried tables.

---

## 📝 EXPECTED USER RESPONSE FORMAT

Please paste the complete output for each query like this:

```
=== Query 1 Results ===
table_name          | table_schema
--------------------|-------------
[paste your results here]

=== Query 2 Results ===
column_name         | data_type | is_nullable | column_default
--------------------|-----------|-------------|---------------
[paste your results here]

=== Query 3 Results ===
column_name         | data_type | is_nullable | column_default
--------------------|-----------|-------------|---------------
[paste your results here]

=== Query 4 Results ===
table_name          | column_name     | data_type
--------------------|-----------------|----------
[paste your results here]
```

---

## 🚀 NEXT STEPS

Once you provide the schema results, I will:

1. **Analyze Root Cause** - Identify exact mismatch between code queries and actual schema
2. **Create Migration SQL** - Generate SQL to create missing tables with correct structure
3. **Fix Dashboard Queries** - Update all queries to match actual column names
4. **Implement Permanent Solution** - Zero console errors, 100% functional dashboard
5. **Test & Deploy** - Verify everything works perfectly

---

**ACTION**: Copy these queries to Supabase SQL Editor, run them, and paste the results.
