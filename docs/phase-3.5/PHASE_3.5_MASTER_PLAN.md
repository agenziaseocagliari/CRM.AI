# Phase 3.5: Database Health & Multi-Credit Migration
## Master Execution Plan

**Project**: Guardian AI CRM  
**Phase**: 3.5 (Database Health & Multi-Credit Migration)  
**Start Date**: October 12, 2025, 18:53 CEST  
**Estimated Duration**: 3-4 hours  
**Lead Engineer**: Claude Sonnet 4 (GitHub Copilot)  

---

## 📋 **EXECUTIVE SUMMARY**

### **Business Objective**
Migrate Guardian AI CRM from unified credit system to multi-credit system to align with published pricing plans and enable accurate per-API margin tracking.

### **Technical Objective** 
Transform database schema from single credit pool to separated AI/WhatsApp/Email/SMS credit pools while maintaining system functionality and business continuity.

### **Success Criteria**
- ✅ Multi-credit schema implemented and operational
- ✅ Organization data migrated to plan-based credit allocation
- ✅ Credit consumption tracking accurate per API type
- ✅ Margin tracking capability ≥82% verified
- ✅ Zero data loss or system downtime
- ✅ Rollback capability tested and available

### **Risk Assessment**: **LOW**
- Additive migration (no data deletion)
- Comprehensive backup system in place
- Verified rollback procedures available
- Incremental testing approach

---

## 🗺️ **MIGRATION STRATEGY**

### **Approach**: **Additive Schema Evolution**
1. **Add new multi-credit columns** alongside existing unified columns
2. **Migrate data** from unified → multi-credit allocation
3. **Update functions** to use new schema
4. **Test functionality** end-to-end
5. **Deprecate old columns** (future phase)

### **Data Migration Logic**
```sql
-- Convert unified credits to multi-credit based on plan type
CASE 
  WHEN plan_name = 'enterprise' THEN 
    ai_credits = 1500, whatsapp_credits = 1200, email_credits = 20000
  WHEN plan_name = 'premium' THEN
    ai_credits = 1500, whatsapp_credits = 1200, email_credits = 20000
  ELSE -- system admin or custom
    ai_credits = total_credits * 0.4, 
    whatsapp_credits = total_credits * 0.3,
    email_credits = total_credits * 0.3
END
```

### **Function Migration Strategy**
- **Phase 1**: Update `consume_credits_rpc` to support both unified + multi-credit
- **Phase 2**: Migrate all function calls to multi-credit parameters
- **Phase 3**: Remove unified credit support (future)

---

## 🛡️ **ROLLBACK PLAN**

### **Rollback Triggers**
- Data corruption detected
- Function failures > 10%
- Performance degradation > 50%
- Business logic errors
- Stakeholder request

### **Rollback Procedure**
1. **Stop all credit consumption** (maintenance mode)
2. **Restore database** from SQL backup files:
   - `organizations_backup_2025-10-12.sql`
   - `organization_credits_backup_2025-10-12.sql`
   - `credit_actions_backup_2025-10-12.sql`
3. **Deploy old Edge Function** version (if needed)
4. **Verify system functionality**
5. **Resume operations**
6. **Document rollback cause**

### **Rollback Time Estimate**: 30-45 minutes

---

## ✅ **TESTING CHECKLIST**

### **Pre-Migration Tests**
- [ ] Current credit consumption working
- [ ] Organization data integrity verified
- [ ] Backup restoration tested
- [ ] Edge function baseline performance recorded

### **During Migration Tests**
- [ ] Schema changes applied successfully
- [ ] Data migration completed without errors
- [ ] New function deployment successful
- [ ] Basic functionality test passed

### **Post-Migration Tests**
- [ ] AI credit consumption (action_type: 'ai_chat')
- [ ] WhatsApp credit consumption (action_type: 'whatsapp_message')
- [ ] Email credit consumption (action_type: 'email_send')
- [ ] Multi-action scenario (consume multiple credit types)
- [ ] Credit exhaustion handling
- [ ] Organization credit balance accuracy
- [ ] Performance benchmarks met
- [ ] Rollback capability verified

---

## 📊 **SUCCESS METRICS**

### **Functional Metrics**
- ✅ **Credit Accuracy**: 100% alignment with plan definitions
- ✅ **Data Integrity**: Zero data loss, corruption, or inconsistency
- ✅ **Function Performance**: ≤200ms response time (baseline: ~150ms)
- ✅ **System Availability**: 100% uptime during migration

### **Business Metrics**
- ✅ **Margin Tracking**: Accurate per-API cost calculation
- ✅ **Plan Compliance**: Credits match published landing pages
- ✅ **Billing Accuracy**: Consumption tracking precise to credit unit

### **Technical Metrics**
- ✅ **Database Performance**: Query times ≤ baseline + 10%
- ✅ **Schema Consistency**: All constraints and relationships intact
- ✅ **Function Reliability**: Zero errors in credit consumption operations

---

## 🔄 **EXECUTION WORKFLOW**

### **Task 0**: Documentation & Planning (15 min)
- Create master documentation suite
- Verify all safety procedures
- Confirm stakeholder alignment

### **Task 1**: Credit System Status Check (15 min)
- Document current schema architecture
- Test existing credit consumption
- Benchmark performance metrics
- Identify migration requirements

### **Task 2**: Multi-Credit System Migration (90 min)
- **2.1** Schema Migration (30 min)
- **2.2** Data Migration (30 min)  
- **2.3** Function Updates (30 min)

### **Task 3**: RLS Policies Testing (30 min)
- Verify multi-tenant data isolation
- Test role-based access controls
- Performance impact analysis

### **Task 4**: Performance & Optimization (45 min)
- Query optimization
- Index tuning
- Caching verification

### **Task 5**: Audit Logging Verification (30 min)
- Comprehensive logging test
- GDPR compliance check
- Performance assessment

---

## 📞 **COMMUNICATION PROTOCOL**

### **Stakeholder Updates**
- **Task Start**: Announce beginning with ETA
- **Progress Updates**: 25%, 50%, 75% completion
- **Issues**: Immediate escalation for blockers
- **Completion**: Full status report with deliverables

### **Emergency Contacts**
- **Technical Lead**: Claude Sonnet 4 (GitHub Copilot)
- **Project Owner**: agenziaseocagliari
- **Rollback Authority**: Both parties must agree

---

## 🎯 **DELIVERABLES CHECKLIST**

### **Documentation Deliverables**
- [ ] PHASE_3.5_MASTER_PLAN.md (this document)
- [ ] MIGRATION_SAFETY_CHECKLIST.md
- [ ] TASK_BREAKDOWN.md  
- [ ] SQL_MIGRATION_SCRIPTS.md
- [ ] TESTING_SCENARIOS.md

### **Migration Deliverables**
- [ ] Updated database schema
- [ ] Migrated organization data
- [ ] New/updated Edge Functions
- [ ] Performance benchmarks
- [ ] Test results documentation
- [ ] Git commit with all changes

### **Final Deliverables**
- [ ] PHASE_3.5_COMPLETION_REPORT.md
- [ ] PHASE_3.5_LESSONS_LEARNED.md
- [ ] Updated system documentation

---

## 🚦 **GO/NO-GO DECISION CRITERIA**

### **GO Criteria** ✅
- [ ] All documentation complete and reviewed
- [ ] Backup systems verified and tested
- [ ] Rollback procedures documented and understood
- [ ] Development environment 100% operational
- [ ] Stakeholder approval obtained

### **NO-GO Criteria** ❌
- [ ] Backup system failures
- [ ] Database connectivity issues
- [ ] Incomplete rollback procedures
- [ ] Performance degradation detected
- [ ] Stakeholder concerns raised

---

## ⏰ **TIMELINE SUMMARY**

| Task | Duration | Start | End | Deliverables |
|------|----------|-------|-----|--------------|
| **Task 0** | 15 min | 18:53 | 19:08 | 5 documentation files |
| **Task 1** | 15 min | 19:10 | 19:25 | Status assessment |
| **Task 2** | 90 min | 19:30 | 21:00 | Migration complete |
| **Task 3** | 30 min | 21:00 | 21:30 | RLS verification |
| **Task 4** | 45 min | 21:30 | 22:15 | Performance tuning |
| **Task 5** | 30 min | 22:15 | 22:45 | Audit verification |
| **Wrap-up** | 15 min | 22:45 | 23:00 | Final documentation |

**Total Duration**: 4 hours  
**Completion Target**: 23:00 CEST (October 12, 2025)

---

**This master plan serves as the single source of truth for Phase 3.5 execution.**  
**All decisions, changes, and updates must be documented here.**

**Status**: ✅ APPROVED - READY FOR EXECUTION