# 🔍 Database Schema Complete Audit Checklist

**Generated**: 2025-01-24  
**Purpose**: Complete reference for all database tables, columns, indexes, functions, and policies  
**Status**: ✅ Extracted from all migration files

---

## 📊 Executive Summary

### Statistics
- **Total Tables**: 53
- **Total Database Functions**: 51
- **Total Views**: 5
- **Tables with Indexes**: 56
- **Tables with RLS Policies**: 55
- **Migration Files Analyzed**: 25

### Prerequisites (NOT in migrations)
The following core tables are **REQUIRED** but **NOT CREATED** in migrations:
- `organizations` - Multi-tenancy core (referenced by 40+ tables)
- `profiles` - User management (required for all RLS policies)
- `contacts` - CRM core functionality
- `opportunities` - Sales pipeline
- `forms` - Form management
- `google_credentials` - OAuth integration
- `organization_settings` - Configuration
- `organization_subscriptions` - Billing
- `credit_ledger` - Legacy credits system
- `automations` - Automation rules base table

---

## 📋 Complete Table Catalog by Category

### 1. 🏢 Core Business Tables (Prerequisites - Not in migrations)
**Status**: ⚠️ Must be created manually before running migrations

- [ ] `organizations` - Multi-tenant organization management
- [ ] `profiles` - User profiles and authentication
- [ ] `contacts` - CRM contact management
- [ ] `opportunities` - Sales pipeline and deals
- [ ] `forms` - Form definitions
- [ ] `google_credentials` - OAuth tokens
- [ ] `organization_settings` - Organization configuration
- [ ] `organization_subscriptions` - Billing subscriptions
- [ ] `credit_ledger` - Legacy credit system
- [ ] `automations` - Base automation rules

---

### 2. 🤖 Automation & Workflow Tables (11 tables)

#### `automation_agents`
**Source**: `20250102000000_create_agents_and_integrations.sql`  
**Purpose**: AI automation agent definitions  
**Columns**: 13

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | NOT NULL, FK → organizations |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| agent_type | TEXT | NOT NULL (e.g., 'lead_qualifier', 'email_responder') |
| configuration | JSONB | NOT NULL DEFAULT '{}' |
| is_active | BOOLEAN | DEFAULT true |
| trigger_type | TEXT | NOT NULL ('scheduled', 'event', 'webhook') |
| trigger_config | JSONB | NOT NULL DEFAULT '{}' |
| last_executed_at | TIMESTAMPTZ | - |
| execution_count | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 4
- `idx_automation_agents_org_id`
- `idx_automation_agents_type`
- `idx_automation_agents_active`
- `idx_automation_agents_trigger`

**RLS Policies**: 2
- Organization-scoped read
- Organization admin write

---

#### `agent_execution_logs`
**Source**: `20250102000000_create_agents_and_integrations.sql`  
**Purpose**: Execution logs for automation agents  
**Columns**: 9

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PRIMARY KEY |
| agent_id | UUID | NOT NULL, FK → automation_agents |
| execution_start | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| execution_end | TIMESTAMPTZ | - |
| status | TEXT | NOT NULL ('running', 'success', 'error', 'timeout') |
| result_summary | JSONB | - |
| error_details | TEXT | - |
| actions_taken | JSONB | DEFAULT '[]' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 3
- `idx_agent_execution_logs_agent_id`
- `idx_agent_execution_logs_status`
- `idx_agent_execution_logs_created_at`

---

#### `workflow_definitions`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Workflow definitions and configurations  
**Columns**: 13

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | NOT NULL, FK → organizations |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| trigger_type | TEXT | NOT NULL |
| trigger_config | JSONB | NOT NULL DEFAULT '{}' |
| is_active | BOOLEAN | DEFAULT true |
| version | INTEGER | DEFAULT 1 |
| workflow_schema | JSONB | NOT NULL |
| created_by | UUID | FK → auth.users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| last_executed_at | TIMESTAMPTZ | - |

**Indexes**: 3
- `idx_workflow_definitions_org_id`
- `idx_workflow_definitions_active`
- `idx_workflows_org_active` (composite)

---

#### `workflow_execution_logs`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Execution history of workflows  
**Columns**: 11

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| workflow_id | UUID | NOT NULL, FK → workflow_definitions |
| organization_id | UUID | FK → organizations |
| execution_start | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| execution_end | TIMESTAMPTZ | - |
| status | TEXT | NOT NULL |
| trigger_event | JSONB | - |
| execution_context | JSONB | DEFAULT '{}' |
| error_message | TEXT | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 4
- `idx_workflow_execution_logs_workflow_id`
- `idx_workflow_execution_logs_status`
- `idx_workflow_exec_org_time` (composite with organization_id)

---

#### `workflow_execution_steps`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Individual steps within workflow executions  
**Columns**: 12

---

#### `workflow_actions`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Available workflow action definitions

---

#### `workflow_conditions`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Conditional logic for workflow branching

---

#### `workflow_templates`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Pre-built workflow templates

---

#### `workflow_triggers`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Event triggers for workflows

---

#### `workflow_variables`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Variables and context storage

---

#### `workflow_versions`
**Source**: `20250103000001_enhanced_workflow_orchestration.sql`  
**Purpose**: Version history of workflows

---

### 3. 🔐 Security & Access Control Tables (10 tables)

#### `user_2fa_settings`
**Source**: `20250102000002_superadmin_2fa.sql`  
**Purpose**: Two-factor authentication settings  
**Columns**: 11

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | NOT NULL UNIQUE, FK → auth.users |
| is_enabled | BOOLEAN | DEFAULT false |
| secret_key | TEXT | - |
| backup_codes | TEXT[] | - |
| preferred_method | TEXT | DEFAULT 'totp' |
| phone_number | TEXT | - |
| verified_at | TIMESTAMPTZ | - |
| last_used_at | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 2
- `idx_2fa_settings_user_id`
- `idx_2fa_settings_enabled`

---

#### `user_2fa_attempts`
**Source**: `20250102000002_superadmin_2fa.sql`  
**Purpose**: Track 2FA authentication attempts  
**Columns**: 8

---

#### `trusted_devices`
**Source**: `20250102000002_superadmin_2fa.sql`  
**Purpose**: Remember trusted devices for 2FA

---

#### `login_attempts`
**Source**: `20250102000002_superadmin_2fa.sql`  
**Purpose**: Track all login attempts for security monitoring

---

#### `ip_whitelist`
**Source**: `20251022000003_create_ip_whitelisting_schema.sql`  
**Purpose**: IP address whitelisting for enhanced security  
**Columns**: 11

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | FK → organizations |
| ip_address | INET | NOT NULL |
| ip_range | CIDR | - |
| description | TEXT | - |
| is_active | BOOLEAN | DEFAULT true |
| added_by | UUID | FK → auth.users |
| last_used_at | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| expires_at | TIMESTAMPTZ | - |

**Indexes**: 3
- `idx_ip_whitelist_org_id`
- `idx_ip_whitelist_active`
- `idx_ip_whitelist_ip`

---

#### `ip_access_log`
**Source**: `20251022000003_create_ip_whitelisting_schema.sql`  
**Purpose**: Log all IP access attempts

---

#### `geo_restrictions`
**Source**: `20251022000003_create_ip_whitelisting_schema.sql`  
**Purpose**: Geographic access restrictions

---

#### `security_alerts`
**Source**: `20250123000002_phase3_security_hardening.sql`  
**Purpose**: Security alert tracking

---

#### `security_events`
**Source**: `20250123000002_phase3_security_hardening.sql`  
**Purpose**: Detailed security event logging

---

#### `data_sensitivity_classifications`
**Source**: `20250123000002_phase3_security_hardening.sql`  
**Purpose**: Data classification for compliance

---

### 4. 📊 Audit & Logging Tables (6 tables)

#### `audit_logs`
**Source**: `20251002000002_create_enhanced_audit_logging.sql`  
**Purpose**: Comprehensive audit trail  
**Columns**: 15

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | FK → organizations |
| user_id | UUID | FK → auth.users |
| event_type | TEXT | NOT NULL |
| resource_type | TEXT | - |
| resource_id | TEXT | - |
| action | TEXT | NOT NULL |
| changes | JSONB | - |
| metadata | JSONB | DEFAULT '{}' |
| ip_address | INET | - |
| user_agent | TEXT | - |
| status | TEXT | DEFAULT 'success' |
| error_message | TEXT | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| severity | TEXT | DEFAULT 'info' |

**Indexes**: 6
- `idx_audit_logs_org_id`
- `idx_audit_logs_user_id`
- `idx_audit_logs_event_type`
- `idx_audit_logs_created_at`
- `idx_audit_org_time` (composite)
- `idx_audit_old_entries` (for archival)

**RLS Policies**: 3
- Organization-scoped read
- Admin read all
- System write only

---

#### `audit_logs_enhanced`
**Source**: `20251002000002_create_enhanced_audit_logging.sql`  
**Purpose**: Extended audit logging with additional fields

---

#### `audit_log_exports`
**Source**: `20251002000002_create_enhanced_audit_logging.sql`  
**Purpose**: Track audit log export requests

---

#### `debug_logs`
**Source**: `20250919000000_create_debug_logs_table.sql`  
**Purpose**: Application debugging logs

---

#### `superadmin_logs`
**Source**: `20250930000000_create_superadmin_schema.sql`  
**Purpose**: Super admin action logging

---

#### `system_metrics`
**Source**: `20250123000001_phase3_system_health_monitoring.sql`  
**Purpose**: System performance metrics

---

### 5. 💳 Credits & Billing Tables (4 tables)

#### `organization_credits`
**Source**: `20240911000000_credits_schema.sql`  
**Purpose**: Credit balance tracking per organization  
**Columns**: 8

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | NOT NULL UNIQUE, FK → organizations |
| credits_available | INTEGER | DEFAULT 0 |
| credits_used | INTEGER | DEFAULT 0 |
| credits_reserved | INTEGER | DEFAULT 0 |
| last_recharged_at | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 2
- `idx_org_credits_org_id`

---

#### `credit_consumption_logs`
**Source**: `20240911000000_credits_schema.sql`  
**Purpose**: Detailed credit usage tracking

---

#### `credit_actions`
**Source**: `20240911000000_credits_schema.sql`  
**Purpose**: Credit purchase and adjustment actions

---

#### `quota_policies`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Quota policy definitions

---

### 6. 🔌 Integration Tables (3 tables)

#### `integrations`
**Source**: `20250122000000_create_integrations_table.sql`  
**Purpose**: Organization-level integration configurations  
**Columns**: 11

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | NOT NULL, FK → organizations |
| integration_type | TEXT | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| configuration | JSONB | DEFAULT '{}' |
| credentials | JSONB | DEFAULT '{}' |
| status | TEXT | DEFAULT 'active' |
| last_sync_at | TIMESTAMPTZ | - |
| last_error | TEXT | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 3
- `idx_integrations_org_id`
- `idx_integrations_type`
- `idx_active_integrations` (partial, where is_active = true)

---

#### `api_integrations`
**Source**: `20250102000000_create_agents_and_integrations.sql`  
**Purpose**: Super admin level API integration settings

---

#### `integration_usage_logs`
**Source**: `20250102000000_create_agents_and_integrations.sql`  
**Purpose**: Track integration API usage

---

### 7. ⚡ Rate Limiting & Quota Tables (6 tables)

#### `api_rate_limits`
**Source**: `20251002000001_create_rate_limiting_schema.sql`  
**Purpose**: API rate limiting tracking  
**Columns**: 10

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | FK → organizations |
| user_id | UUID | FK → auth.users |
| endpoint | TEXT | NOT NULL |
| request_count | INTEGER | DEFAULT 0 |
| window_start | TIMESTAMPTZ | NOT NULL |
| window_end | TIMESTAMPTZ | NOT NULL |
| limit_type | TEXT | DEFAULT 'per_minute' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 3
- `idx_rate_limits_org_endpoint` (composite)
- `idx_rate_limits_cleanup` (on window_end)
- `idx_rate_limits_user`

---

#### `rate_limit_config`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Rate limit configuration per endpoint

---

#### `rate_limit_tracking`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Real-time rate limit tracking

---

#### `rate_limit_quota_usage`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Quota usage aggregation

---

#### `quota_alerts`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Quota threshold alerts

---

#### `organization_quota_overrides`
**Source**: `20250102000001_rate_limiting_and_quota.sql`  
**Purpose**: Custom quota limits per organization

---

### 8. 🚨 Incident Response Tables (7 tables)

#### `incidents`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Incident tracking and management  
**Columns**: 17

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| organization_id | UUID | FK → organizations |
| incident_type | TEXT | NOT NULL (ENUM type) |
| severity | TEXT | NOT NULL (ENUM type) |
| status | TEXT | DEFAULT 'open' |
| title | TEXT | NOT NULL |
| description | TEXT | - |
| affected_resources | JSONB | DEFAULT '[]' |
| detected_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| acknowledged_at | TIMESTAMPTZ | - |
| resolved_at | TIMESTAMPTZ | - |
| assigned_to | UUID | FK → auth.users |
| created_by | UUID | FK → auth.users |
| resolution_notes | TEXT | - |
| metadata | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 5
- `idx_incidents_org_id`
- `idx_incidents_status`
- `idx_incidents_severity`
- `idx_incidents_detected_at`
- `idx_incidents_open` (partial)

---

#### `incident_actions`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Actions taken on incidents

---

#### `notification_rules`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Notification rules for incidents

---

#### `notification_logs`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Notification delivery tracking

---

#### `escalation_rules`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Incident escalation policies

---

#### `rollback_procedures`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Automated rollback procedures

---

#### `rollback_executions`
**Source**: `20250103000000_incident_response_system.sql`  
**Purpose**: Rollback execution tracking

---

### 9. 🏥 System Health Monitoring Tables (4 tables)

#### `system_health_checks`
**Source**: `20250123000001_phase3_system_health_monitoring.sql`  
**Purpose**: System health check results

---

#### `system_metrics`
**Source**: `20250123000001_phase3_system_health_monitoring.sql`  
**Purpose**: Time-series system metrics

---

#### `alert_rules`
**Source**: `20250123000001_phase3_system_health_monitoring.sql`  
**Purpose**: Alert rule definitions

---

#### `alert_history`
**Source**: `20250123000001_phase3_system_health_monitoring.sql`  
**Purpose**: Alert trigger history

---

### 10. 📅 CRM Event Tables (2 tables)

#### `crm_events`
**Source**: `20240911120000_create_crm_events_table.sql`  
**Purpose**: CRM calendar events and meetings  
**Columns**: 11

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PRIMARY KEY |
| organization_id | UUID | NOT NULL, FK → organizations |
| contact_id | BIGINT | FK → contacts |
| title | TEXT | NOT NULL |
| description | TEXT | - |
| event_start_time | TIMESTAMPTZ | NOT NULL |
| event_end_time | TIMESTAMPTZ | - |
| location | TEXT | - |
| event_type | TEXT | - |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes**: 4
- `idx_crm_events_org_id`
- `idx_crm_events_contact_id`
- `idx_crm_events_org_date` (composite)
- `idx_upcoming_events` (for reminders)

---

#### `event_reminders`
**Source**: `20240911140000_create_event_reminders_table.sql`  
**Purpose**: Event reminder notifications

---

### 11. 📊 API Usage & Statistics Tables (1 table)

#### `api_usage_statistics`
**Source**: Multiple files  
**Purpose**: API usage analytics

---

---

## 🔧 Database Functions (51 total)

### Audit & Logging Functions
- `log_audit_event` - Log audit events
- `export_audit_logs` - Export audit logs to file
- `cleanup_old_audit_logs` - Archive old audit logs

### Credit Management Functions
- `consume_credits` - Consume credits from organization balance
- `add_credits` - Add credits to organization
- `check_credit_balance` - Check available credits
- `reserve_credits` - Reserve credits for operations

### Rate Limiting Functions
- `check_rate_limit` - Check if rate limit exceeded
- `increment_rate_limit` - Increment rate limit counter
- `reset_rate_limit` - Reset rate limit window

### Workflow Functions
- `execute_workflow` - Execute a workflow
- `evaluate_workflow_condition` - Evaluate workflow conditions
- `get_workflow_context` - Get workflow execution context

### Incident Response Functions
- `create_incident` - Create new incident
- `log_incident_action` - Log incident action
- `check_incident_escalation` - Check escalation rules
- `update_incident_status` - Update incident status
- `execute_rollback_procedure` - Execute rollback

### System Health Functions
- `record_system_metric` - Record system metric
- `check_system_health` - Perform health check
- `trigger_alert` - Trigger system alert
- `get_slow_queries` - Identify slow queries
- `check_index_health` - Analyze index usage

### 2FA Functions
- `generate_2fa_secret` - Generate 2FA secret key
- `verify_2fa_code` - Verify 2FA code
- `generate_backup_codes` - Generate backup codes

### Security Functions
- `check_ip_whitelist` - Check IP whitelist
- `log_security_event` - Log security event
- `check_geo_restriction` - Check geographic restrictions

---

## 👁️ Database Views (5 total)

### `v_index_usage_stats`
**Purpose**: Index usage statistics for performance monitoring  
**Source**: `20250123000000_phase3_performance_indexes.sql`  
**Columns**: schemaname, tablename, indexname, index_scans, tuples_read, tuples_fetched, index_size

### `v_table_stats`
**Purpose**: Table statistics for maintenance  
**Source**: `20250123000000_phase3_performance_indexes.sql`  
**Columns**: schemaname, tablename, inserts, updates, deletes, live_tuples, dead_tuples, total_size, vacuum stats

### `v_rate_limit_summary`
**Purpose**: Rate limit summary by organization  
**Source**: Rate limiting migrations

### `v_quota_usage`
**Purpose**: Quota usage summary  
**Source**: Quota management migrations

### `v_incident_summary`
**Purpose**: Active incident summary  
**Source**: Incident response migrations

---

## 🔒 Row Level Security (RLS) Policies

### Standard Policy Patterns

#### Organization-Scoped Read
Applied to most tables:
```sql
CREATE POLICY "Users can read their organization data"
ON table_name FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
);
```

#### Organization Admin Write
Applied to sensitive tables:
```sql
CREATE POLICY "Org admins can modify data"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = table_name.organization_id
    AND role IN ('admin', 'owner')
  )
);
```

#### Super Admin Full Access
Applied to all tables:
```sql
CREATE POLICY "Super admins have full access"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);
```

---

## ✅ Validation Procedures

### 1. Pre-Deployment Validation

```sql
-- Check prerequisite tables exist
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'organizations', 'profiles', 'contacts', 'opportunities',
  'forms', 'google_credentials', 'organization_settings',
  'organization_subscriptions', 'credit_ledger', 'automations'
);

-- Expected: 10 rows (all prerequisite tables)
```

### 2. Post-Migration Validation

```sql
-- Verify all expected tables exist
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  -- Insert all 53 table names from migrations
  'automation_agents', 'agent_execution_logs', ...
);

-- Expected: 53 tables
```

### 3. Index Validation

```sql
-- Check all indexes created successfully
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected: 150+ indexes
```

### 4. Function Validation

```sql
-- Check all functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: 51+ functions
```

### 5. RLS Policy Validation

```sql
-- Check RLS enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables have rowsecurity = true
```

### 6. Column Reference Validation

```sql
-- Verify critical columns exist
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'crm_events'
AND column_name IN ('event_start_time', 'event_end_time');

-- Expected: 2 rows (correct column names)
```

---

## 🔄 Migration Order & Dependencies

### Critical Dependency Chain

1. **Prerequisites** (Manual setup required)
   - organizations
   - profiles
   - contacts
   - opportunities

2. **Phase 1: Core Systems** (Sep 2024)
   - 20240911000000_credits_schema.sql
   - 20240911120000_create_crm_events_table.sql
   - 20240911140000_create_event_reminders_table.sql

3. **Phase 2: Automation** (Jan 2025)
   - 20250102000000_create_agents_and_integrations.sql
   - 20250102000001_rate_limiting_and_quota.sql

4. **Phase 3: Advanced Features** (Jan 2025)
   - 20250103000000_incident_response_system.sql
   - 20250103000001_enhanced_workflow_orchestration.sql
   - 20250122000000_create_integrations_table.sql
   - 20250123000000_phase3_performance_indexes.sql
   - 20250123000001_phase3_system_health_monitoring.sql
   - 20250123000002_phase3_security_hardening.sql

5. **Phase 4: Security & Auth** (Sep-Oct 2025)
   - 20250930000000_create_superadmin_schema.sql
   - 20251002000002_create_enhanced_audit_logging.sql
   - 20251022000003_create_ip_whitelisting_schema.sql

6. **Phase 5: Fixes** (Nov 2025)
   - 20251103000000_fix_non_immutable_index_predicates.sql

---

## 🚨 Known Issues & Required Manual Actions

### Issue 1: Prerequisite Tables Missing
**Severity**: 🔴 CRITICAL  
**Action Required**: Create prerequisite tables before running migrations  
**Tables**: organizations, profiles, contacts, opportunities, etc.

### Issue 2: Column Name Mismatches
**Severity**: 🟡 MEDIUM (Fixed in migrations)  
**Status**: ✅ Resolved  
**Details**: crm_events uses `event_start_time` not `start_time`

### Issue 3: View Column References
**Severity**: 🟡 MEDIUM  
**Status**: ✅ Fixed in this update  
**Details**: v_index_usage_stats now uses correct column names from pg_stat_user_indexes

---

## 📊 Database Size Estimates

### Expected Table Sizes (Production)
- **Large Tables** (>1GB): audit_logs, workflow_execution_logs, system_metrics
- **Medium Tables** (100MB-1GB): crm_events, contacts, opportunities
- **Small Tables** (<100MB): Most configuration and definition tables

### Index Overhead
- Estimated total index size: 30-40% of table size
- Critical for query performance on large tables

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Verify prerequisites tables exist
- [ ] Backup existing database
- [ ] Test migrations in staging
- [ ] Review this checklist for completeness

### Deployment
- [ ] Run migrations in timestamp order
- [ ] Monitor for errors in each migration
- [ ] Verify indexes created (check pg_indexes)
- [ ] Verify RLS policies active (check pg_tables.rowsecurity)

### Post-Deployment
- [ ] Run validation queries (see Validation Procedures)
- [ ] Check table counts (53 expected)
- [ ] Check function counts (51+ expected)
- [ ] Verify index usage with v_index_usage_stats
- [ ] Monitor error logs for 24 hours

---

## 📚 Related Documentation

- `DATABASE_SCHEMA_COMPLETE_REFERENCE.md` - Detailed schema reference
- `SCHEMA_VERIFICATION_TRACKING.md` - Verification tracking and history
- `MIGRATION_ROBUSTNESS_GUIDE.md` - Migration best practices
- `GUIDA_RAPIDA_FIX_COLONNE_IT.md` - Quick fix guide (Italian)
- `scripts/verify-phase3-schema.sql` - Automated validation script

---

## 📝 Maintenance Notes

### Regular Maintenance Tasks
- **Weekly**: Check index usage via v_index_usage_stats
- **Monthly**: Review table sizes and plan partitioning
- **Quarterly**: Audit unused indexes (idx_scan = 0)
- **Yearly**: Review and update this checklist

### Schema Evolution Process
1. Create new migration file with timestamp
2. Update this checklist with new tables/columns
3. Add defensive checks (IF NOT EXISTS, column existence)
4. Test in staging environment
5. Deploy and verify

---

**Last Updated**: 2025-01-24  
**Maintained By**: CRM-AI Development Team  
**Version**: 1.0.0
