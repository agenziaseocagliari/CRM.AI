# Phase 3.5: Task Breakdown & Execution Guide

## Detailed Implementation Roadmap

**Project**: Guardian AI CRM  
**Phase**: 3.5 (Database Health & Multi-Credit Migration)  
**Document Type**: Task Breakdown  
**Created**: October 12, 2025, 18:55 CEST

---

## 📋 **TASK OVERVIEW**

| Task  | Name                          | Duration | Dependencies              | Risk Level |
| ----- | ----------------------------- | -------- | ------------------------- | ---------- |
| **0** | Documentation & Planning      | 15 min   | Safety checklist complete | 🟢 LOW     |
| **1** | Credit System Status Check    | 15 min   | Task 0 complete           | 🟢 LOW     |
| **2** | Multi-Credit System Migration | 90 min   | Task 1 complete           | 🟡 MEDIUM  |
| **3** | RLS Policies Testing          | 30 min   | Task 2 complete           | 🟡 MEDIUM  |
| **4** | Performance & Optimization    | 45 min   | Task 3 complete           | 🟢 LOW     |
| **5** | Audit Logging Verification    | 30 min   | Task 4 complete           | 🟢 LOW     |

**Total Duration**: 225 minutes (3 hours 45 minutes)  
**Buffer Time**: 15 minutes  
**Total Window**: 4 hours

---

## 📝 **TASK 0: Documentation & Planning**

**Duration**: 15 minutes  
**Risk Level**: 🟢 LOW  
**Lead**: Claude Sonnet 4

### **Objective**

Complete documentation suite and verify all safety procedures before migration begins.

### **Deliverables**

- [ ] `PHASE_3.5_MASTER_PLAN.md` ✅ Complete
- [ ] `MIGRATION_SAFETY_CHECKLIST.md` ✅ Complete
- [ ] `TASK_BREAKDOWN.md` (this document) ⏳ In Progress
- [ ] `SQL_MIGRATION_SCRIPTS.md` 🔄 Pending
- [ ] `TESTING_SCENARIOS.md` 🔄 Pending

### **Step-by-Step Execution**

1. **Create remaining documentation files** (5 min)
   - Complete SQL_MIGRATION_SCRIPTS.md
   - Complete TESTING_SCENARIOS.md
2. **Verify safety checklist completion** (5 min)
   - Review all safety requirements
   - Confirm backup systems operational
   - Validate rollback readiness

3. **Stakeholder final approval** (5 min)
   - Present complete documentation suite
   - Obtain go/no-go decision
   - Document approval in master plan

### **Success Criteria**

- All 5 documentation files created and reviewed
- Safety checklist 100% complete
- Stakeholder approval obtained and documented
- Migration authorized to proceed

### **Rollback Triggers**

- Incomplete documentation
- Safety requirements not met
- Stakeholder concerns raised
- Technical environment issues

---

## 🔍 **TASK 1: Credit System Status Check**

**Duration**: 15 minutes  
**Risk Level**: 🟢 LOW  
**Lead**: Claude Sonnet 4

### **Objective**

Document current system architecture, test existing functionality, and establish migration baseline.

### **Deliverables**

- Current schema documentation
- Performance baseline metrics
- System health verification
- Migration requirements confirmation

### **Step-by-Step Execution**

#### **1.1: Database Schema Analysis** (5 min)

```sql
-- Document current organizations table structure
\d organizations;

-- Document current organization_credits table structure
\d organization_credits;

-- Document credit_actions table structure
\d credit_actions;
```

**Expected Results:**

- Organizations table with current credit fields
- Credit tracking mechanisms identified
- Action logging structure documented

#### **1.2: Current System Testing** (5 min)

```sql
-- Test current credit consumption function
SELECT consume_credits_rpc(
    p_organization_id := 'test-org-uuid',
    p_action_type := 'ai_chat',
    p_credits := 1
);

-- Verify current credit balances
SELECT organization_id, total_credits, used_credits, remaining_credits
FROM organization_credits
LIMIT 5;
```

**Expected Results:**

- Credit consumption function working properly
- Current balances accurate and consistent
- No errors in existing system

#### **1.3: Performance Baseline** (5 min)

```sql
-- Measure current query performance
EXPLAIN ANALYZE
SELECT * FROM organization_credits
WHERE organization_id = 'sample-uuid';

-- Check function execution time
\timing on
SELECT consume_credits_rpc('test-org', 'ai_chat', 1);
\timing off
```

**Expected Results:**

- Query execution time baseline recorded
- Function performance baseline established
- No performance issues identified

### **Success Criteria**

- Current system fully documented
- All existing functionality verified working
- Performance baselines established
- No critical issues discovered

### **Rollback Triggers**

- Current system not functioning properly
- Performance issues detected
- Data integrity problems found
- Cannot establish reliable baseline

---

## 🚀 **TASK 2: Multi-Credit System Migration**

**Duration**: 90 minutes  
**Risk Level**: 🟡 MEDIUM  
**Lead**: Claude Sonnet 4

### **Objective**

Transform database from unified credit system to multi-credit system (AI, WhatsApp, Email, SMS).

### **Deliverables**

- Updated database schema with multi-credit columns
- Migrated organization data with plan-based allocation
- Updated Edge Functions for multi-credit consumption
- Verified functionality across all credit types

### **Step-by-Step Execution**

#### **2.1: Schema Migration** (30 min)

##### **2.1.1: Add Multi-Credit Columns** (10 min)

```sql
-- Add new credit columns to organizations table
ALTER TABLE organizations
ADD COLUMN ai_credits INTEGER DEFAULT 0,
ADD COLUMN whatsapp_credits INTEGER DEFAULT 0,
ADD COLUMN email_credits INTEGER DEFAULT 0,
ADD COLUMN sms_credits INTEGER DEFAULT 0,
ADD COLUMN ai_used_credits INTEGER DEFAULT 0,
ADD COLUMN whatsapp_used_credits INTEGER DEFAULT 0,
ADD COLUMN email_used_credits INTEGER DEFAULT 0,
ADD COLUMN sms_used_credits INTEGER DEFAULT 0;
```

##### **2.1.2: Create Credit Allocation Function** (10 min)

```sql
CREATE OR REPLACE FUNCTION allocate_plan_credits(
    org_id UUID,
    plan_type TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE organizations
    SET
        ai_credits = CASE plan_type
            WHEN 'enterprise' THEN 1500
            WHEN 'premium' THEN 1500
            ELSE COALESCE(total_credits * 0.4, 500)
        END,
        whatsapp_credits = CASE plan_type
            WHEN 'enterprise' THEN 1200
            WHEN 'premium' THEN 1200
            ELSE COALESCE(total_credits * 0.3, 300)
        END,
        email_credits = CASE plan_type
            WHEN 'enterprise' THEN 20000
            WHEN 'premium' THEN 20000
            ELSE COALESCE(total_credits * 0.3, 1000)
        END,
        sms_credits = CASE plan_type
            WHEN 'enterprise' THEN 500
            WHEN 'premium' THEN 500
            ELSE COALESCE(total_credits * 0.1, 100)
        END
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### **2.1.3: Create Indexes for Performance** (10 min)

```sql
-- Add indexes for multi-credit queries
CREATE INDEX IF NOT EXISTS idx_organizations_ai_credits
ON organizations(ai_credits, ai_used_credits);

CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_credits
ON organizations(whatsapp_credits, whatsapp_used_credits);

CREATE INDEX IF NOT EXISTS idx_organizations_email_credits
ON organizations(email_credits, email_used_credits);

CREATE INDEX IF NOT EXISTS idx_organizations_sms_credits
ON organizations(sms_credits, sms_used_credits);
```

#### **2.2: Data Migration** (30 min)

##### **2.2.1: Migrate Organization Credits** (15 min)

```sql
-- Migrate all organizations to multi-credit system
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN
        SELECT id, plan_name, total_credits
        FROM organizations
        WHERE ai_credits = 0 -- Only migrate unmigrated orgs
    LOOP
        PERFORM allocate_plan_credits(org_record.id, org_record.plan_name);

        -- Log the migration
        INSERT INTO credit_actions (
            organization_id,
            action_type,
            credits_consumed,
            description,
            created_at
        ) VALUES (
            org_record.id,
            'migration',
            0,
            'Migrated to multi-credit system: ' || org_record.plan_name,
            NOW()
        );
    END LOOP;
END $$;
```

##### **2.2.2: Verify Migration Integrity** (15 min)

```sql
-- Verify all organizations have multi-credits allocated
SELECT
    plan_name,
    COUNT(*) as org_count,
    AVG(ai_credits) as avg_ai_credits,
    AVG(whatsapp_credits) as avg_whatsapp_credits,
    AVG(email_credits) as avg_email_credits,
    AVG(sms_credits) as avg_sms_credits
FROM organizations
GROUP BY plan_name;

-- Check for any missing allocations
SELECT id, name, plan_name
FROM organizations
WHERE ai_credits = 0 AND whatsapp_credits = 0;
```

#### **2.3: Function Updates** (30 min)

##### **2.3.1: Update Credit Consumption Function** (20 min)

```typescript
// Update Edge Function: consume-credits
export const consume_credits_rpc = async (
  organization_id: string,
  action_type: 'ai_chat' | 'whatsapp_message' | 'email_send' | 'sms_send',
  credits: number
) => {
  const { data: org, error } = await supabase
    .from('organizations')
    .select(
      'ai_credits, whatsapp_credits, email_credits, sms_credits, ai_used_credits, whatsapp_used_credits, email_used_credits, sms_used_credits'
    )
    .eq('id', organization_id)
    .single();

  if (error || !org) {
    throw new Error('Organization not found');
  }

  // Determine credit type and check availability
  let creditField: string, usedField: string, available: number;

  switch (action_type) {
    case 'ai_chat':
      creditField = 'ai_credits';
      usedField = 'ai_used_credits';
      available = org.ai_credits - org.ai_used_credits;
      break;
    case 'whatsapp_message':
      creditField = 'whatsapp_credits';
      usedField = 'whatsapp_used_credits';
      available = org.whatsapp_credits - org.whatsapp_used_credits;
      break;
    case 'email_send':
      creditField = 'email_credits';
      usedField = 'email_used_credits';
      available = org.email_credits - org.email_used_credits;
      break;
    case 'sms_send':
      creditField = 'sms_credits';
      usedField = 'sms_used_credits';
      available = org.sms_credits - org.sms_used_credits;
      break;
    default:
      throw new Error('Invalid action type');
  }

  if (available < credits) {
    throw new Error(
      `Insufficient ${action_type} credits. Available: ${available}, Required: ${credits}`
    );
  }

  // Update used credits
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ [usedField]: org[usedField] + credits })
    .eq('id', organization_id);

  if (updateError) {
    throw new Error('Failed to consume credits');
  }

  // Log the action
  await supabase.from('credit_actions').insert({
    organization_id,
    action_type,
    credits_consumed: credits,
    description: `Consumed ${credits} ${action_type} credits`,
  });

  return {
    success: true,
    remaining_credits: available - credits,
    action_type,
    credits_consumed: credits,
  };
};
```

##### **2.3.2: Deploy Updated Function** (10 min)

```powershell
# Deploy the updated Edge Function
npx supabase functions deploy consume-credits --project-ref qjtaqrlpronohgpfdxsi
```

### **Success Criteria**

- Database schema updated with multi-credit columns
- All organization data migrated successfully
- New credit consumption function deployed and working
- All credit types (AI, WhatsApp, Email, SMS) functional

### **Rollback Triggers**

- Schema migration failures
- Data migration errors or inconsistencies
- Function deployment failures
- Credit consumption not working for any type

---

## 🔒 **TASK 3: RLS Policies Testing**

**Duration**: 30 minutes  
**Risk Level**: 🟡 MEDIUM  
**Lead**: Claude Sonnet 4

### **Objective**

Verify multi-tenant data isolation and role-based access controls work properly with new multi-credit system.

### **Deliverables**

- RLS policy verification for multi-credit columns
- Multi-tenant isolation confirmed
- Role-based access testing complete
- Performance impact assessment

### **Step-by-Step Execution**

#### **3.1: RLS Policy Review** (10 min)

```sql
-- Check existing RLS policies on organizations table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'organizations';

-- Verify policies cover new multi-credit columns
\d+ organizations
```

#### **3.2: Multi-Tenant Testing** (15 min)

```sql
-- Test as different organization users
SET ROLE organization_user;
SET request.jwt.claims TO '{"sub": "org-1-user", "organization_id": "org-1-uuid"}';

-- Should only see own organization data
SELECT id, name, ai_credits, whatsapp_credits
FROM organizations;

-- Test credit consumption with RLS
SELECT consume_credits_rpc('org-1-uuid', 'ai_chat', 1);

-- Switch to different org
SET request.jwt.claims TO '{"sub": "org-2-user", "organization_id": "org-2-uuid"}';

-- Should only see different organization data
SELECT id, name, ai_credits, whatsapp_credits
FROM organizations;
```

#### **3.3: Performance Impact Testing** (5 min)

```sql
-- Measure RLS performance with new columns
EXPLAIN ANALYZE
SELECT ai_credits, whatsapp_credits, email_credits, sms_credits
FROM organizations
WHERE id = 'test-org-uuid';

-- Compare with baseline from Task 1
```

### **Success Criteria**

- RLS policies properly protect multi-credit data
- Multi-tenant isolation maintained
- No unauthorized data access possible
- Performance impact within acceptable limits (<10% degradation)

### **Rollback Triggers**

- RLS policies not protecting new columns
- Data leakage between organizations
- Significant performance degradation (>20%)
- Access control failures

---

## ⚡ **TASK 4: Performance & Optimization**

**Duration**: 45 minutes  
**Risk Level**: 🟢 LOW  
**Lead**: Claude Sonnet 4

### **Objective**

Optimize query performance, tune indexes, and verify caching strategies for multi-credit system.

### **Deliverables**

- Query performance optimization
- Index tuning complete
- Caching verification
- Performance benchmarks documented

### **Step-by-Step Execution**

#### **4.1: Query Optimization** (15 min)

```sql
-- Analyze slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%organizations%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Optimize credit balance queries
CREATE OR REPLACE VIEW organization_credit_summary AS
SELECT
    id,
    name,
    ai_credits - ai_used_credits as ai_available,
    whatsapp_credits - whatsapp_used_credits as whatsapp_available,
    email_credits - email_used_credits as email_available,
    sms_credits - sms_used_credits as sms_available,
    (ai_credits + whatsapp_credits + email_credits + sms_credits) as total_allocated,
    (ai_used_credits + whatsapp_used_credits + email_used_credits + sms_used_credits) as total_used
FROM organizations;
```

#### **4.2: Index Tuning** (15 min)

```sql
-- Analyze index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'organizations'
AND attname IN ('ai_credits', 'whatsapp_credits', 'email_credits', 'sms_credits');

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_credit_summary
ON organizations(id, ai_credits, ai_used_credits, whatsapp_credits, whatsapp_used_credits);

-- Create partial indexes for active organizations
CREATE INDEX IF NOT EXISTS idx_active_organizations_credits
ON organizations(ai_credits, whatsapp_credits, email_credits, sms_credits)
WHERE status = 'active';
```

#### **4.3: Caching Verification** (15 min)

```typescript
// Test Edge Function caching
const testCachePerformance = async () => {
  const start = performance.now();

  // Test credit balance retrieval (should be cached)
  const result = await supabase
    .from('organization_credit_summary')
    .select('*')
    .eq('id', 'test-org-uuid');

  const end = performance.now();
  console.log(`Query time: ${end - start}ms`);

  return result;
};

// Run cache warming
await testCachePerformance();
await testCachePerformance(); // Second call should be faster
```

### **Success Criteria**

- Query performance within baseline +10%
- Indexes optimized for multi-credit queries
- Caching strategy verified and effective
- No performance regressions identified

### **Rollback Triggers**

- Performance degradation >20%
- Index creation failures
- Caching issues causing stale data
- Memory usage issues

---

## 📊 **TASK 5: Audit Logging Verification**

**Duration**: 30 minutes  
**Risk Level**: 🟢 LOW  
**Lead**: Claude Sonnet 4

### **Objective**

Verify comprehensive logging, GDPR compliance, and audit trail functionality with multi-credit system.

### **Deliverables**

- Audit logging verification
- GDPR compliance check
- Performance assessment
- Logging completeness validation

### **Step-by-Step Execution**

#### **5.1: Audit Trail Testing** (15 min)

```sql
-- Test comprehensive credit action logging
SELECT * FROM credit_actions
WHERE organization_id = 'test-org-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Verify all action types are logged
SELECT
    action_type,
    COUNT(*) as action_count,
    SUM(credits_consumed) as total_credits,
    MIN(created_at) as first_action,
    MAX(created_at) as last_action
FROM credit_actions
GROUP BY action_type;

-- Test migration logging
SELECT * FROM credit_actions
WHERE action_type = 'migration'
ORDER BY created_at DESC;
```

#### **5.2: GDPR Compliance Check** (10 min)

```sql
-- Verify data retention policies
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'credit_actions'
AND column_name IN ('organization_id', 'user_id', 'ip_address', 'user_agent');

-- Test data anonymization capability
UPDATE credit_actions
SET description = 'ANONYMIZED'
WHERE organization_id = 'test-delete-org-uuid';

-- Verify audit trail maintains integrity after anonymization
SELECT COUNT(*) FROM credit_actions
WHERE description = 'ANONYMIZED';
```

#### **5.3: Performance Assessment** (5 min)

```sql
-- Check audit logging performance impact
EXPLAIN ANALYZE
INSERT INTO credit_actions (
    organization_id,
    action_type,
    credits_consumed,
    description
) VALUES (
    'test-org-uuid',
    'ai_chat',
    1,
    'Performance test'
);

-- Verify logging doesn't slow down credit consumption
\timing on
SELECT consume_credits_rpc('test-org-uuid', 'ai_chat', 1);
\timing off
```

### **Success Criteria**

- All credit actions properly logged
- GDPR compliance verified
- Audit trail complete and accurate
- Logging performance impact minimal (<50ms)

### **Rollback Triggers**

- Logging failures or gaps
- GDPR compliance issues
- Performance impact >100ms
- Audit trail corruption

---

## 🎯 **EXECUTION CHECKLIST**

### **Pre-Task Preparation**

- [ ] All documentation reviewed and approved
- [ ] Safety checklist 100% complete
- [ ] Backup systems verified operational
- [ ] Stakeholder approval obtained
- [ ] Development environment ready

### **Task Completion Validation**

Each task must be marked complete ONLY when:

- [ ] All deliverables produced and verified
- [ ] Success criteria met
- [ ] No rollback triggers activated
- [ ] Documentation updated
- [ ] Next task dependencies satisfied

### **Inter-Task Dependencies**

- **Task 1** requires Task 0 documentation complete
- **Task 2** requires Task 1 baseline established
- **Task 3** requires Task 2 migration complete
- **Task 4** requires Task 3 RLS verified
- **Task 5** requires Task 4 optimization complete

### **Quality Gates**

Each task has mandatory quality verification:

1. **Functional Testing**: Feature works as designed
2. **Performance Testing**: No significant degradation
3. **Security Testing**: RLS and access controls intact
4. **Integration Testing**: System components work together
5. **Rollback Testing**: Rollback capability verified

---

## 📞 **COMMUNICATION PROTOCOL**

### **Task Status Updates**

- **Task Start**: "Starting Task X: [Name] - ETA: [Duration]"
- **Task Progress**: "Task X: 25/50/75% complete - [Status]"
- **Task Complete**: "Task X: ✅ COMPLETE - [Summary of deliverables]"
- **Issues**: "Task X: ⚠️ ISSUE - [Description] - [Action plan]"

### **Escalation Triggers**

- Task duration exceeds estimate by 50%
- Any rollback trigger activated
- Critical errors encountered
- Stakeholder input required

---

**This task breakdown serves as the execution blueprint for Phase 3.5.**  
**All tasks must be completed in sequence with full verification.**

**Status**: ✅ READY FOR EXECUTION
