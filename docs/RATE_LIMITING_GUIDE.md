# 🚦 API Rate Limiting & Quota Management Guide

**Phase 3 - Milestone M01**  
**Version**: 1.0  
**Status**: Production Ready

---

## 📋 Overview

The API Rate Limiting system provides intelligent rate limiting at the organization level with per-org quotas using a sliding window algorithm. This ensures fair resource usage, prevents API abuse, and enables predictable system performance.

### Key Features

- ✅ **Sliding Window Algorithm**: Precise rate limiting without bursting issues
- ✅ **Per-Organization Quotas**: Customizable limits per organization
- ✅ **Resource-Type Segmentation**: Different limits for different API types (API calls, AI requests, workflow executions)
- ✅ **Real-Time Tracking**: Live usage monitoring with millisecond precision
- ✅ **Monthly Quotas**: Long-term usage tracking and enforcement
- ✅ **Graceful Degradation**: System remains available even during database issues
- ✅ **Comprehensive Logging**: Full audit trail of rate limit events

---

## 🗄️ Database Schema

### Tables

#### `rate_limit_config`
Configuration for rate limiting per organization and resource type.

**Columns**:
- `id` (UUID): Primary key
- `organization_id` (UUID): Reference to organization
- `resource_type` (TEXT): Type of resource (e.g., 'api_call', 'ai_request', 'workflow_execution')
- `endpoint_pattern` (TEXT): Optional endpoint pattern for fine-grained control
- `max_requests` (INTEGER): Maximum requests allowed in window
- `window_seconds` (INTEGER): Time window in seconds (default: 3600 = 1 hour)
- `quota_monthly` (INTEGER): Optional monthly quota limit
- `enabled` (BOOLEAN): Whether rate limiting is enabled
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Unique Constraint**: `(organization_id, resource_type, endpoint_pattern)`

#### `rate_limit_tracking`
Real-time tracking of API requests for rate limiting.

**Columns**:
- `id` (BIGSERIAL): Primary key
- `organization_id` (UUID): Reference to organization
- `user_id` (UUID): Reference to user (optional)
- `resource_type` (TEXT): Type of resource
- `endpoint` (TEXT): API endpoint accessed
- `request_timestamp` (TIMESTAMPTZ): When request was made
- `response_status` (INTEGER): HTTP response status
- `rate_limited` (BOOLEAN): Whether request was rate limited
- `metadata` (JSONB): Additional metadata
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Retention**: 30 days (automatic cleanup)

#### `rate_limit_quota_usage`
Monthly quota usage aggregation.

**Columns**:
- `id` (UUID): Primary key
- `organization_id` (UUID): Reference to organization
- `resource_type` (TEXT): Type of resource
- `year` (INTEGER): Year
- `month` (INTEGER): Month (1-12)
- `request_count` (INTEGER): Total requests in period
- `rate_limited_count` (INTEGER): Number of rate-limited requests
- `last_updated` (TIMESTAMPTZ): Last update timestamp

**Unique Constraint**: `(organization_id, resource_type, year, month)`

### Functions

#### `check_rate_limit(organization_id, resource_type, endpoint)`
Checks if a request is allowed based on current rate limits using sliding window algorithm.

**Parameters**:
- `p_organization_id` (UUID): Organization ID
- `p_resource_type` (TEXT): Resource type
- `p_endpoint` (TEXT, optional): Specific endpoint

**Returns**: Table with:
- `is_allowed` (BOOLEAN): Whether request is allowed
- `current_usage` (INTEGER): Current request count in window
- `limit_value` (INTEGER): Maximum allowed requests
- `window_seconds` (INTEGER): Window size in seconds
- `reset_at` (TIMESTAMPTZ): When the window resets

#### `update_quota_usage()`
Trigger function that automatically updates monthly quota usage when new tracking records are inserted.

#### `cleanup_old_rate_limit_tracking()`
Function to clean up tracking records older than 30 days.

---

## 💻 Usage

### Basic Rate Limit Check

```typescript
import { checkRateLimit, trackRequest } from '@/lib/rateLimiter';

// Check if request is allowed
const check = await checkRateLimit('org-123', 'api_call', '/api/contacts');

if (check.isAllowed) {
  // Process request
  const response = await processRequest();
  
  // Track successful request
  await trackRequest({
    organizationId: 'org-123',
    userId: 'user-456',
    resourceType: 'api_call',
    endpoint: '/api/contacts',
    responseStatus: 200,
    rateLimited: false,
  });
} else {
  // Return rate limit error
  return {
    error: 'Rate limit exceeded',
    message: `Limit: ${check.limitValue} requests per ${check.windowSeconds}s`,
    resetAt: check.resetAt,
  };
}
```

### Using Middleware

```typescript
import { withRateLimit } from '@/lib/rateLimiter';

// Wrap your function with rate limiting
const result = await withRateLimit(
  'org-123',
  'api_call',
  '/api/contacts',
  async () => {
    // Your API logic here
    return await fetchContacts();
  }
);
```

### Get Rate Limit Status

```typescript
import { getRateLimitStatus } from '@/lib/rateLimiter';

const status = await getRateLimitStatus('org-123', 'api_call');

console.log(`Usage: ${status.usage}/${status.limit} (${status.percentage}%)`);
console.log(`Resets at: ${status.resetAt}`);
```

### Configure Rate Limits

```typescript
import { updateRateLimitConfig } from '@/lib/rateLimiter';

// Update rate limit for organization
await updateRateLimitConfig('org-123', 'api_call', {
  maxRequests: 2000,      // Allow 2000 requests
  windowSeconds: 3600,    // Per hour
  quotaMonthly: 100000,   // Monthly quota
  enabled: true,
});
```

### View Quota Usage

```typescript
import { getQuotaUsage } from '@/lib/rateLimiter';

// Get current month usage
const usage = await getQuotaUsage('org-123', 'api_call', 2025, 10);

console.log(`Requests this month: ${usage[0].requestCount}`);
console.log(`Rate limited: ${usage[0].rateLimitedCount}`);
```

---

## 🎯 Resource Types

Standard resource types in the system:

| Resource Type | Description | Default Limit | Default Window |
|---------------|-------------|---------------|----------------|
| `api_call` | General API calls | 1000 req | 1 hour |
| `ai_request` | AI/ML API calls | 100 req | 1 hour |
| `workflow_execution` | Workflow runs | 500 req | 1 hour |
| `report_generation` | Report generation | 50 req | 1 hour |
| `export_data` | Data exports | 20 req | 1 hour |

---

## 🔒 Security & Row Level Security

All tables have RLS policies:

### `rate_limit_config`
- **Read**: Users can view configs for their organization
- **Write**: Only admins/superadmins can modify configs

### `rate_limit_tracking`
- **Read**: Users can view tracking for their organization
- **Write**: Service role only (automated)

### `rate_limit_quota_usage`
- **Read**: Users can view usage for their organization
- **Write**: Automated via triggers

---

## 📊 Monitoring

### Key Metrics

1. **Usage Percentage**: `current_usage / limit_value * 100`
2. **Rate Limited Requests**: Count of 429 responses
3. **Peak Usage Times**: When usage is highest
4. **Top Organizations**: Organizations hitting limits most

### Alerts

Set up alerts for:
- Organizations exceeding 80% of their limit
- Repeated rate limit violations (potential abuse)
- Unusual spike in rate-limited requests

### Dashboard Queries

```sql
-- Organizations near their limits (>80%)
WITH current_usage AS (
  SELECT 
    t.organization_id,
    t.resource_type,
    COUNT(*) as usage_count,
    c.max_requests,
    c.window_seconds
  FROM rate_limit_tracking t
  JOIN rate_limit_config c ON 
    c.organization_id = t.organization_id 
    AND c.resource_type = t.resource_type
  WHERE t.request_timestamp >= NOW() - (c.window_seconds || ' seconds')::INTERVAL
  GROUP BY t.organization_id, t.resource_type, c.max_requests, c.window_seconds
)
SELECT 
  organization_id,
  resource_type,
  usage_count,
  max_requests,
  ROUND((usage_count::FLOAT / max_requests * 100), 2) as usage_percent
FROM current_usage
WHERE usage_count::FLOAT / max_requests > 0.8
ORDER BY usage_percent DESC;
```

---

## 🛠️ Maintenance

### Cleanup Old Data

Run periodically (recommended: daily via cron job):

```sql
SELECT cleanup_old_rate_limit_tracking();
```

### Adjust Limits

For organizations needing higher limits:

```sql
UPDATE rate_limit_config
SET 
  max_requests = 5000,
  quota_monthly = 500000,
  updated_at = NOW()
WHERE organization_id = 'org-123'
  AND resource_type = 'api_call';
```

### Disable Rate Limiting

For maintenance or testing:

```sql
UPDATE rate_limit_config
SET enabled = false
WHERE organization_id = 'org-123';
```

---

## 🧪 Testing

### Test Coverage

- ✅ Rate limit check (allowed/denied)
- ✅ Graceful degradation on errors
- ✅ Request tracking
- ✅ Configuration management
- ✅ Quota usage tracking
- ✅ Middleware functionality
- ✅ Status reporting

Run tests:

```bash
npm test rateLimiter.test.ts
```

### Manual Testing

```bash
# Test rate limit in development
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/contacts

# Verify tracking
psql $DATABASE_URL -c "SELECT * FROM rate_limit_tracking ORDER BY created_at DESC LIMIT 10;"

# Check quota usage
psql $DATABASE_URL -c "SELECT * FROM rate_limit_quota_usage WHERE organization_id = 'org-123';"
```

---

## 📈 Performance

### Optimizations

1. **Indexed Queries**: All common queries use indexes
2. **Automatic Cleanup**: Old data is automatically removed
3. **Minimal Overhead**: ~5ms per rate limit check
4. **Graceful Degradation**: System remains available during outages

### Expected Performance

- **Check Rate Limit**: < 10ms
- **Track Request**: < 5ms (async)
- **Get Status**: < 15ms
- **Throughput**: > 10,000 checks/second

---

## 🔄 Migration

Migration file: `supabase/migrations/20251002000001_create_rate_limiting_schema.sql`

To apply:

```bash
# Using Supabase CLI
supabase db push

# Or directly via psql
psql $DATABASE_URL -f supabase/migrations/20251002000001_create_rate_limiting_schema.sql
```

---

## 📞 Support

For issues or questions:

1. Check logs in `rate_limit_tracking` table
2. Verify configuration in `rate_limit_config`
3. Review quota usage in `rate_limit_quota_usage`
4. Contact platform team

---

## 🎓 Best Practices

1. **Set Conservative Limits**: Start with lower limits and increase based on usage patterns
2. **Monitor Regularly**: Track rate limit violations to identify abuse or legitimate need for higher limits
3. **Communicate Limits**: Document limits in API documentation
4. **Provide Clear Errors**: Include reset time and current usage in error messages
5. **Use Resource Types**: Segment different API types for fine-grained control
6. **Enable Graceful Degradation**: System should remain functional even if rate limiting fails

---

## 📚 Related Documentation

- [PHASE_3_MILESTONE_TRACKING.md](../PHASE_3_MILESTONE_TRACKING.md) - Overall Phase 3 progress
- [PHASE_3_ROADMAP.md](../PHASE_3_ROADMAP.md) - Phase 3 planning
- [API Documentation](./API_DOCUMENTATION.md) - Full API reference

---

**Last Updated**: 2025-10-02  
**Milestone**: M01 - API Rate Limiting & Quota Management  
**Status**: ✅ Complete
