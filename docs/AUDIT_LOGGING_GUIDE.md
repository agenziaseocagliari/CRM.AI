# 📝 Enhanced Audit Logging Guide

**Phase 3 - Milestone M02**  
**Version**: 1.0  
**Status**: Production Ready

---

## 📋 Overview

The Enhanced Audit Logging system provides comprehensive event tracking with full-text search, advanced filtering, and export capabilities. This ensures complete visibility into system activities, supports compliance requirements (GDPR, SOC 2), and enables security monitoring.

### Key Features

- ✅ **Full-Text Search**: Search across event descriptions and metadata
- ✅ **Advanced Filtering**: Filter by user, event type, category, severity, date range
- ✅ **Event Categorization**: Organized by authentication, data management, workflow, security, system
- ✅ **Severity Levels**: INFO, WARNING, ERROR, CRITICAL, SECURITY
- ✅ **Resource Tracking**: Track changes to specific resources (contacts, workflows, etc.)
- ✅ **Export Functionality**: Export logs to CSV or JSON
- ✅ **Statistics Dashboard**: Real-time analytics and success rates
- ✅ **Data Retention**: Configurable retention policies (default: 90 days)

---

## 🗄️ Database Schema

### Tables

#### `audit_logs`
Main audit logging table with full-text search capability.

**Columns**:
- `id` (UUID): Primary key
- `organization_id` (UUID): Reference to organization
- `user_id` (UUID): User who performed the action (optional)
- `event_type` (TEXT): Specific event type (e.g., 'user.login', 'contact.created')
- `event_category` (TEXT): Event category (authentication, data_management, workflow, security, system)
- `severity` (audit_severity): Severity level (INFO, WARNING, ERROR, CRITICAL, SECURITY)
- `description` (TEXT): Human-readable description
- `details` (JSONB): Additional event details
- `resource_type` (TEXT): Type of affected resource (optional)
- `resource_id` (TEXT): ID of affected resource (optional)
- `ip_address` (INET): IP address of requester
- `user_agent` (TEXT): User agent string
- `request_id` (TEXT): For correlating related events
- `session_id` (TEXT): Session identifier
- `duration_ms` (INTEGER): Operation duration in milliseconds
- `success` (BOOLEAN): Whether operation succeeded
- `error_message` (TEXT): Error message if failed
- `metadata` (JSONB): Additional metadata
- `search_vector` (tsvector): Full-text search vector (automatically maintained)
- `created_at` (TIMESTAMPTZ): Timestamp

**Indexes**:
- organization_id, user_id, event_type, event_category, severity
- created_at (DESC for recent logs)
- resource_type + resource_id
- success (WHERE success = FALSE for failures)
- GIN indexes on search_vector, details, metadata

#### `audit_log_exports`
Tracks export requests for audit logs.

**Columns**:
- `id` (UUID): Primary key
- `organization_id` (UUID): Reference to organization
- `user_id` (UUID): User who requested export
- `filters` (JSONB): Filter criteria used
- `format` (TEXT): Export format (csv, json, pdf)
- `status` (TEXT): Status (pending, processing, completed, failed)
- `file_url` (TEXT): URL to download file
- `row_count` (INTEGER): Number of rows exported
- `file_size_bytes` (BIGINT): File size in bytes
- `error_message` (TEXT): Error if failed
- `created_at` (TIMESTAMPTZ): Request time
- `completed_at` (TIMESTAMPTZ): Completion time

### Functions

#### `log_audit_event(...)`
Helper function to log audit events.

**Returns**: UUID of created log entry

#### `search_audit_logs(...)`
Advanced search with full-text and filters.

**Parameters**:
- `p_organization_id`: Organization ID
- `p_search_query`: Full-text search query
- `p_user_id`: Filter by user
- `p_event_types`: Array of event types
- `p_event_categories`: Array of categories
- `p_severities`: Array of severity levels
- `p_start_date`, `p_end_date`: Date range
- `p_success`: Filter by success status
- `p_resource_type`: Filter by resource type
- `p_limit`, `p_offset`: Pagination

**Returns**: Table of audit logs with relevance scoring

#### `get_audit_log_stats(...)`
Get aggregated statistics for audit logs.

**Returns**: Statistics including total events, events by severity/category/user, success rate, avg duration

#### `cleanup_old_audit_logs(retention_days)`
Clean up old audit logs (keeps CRITICAL and SECURITY logs longer).

---

## 💻 Usage

### Basic Logging

```typescript
import { logAuditEvent } from '@/lib/auditLogger';

// Log a user action
await logAuditEvent({
  organizationId: 'org-123',
  userId: 'user-456',
  eventType: 'contact.created',
  eventCategory: 'data_management',
  description: 'Created new contact: John Doe',
  severity: 'INFO',
  resourceType: 'contact',
  resourceId: 'contact-789',
  details: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});
```

### Using Helper Functions

```typescript
import { AuditLogger } from '@/lib/auditLogger';

// Log login
await AuditLogger.login('org-123', 'user-456', true);

// Log resource creation
await AuditLogger.createResource('org-123', 'user-456', 'contact', 'contact-789');

// Log resource update
await AuditLogger.updateResource('org-123', 'user-456', 'contact', 'contact-789', {
  fieldsChanged: ['email', 'phone'],
});

// Log resource deletion
await AuditLogger.deleteResource('org-123', 'user-456', 'contact', 'contact-789');

// Log workflow execution
await AuditLogger.executeWorkflow('org-123', 'user-456', 'workflow-123', 5000, true);

// Log security violation
await AuditLogger.securityViolation('org-123', 'user-456', 'Unauthorized access attempt', {
  attemptedResource: '/admin/users',
});

// Log system error
await AuditLogger.systemError('org-123', 'Database connection failed', 'Connection timeout after 30s');
```

### Searching Audit Logs

```typescript
import { searchAuditLogs } from '@/lib/auditLogger';

// Basic search
const logs = await searchAuditLogs('org-123', {
  searchQuery: 'contact created',
  limit: 50,
});

// Advanced filtering
const filteredLogs = await searchAuditLogs('org-123', {
  userId: 'user-456',
  eventTypes: ['contact.created', 'contact.updated'],
  eventCategories: ['data_management'],
  severities: ['INFO', 'WARNING'],
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31'),
  success: true,
  limit: 100,
  offset: 0,
});
```

### Get Statistics

```typescript
import { getAuditLogStats } from '@/lib/auditLogger';

const stats = await getAuditLogStats('org-123');

console.log(`Total events: ${stats.totalEvents}`);
console.log(`Success rate: ${stats.successRate}%`);
console.log(`Average duration: ${stats.avgDurationMs}ms`);
console.log('Events by severity:', stats.eventsBySeverity);
console.log('Events by category:', stats.eventsByCategory);
```

### Resource-Specific Logs

```typescript
import { getResourceAuditLogs } from '@/lib/auditLogger';

// Get all logs for a specific contact
const contactLogs = await getResourceAuditLogs(
  'org-123',
  'contact',
  'contact-789',
  50
);

// Display timeline
contactLogs.forEach(log => {
  console.log(`${log.createdAt}: ${log.description}`);
});
```

### Export Logs

```typescript
import { requestAuditLogExport, getExportStatus } from '@/lib/auditLogger';

// Request export
const exportId = await requestAuditLogExport(
  'org-123',
  'user-456',
  {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    eventCategories: ['authentication', 'security'],
  },
  'csv'
);

// Check status
const status = await getExportStatus(exportId);
console.log(`Status: ${status.status}`);
if (status.status === 'completed') {
  console.log(`Download: ${status.fileUrl}`);
  console.log(`Rows: ${status.rowCount}, Size: ${status.fileSizeBytes} bytes`);
}
```

---

## 📊 Event Categories and Types

### Authentication
- `user.login` - User login attempt
- `user.logout` - User logout
- `user.password_change` - Password changed
- `user.mfa_enabled` - MFA enabled
- `user.mfa_disabled` - MFA disabled

### Data Management
- `contact.created` - Contact created
- `contact.updated` - Contact updated
- `contact.deleted` - Contact deleted
- `opportunity.created` - Opportunity created
- `opportunity.updated` - Opportunity updated

### Workflow
- `workflow.created` - Workflow created
- `workflow.updated` - Workflow updated
- `workflow.executed` - Workflow executed
- `workflow.deleted` - Workflow deleted

### Security
- `security.violation` - Security policy violation
- `security.unauthorized_access` - Unauthorized access attempt
- `security.permission_denied` - Permission denied
- `security.suspicious_activity` - Suspicious activity detected

### System
- `system.error` - System error
- `system.warning` - System warning
- `system.maintenance` - Maintenance activity
- `system.backup` - Backup completed

---

## 🔒 Security & Compliance

### Row Level Security

- **Read**: Users can only view logs for their organization
- **Write**: Only system can insert logs (automated)
- **Delete**: Only superadmins can delete (for GDPR compliance)

### GDPR Compliance

- Users can request deletion of their personal data
- Audit logs include data access tracking
- Data retention policies enforced
- Export functionality for data portability

### SOC 2 Compliance

- Complete audit trail of system activities
- Timestamp accuracy ensured
- Immutable log entries (no updates)
- Automatic retention and archival

---

## 📈 Monitoring & Analytics

### Key Metrics

1. **Event Volume**: Total events per hour/day/month
2. **Success Rate**: Percentage of successful operations
3. **Average Duration**: Average operation duration
4. **Error Rate**: Percentage of failed operations
5. **Security Events**: Count of security-related events

### Dashboard Queries

```sql
-- Recent failed operations
SELECT * FROM audit_logs
WHERE organization_id = 'org-123'
  AND success = FALSE
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Top users by activity
SELECT 
  user_id,
  COUNT(*) as event_count,
  COUNT(CASE WHEN success = FALSE THEN 1 END) as failure_count
FROM audit_logs
WHERE organization_id = 'org-123'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY event_count DESC
LIMIT 10;

-- Security events this month
SELECT * FROM audit_logs
WHERE organization_id = 'org-123'
  AND severity = 'SECURITY'
  AND created_at >= date_trunc('month', NOW())
ORDER BY created_at DESC;
```

---

## 🛠️ Maintenance

### Data Retention

Run cleanup periodically (recommended: daily):

```sql
-- Cleanup logs older than 90 days (keeps CRITICAL and SECURITY)
SELECT cleanup_old_audit_logs(90);
```

### Index Maintenance

Rebuild search indexes monthly:

```sql
REINDEX INDEX idx_audit_logs_search;
```

### Export Cleanup

Clean up old export files (recommended: weekly):

```sql
DELETE FROM audit_log_exports
WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('completed', 'failed');
```

---

## 🧪 Testing

### Test Coverage

- ✅ Event logging (success/failure)
- ✅ Full-text search
- ✅ Advanced filtering
- ✅ Statistics calculation
- ✅ Resource-specific queries
- ✅ Export functionality
- ✅ Helper functions

Run tests:

```bash
npm test auditLogger.test.ts
```

---

## 🎓 Best Practices

1. **Log Important Events**: Focus on authentication, data changes, security events
2. **Include Context**: Add relevant details in the `details` field
3. **Use Consistent Event Types**: Follow the naming convention (category.action)
4. **Track Resources**: Always specify resource type and ID when applicable
5. **Measure Duration**: Include operation duration for performance monitoring
6. **Handle Errors**: Log failures with error messages for debugging
7. **Use Severity Appropriately**: 
   - INFO: Normal operations
   - WARNING: Potential issues
   - ERROR: Operation failures
   - CRITICAL: System failures
   - SECURITY: Security-related events

---

## 🔗 Related Documentation

- [RATE_LIMITING_GUIDE.md](./RATE_LIMITING_GUIDE.md) - Rate limiting (M01)
- [PHASE_3_MILESTONE_TRACKING.md](../PHASE_3_MILESTONE_TRACKING.md) - Overall progress
- [PHASE_3_ROADMAP.md](../PHASE_3_ROADMAP.md) - Phase 3 planning

---

**Last Updated**: 2025-10-02  
**Milestone**: M02 - Enhanced Audit Logging with Search & Filtering  
**Status**: ✅ Complete
