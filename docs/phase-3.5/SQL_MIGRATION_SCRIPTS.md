# Phase 3.5: SQL Migration Scripts

## Database Schema & Data Migration Commands

**Project**: Guardian AI CRM  
**Phase**: 3.5 (Database Health & Multi-Credit Migration)  
**Document Type**: SQL Migration Scripts  
**Created**: October 12, 2025, 18:56 CEST

---

## 🔄 **MIGRATION OVERVIEW**

### **Migration Strategy**: Additive Schema Evolution

- **Approach**: Add new multi-credit columns alongside existing unified columns
- **Data Safety**: No data deletion, only additions and updates
- **Rollback**: Simple column removal if needed
- **Performance**: Non-blocking operations with optimized indexes

### **Credit System Transformation**

```
BEFORE: organizations.total_credits (unified pool)
AFTER:  organizations.ai_credits + whatsapp_credits + email_credits + sms_credits
```

### **Plan-Based Credit Allocation**

| Plan Type  | AI Credits   | WhatsApp Credits | Email Credits | SMS Credits  |
| ---------- | ------------ | ---------------- | ------------- | ------------ |
| Enterprise | 1,500        | 1,200            | 20,000        | 500          |
| Premium    | 1,500        | 1,200            | 20,000        | 500          |
| Custom     | total \* 0.4 | total \* 0.3     | total \* 0.3  | total \* 0.1 |

---

## 📊 **STEP 1: PRE-MIGRATION ANALYSIS**

### **1.1: Current Schema Analysis**

```sql
-- Document current organizations table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current credit-related columns
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name ILIKE '%credit%';
```

### **1.2: Data Inventory**

```sql
-- Count organizations by plan type
SELECT
    plan_name,
    COUNT(*) as org_count,
    AVG(total_credits) as avg_total_credits,
    SUM(total_credits) as sum_total_credits
FROM organizations
GROUP BY plan_name
ORDER BY org_count DESC;

-- Identify organizations requiring migration
SELECT
    id,
    name,
    plan_name,
    total_credits,
    CASE
        WHEN total_credits IS NULL THEN 'NULL_CREDITS'
        WHEN total_credits = 0 THEN 'ZERO_CREDITS'
        WHEN total_credits > 0 THEN 'HAS_CREDITS'
    END as credit_status
FROM organizations
ORDER BY plan_name, total_credits DESC;
```

### **1.3: Constraint and Index Analysis**

```sql
-- Check existing constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass;

-- Check existing indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'organizations'
AND schemaname = 'public';
```

---

## 🏗️ **STEP 2: SCHEMA MIGRATION**

### **2.1: Add Multi-Credit Columns**

```sql
-- Add new credit allocation columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0 CHECK (ai_credits >= 0),
ADD COLUMN IF NOT EXISTS whatsapp_credits INTEGER DEFAULT 0 CHECK (whatsapp_credits >= 0),
ADD COLUMN IF NOT EXISTS email_credits INTEGER DEFAULT 0 CHECK (email_credits >= 0),
ADD COLUMN IF NOT EXISTS sms_credits INTEGER DEFAULT 0 CHECK (sms_credits >= 0);

-- Add new used credit tracking columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_used_credits INTEGER DEFAULT 0 CHECK (ai_used_credits >= 0),
ADD COLUMN IF NOT EXISTS whatsapp_used_credits INTEGER DEFAULT 0 CHECK (whatsapp_used_credits >= 0),
ADD COLUMN IF NOT EXISTS email_used_credits INTEGER DEFAULT 0 CHECK (email_used_credits >= 0),
ADD COLUMN IF NOT EXISTS sms_used_credits INTEGER DEFAULT 0 CHECK (sms_used_credits >= 0);

-- Add constraints to ensure used credits don't exceed allocated
ALTER TABLE organizations
ADD CONSTRAINT check_ai_credits_limit
    CHECK (ai_used_credits <= ai_credits),
ADD CONSTRAINT check_whatsapp_credits_limit
    CHECK (whatsapp_used_credits <= whatsapp_credits),
ADD CONSTRAINT check_email_credits_limit
    CHECK (email_used_credits <= email_credits),
ADD CONSTRAINT check_sms_credits_limit
    CHECK (sms_used_credits <= sms_credits);

-- Verify columns added successfully
\d organizations;
```

### **2.2: Create Supporting Functions**

```sql
-- Function to allocate credits based on plan type
CREATE OR REPLACE FUNCTION allocate_plan_credits(
    p_organization_id UUID,
    p_plan_type TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE organizations
    SET
        ai_credits = CASE
            WHEN p_plan_type IN ('enterprise', 'premium') THEN 1500
            ELSE GREATEST(COALESCE(total_credits, 0) * 0.4, 500)::INTEGER
        END,
        whatsapp_credits = CASE
            WHEN p_plan_type IN ('enterprise', 'premium') THEN 1200
            ELSE GREATEST(COALESCE(total_credits, 0) * 0.3, 300)::INTEGER
        END,
        email_credits = CASE
            WHEN p_plan_type IN ('enterprise', 'premium') THEN 20000
            ELSE GREATEST(COALESCE(total_credits, 0) * 0.3, 1000)::INTEGER
        END,
        sms_credits = CASE
            WHEN p_plan_type IN ('enterprise', 'premium') THEN 500
            ELSE GREATEST(COALESCE(total_credits, 0) * 0.1, 100)::INTEGER
        END,
        updated_at = NOW()
    WHERE id = p_organization_id;

    -- Log the allocation
    INSERT INTO credit_actions (
        organization_id,
        action_type,
        credits_consumed,
        description,
        created_at
    ) VALUES (
        p_organization_id,
        'allocation',
        0,
        'Multi-credit allocation for plan: ' || p_plan_type,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available credits by type
CREATE OR REPLACE FUNCTION get_available_credits(
    p_organization_id UUID,
    p_credit_type TEXT
) RETURNS INTEGER AS $$
DECLARE
    available_credits INTEGER;
BEGIN
    SELECT
        CASE p_credit_type
            WHEN 'ai' THEN (ai_credits - ai_used_credits)
            WHEN 'whatsapp' THEN (whatsapp_credits - whatsapp_used_credits)
            WHEN 'email' THEN (email_credits - email_used_credits)
            WHEN 'sms' THEN (sms_credits - sms_used_credits)
            ELSE 0
        END
    INTO available_credits
    FROM organizations
    WHERE id = p_organization_id;

    RETURN COALESCE(available_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume specific credit type
CREATE OR REPLACE FUNCTION consume_specific_credits(
    p_organization_id UUID,
    p_credit_type TEXT,
    p_credits INTEGER,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    available_credits INTEGER;
    update_successful BOOLEAN := FALSE;
BEGIN
    -- Check available credits
    available_credits := get_available_credits(p_organization_id, p_credit_type);

    IF available_credits < p_credits THEN
        RAISE EXCEPTION 'Insufficient % credits. Available: %, Required: %',
            p_credit_type, available_credits, p_credits;
    END IF;

    -- Update used credits based on type
    CASE p_credit_type
        WHEN 'ai' THEN
            UPDATE organizations
            SET ai_used_credits = ai_used_credits + p_credits,
                updated_at = NOW()
            WHERE id = p_organization_id;
        WHEN 'whatsapp' THEN
            UPDATE organizations
            SET whatsapp_used_credits = whatsapp_used_credits + p_credits,
                updated_at = NOW()
            WHERE id = p_organization_id;
        WHEN 'email' THEN
            UPDATE organizations
            SET email_used_credits = email_used_credits + p_credits,
                updated_at = NOW()
            WHERE id = p_organization_id;
        WHEN 'sms' THEN
            UPDATE organizations
            SET sms_used_credits = sms_used_credits + p_credits,
                updated_at = NOW()
            WHERE id = p_organization_id;
        ELSE
            RAISE EXCEPTION 'Invalid credit type: %', p_credit_type;
    END CASE;

    GET DIAGNOSTICS update_successful = ROW_COUNT;

    IF update_successful THEN
        -- Log the consumption
        INSERT INTO credit_actions (
            organization_id,
            action_type,
            credits_consumed,
            description,
            created_at
        ) VALUES (
            p_organization_id,
            p_credit_type || '_consumption',
            p_credits,
            COALESCE(p_description, 'Consumed ' || p_credits || ' ' || p_credit_type || ' credits'),
            NOW()
        );

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2.3: Create Performance Indexes**

```sql
-- Composite indexes for credit queries
CREATE INDEX IF NOT EXISTS idx_organizations_ai_credits
ON organizations(id, ai_credits, ai_used_credits)
WHERE ai_credits > 0;

CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_credits
ON organizations(id, whatsapp_credits, whatsapp_used_credits)
WHERE whatsapp_credits > 0;

CREATE INDEX IF NOT EXISTS idx_organizations_email_credits
ON organizations(id, email_credits, email_used_credits)
WHERE email_credits > 0;

CREATE INDEX IF NOT EXISTS idx_organizations_sms_credits
ON organizations(id, sms_credits, sms_used_credits)
WHERE sms_credits > 0;

-- Comprehensive credit summary index
CREATE INDEX IF NOT EXISTS idx_organizations_multi_credit_summary
ON organizations(
    id,
    (ai_credits - ai_used_credits),
    (whatsapp_credits - whatsapp_used_credits),
    (email_credits - email_used_credits),
    (sms_credits - sms_used_credits)
) WHERE status = 'active';

-- Plan-based lookup index
CREATE INDEX IF NOT EXISTS idx_organizations_plan_credits
ON organizations(plan_name, ai_credits, whatsapp_credits, email_credits, sms_credits);
```

---

## 📦 **STEP 3: DATA MIGRATION**

### **3.1: Batch Migration Script**

```sql
-- Migrate organizations in batches to avoid locks
DO $$
DECLARE
    batch_size INTEGER := 100;
    total_count INTEGER;
    processed_count INTEGER := 0;
    org_record RECORD;
    start_time TIMESTAMP;
    batch_start_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();

    -- Get total count for progress tracking
    SELECT COUNT(*) INTO total_count
    FROM organizations
    WHERE ai_credits = 0 AND whatsapp_credits = 0; -- Unmigrated orgs only

    RAISE NOTICE 'Starting migration of % organizations at %', total_count, start_time;

    FOR org_record IN
        SELECT id, name, plan_name, total_credits
        FROM organizations
        WHERE ai_credits = 0 AND whatsapp_credits = 0 -- Only unmigrated
        ORDER BY created_at ASC
    LOOP
        batch_start_time := clock_timestamp();

        -- Apply credit allocation
        PERFORM allocate_plan_credits(org_record.id, COALESCE(org_record.plan_name, 'custom'));

        processed_count := processed_count + 1;

        -- Progress reporting every batch
        IF processed_count % batch_size = 0 THEN
            RAISE NOTICE 'Processed % / % organizations (%.1f%%) - Batch time: %ms',
                processed_count,
                total_count,
                (processed_count::FLOAT / total_count * 100),
                EXTRACT(milliseconds FROM (clock_timestamp() - batch_start_time));

            -- Brief pause to allow other operations
            PERFORM pg_sleep(0.1);
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration completed! Processed % organizations in %ms',
        processed_count,
        EXTRACT(milliseconds FROM (clock_timestamp() - start_time));
END $$;
```

### **3.2: Migration Verification**

```sql
-- Verify all organizations have multi-credits allocated
SELECT
    'Migration Summary' as report_type,
    COUNT(*) as total_organizations,
    COUNT(CASE WHEN ai_credits > 0 THEN 1 END) as orgs_with_ai_credits,
    COUNT(CASE WHEN whatsapp_credits > 0 THEN 1 END) as orgs_with_whatsapp_credits,
    COUNT(CASE WHEN email_credits > 0 THEN 1 END) as orgs_with_email_credits,
    COUNT(CASE WHEN sms_credits > 0 THEN 1 END) as orgs_with_sms_credits
FROM organizations;

-- Plan-based allocation verification
SELECT
    plan_name,
    COUNT(*) as org_count,
    AVG(ai_credits) as avg_ai_credits,
    AVG(whatsapp_credits) as avg_whatsapp_credits,
    AVG(email_credits) as avg_email_credits,
    AVG(sms_credits) as avg_sms_credits,
    SUM(ai_credits + whatsapp_credits + email_credits + sms_credits) as total_allocated_credits
FROM organizations
WHERE ai_credits > 0 OR whatsapp_credits > 0
GROUP BY plan_name
ORDER BY org_count DESC;

-- Identify any migration failures
SELECT
    id,
    name,
    plan_name,
    total_credits,
    ai_credits,
    whatsapp_credits,
    email_credits,
    sms_credits,
    CASE
        WHEN ai_credits = 0 AND whatsapp_credits = 0 AND email_credits = 0 AND sms_credits = 0
        THEN 'MIGRATION_FAILED'
        ELSE 'MIGRATED'
    END as migration_status
FROM organizations
WHERE ai_credits = 0 AND whatsapp_credits = 0 AND email_credits = 0 AND sms_credits = 0;
```

### **3.3: Data Integrity Checks**

```sql
-- Check constraint violations
SELECT
    conname as constraint_name,
    COUNT(*) as violations
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
LEFT JOIN organizations o ON true
WHERE t.relname = 'organizations'
  AND contype = 'c'
  AND NOT (
    CASE conname
      WHEN 'check_ai_credits_limit' THEN o.ai_used_credits <= o.ai_credits
      WHEN 'check_whatsapp_credits_limit' THEN o.whatsapp_used_credits <= o.whatsapp_credits
      WHEN 'check_email_credits_limit' THEN o.email_used_credits <= o.email_credits
      WHEN 'check_sms_credits_limit' THEN o.sms_used_credits <= o.sms_credits
      ELSE true
    END
  )
GROUP BY conname;

-- Verify referential integrity
SELECT
    'Organizations with credit actions' as check_type,
    COUNT(DISTINCT o.id) as org_count,
    COUNT(DISTINCT ca.organization_id) as orgs_with_actions
FROM organizations o
LEFT JOIN credit_actions ca ON o.id = ca.organization_id;

-- Check for negative credits (should be impossible with constraints)
SELECT
    'Negative Credits Check' as check_type,
    COUNT(CASE WHEN ai_credits < 0 THEN 1 END) as negative_ai,
    COUNT(CASE WHEN whatsapp_credits < 0 THEN 1 END) as negative_whatsapp,
    COUNT(CASE WHEN email_credits < 0 THEN 1 END) as negative_email,
    COUNT(CASE WHEN sms_credits < 0 THEN 1 END) as negative_sms,
    COUNT(CASE WHEN ai_used_credits < 0 THEN 1 END) as negative_ai_used,
    COUNT(CASE WHEN whatsapp_used_credits < 0 THEN 1 END) as negative_whatsapp_used,
    COUNT(CASE WHEN email_used_credits < 0 THEN 1 END) as negative_email_used,
    COUNT(CASE WHEN sms_used_credits < 0 THEN 1 END) as negative_sms_used
FROM organizations;
```

---

## 🎯 **STEP 4: TESTING SCRIPTS**

### **4.1: Functional Testing**

```sql
-- Test credit allocation function
SELECT allocate_plan_credits(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'enterprise'
);

-- Verify allocation worked
SELECT
    name,
    plan_name,
    ai_credits,
    whatsapp_credits,
    email_credits,
    sms_credits
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Test credit consumption
SELECT consume_specific_credits(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'ai',
    10,
    'Test AI credit consumption'
);

-- Test credit availability check
SELECT get_available_credits(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'ai'
) as available_ai_credits;
```

### **4.2: Performance Testing**

```sql
-- Test query performance with new indexes
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    id,
    name,
    (ai_credits - ai_used_credits) as ai_available,
    (whatsapp_credits - whatsapp_used_credits) as whatsapp_available,
    (email_credits - email_used_credits) as email_available,
    (sms_credits - sms_used_credits) as sms_available
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Test function performance
\timing on
SELECT consume_specific_credits(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'whatsapp',
    1,
    'Performance test'
);
\timing off

-- Bulk query performance test
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    plan_name,
    COUNT(*) as org_count,
    AVG(ai_credits - ai_used_credits) as avg_ai_available,
    AVG(whatsapp_credits - whatsapp_used_credits) as avg_whatsapp_available
FROM organizations
GROUP BY plan_name;
```

### **4.3: Edge Case Testing**

```sql
-- Test zero credit allocation
SELECT allocate_plan_credits(
    '00000000-0000-0000-0000-000000000002'::UUID,
    'zero_plan'
);

-- Test consuming more credits than available (should fail)
DO $$
BEGIN
    PERFORM consume_specific_credits(
        '00000000-0000-0000-0000-000000000002'::UUID,
        'ai',
        999999,
        'Test overconsumption - should fail'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Expected error caught: %', SQLERRM;
END $$;

-- Test invalid credit type (should fail)
DO $$
BEGIN
    PERFORM consume_specific_credits(
        '00000000-0000-0000-0000-000000000001'::UUID,
        'invalid_type',
        1,
        'Test invalid type - should fail'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Expected error caught: %', SQLERRM;
END $$;
```

---

## 🔄 **STEP 5: ROLLBACK SCRIPTS**

### **5.1: Emergency Rollback (Fast)**

```sql
-- Emergency rollback - remove multi-credit columns
BEGIN;

-- Drop constraints first
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_ai_credits_limit,
DROP CONSTRAINT IF EXISTS check_whatsapp_credits_limit,
DROP CONSTRAINT IF EXISTS check_email_credits_limit,
DROP CONSTRAINT IF EXISTS check_sms_credits_limit;

-- Drop indexes
DROP INDEX IF EXISTS idx_organizations_ai_credits;
DROP INDEX IF EXISTS idx_organizations_whatsapp_credits;
DROP INDEX IF EXISTS idx_organizations_email_credits;
DROP INDEX IF EXISTS idx_organizations_sms_credits;
DROP INDEX IF EXISTS idx_organizations_multi_credit_summary;
DROP INDEX IF EXISTS idx_organizations_plan_credits;

-- Drop functions
DROP FUNCTION IF EXISTS allocate_plan_credits(UUID, TEXT);
DROP FUNCTION IF EXISTS get_available_credits(UUID, TEXT);
DROP FUNCTION IF EXISTS consume_specific_credits(UUID, TEXT, INTEGER, TEXT);

-- Remove columns (THIS IS DESTRUCTIVE - USE ONLY IN EMERGENCY)
ALTER TABLE organizations
DROP COLUMN IF EXISTS ai_credits,
DROP COLUMN IF EXISTS whatsapp_credits,
DROP COLUMN IF EXISTS email_credits,
DROP COLUMN IF EXISTS sms_credits,
DROP COLUMN IF EXISTS ai_used_credits,
DROP COLUMN IF EXISTS whatsapp_used_credits,
DROP COLUMN IF EXISTS email_used_credits,
DROP COLUMN IF EXISTS sms_used_credits;

COMMIT;
```

### **5.2: Controlled Rollback (Safe)**

```sql
-- Controlled rollback - preserve data, disable features
BEGIN;

-- Disable multi-credit functions by renaming them
ALTER FUNCTION allocate_plan_credits(UUID, TEXT)
RENAME TO allocate_plan_credits_disabled;

ALTER FUNCTION get_available_credits(UUID, TEXT)
RENAME TO get_available_credits_disabled;

ALTER FUNCTION consume_specific_credits(UUID, TEXT, INTEGER, TEXT)
RENAME TO consume_specific_credits_disabled;

-- Add rollback marker
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS rollback_marker TIMESTAMP DEFAULT NOW();

-- Log rollback action
INSERT INTO credit_actions (
    organization_id,
    action_type,
    credits_consumed,
    description,
    created_at
)
SELECT
    id,
    'rollback',
    0,
    'Multi-credit system rollback executed',
    NOW()
FROM organizations
WHERE rollback_marker IS NOT NULL;

COMMIT;
```

### **5.3: Rollback Verification**

```sql
-- Verify rollback completion
SELECT
    'Rollback Verification' as report_type,
    COUNT(*) as total_organizations,
    COUNT(CASE WHEN rollback_marker IS NOT NULL THEN 1 END) as orgs_with_rollback_marker,
    COUNT(CASE WHEN ai_credits IS NOT NULL THEN 1 END) as orgs_with_multicredit_data
FROM organizations;

-- Check function availability
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name ILIKE '%credit%'
AND routine_schema = 'public'
ORDER BY routine_name;
```

---

## 📋 **EXECUTION CHECKLIST**

### **Pre-Execution Requirements**

- [ ] Database backup completed and verified
- [ ] All scripts reviewed and syntax validated
- [ ] Test environment available for dry run
- [ ] Rollback procedures tested and confirmed working
- [ ] Performance baseline measurements recorded

### **Migration Execution Order**

1. [ ] **Step 1**: Pre-migration analysis (5 min)
2. [ ] **Step 2**: Schema migration (25 min)
3. [ ] **Step 3**: Data migration (45 min)
4. [ ] **Step 4**: Testing scripts (15 min)
5. [ ] **Step 5**: Rollback verification (ready, but not executed)

### **Validation Requirements**

Each step must pass validation before proceeding:

- [ ] No SQL errors during execution
- [ ] All constraints and indexes created successfully
- [ ] Data integrity checks pass 100%
- [ ] Performance tests meet acceptable thresholds
- [ ] Rollback capability confirmed available

---

## ⚠️ **IMPORTANT NOTES**

### **Execution Guidelines**

1. **Run scripts in order** - Dependencies must be satisfied
2. **Validate after each step** - Don't proceed if errors occur
3. **Monitor performance** - Watch for lock contentions
4. **Test rollback** - Verify rollback works before data migration
5. **Keep logs** - Document all execution times and results

### **Safety Reminders**

- ⚠️ **Always backup before executing**
- ⚠️ **Test in development environment first**
- ⚠️ **Have rollback plan ready**
- ⚠️ **Monitor system performance during migration**
- ⚠️ **Keep stakeholders informed of progress**

---

**These SQL scripts provide the complete database migration pathway for Phase 3.5.**  
**Execute with care and always verify results at each step.**

**Status**: ✅ READY FOR EXECUTION
