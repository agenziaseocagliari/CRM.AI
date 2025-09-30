# 🛡️ RLS Policy Strategy Guide

**Date**: September 30, 2024  
**Version**: 1.0  
**Status**: ✅ Implemented

---

## 📋 Executive Summary

This guide documents the comprehensive Row Level Security (RLS) policy strategy for Guardian AI CRM. All policies follow a strict pattern that eliminates "role does not exist" errors and ensures compatibility with modern Supabase architecture.

---

## 🎯 Core Principle

**ALWAYS use `TO public` with custom profile claim filters**

### ❌ NEVER DO THIS

```sql
-- These cause "role does not exist" errors (SQLSTATE 22023, 42704)
CREATE POLICY "my_policy" ON my_table 
    FOR SELECT 
    TO authenticated  -- ❌ WRONG
    USING (...);

CREATE POLICY "my_policy" ON my_table 
    FOR SELECT 
    TO super_admin  -- ❌ WRONG
    USING (...);

CREATE POLICY "my_policy" ON my_table 
    FOR SELECT 
    TO service_role  -- ❌ WRONG
    USING (...);

CREATE POLICY "my_policy" ON my_table
    FOR INSERT
    WITH CHECK (true);  -- ❌ TOO PERMISSIVE
```

### ✅ ALWAYS DO THIS

```sql
-- Correct pattern: TO public + custom profile claim filter
CREATE POLICY "Super admins can view all" ON my_table
    FOR SELECT
    TO public  -- ✅ CORRECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'  -- ✅ Custom claim
        )
    );

-- For organization-scoped access
CREATE POLICY "Users can view their organization data" ON my_table
    FOR SELECT
    TO public  -- ✅ CORRECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- For authenticated-only access
CREATE POLICY "Authenticated users can insert" ON my_table
    FOR INSERT
    TO public  -- ✅ CORRECT
    WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 🔒 Policy Patterns by Use Case

### 1. Super Admin Full Access

```sql
-- SELECT (Read)
CREATE POLICY "Super admins can view all records" ON your_table
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- INSERT (Create)
CREATE POLICY "Super admins can insert records" ON your_table
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- UPDATE (Modify)
CREATE POLICY "Super admins can update records" ON your_table
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- DELETE (Remove)
CREATE POLICY "Super admins can delete records" ON your_table
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
```

### 2. Super Admin OR Organization Member Access

```sql
CREATE POLICY "Super admins and org members can view" ON your_table
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        ) OR
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### 3. Organization-Only Access

```sql
CREATE POLICY "Users can view their organization data" ON your_table
    FOR SELECT
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert in their organization" ON your_table
    FOR INSERT
    TO public
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization data" ON your_table
    FOR UPDATE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their organization data" ON your_table
    FOR DELETE
    TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### 4. User-Owned Records Only

```sql
CREATE POLICY "Users can view their own records" ON your_table
    FOR SELECT
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own records" ON your_table
    FOR INSERT
    TO public
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own records" ON your_table
    FOR UPDATE
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own records" ON your_table
    FOR DELETE
    TO public
    USING (user_id = auth.uid());
```

### 5. Authenticated Access with Conditions

```sql
-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view" ON your_table
    FOR SELECT
    TO public
    USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert with validation
CREATE POLICY "Authenticated users can insert valid records" ON your_table
    FOR INSERT
    TO public
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (your_validation_condition_here)
    );
```

---

## 🔄 Robust Policy Modification Pattern

When modifying policies on tables that may not exist:

```sql
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'your_table'
    ) THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "old_policy_name" ON your_table;
        
        -- Create new policies
        CREATE POLICY "new_policy_name" ON your_table
            FOR SELECT
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );
    END IF;
END $$;
```

---

## 🎓 Why This Approach?

### ✅ Benefits

1. **No Role Errors**: Eliminates `"role does not exist"` errors (SQLSTATE 22023, 42704)
2. **JWT Compatible**: Works seamlessly with JWT custom claims
3. **Edge Function Ready**: Compatible with Supabase Edge Functions
4. **Consistent**: Same pattern across all tables and policies
5. **Testable**: Easy to test and debug authorization logic
6. **Scalable**: Can add more roles without database role management
7. **Auditable**: Clear, readable authorization logic

### ❌ Problems with Old Approach

```sql
-- Old approach (BROKEN)
CREATE POLICY "policy" ON table FOR SELECT TO super_admin USING (...);
```

**Problems:**
- ❌ Requires creating Postgres roles (`CREATE ROLE super_admin`)
- ❌ Role must exist before policy can be created
- ❌ Doesn't work with JWT custom claims
- ❌ Incompatible with Edge Functions
- ❌ Hard to test and debug
- ❌ Requires complex role management

---

## 📊 Migration Checklist

When creating new tables with RLS:

- [ ] Enable RLS on table: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
- [ ] Create SELECT policy with `TO public` and custom filters
- [ ] Create INSERT policy with `TO public` and `WITH CHECK` validation
- [ ] Create UPDATE policy with `TO public` and custom filters
- [ ] Create DELETE policy with `TO public` and custom filters
- [ ] Test policies with different user roles
- [ ] Document policy logic in comments
- [ ] Add to migration file with table existence checks

---

## 🧪 Testing Policies

### Test Script Template

```sql
-- Test as super admin
SET request.jwt.claims TO '{"sub": "super-admin-uuid", "role": "authenticated"}';

-- Verify super admin can see all records
SELECT * FROM your_table;  -- Should return all records

-- Test as regular user
SET request.jwt.claims TO '{"sub": "regular-user-uuid", "role": "authenticated"}';

-- Verify regular user only sees their organization
SELECT * FROM your_table;  -- Should return only org records

-- Test as unauthenticated (should fail or return nothing)
RESET request.jwt.claims;
SELECT * FROM your_table;  -- Should return empty or fail
```

---

## 📚 Related Documentation

- [SUPER_ADMIN_IMPLEMENTATION.md](../SUPER_ADMIN_IMPLEMENTATION.md) - Super Admin security architecture
- [MIGRATION_ROBUSTNESS_GUIDE.md](../MIGRATION_ROBUSTNESS_GUIDE.md) - Migration best practices
- [README.md](../README.md) - General project documentation

---

## 🚨 Common Mistakes to Avoid

1. ❌ Using `TO authenticated` instead of `TO public` with auth check
2. ❌ Using `TO super_admin` or any internal role name
3. ❌ Using `WITH CHECK (true)` without proper validation
4. ❌ Forgetting to wrap policy modifications in table existence checks
5. ❌ Not testing policies with different user types
6. ❌ Creating policies before enabling RLS on table

---

## ✅ Verification

Run the verification script to check policy compliance:

```bash
./scripts/verify-rls-policies.sh
```

Expected output:
```
✅ All critical checks passed!

RLS Policy Best Practices:
  1. ✅ Always use TO public (never TO authenticated/super_admin/service_role)
  2. ✅ Always filter by custom profile claims (profiles.role = 'super_admin')
  3. ✅ Avoid WITH CHECK (true) - use proper authorization checks
  4. ✅ Wrap policy modifications in DO blocks with table existence checks
```

---

**This strategy ensures zero role errors and full compatibility with modern Supabase architecture! 🎉**
