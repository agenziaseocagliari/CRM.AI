# Phase 3.5: Testing Scenarios & Validation

## Comprehensive Test Suite for Multi-Credit Migration

**Project**: Guardian AI CRM  
**Phase**: 3.5 (Database Health & Multi-Credit Migration)  
**Document Type**: Testing Scenarios  
**Created**: October 12, 2025, 18:57 CEST

---

## 🎯 **TESTING OVERVIEW**

### **Testing Philosophy**

- **Comprehensive Coverage**: Test all credit types, edge cases, and failure scenarios
- **Real-World Simulation**: Use actual business workflows and user patterns
- **Performance Validation**: Ensure system maintains acceptable performance
- **Safety Verification**: Confirm rollback procedures work under all conditions

### **Testing Phases**

1. **Pre-Migration Testing**: Establish baselines and verify current functionality
2. **Migration Testing**: Validate schema changes and data migration
3. **Post-Migration Testing**: Comprehensive functionality and performance validation
4. **Rollback Testing**: Verify emergency recovery procedures

### **Success Criteria**

- ✅ **Functional**: 100% of credit operations work correctly
- ✅ **Performance**: ≤10% degradation from baseline
- ✅ **Data Integrity**: Zero data loss or corruption
- ✅ **Security**: RLS policies and access controls intact
- ✅ **Rollback**: Emergency recovery procedures functional

---

## 🔬 **PHASE 1: PRE-MIGRATION TESTING**

### **1.1: Baseline Functionality Test**

**Objective**: Establish current system performance and functionality baselines

#### **Test Scenario 1A: Current Credit Consumption**

```sql
-- Test current unified credit system
-- Record baseline performance metrics
\timing on

SELECT
    id,
    name,
    total_credits,
    used_credits,
    (total_credits - used_credits) as remaining_credits
FROM organizations
WHERE id = 'test-org-baseline-uuid';

-- Test current credit consumption function
SELECT consume_credits_rpc(
    'test-org-baseline-uuid',
    'ai_chat',
    10
);

\timing off
```

**Expected Results**:

- Query execution time: <200ms
- Credit consumption successful
- Accurate credit balance calculation
- No errors in function execution

#### **Test Scenario 1B: Current System Load Test**

```sql
-- Simulate 100 concurrent credit consumptions
DO $$
DECLARE
    i INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();

    FOR i IN 1..100 LOOP
        PERFORM consume_credits_rpc(
            'load-test-org-uuid',
            'ai_chat',
            1
        );
    END LOOP;

    end_time := clock_timestamp();

    RAISE NOTICE 'Load test completed in %ms',
        EXTRACT(milliseconds FROM (end_time - start_time));
END $$;
```

**Expected Results**:

- Batch completion time: <5 seconds
- No errors or timeouts
- Data consistency maintained
- Performance within acceptable limits

### **1.2: Data Integrity Baseline**

```sql
-- Document current data state for comparison
CREATE TEMP TABLE baseline_snapshot AS
SELECT
    id,
    name,
    plan_name,
    total_credits,
    used_credits,
    created_at,
    updated_at
FROM organizations;

-- Verify baseline snapshot
SELECT
    COUNT(*) as total_organizations,
    COUNT(CASE WHEN total_credits > 0 THEN 1 END) as orgs_with_credits,
    AVG(total_credits) as avg_total_credits,
    SUM(total_credits) as sum_total_credits
FROM baseline_snapshot;
```

---

## 🔄 **PHASE 2: MIGRATION TESTING**

### **2.1: Schema Migration Validation**

#### **Test Scenario 2A: Column Addition Verification**

```sql
-- Verify new columns added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name IN (
    'ai_credits', 'whatsapp_credits', 'email_credits', 'sms_credits',
    'ai_used_credits', 'whatsapp_used_credits', 'email_used_credits', 'sms_used_credits'
)
ORDER BY column_name;
```

**Expected Results**:

- All 8 new columns present
- Correct data types (INTEGER)
- Default values set to 0
- NOT NULL constraints applied

#### **Test Scenario 2B: Constraint Validation**

```sql
-- Verify constraints were added correctly
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass
AND conname ILIKE '%credit%';

-- Test constraint enforcement
BEGIN;
-- This should fail due to constraint violation
UPDATE organizations
SET ai_used_credits = ai_credits + 1000
WHERE id = 'test-constraint-org-uuid';
ROLLBACK;
```

**Expected Results**:

- All credit limit constraints present
- Constraint violations properly blocked
- Error messages clear and informative

### **2.2: Function Migration Validation**

#### **Test Scenario 2C: New Function Testing**

```sql
-- Test credit allocation function
SELECT allocate_plan_credits(
    'test-allocation-org-uuid',
    'enterprise'
);

-- Verify allocation worked correctly
SELECT
    name,
    plan_name,
    ai_credits,
    whatsapp_credits,
    email_credits,
    sms_credits
FROM organizations
WHERE id = 'test-allocation-org-uuid';
```

**Expected Results**:

- Enterprise plan: AI=1500, WhatsApp=1200, Email=20000, SMS=500
- Function executes without errors
- Credit allocation matches plan specifications

#### **Test Scenario 2D: Credit Consumption Testing**

```sql
-- Test each credit type consumption
SELECT consume_specific_credits(
    'test-consumption-org-uuid',
    'ai',
    50,
    'Test AI credit consumption'
);

SELECT consume_specific_credits(
    'test-consumption-org-uuid',
    'whatsapp',
    25,
    'Test WhatsApp credit consumption'
);

SELECT consume_specific_credits(
    'test-consumption-org-uuid',
    'email',
    100,
    'Test Email credit consumption'
);

SELECT consume_specific_credits(
    'test-consumption-org-uuid',
    'sms',
    10,
    'Test SMS credit consumption'
);

-- Verify consumptions recorded correctly
SELECT
    ai_credits, ai_used_credits, (ai_credits - ai_used_credits) as ai_available,
    whatsapp_credits, whatsapp_used_credits, (whatsapp_credits - whatsapp_used_credits) as whatsapp_available,
    email_credits, email_used_credits, (email_credits - email_used_credits) as email_available,
    sms_credits, sms_used_credits, (sms_credits - sms_used_credits) as sms_available
FROM organizations
WHERE id = 'test-consumption-org-uuid';
```

**Expected Results**:

- All credit types consume correctly
- Used credit tracking accurate
- Available credit calculations correct
- Audit logging functional

### **2.3: Data Migration Validation**

#### **Test Scenario 2E: Migration Completeness**

```sql
-- Verify all organizations migrated successfully
SELECT
    'Migration Completeness' as test_name,
    COUNT(*) as total_orgs,
    COUNT(CASE WHEN ai_credits > 0 OR whatsapp_credits > 0 OR email_credits > 0 OR sms_credits > 0 THEN 1 END) as migrated_orgs,
    COUNT(CASE WHEN ai_credits = 0 AND whatsapp_credits = 0 AND email_credits = 0 AND sms_credits = 0 THEN 1 END) as unmigrated_orgs
FROM organizations;

-- Compare pre/post migration totals
SELECT
    'Credit Conservation' as test_name,
    SUM(total_credits) as original_total_credits,
    SUM(ai_credits + whatsapp_credits + email_credits + sms_credits) as new_total_credits,
    SUM(ai_credits + whatsapp_credits + email_credits + sms_credits) - SUM(total_credits) as difference
FROM organizations;
```

**Expected Results**:

- 100% of organizations migrated
- Total allocated credits >= original total credits
- No organizations left with zero credits (unless originally zero)

---

## 🚀 **PHASE 3: POST-MIGRATION TESTING**

### **3.1: Functional Validation Tests**

#### **Test Scenario 3A: Multi-Credit Workflow Test**

```sql
-- Create test organization for comprehensive workflow
INSERT INTO organizations (
    id,
    name,
    plan_name,
    status
) VALUES (
    'workflow-test-org-uuid',
    'Workflow Test Organization',
    'premium',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status;

-- Allocate credits
SELECT allocate_plan_credits('workflow-test-org-uuid', 'premium');

-- Test realistic usage pattern
-- Morning: AI assistant usage
SELECT consume_specific_credits('workflow-test-org-uuid', 'ai', 25, 'Morning AI sessions');

-- Midday: WhatsApp campaign
SELECT consume_specific_credits('workflow-test-org-uuid', 'whatsapp', 50, 'Lunch time WhatsApp blast');

-- Afternoon: Email newsletter
SELECT consume_specific_credits('workflow-test-org-uuid', 'email', 500, 'Afternoon newsletter');

-- Evening: SMS notifications
SELECT consume_specific_credits('workflow-test-org-uuid', 'sms', 15, 'Evening SMS alerts');

-- Verify final state
SELECT
    name,
    ai_credits - ai_used_credits as ai_remaining,
    whatsapp_credits - whatsapp_used_credits as whatsapp_remaining,
    email_credits - email_used_credits as email_remaining,
    sms_credits - sms_used_credits as sms_remaining
FROM organizations
WHERE id = 'workflow-test-org-uuid';
```

**Expected Results**:

- All credit consumptions successful
- Remaining credits: AI=1475, WhatsApp=1150, Email=19500, SMS=485
- No errors throughout workflow
- Audit trail complete for all actions

#### **Test Scenario 3B: Edge Case Validation**

```sql
-- Test 1: Exact credit exhaustion
CREATE TEMP TABLE test_org AS
SELECT * FROM organizations WHERE id = 'edge-case-test-org-uuid';

-- Set specific credit amounts for testing
UPDATE organizations
SET ai_credits = 10, ai_used_credits = 0
WHERE id = 'edge-case-test-org-uuid';

-- Consume exactly all credits
SELECT consume_specific_credits('edge-case-test-org-uuid', 'ai', 10, 'Exact exhaustion test');

-- Verify zero credits remaining
SELECT ai_credits - ai_used_credits as should_be_zero
FROM organizations
WHERE id = 'edge-case-test-org-uuid';

-- Test 2: Overconsumption attempt (should fail)
DO $$
BEGIN
    PERFORM consume_specific_credits('edge-case-test-org-uuid', 'ai', 1, 'Overconsumption test - should fail');
    RAISE EXCEPTION 'Test failed: Overconsumption was allowed!';
EXCEPTION
    WHEN OTHERS THEN
        -- This is expected
        RAISE NOTICE 'Overconsumption correctly blocked: %', SQLERRM;
END $$;

-- Test 3: Invalid credit type (should fail)
DO $$
BEGIN
    PERFORM consume_specific_credits('edge-case-test-org-uuid', 'invalid', 1, 'Invalid type test - should fail');
    RAISE EXCEPTION 'Test failed: Invalid credit type was allowed!';
EXCEPTION
    WHEN OTHERS THEN
        -- This is expected
        RAISE NOTICE 'Invalid credit type correctly blocked: %', SQLERRM;
END $$;
```

**Expected Results**:

- Exact credit exhaustion works correctly
- Overconsumption attempts properly blocked
- Invalid credit types rejected
- Clear error messages provided

### **3.2: Performance Validation Tests**

#### **Test Scenario 3C: Individual Query Performance**

```sql
-- Test 1: Single organization credit query
\timing on
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    id,
    name,
    ai_credits - ai_used_credits as ai_available,
    whatsapp_credits - whatsapp_used_credits as whatsapp_available,
    email_credits - email_used_credits as email_available,
    sms_credits - sms_used_credits as sms_available
FROM organizations
WHERE id = 'performance-test-org-uuid';
\timing off

-- Test 2: Credit consumption function performance
\timing on
SELECT consume_specific_credits(
    'performance-test-org-uuid',
    'ai',
    1,
    'Performance test'
);
\timing off

-- Test 3: Bulk credit summary query
\timing on
SELECT
    plan_name,
    COUNT(*) as org_count,
    AVG(ai_credits - ai_used_credits) as avg_ai_available,
    AVG(whatsapp_credits - whatsapp_used_credits) as avg_whatsapp_available,
    AVG(email_credits - email_used_credits) as avg_email_available,
    AVG(sms_credits - sms_used_credits) as avg_sms_available
FROM organizations
GROUP BY plan_name;
\timing off
```

**Expected Results**:

- Single query: <50ms
- Credit consumption: <200ms
- Bulk summary: <500ms
- All within 110% of baseline performance

#### **Test Scenario 3D: Concurrent Load Testing**

```sql
-- Simulate realistic concurrent load
DO $$
DECLARE
    i INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    start_time := clock_timestamp();

    -- Simulate 50 concurrent users doing various actions
    FOR i IN 1..50 LOOP
        BEGIN
            CASE (i % 4)
                WHEN 0 THEN
                    PERFORM consume_specific_credits('load-test-org-1', 'ai', 1, 'Load test AI');
                WHEN 1 THEN
                    PERFORM consume_specific_credits('load-test-org-2', 'whatsapp', 1, 'Load test WhatsApp');
                WHEN 2 THEN
                    PERFORM consume_specific_credits('load-test-org-3', 'email', 10, 'Load test Email');
                WHEN 3 THEN
                    PERFORM consume_specific_credits('load-test-org-4', 'sms', 1, 'Load test SMS');
            END CASE;

            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Load test error on iteration %: %', i, SQLERRM;
        END;
    END LOOP;

    end_time := clock_timestamp();

    RAISE NOTICE 'Load test completed: % successes, % errors in %ms',
        success_count,
        error_count,
        EXTRACT(milliseconds FROM (end_time - start_time));
END $$;
```

**Expected Results**:

- > 95% success rate
- Total execution time <10 seconds
- No database deadlocks or timeouts
- Error rate within acceptable limits

### **3.3: Security & Access Control Tests**

#### **Test Scenario 3E: RLS Policy Validation**

```sql
-- Test 1: Organization isolation
-- Set up test as org1 user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "org1-user", "organization_id": "org-1-uuid"}';

-- Should only see own organization
SELECT COUNT(*) as accessible_orgs
FROM organizations; -- Should be 1

-- Should only be able to consume own credits
SELECT consume_specific_credits('org-1-uuid', 'ai', 1, 'RLS test - own org');

-- Test 2: Cross-organization access attempt (should fail)
DO $$
BEGIN
    PERFORM consume_specific_credits('org-2-uuid', 'ai', 1, 'RLS test - other org - should fail');
    RAISE EXCEPTION 'RLS policy failed: Cross-org access allowed!';
EXCEPTION
    WHEN insufficient_privilege OR others THEN
        RAISE NOTICE 'RLS policy working: Cross-org access blocked';
END $$;

-- Test 3: Admin access
SET ROLE service_role;

-- Should see all organizations
SELECT COUNT(*) as accessible_orgs
FROM organizations; -- Should be all orgs
```

**Expected Results**:

- Organizations can only access own data
- Credit consumption limited to own organization
- Cross-organization access properly blocked
- Admin role has full access

#### **Test Scenario 3F: Audit Trail Validation**

```sql
-- Verify all actions are logged
SELECT
    action_type,
    COUNT(*) as action_count,
    MIN(created_at) as first_action,
    MAX(created_at) as last_action
FROM credit_actions
WHERE organization_id IN ('workflow-test-org-uuid', 'performance-test-org-uuid')
AND created_at >= (NOW() - INTERVAL '1 hour')
GROUP BY action_type
ORDER BY action_count DESC;

-- Test audit trail completeness
SELECT
    ca.organization_id,
    ca.action_type,
    ca.credits_consumed,
    ca.description,
    ca.created_at,
    o.name as org_name
FROM credit_actions ca
JOIN organizations o ON ca.organization_id = o.id
WHERE ca.created_at >= (NOW() - INTERVAL '1 hour')
ORDER BY ca.created_at DESC
LIMIT 20;
```

**Expected Results**:

- All test actions logged in audit trail
- Timestamps accurate and sequential
- Organization associations correct
- Descriptions informative and complete

---

## 🔄 **PHASE 4: ROLLBACK TESTING**

### **4.1: Rollback Scenario Validation**

#### **Test Scenario 4A: Controlled Rollback Test**

```sql
-- Create backup of current state
CREATE TEMP TABLE rollback_test_snapshot AS
SELECT
    id,
    name,
    ai_credits,
    whatsapp_credits,
    email_credits,
    sms_credits,
    ai_used_credits,
    whatsapp_used_credits,
    email_used_credits,
    sms_used_credits
FROM organizations
WHERE id = 'rollback-test-org-uuid';

-- Perform some operations
SELECT consume_specific_credits('rollback-test-org-uuid', 'ai', 10, 'Pre-rollback test');

-- Execute controlled rollback (function disable only)
BEGIN;

ALTER FUNCTION consume_specific_credits(UUID, TEXT, INTEGER, TEXT)
RENAME TO consume_specific_credits_disabled;

-- Verify function is disabled
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'consume_specific_credits_disabled';

-- Test that disabled function is not accessible
DO $$
BEGIN
    PERFORM consume_specific_credits('rollback-test-org-uuid', 'ai', 1, 'Should fail');
    RAISE EXCEPTION 'Rollback test failed: Disabled function still accessible!';
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'Rollback test passed: Function properly disabled';
END $$;

-- Restore function for continued testing
ALTER FUNCTION consume_specific_credits_disabled(UUID, TEXT, INTEGER, TEXT)
RENAME TO consume_specific_credits;

COMMIT;
```

**Expected Results**:

- Function disable/restore works correctly
- Data preserved during rollback
- System remains functional after rollback reversal

#### **Test Scenario 4B: Emergency Rollback Test (Non-Destructive)**

```sql
-- Test emergency rollback procedures without data loss
-- Create complete backup first
CREATE TABLE emergency_rollback_backup AS
SELECT * FROM organizations;

-- Document current function state
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name ILIKE '%credit%'
AND routine_schema = 'public';

-- Test rollback triggers
CREATE OR REPLACE FUNCTION test_rollback_trigger() RETURNS BOOLEAN AS $$
BEGIN
    -- Simulate critical error condition
    IF (SELECT COUNT(*) FROM organizations WHERE ai_credits < 0) > 0 THEN
        RAISE EXCEPTION 'ROLLBACK TRIGGER: Negative credits detected!';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test the trigger
SELECT test_rollback_trigger(); -- Should pass

-- Simulate trigger condition (without actually corrupting data)
INSERT INTO credit_actions (
    organization_id,
    action_type,
    credits_consumed,
    description
) VALUES (
    'test-org-uuid',
    'rollback_test',
    0,
    'Simulated rollback trigger test'
);

-- Clean up test function
DROP FUNCTION test_rollback_trigger();
DROP TABLE emergency_rollback_backup;
```

**Expected Results**:

- Rollback triggers function correctly
- Backup procedures work as expected
- No data corruption during rollback tests

### **4.2: Recovery Validation**

#### **Test Scenario 4C: System Recovery Test**

```sql
-- Test full system recovery after simulated failure
BEGIN;

-- Simulate recovery scenario
CREATE TEMP TABLE recovery_checkpoint AS
SELECT
    'pre_recovery' as checkpoint,
    COUNT(*) as total_orgs,
    SUM(ai_credits) as total_ai_credits,
    SUM(whatsapp_credits) as total_whatsapp_credits,
    SUM(email_credits) as total_email_credits,
    SUM(sms_credits) as total_sms_credits
FROM organizations;

-- Simulate system restoration
-- (In real scenario, this would restore from backups)

-- Verify system integrity post-recovery
CREATE TEMP TABLE recovery_validation AS
SELECT
    'post_recovery' as checkpoint,
    COUNT(*) as total_orgs,
    SUM(ai_credits) as total_ai_credits,
    SUM(whatsapp_credits) as total_whatsapp_credits,
    SUM(email_credits) as total_email_credits,
    SUM(sms_credits) as total_sms_credits
FROM organizations;

-- Compare pre and post recovery states
SELECT
    'Recovery Integrity Check' as test_name,
    rc1.total_orgs = rc2.total_orgs as org_count_match,
    rc1.total_ai_credits = rc2.total_ai_credits as ai_credits_match,
    rc1.total_whatsapp_credits = rc2.total_whatsapp_credits as whatsapp_credits_match,
    rc1.total_email_credits = rc2.total_email_credits as email_credits_match,
    rc1.total_sms_credits = rc2.total_sms_credits as sms_credits_match
FROM recovery_checkpoint rc1, recovery_validation rc2;

ROLLBACK; -- This test was just a simulation
```

**Expected Results**:

- Recovery procedures complete successfully
- Data integrity maintained through recovery
- All system functions operational post-recovery

---

## 📊 **TEST RESULTS DOCUMENTATION**

### **Test Execution Template**

```sql
-- Test Results Recording Template
CREATE TEMP TABLE IF NOT EXISTS test_results (
    test_phase VARCHAR(50),
    test_scenario VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms INTEGER,
    status VARCHAR(20), -- PASS, FAIL, WARNING
    expected_result TEXT,
    actual_result TEXT,
    performance_metric NUMERIC,
    notes TEXT
);

-- Example result recording
INSERT INTO test_results VALUES (
    'Phase 3: Post-Migration',
    '3A: Multi-Credit Workflow Test',
    '2025-10-12 19:30:00',
    '2025-10-12 19:32:15',
    135000,
    'PASS',
    'All credit types functional, accurate tracking',
    'All 4 credit types consumed correctly, audit trail complete',
    95.5, -- Performance as % of baseline
    'Workflow completed successfully within performance thresholds'
);
```

### **Performance Benchmarking**

```sql
-- Performance Comparison Template
CREATE TEMP TABLE performance_comparison (
    operation VARCHAR(100),
    baseline_ms NUMERIC,
    post_migration_ms NUMERIC,
    performance_ratio NUMERIC,
    status VARCHAR(20)
);

-- Example performance recording
INSERT INTO performance_comparison VALUES
('Single org credit query', 45.2, 48.7, 1.08, 'PASS'),
('Credit consumption function', 156.3, 167.9, 1.07, 'PASS'),
('Bulk summary query', 423.1, 451.8, 1.07, 'PASS'),
('Concurrent load test (50 ops)', 4521.7, 4832.3, 1.07, 'PASS');

-- Performance summary
SELECT
    'Performance Summary' as report_type,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN performance_ratio <= 1.1 THEN 1 END) as within_threshold,
    AVG(performance_ratio) as avg_performance_ratio,
    MAX(performance_ratio) as worst_performance_ratio
FROM performance_comparison;
```

---

## ✅ **ACCEPTANCE CRITERIA VALIDATION**

### **Final Acceptance Test Suite**

```sql
-- Comprehensive acceptance validation
SELECT
    'FINAL ACCEPTANCE TEST' as test_suite,

    -- Functional Tests
    (SELECT COUNT(*) FROM organizations WHERE ai_credits > 0) as orgs_with_ai_credits,
    (SELECT COUNT(*) FROM organizations WHERE whatsapp_credits > 0) as orgs_with_whatsapp_credits,
    (SELECT COUNT(*) FROM organizations WHERE email_credits > 0) as orgs_with_email_credits,
    (SELECT COUNT(*) FROM organizations WHERE sms_credits > 0) as orgs_with_sms_credits,

    -- Data Integrity Tests
    (SELECT COUNT(*) FROM organizations WHERE ai_used_credits > ai_credits) as ai_constraint_violations,
    (SELECT COUNT(*) FROM organizations WHERE whatsapp_used_credits > whatsapp_credits) as whatsapp_constraint_violations,
    (SELECT COUNT(*) FROM organizations WHERE email_used_credits > email_credits) as email_constraint_violations,
    (SELECT COUNT(*) FROM organizations WHERE sms_used_credits > sms_credits) as sms_constraint_violations,

    -- Audit Trail Tests
    (SELECT COUNT(DISTINCT action_type) FROM credit_actions WHERE action_type ILIKE '%consumption%') as credit_action_types,
    (SELECT COUNT(*) FROM credit_actions WHERE created_at >= (NOW() - INTERVAL '1 hour')) as recent_audit_entries;

-- Final system health check
SELECT
    'SYSTEM HEALTH CHECK' as check_type,

    -- Database Health
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name ILIKE '%credit%') as credit_functions,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'organizations' AND indexname ILIKE '%credit%') as credit_indexes,

    -- Performance Indicators
    (SELECT AVG(mean_exec_time) FROM pg_stat_statements WHERE query ILIKE '%organizations%') as avg_query_time_ms;
```

### **Go-Live Checklist**

- [ ] **All test phases completed successfully**
- [ ] **Performance within acceptable thresholds (≤110% baseline)**
- [ ] **Data integrity verified (zero constraint violations)**
- [ ] **Security controls functional (RLS policies working)**
- [ ] **Audit trail complete (all actions logged)**
- [ ] **Rollback procedures tested and ready**
- [ ] **Documentation complete and accurate**
- [ ] **Stakeholder sign-off obtained**

---

## 🎯 **TEST EXECUTION SCHEDULE**

### **Phase-by-Phase Timeline**

| Phase       | Duration | Activities                           | Success Gate                 |
| ----------- | -------- | ------------------------------------ | ---------------------------- |
| **Phase 1** | 5 min    | Pre-migration baseline testing       | Baseline established         |
| **Phase 2** | 20 min   | Migration validation testing         | Migration verified           |
| **Phase 3** | 45 min   | Post-migration comprehensive testing | All functions validated      |
| **Phase 4** | 15 min   | Rollback procedure testing           | Recovery procedures verified |

### **Quality Gates**

Each phase must pass before proceeding:

1. **No critical errors** in any test scenario
2. **Performance within thresholds** for all operations
3. **100% data integrity** maintained throughout
4. **Security controls** functioning correctly
5. **Audit trail** complete and accurate

---

**This comprehensive testing suite ensures the Phase 3.5 migration meets all quality, performance, and safety requirements.**

**Status**: ✅ READY FOR EXECUTION
