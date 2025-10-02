# 🚀 Phase 2 Quick Reference Guide

**Quick access guide for Phase 2 Enterprise Core & Security Upgrade features**

---

## 📋 Table of Contents

1. [2FA Setup](#2fa-setup)
2. [Incident Management](#incident-management)
3. [Workflow Orchestration](#workflow-orchestration)
4. [API Reference](#api-reference)
5. [Common Tasks](#common-tasks)

---

## 🔐 2FA Setup

### Enable 2FA for a User

**Frontend:**
1. Navigate to Settings → Security tab
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter 6-digit code
5. Download backup codes

**Backend (Manual):**
```sql
-- Check if user has 2FA enabled
SELECT is_enabled, method, verified_at
FROM user_2fa_settings
WHERE user_id = 'user-uuid';

-- Generate backup codes
SELECT generate_backup_codes('user-uuid');
```

### Trusted Devices

```sql
-- List trusted devices for user
SELECT device_name, device_type, browser, os, last_used_at
FROM trusted_devices
WHERE user_id = 'user-uuid'
AND is_active = true
ORDER BY last_used_at DESC;

-- Remove trusted device
UPDATE trusted_devices
SET is_active = false
WHERE id = 'device-uuid';
```

---

## 🚨 Incident Management

### Create Incident

**API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/incident-management \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_incident",
    "incident_data": {
      "incident_type": "api_down",
      "severity": "critical",
      "title": "Users API endpoint failing",
      "description": "GET /api/users returning 500 errors",
      "affected_service": "/api/users"
    }
  }'
```

**SQL Function:**
```sql
SELECT create_incident(
  'api_down'::incident_type,
  'critical'::incident_severity,
  'Users API endpoint failing',
  'GET /api/users returning 500 errors',
  '/api/users'
);
```

### List Open Incidents

```bash
curl -X POST https://your-project.supabase.co/functions/v1/incident-management \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_incidents",
    "filters": {
      "status": ["open", "investigating"],
      "severity": ["critical", "high"]
    },
    "page": 1,
    "per_page": 20
  }'
```

### Update Incident Status

```bash
curl -X POST https://your-project.supabase.co/functions/v1/incident-management \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_status",
    "incident_id": "incident-uuid",
    "status": "resolved",
    "comment": "Issue resolved by restarting service"
  }'
```

### Common Incident Queries

```sql
-- Get all critical incidents in last 24 hours
SELECT id, title, affected_service, detected_at, status
FROM incidents
WHERE severity = 'critical'
AND detected_at > NOW() - INTERVAL '24 hours'
ORDER BY detected_at DESC;

-- Get incident timeline
SELECT action_type, description, created_at, actor_id
FROM incident_actions
WHERE incident_id = 'incident-uuid'
ORDER BY created_at DESC;

-- Get unresolved incidents older than 1 hour
SELECT id, title, severity, detected_at
FROM incidents
WHERE status IN ('open', 'investigating')
AND detected_at < NOW() - INTERVAL '1 hour'
ORDER BY severity DESC, detected_at ASC;
```

---

## ⚙️ Workflow Orchestration

### Use a Template

```sql
-- List available templates
SELECT id, name, description, category
FROM workflow_templates
WHERE is_public = true
ORDER BY use_count DESC;

-- Create workflow from template
INSERT INTO workflow_definitions (
  organization_id,
  name,
  description,
  natural_language_prompt,
  workflow_json,
  trigger_type,
  created_by
)
SELECT
  'org-uuid',
  'My ' || name,
  description,
  'Created from template: ' || name,
  template_json,
  'manual',
  'user-uuid'
FROM workflow_templates
WHERE id = 'template-uuid';
```

### Execute Workflow

```bash
curl -X POST https://your-project.supabase.co/functions/v1/execute-workflow \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-uuid",
    "trigger_data": {
      "customer_name": "John Doe",
      "customer_email": "john@example.com"
    }
  }'
```

### Check Workflow Execution

```sql
-- Get latest executions
SELECT 
  workflow_id,
  status,
  execution_start,
  execution_end,
  steps_total,
  steps_success,
  steps_failed
FROM workflow_execution_logs
WHERE workflow_id = 'workflow-uuid'
ORDER BY execution_start DESC
LIMIT 10;

-- Get detailed step logs
SELECT 
  step_index,
  status,
  duration_ms,
  error_message
FROM workflow_execution_steps
WHERE execution_log_id = 'log-id'
ORDER BY step_index;
```

### Export Workflow

```sql
-- Export complete workflow as JSON
SELECT export_workflow('workflow-uuid');
```

---

## 📡 API Reference

### Base URL
```
https://your-project.supabase.co/functions/v1/
```

### Authentication
All requests require JWT token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### Incident Management
- **POST** `/incident-management`
  - Actions: `create_incident`, `list_incidents`, `get_incident`, `update_status`, `add_comment`, `assign_incident`, `check_escalations`

#### Notifications
- **POST** `/send-notification`
  - Channels: `email`, `slack`, `telegram`, `webhook`, `in_app`

#### Workflow Execution
- **POST** `/execute-workflow`
  - Parameters: `workflow_id`, `trigger_data`, `force`

---

## 🛠️ Common Tasks

### Setup Notification Rule

```sql
INSERT INTO notification_rules (
  name,
  description,
  trigger_conditions,
  notification_channels,
  recipients
) VALUES (
  'Critical Incidents',
  'Immediate notification for critical incidents',
  '{"severities": ["critical"], "incident_types": ["api_down", "security_breach"]}'::jsonb,
  ARRAY['email', 'slack']::notification_channel[],
  '{"emails": ["admin@example.com"], "slack_channels": ["#incidents-critical"]}'::jsonb
);
```

### Setup Escalation Rule

```sql
INSERT INTO escalation_rules (
  name,
  description,
  trigger_after_minutes,
  incident_types,
  min_severity,
  escalate_to,
  auto_assign
) VALUES (
  'Critical Incident Escalation',
  'Escalate critical incidents after 15 minutes',
  15,
  ARRAY['api_down', 'security_breach']::incident_type[],
  'critical'::incident_severity,
  ARRAY['supervisor-user-id']::uuid[],
  true
);
```

### Check System Health

```sql
-- Count incidents by status
SELECT status, COUNT(*) as count
FROM incidents
WHERE detected_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY count DESC;

-- Count incidents by type
SELECT incident_type, COUNT(*) as count
FROM incidents
WHERE detected_at > NOW() - INTERVAL '7 days'
GROUP BY incident_type
ORDER BY count DESC;

-- Average resolution time
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))) / 60 as avg_minutes
FROM incidents
WHERE resolved_at IS NOT NULL
AND detected_at > NOW() - INTERVAL '30 days';
```

### Workflow Statistics

```sql
-- Workflow success rate
SELECT 
  wd.name,
  COUNT(*) as total_executions,
  SUM(CASE WHEN wel.status = 'completed' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN wel.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM workflow_definitions wd
JOIN workflow_execution_logs wel ON wel.workflow_id = wd.id
WHERE wel.execution_start > NOW() - INTERVAL '30 days'
GROUP BY wd.id, wd.name
ORDER BY total_executions DESC;
```

---

## 🔍 Troubleshooting

### 2FA Not Working

1. **Check if 2FA is enabled:**
   ```sql
   SELECT * FROM user_2fa_settings WHERE user_id = 'user-uuid';
   ```

2. **Check failed attempts:**
   ```sql
   SELECT * FROM user_2fa_attempts 
   WHERE user_id = 'user-uuid' 
   AND success = false 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Verify backup codes:**
   ```sql
   SELECT backup_codes FROM user_2fa_settings WHERE user_id = 'user-uuid';
   ```

### Incident Not Created

1. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'incidents';
   ```

2. **Test incident creation:**
   ```sql
   SELECT create_incident(
     'custom'::incident_type,
     'low'::incident_severity,
     'Test incident',
     'This is a test'
   );
   ```

3. **Check logs:**
   ```sql
   SELECT * FROM incident_actions 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Workflow Not Executing

1. **Check if workflow is active:**
   ```sql
   SELECT id, name, is_active FROM workflow_definitions WHERE id = 'workflow-uuid';
   ```

2. **Check execution logs:**
   ```sql
   SELECT * FROM workflow_execution_logs 
   WHERE workflow_id = 'workflow-uuid' 
   ORDER BY execution_start DESC 
   LIMIT 5;
   ```

3. **Check step failures:**
   ```sql
   SELECT step_index, status, error_message 
   FROM workflow_execution_steps 
   WHERE execution_log_id = 'log-id' 
   AND status = 'failed';
   ```

---

## 📞 Support

- **Documentation**: See PHASE_2_IMPLEMENTATION.md
- **API Reference**: In PHASE_2_IMPLEMENTATION.md
- **Issues**: Create GitHub issue
- **Testing**: See PHASE_2_COMPLETION_SUMMARY.md

---

## 🔗 Quick Links

- [Full Implementation Guide](./PHASE_2_IMPLEMENTATION.md)
- [Completion Summary](./PHASE_2_COMPLETION_SUMMARY.md)
- [Phase 1 Summary](./PHASE_1_COMPLETION_SUMMARY.md)
- [Super Admin Guide](./SUPER_ADMIN_IMPLEMENTATION.md)

---

**Last Updated**: 2025-01-03  
**Version**: 2.0  
**Status**: Production Ready (45% Complete)
