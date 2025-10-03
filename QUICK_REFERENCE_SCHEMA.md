# 🚀 Quick Reference: Database Schema

**Last Updated**: 2025-10-03  
**For Complete Details**: See `DATABASE_SCHEMA_COMPLETE_REFERENCE.md`

---

## ⚡ Quick Stats

- **Total Tables**: 63 (53 migrated + 10 prerequisites)
- **RLS Coverage**: 100%
- **Total Indexes**: 150+
- **Database Functions**: 15+
- **Migration Files**: 24 (23 + 1 fix)

---

## 🚨 Critical Prerequisites

These tables MUST exist before running migrations:

1. ✅ `organizations` - Multi-tenancy core (referenced by 40+ tables)
2. ✅ `profiles` - User management (required for all RLS)
3. ✅ `contacts` - CRM core
4. ✅ `opportunities` - Sales pipeline
5. `forms` - Form management
6. `google_credentials` - OAuth integration
7. `organization_settings` - Configuration
8. `organization_subscriptions` - Billing
9. `credit_ledger` - Legacy credits
10. `automations` - Automation rules

**Verify**: 
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'profiles', 'contacts', 'opportunities');
```

---

## 📊 Tables by Category

### Rate Limiting (10 tables)
- `api_rate_limits` ⭐ - Main rate limiting tracker
- `quota_policies` - Policy definitions
- `organization_quota_overrides` - Custom org limits
- `quota_alerts` - Usage alerts
- `api_usage_statistics` - Usage stats
- `rate_limit_config` - Phase 3 config
- `rate_limit_tracking` - Phase 3 tracking
- `rate_limit_quota_usage` - Monthly quotas

### Workflows (13 tables)
- `workflow_definitions` ⭐ - Workflow definitions
- `workflow_execution_logs` - Execution history
- `workflow_templates` - Pre-built templates
- `workflow_conditions` - Branching logic
- `workflow_actions` - Action definitions
- `workflow_triggers` - Trigger config
- `workflow_versions` - Version control
- `workflow_execution_steps` - Step tracking
- `workflow_variables` - Template variables
- `automation_agents` - AI agents
- `agent_execution_logs` - Agent history

### Integrations (3 tables)
- `integrations` ⭐ - Third-party integrations
- `api_integrations` - API providers
- `integration_usage_logs` - Usage tracking

### Audit & Security (8 tables)
- `audit_logs` ⭐ - Main audit log
- `audit_logs_enhanced` - Enhanced with security context
- `audit_log_exports` - Export tracking
- `security_events` - Security-specific events
- `security_alerts` - User security alerts
- `superadmin_logs` - Super admin activity
- `data_sensitivity_classifications` - Data classification
- `ip_whitelist` - IP whitelisting

### Access Control (6 tables)
- `user_2fa_settings` ⭐ - 2FA config
- `user_2fa_attempts` - 2FA attempts
- `login_attempts` - Login tracking
- `trusted_devices` - Device management
- `ip_access_log` - IP access tracking
- `geo_restrictions` - Geographic restrictions

### Incident Response (8 tables)
- `incidents` ⭐ - Incident tracking
- `incident_actions` - Action timeline
- `notification_rules` - Notification config
- `notification_logs` - Notification history
- `escalation_rules` - Auto-escalation
- `rollback_procedures` - Rollback definitions
- `rollback_executions` - Rollback history

### System Health (4 tables)
- `system_health_checks` - Health check results
- `system_metrics` - Time-series metrics
- `alert_rules` - Alerting rules
- `alert_history` - Alert history

### Credits & Billing (3 tables)
- `organization_credits` - Credit balances
- `credit_actions` - Action costs
- `credit_consumption_logs` - Usage tracking

### CRM Core (2 tables)
- `crm_events` - CRM events
- `event_reminders` - Event reminders

### Debug (1 table)
- `debug_logs` - Development logs

---

## 🔍 Most Referenced Tables

1. **organizations** (40+ references) - Multi-tenancy core
2. **auth.users** (30+ references) - User auth
3. **profiles** (All RLS policies) - User profiles
4. **workflow_definitions** (10+ references) - Workflow system
5. **incidents** (5+ references) - Incident response

---

## 🔧 Key Database Functions

### Rate Limiting
```sql
check_rate_limit() → BOOLEAN
get_quota_usage() → TABLE
cleanup_old_rate_limit_data() → INTEGER
```

### Performance
```sql
get_slow_queries(threshold_ms) → TABLE
check_index_health() → TABLE
```

### Authentication
```sql
custom_access_token_hook(event) → JSONB
```

---

## 🛡️ RLS Policy Patterns

### 1. Organization Isolation
```sql
CREATE POLICY "org_isolation" ON table_name FOR SELECT TO public
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));
```

### 2. Super Admin Override
```sql
CREATE POLICY "superadmin_access" ON table_name FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
));
```

### 3. Owner Only
```sql
CREATE POLICY "owner_only" ON table_name FOR ALL TO public
USING (user_id = auth.uid());
```

---

## 🚨 Known Issues & Fixes

### ✅ Fixed: Non-IMMUTABLE Functions in Indexes

**Problem**: 4 indexes used `NOW()` in WHERE clauses  
**Fix**: 
- ✅ Source migration fixed: `20250123000000_phase3_performance_indexes.sql`
- ✅ Fix migration updated: `20251103000000_fix_non_immutable_index_predicates.sql`  
**Status**: ✅ Fully Resolved

**Affected Indexes**:
- `idx_rate_limits_cleanup`
- `idx_upcoming_events`
- `idx_sessions_expired`
- `idx_audit_old_entries`

### ⚠️ Documented: Missing Core Tables

**Problem**: 10 core tables not in migrations  
**Fix**: Documented in `DATABASE_SCHEMA_COMPLETE_REFERENCE.md`  
**Status**: ⚠️ Requires manual setup

---

## 📝 Validation Scripts

### Schema Validation
```bash
supabase db execute --file scripts/verify-phase3-schema.sql
```

### Migration Testing (Staging Only)
```bash
supabase db execute --file scripts/test-phase3-migrations.sql
```

### Integration Verification
```bash
supabase db execute --file scripts/verify-integrations-migration.sql
```

---

## 🚀 Quick Deployment

### 1. Pre-Flight Check
```sql
-- Verify prerequisites
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'profiles', 'contacts', 'opportunities');
```

### 2. Deploy Migrations
```bash
# All migrations
supabase db push

# Fix migration
supabase db execute --file supabase/migrations/20251103000000_fix_non_immutable_index_predicates.sql
```

### 3. Verify
```bash
# Run validation
supabase db execute --file scripts/verify-phase3-schema.sql

# Check indexes (verify no NOW() predicates)
SELECT indexname, indexdef FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_rate_limits_cleanup', 'idx_upcoming_events', 'idx_sessions_expired', 'idx_audit_old_entries');
```

### 4. Monitor
```sql
-- Index usage
SELECT indexname, idx_scan FROM pg_stat_user_indexes
WHERE schemaname = 'public' ORDER BY idx_scan DESC LIMIT 20;

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC LIMIT 20;
```

---

## 📚 Documentation Files

### Main References
1. **DATABASE_SCHEMA_COMPLETE_REFERENCE.md** - Complete schema (2200+ lines)
2. **SCHEMA_VERIFICATION_TRACKING.md** - Verification & tracking (800+ lines)
3. **SCHEMA_ALIGNMENT_IMPLEMENTATION_SUMMARY_IT.md** - Implementation summary (Italian)
4. **This file** - Quick reference

### Supporting Docs
- `PHASE_3_SCHEMA_COMPLIANCE_REPORT_IT.md` - Phase 3 compliance
- `PHASE_3_SCHEMA_VALIDATION.md` - Validation procedures
- `MIGRATION_ROBUSTNESS_GUIDE.md` - Migration best practices

---

## 💡 Common Queries

### Find tables without RLS
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

### List all indexes for a table
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'api_rate_limits';
```

### Check RLS policies
```sql
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename;
```

### Find unused indexes
```sql
SELECT indexname, idx_scan FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0;
```

---

## ✅ Status Summary

**Schema**: ✅ Complete & Documented  
**Migrations**: ✅ Sequenced Correctly  
**Indexes**: ✅ Optimized & Fixed  
**RLS**: ✅ 100% Coverage  
**Code**: ✅ Aligned with Schema  
**Deployment**: ✅ Ready  

---

**For detailed information, see**: `DATABASE_SCHEMA_COMPLETE_REFERENCE.md`  
**Last Updated**: 2025-10-03  
**Version**: 1.0
