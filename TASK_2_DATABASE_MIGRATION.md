# 🗄️ STEP-BY-STEP DATABASE MIGRATION GUIDE

## Task 2: Execute Database Security Migration

### 📋 Overview

**Objective:** Execute SQL migration to create `consume_credits_rpc` function and security system
**Priority:** HIGH - Required for Edge Function to work properly
**File:** `supabase/migrations/20250124000001_advanced_security_system.sql`

### 🛠️ Detailed Steps

#### Step 1: Access Supabase Studio

1. Open your browser
2. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Login and select your CRM-AI project
4. Click **"SQL Editor"** in the left sidebar

#### Step 2: Open Migration File

1. Open the file: `supabase/migrations/20250124000001_advanced_security_system.sql`
2. This file contains ~400 lines of SQL code
3. **SELECT ALL** content (Ctrl+A) and **COPY** it (Ctrl+C)

#### Step 3: Execute Migration in SQL Editor

1. In Supabase Studio SQL Editor:
2. **PASTE** the entire migration content
3. You should see SQL commands for:
   - Creating security tables
   - Creating RPC functions
   - Setting up RLS policies
   - Creating indexes
   - Setting up triggers

#### Step 4: Run the Migration

1. Click **"Run"** button (large button at bottom)
2. **WAIT** for execution to complete (may take 2-3 minutes)
3. Monitor the results panel for any errors

#### Step 5: Verify Migration Success

After execution, run these verification queries in the same SQL Editor:

**Query 1: Check if RPC functions were created**

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'consume_credits_rpc',
    'check_ip_whitelist',
    'log_security_event',
    'record_failed_login',
    'check_failed_login_attempts'
);
```

**Expected:** Should return 5 rows (functions)

**Query 2: Check if security tables were created**

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN (
    'security_failed_logins',
    'security_audit_log',
    'security_ip_whitelist'
);
```

**Expected:** Should return 3 rows (tables)

**Query 3: Test the main RPC function**

```sql
SELECT consume_credits_rpc(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test'
);
```

**Expected:** Should return a JSON response (may show organization not found, which is OK)

### ✅ Success Indicators

- ✅ Migration runs without errors
- ✅ 5 functions created (verification query 1)
- ✅ 3 security tables created (verification query 2)
- ✅ consume_credits_rpc function responds (verification query 3)

### 🔧 Troubleshooting

#### If Migration Fails:

1. **Check for syntax errors** in the output panel
2. **Run migration in smaller chunks** if needed
3. **Verify permissions** - ensure you have admin access

#### If Functions Don't Exist:

1. **Re-run the migration** - it's idempotent (safe to run multiple times)
2. **Check for existing functions** with similar names that might conflict

#### If RPC Test Fails:

1. **Check function exists** with verification query 1
2. **Verify parameter types** match the function signature
3. **Test with different organization_id** if needed

### 📊 What This Migration Creates

#### 🔐 Security Functions:

- **consume_credits_rpc** - Main function for credit consumption (fixes FormMaster)
- **check_ip_whitelist** - IP address validation
- **log_security_event** - Security event logging
- **record_failed_login** - Failed login tracking
- **check_failed_login_attempts** - Brute force protection

#### 🗄️ Security Tables:

- **security_failed_logins** - Track failed authentication attempts
- **security_audit_log** - Comprehensive security event logging
- **security_ip_whitelist** - Organization-based IP access control

#### 🛡️ Security Features:

- Row Level Security (RLS) policies
- Performance indexes
- Audit triggers
- Role-based access control

---

**Status:** Ready for execution
**Critical:** This creates the missing `consume_credits_rpc` function that FormMaster needs
