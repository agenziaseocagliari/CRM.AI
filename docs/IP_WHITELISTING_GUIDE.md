# 🔐 IP Whitelisting & Geo-Restrictions Guide

**Phase 3 - Milestone M03**  
**Priority**: P1 - High  
**Status**: Production Ready

---

## 📋 Overview

The IP Whitelisting & Geo-Restrictions system provides organization-level security controls to restrict access based on IP addresses and geographic locations. This enterprise feature enables administrators to:

- ✅ Whitelist specific IP addresses or ranges
- ✅ Block or allow access from specific countries
- ✅ Log all IP access attempts with geo-location
- ✅ Monitor security threats with real-time analytics
- ✅ Enforce compliance with geographic data residency requirements

---

## 🎯 Key Features

### IP Whitelisting
- Single IP address whitelisting
- CIDR notation support (e.g., `10.0.0.0/8`)
- IP range whitelisting (start-end)
- Temporary whitelist entries with expiration
- Label and description for organization
- Automatic cleanup of expired entries

### Geo-Restrictions
- Country-level access control (ISO 3166-1 alpha-2 codes)
- Allow-list mode (only specified countries)
- Block-list mode (block specified countries)
- Mixed mode support (allow + block rules)
- Priority: Whitelist IPs override geo-restrictions

### Access Logging & Analytics
- Real-time IP access logging
- Geographic data capture (country, city)
- Blocked access tracking with reasons
- Access statistics and trends
- Top blocked IPs identification
- Audit trail integration

---

## 🚀 Quick Start

### 1. Add IP to Whitelist

```typescript
import { addIPWhitelist } from '@/lib/ipWhitelist';

// Add a single IP
await addIPWhitelist(organizationId, '192.168.1.100', {
  label: 'Office Main Gateway',
  description: 'Main office internet gateway',
});

// Add a CIDR range
await addIPWhitelist(organizationId, '10.0.0.0/8', {
  label: 'Internal Network',
  description: 'All internal office networks',
});

// Add with expiration
await addIPWhitelist(organizationId, '203.0.113.10', {
  label: 'Contractor Access',
  description: 'Temporary contractor access',
  expiresAt: new Date('2025-12-31'),
});
```

### 2. Configure Geo-Restrictions

```typescript
import { addGeoRestriction } from '@/lib/ipWhitelist';

// Allow access only from US and UK
await addGeoRestriction(organizationId, 'US', 'allow', {
  label: 'United States',
  description: 'Primary market',
});

await addGeoRestriction(organizationId, 'GB', 'allow', {
  label: 'United Kingdom',
  description: 'Secondary market',
});

// Block access from specific countries
await addGeoRestriction(organizationId, 'CN', 'block', {
  label: 'China',
  description: 'Compliance restriction',
});
```

### 3. Validate IP Access

```typescript
import { validateIPAccess, logIPAccess } from '@/lib/ipWhitelist';

// Validate incoming request
const validation = await validateIPAccess(
  organizationId,
  requestIP,
  countryCode
);

if (!validation.allowed) {
  // Log blocked access
  await logIPAccess(organizationId, requestIP, {
    isBlocked: true,
    blockReason: validation.blockReason,
    countryCode,
    endpoint: req.url,
    requestMethod: req.method,
  });
  
  // Return 403 Forbidden
  return res.status(403).json({
    error: 'Access denied',
    reason: validation.blockReason,
  });
}

// Log successful access
await logIPAccess(organizationId, requestIP, {
  userId: user.id,
  isWhitelisted: validation.isWhitelisted,
  countryCode,
  endpoint: req.url,
});
```

### 4. Monitor Access

```typescript
import { getIPAccessStats, getIPAccessLogs } from '@/lib/ipWhitelist';

// Get access statistics
const stats = await getIPAccessStats(organizationId, 7); // Last 7 days
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Blocked requests: ${stats.blockedRequests}`);
console.log(`Unique IPs: ${stats.uniqueIps}`);

// Get recent blocked access attempts
const blockedLogs = await getIPAccessLogs(organizationId, {
  blockedOnly: true,
  limit: 50,
});
```

---

## 📊 Database Schema

### Tables

#### `ip_whitelist`
Stores whitelisted IP addresses and ranges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Organization reference |
| `ip_address` | TEXT | IP address or CIDR notation |
| `ip_range_start` | INET | Start of IP range (optional) |
| `ip_range_end` | INET | End of IP range (optional) |
| `is_range` | BOOLEAN | Whether this is a range entry |
| `label` | TEXT | Human-readable label |
| `description` | TEXT | Detailed description |
| `created_by` | UUID | User who created the entry |
| `is_active` | BOOLEAN | Whether the entry is active |
| `expires_at` | TIMESTAMPTZ | Expiration date (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `geo_restrictions`
Stores geographic access restrictions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Organization reference |
| `country_code` | TEXT | ISO 3166-1 alpha-2 country code |
| `restriction_type` | TEXT | 'allow' or 'block' |
| `label` | TEXT | Human-readable label |
| `description` | TEXT | Detailed description |
| `created_by` | UUID | User who created the entry |
| `is_active` | BOOLEAN | Whether the entry is active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `ip_access_log`
Logs all IP access attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Organization reference |
| `user_id` | UUID | User reference (if authenticated) |
| `ip_address` | INET | IP address of the request |
| `country_code` | TEXT | Country code from geo-IP lookup |
| `city` | TEXT | City from geo-IP lookup |
| `is_whitelisted` | BOOLEAN | Whether IP was whitelisted |
| `is_blocked` | BOOLEAN | Whether access was blocked |
| `block_reason` | TEXT | Reason for blocking |
| `endpoint` | TEXT | API endpoint accessed |
| `request_method` | TEXT | HTTP method |
| `user_agent` | TEXT | User agent string |
| `access_time` | TIMESTAMPTZ | When access was attempted |

### Helper Functions

#### `check_ip_whitelist(p_organization_id, p_ip_address)`
Check if an IP address is whitelisted.

**Returns**: `BOOLEAN`

#### `check_geo_restriction(p_organization_id, p_country_code)`
Check if access from a country is allowed.

**Returns**: `JSONB` with `{ allowed: boolean, reason: string }`

#### `log_ip_access(...)`
Log an IP access attempt.

**Returns**: `UUID` (log entry ID)

#### `get_ip_access_stats(p_organization_id, p_days)`
Get IP access statistics for the last N days.

**Returns**: `JSONB` with statistics

#### `cleanup_old_ip_access_logs(p_retention_days)`
Clean up old IP access logs (for data retention).

**Returns**: `INT` (number of deleted records)

---

## 🔐 Security Considerations

### Whitelist Priority
IP whitelists always take priority over geo-restrictions. If an IP is whitelisted, access is allowed regardless of country-level restrictions.

### Fail-Open vs Fail-Closed
The current implementation uses a "fail-open" approach for high availability:
- If database is unreachable, access is allowed
- If geo-IP lookup fails, access is allowed

For maximum security, you can change this to "fail-closed" by modifying the error handlers in `ipWhitelist.ts`.

### Rate Limiting Integration
IP whitelisting works alongside the API rate limiting system (M01). Whitelisted IPs may still be subject to rate limits unless explicitly exempted.

### Audit Logging
All blocked access attempts are automatically logged to the audit system (M02) with severity `SECURITY`.

---

## 📈 Usage Examples

### Middleware Integration

```typescript
// middleware/ipValidation.ts
import { validateIPAccess, logIPAccess } from '@/lib/ipWhitelist';
import { getClientIP, getCountryCode } from '@/lib/geoip';

export async function ipValidationMiddleware(req, res, next) {
  const clientIP = getClientIP(req);
  const countryCode = await getCountryCode(clientIP);
  const organizationId = req.user?.organizationId;
  
  if (!organizationId) {
    return next(); // Skip validation for unauthenticated requests
  }
  
  const validation = await validateIPAccess(organizationId, clientIP, countryCode);
  
  if (!validation.allowed) {
    await logIPAccess(organizationId, clientIP, {
      userId: req.user?.id,
      isBlocked: true,
      blockReason: validation.blockReason,
      countryCode,
      endpoint: req.originalUrl,
      requestMethod: req.method,
      userAgent: req.headers['user-agent'],
    });
    
    return res.status(403).json({
      error: 'Access denied from your location',
      message: validation.blockReason,
    });
  }
  
  // Log successful access (async, don't await)
  logIPAccess(organizationId, clientIP, {
    userId: req.user?.id,
    isWhitelisted: validation.isWhitelisted,
    countryCode,
    endpoint: req.originalUrl,
    requestMethod: req.method,
    userAgent: req.headers['user-agent'],
  }).catch(console.error);
  
  next();
}
```

### Admin Dashboard Component

```typescript
// components/IPWhitelistManager.tsx
import { useState, useEffect } from 'react';
import { listIPWhitelist, addIPWhitelist, removeIPWhitelist } from '@/lib/ipWhitelist';

export function IPWhitelistManager({ organizationId }) {
  const [whitelist, setWhitelist] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [label, setLabel] = useState('');
  
  useEffect(() => {
    loadWhitelist();
  }, [organizationId]);
  
  async function loadWhitelist() {
    const data = await listIPWhitelist(organizationId);
    setWhitelist(data);
  }
  
  async function handleAdd() {
    await addIPWhitelist(organizationId, newIP, { label });
    setNewIP('');
    setLabel('');
    await loadWhitelist();
  }
  
  async function handleRemove(id) {
    await removeIPWhitelist(organizationId, id);
    await loadWhitelist();
  }
  
  return (
    <div className="ip-whitelist-manager">
      <h2>IP Whitelist</h2>
      
      <div className="add-form">
        <input
          type="text"
          placeholder="IP Address (e.g., 192.168.1.1 or 10.0.0.0/8)"
          value={newIP}
          onChange={e => setNewIP(e.target.value)}
        />
        <input
          type="text"
          placeholder="Label"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <button onClick={handleAdd}>Add IP</button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>IP Address</th>
            <th>Label</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {whitelist.map(entry => (
            <tr key={entry.id}>
              <td>{entry.ipAddress}</td>
              <td>{entry.label}</td>
              <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleRemove(entry.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test src/__tests__/ipWhitelist.test.ts
```

**Test Coverage**:
- ✅ IP whitelist validation
- ✅ Geo-restriction checking
- ✅ Combined IP + Geo validation
- ✅ Access logging
- ✅ CRUD operations
- ✅ Statistics and analytics
- ✅ Error handling

### Integration Testing

```typescript
// Test with real database (requires Supabase setup)
describe('IP Whitelist Integration', () => {
  it('should whitelist and validate IP', async () => {
    const orgId = 'test-org';
    const testIP = '203.0.113.50';
    
    // Add to whitelist
    await addIPWhitelist(orgId, testIP, { label: 'Test IP' });
    
    // Verify it's whitelisted
    const isWhitelisted = await checkIPWhitelist(orgId, testIP);
    expect(isWhitelisted).toBe(true);
    
    // Cleanup
    const list = await listIPWhitelist(orgId);
    const entry = list.find(e => e.ipAddress === testIP);
    await removeIPWhitelist(orgId, entry.id);
  });
});
```

---

## 📊 Performance Considerations

### Indexing
All critical queries are indexed:
- `idx_ip_whitelist_org` - Organization lookup
- `idx_ip_whitelist_active` - Active entries
- `idx_ip_access_log_ip` - IP-based queries
- `idx_ip_access_log_time` - Time-series queries

### Caching Recommendations
For high-traffic applications, consider caching:
- IP whitelist entries (5-minute TTL)
- Geo-restriction rules (5-minute TTL)
- Country code lookups (1-hour TTL)

### Data Retention
IP access logs are automatically cleaned up after 90 days (configurable). For compliance requirements, adjust the retention period:

```sql
-- Run periodically via cron job
SELECT cleanup_old_ip_access_logs(90); -- 90 days
```

---

## 🔧 Configuration

### Environment Variables

```env
# GeoIP Service (optional)
GEOIP_API_KEY=your_api_key_here
GEOIP_SERVICE=ipinfo # or maxmind, ipapi, etc.

# Security Settings
IP_VALIDATION_FAIL_OPEN=true # false for fail-closed
IP_LOG_RETENTION_DAYS=90
```

### Default Behavior

- **Fail Mode**: Fail-open (allow access on error)
- **Whitelist Priority**: Always override geo-restrictions
- **Log Retention**: 90 days
- **Expired Entries**: Automatically excluded from validation

---

## 📞 API Reference

See [API Documentation](./API_REFERENCE.md) for complete TypeScript API reference.

### Key Functions

- `checkIPWhitelist(orgId, ip)` - Validate IP against whitelist
- `checkGeoRestriction(orgId, country)` - Check country access rules
- `validateIPAccess(orgId, ip, country)` - Combined validation
- `logIPAccess(orgId, ip, options)` - Log access attempt
- `addIPWhitelist(orgId, ip, options)` - Add IP to whitelist
- `removeIPWhitelist(orgId, id)` - Remove from whitelist
- `addGeoRestriction(orgId, country, type, options)` - Add geo rule
- `getIPAccessStats(orgId, days)` - Get access statistics

---

## 🐛 Troubleshooting

### IP Not Being Blocked

1. Check if IP is in whitelist: `SELECT * FROM ip_whitelist WHERE ip_address = 'X.X.X.X'`
2. Verify geo-restriction is active: `SELECT * FROM geo_restrictions WHERE is_active = true`
3. Check access logs: `SELECT * FROM ip_access_log ORDER BY access_time DESC LIMIT 10`

### Geo-Location Not Working

1. Verify GeoIP service is configured
2. Check API key is valid
3. Review error logs for GeoIP lookup failures
4. Ensure country codes are in ISO 3166-1 alpha-2 format

### Performance Issues

1. Check indexes are created: `\d ip_whitelist` in psql
2. Monitor query performance: Enable slow query log
3. Consider caching whitelist and geo-rules
4. Partition `ip_access_log` table if very large

---

## 🎓 Best Practices

1. **Start with allow-list**: Define allowed countries first, then add blocks
2. **Use CIDR notation**: For office networks, use CIDR (e.g., `10.0.0.0/8`)
3. **Set expiration dates**: For temporary access, always set `expiresAt`
4. **Label everything**: Use descriptive labels for easy management
5. **Monitor regularly**: Review `ip_access_log` for security threats
6. **Audit changes**: All changes are logged via M02 audit system
7. **Test before deploy**: Always test whitelist rules in staging first

---

## 📝 Compliance

### GDPR
- IP addresses are personal data - handle accordingly
- Log retention configurable for data minimization
- Access logs support right to be forgotten

### SOC 2
- Comprehensive audit trail via M02 integration
- Access control at organization level
- Automated security monitoring

### ISO 27001
- Geographic access restrictions
- IP-based access control
- Security event logging

---

## 🚀 Next Steps

After implementing M03, consider:
- **M11: Smart Alert System** - Get notified of suspicious IP activity
- **M13: Enhanced Tenant Isolation** - Additional security layers
- **M18: Compliance Dashboard** - Centralized compliance monitoring

---

**Status**: ✅ Production Ready  
**Dependencies**: M02 (Enhanced Audit Logging)  
**Integration**: Works with M01 (Rate Limiting), M02 (Audit Logging)

---

For questions or issues, consult the [Implementation Guide](../PHASE_3_IMPLEMENTATION_GUIDE.md) or review the [source code](../src/lib/ipWhitelist.ts).
