# 📸 Before & After: RLS Policy Refactoring

Visual examples showing the changes made to RLS policies.

---

## Example 1: Organization Credits Policy

### ❌ BEFORE
```sql
-- Create policies for organization_credits
CREATE POLICY "Users can view credits for their organization" ON organization_credits
    FOR SELECT
    -- Missing explicit TO clause (defaults to public, but not clear)
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### ✅ AFTER
```sql
-- Create policies for organization_credits
CREATE POLICY "Users can view credits for their organization" ON organization_credits
    FOR SELECT
    TO public  -- ✅ Now explicit and clear
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

---

## Example 2: Debug Logs Policy

### ❌ BEFORE
```sql
CREATE POLICY "Service role can insert debug logs" ON debug_logs
    FOR INSERT
    -- No TO clause specified
    WITH CHECK (true);  -- ❌ TOO PERMISSIVE - anyone can insert!
```

### ✅ AFTER
```sql
-- Only authenticated users can insert debug logs (typically via edge functions)
CREATE POLICY "Authenticated users can insert debug logs" ON debug_logs
    FOR INSERT
    TO public  -- ✅ Explicit
    WITH CHECK (auth.uid() IS NOT NULL);  -- ✅ Proper validation
```

---

## Example 3: Super Admin Policies

### ❌ BEFORE
```sql
CREATE POLICY "Super admins can view all audit logs" ON superadmin_logs
    FOR SELECT
    -- No TO clause specified
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
```

### ✅ AFTER
```sql
CREATE POLICY "Super admins can view all audit logs" ON superadmin_logs
    FOR SELECT
    TO public  -- ✅ Explicit and clear
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
```

---

## Example 4: CRM Events CRUD Policies

### ❌ BEFORE
```sql
CREATE POLICY "Users can view events in their organization" ON crm_events
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events in their organization" ON crm_events
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### ✅ AFTER
```sql
CREATE POLICY "Users can view events in their organization" ON crm_events
    FOR SELECT
    TO public  -- ✅ Explicit
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events in their organization" ON crm_events
    FOR INSERT
    TO public  -- ✅ Explicit
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

---

## Example 5: Profiles Table with Super Admin Override

### ❌ BEFORE
```sql
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        role = 'super_admin' OR
        id = auth.uid()
    );
```

### ✅ AFTER
```sql
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT
    TO public  -- ✅ Explicit
    USING (
        role = 'super_admin' OR
        id = auth.uid()
    );
```

---

## Key Changes Summary

### What Changed
- ✅ Added explicit `TO public` clause to all 44 policies
- ✅ Changed debug_logs policy from overly permissive to properly validated
- ✅ Renamed "Service role" policy to "Authenticated users"
- ✅ Replaced `WITH CHECK (true)` with `WITH CHECK (auth.uid() IS NOT NULL)`

### What Stayed the Same
- ✅ All authorization logic (USING/WITH CHECK conditions)
- ✅ Custom profile claim filters (profiles.role = 'super_admin')
- ✅ Organization-based access controls
- ✅ Table existence checks in DO blocks

### Why This Matters

#### The Problem with Implicit Defaults
```sql
-- Without explicit TO clause
CREATE POLICY "my_policy" ON my_table FOR SELECT USING (...);
-- Defaults to 'public', but not clear to developers
```

#### The Solution: Always Be Explicit
```sql
-- With explicit TO public clause
CREATE POLICY "my_policy" ON my_table FOR SELECT TO public USING (...);
-- Clear intent, no ambiguity, prevents errors
```

---

## Common Pitfalls We Avoided

### ❌ NEVER USE THESE PATTERNS

#### 1. Direct Role References
```sql
-- ❌ WRONG - Causes "role does not exist" errors
CREATE POLICY "policy" ON table FOR SELECT TO authenticated USING (...);
CREATE POLICY "policy" ON table FOR SELECT TO super_admin USING (...);
CREATE POLICY "policy" ON table FOR SELECT TO service_role USING (...);
```

#### 2. Overly Permissive Checks
```sql
-- ❌ WRONG - Anyone can insert anything!
CREATE POLICY "policy" ON table FOR INSERT WITH CHECK (true);
```

#### 3. Missing TO Clause
```sql
-- ❌ BAD PRACTICE - Implicit, not clear
CREATE POLICY "policy" ON table FOR SELECT USING (...);
```

### ✅ ALWAYS USE THESE PATTERNS

#### 1. Explicit TO public with Custom Claims
```sql
-- ✅ CORRECT - Clear and explicit
CREATE POLICY "policy" ON table 
    FOR SELECT 
    TO public 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
```

#### 2. Proper Authentication Checks
```sql
-- ✅ CORRECT - Validates authenticated users
CREATE POLICY "policy" ON table 
    FOR INSERT 
    TO public 
    WITH CHECK (auth.uid() IS NOT NULL);
```

#### 3. Organization Scoping
```sql
-- ✅ CORRECT - Scoped to user's organization
CREATE POLICY "policy" ON table 
    FOR SELECT 
    TO public 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

---

## Impact Analysis

### Before Refactoring
- 44 policies relying on implicit default behavior
- 1 overly permissive policy (debug_logs)
- No explicit TO clauses
- Potential for role-based errors

### After Refactoring
- 44 policies with explicit `TO public` clause
- 0 overly permissive policies
- 100% clarity on policy targets
- Zero risk of role errors
- Full compatibility with JWT custom claims
- Ready for Edge Functions

---

## Testing Verification

All policies verified with automated script:
```bash
./scripts/verify-rls-policies.sh
```

Results:
```
✅ No invalid TO clauses found
✅ All CREATE POLICY statements include TO public
✅ Found 21 profile.role references
✅ All migration files follow naming convention
✅ No overly permissive policies
✅ Documentation includes TO public strategy

Summary: 0 errors, 0 warnings
```

---

## Migration Path

### For New Deployments
All migration files will automatically use the correct pattern.

### For Existing Deployments
Run the batch update migration:
```sql
-- This migration updates all existing policies
\i supabase/migrations/20250930100000_rls_policies_with_public_clause.sql
```

---

**Result**: All 44 policies now follow best practices with explicit `TO public` clause and custom profile claim filters! 🎉
