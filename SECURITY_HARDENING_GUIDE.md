# 🔒 Security Hardening Guide

**Guardian AI CRM - Enterprise Security Implementation**

---

## 📋 Overview

This comprehensive security hardening guide outlines best practices, implementation strategies, and ongoing maintenance procedures to ensure Guardian AI CRM maintains enterprise-grade security standards.

---

## 🎯 Security Objectives

1. **Confidentiality**: Protect sensitive data from unauthorized access
2. **Integrity**: Ensure data accuracy and prevent tampering
3. **Availability**: Maintain system uptime and resilience
4. **Accountability**: Track all actions through comprehensive audit logs
5. **Compliance**: Meet regulatory requirements (GDPR, HIPAA, SOC2)

---

## 🛡️ Security Layers

### 1. Network Security

#### IP Whitelisting

**Implementation**:

```sql
-- IP whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- IP Configuration
    ip_address INET NOT NULL,
    ip_range CIDR,
    
    -- Access Control
    role_restriction TEXT[] DEFAULT '{}',
    resource_restriction TEXT[] DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT ip_or_range_required CHECK (
        ip_address IS NOT NULL OR ip_range IS NOT NULL
    )
);

-- Enable RLS
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage
CREATE POLICY ip_whitelist_admin ON ip_whitelist
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

**Edge Function Integration**:

```typescript
// Middleware for IP validation
export async function validateIPAddress(
    req: Request,
    organizationId: string
): Promise<boolean> {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') ||
                     'unknown';
    
    const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
    
    if (error || !data || data.length === 0) {
        // No whitelist = allow all (default behavior)
        return true;
    }
    
    // Check if IP matches any whitelist entry
    for (const entry of data) {
        if (entry.ip_address && entry.ip_address === clientIP) {
            // Update last_used_at
            await supabase
                .from('ip_whitelist')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', entry.id);
            return true;
        }
        
        if (entry.ip_range) {
            // Check CIDR range matching
            // Implementation depends on IP library
            // return isIPInRange(clientIP, entry.ip_range);
        }
    }
    
    // Log unauthorized access attempt
    await logSecurityEvent({
        event_type: 'ip_whitelist_violation',
        severity: 'high',
        organization_id: organizationId,
        ip_address: clientIP,
        timestamp: new Date().toISOString()
    });
    
    return false;
}
```

#### Rate Limiting (Enhanced)

Already implemented in Phase 1, but additional enhancements:

```typescript
// Adaptive rate limiting based on user behavior
interface AdaptiveRateLimit {
    trustScore: number; // 0-100
    baseLimit: number;
    multiplier: number;
}

export async function getAdaptiveRateLimit(
    userId: string
): Promise<AdaptiveRateLimit> {
    // Calculate trust score based on:
    // - Account age
    // - Past violations
    // - Verification level
    // - Activity patterns
    
    const trustScore = await calculateTrustScore(userId);
    
    return {
        trustScore,
        baseLimit: 100,
        multiplier: trustScore / 100 // Lower score = lower limit
    };
}
```

### 2. Application Security

#### Input Validation & Sanitization

```typescript
// Strict input validation
import { z } from 'zod';

export const WorkflowInputSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    trigger_type: z.enum(['manual', 'schedule', 'event', 'condition']),
    workflow_json: z.record(z.any()).refine(
        (data) => validateWorkflowJSON(data),
        { message: 'Invalid workflow configuration' }
    ),
});

export function validateAndSanitizeInput<T>(
    input: unknown,
    schema: z.ZodSchema<T>
): T {
    try {
        return schema.parse(input);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw error;
    }
}
```

#### SQL Injection Prevention

**Best Practices**:
- ✅ Always use Supabase query builders (parameterized queries)
- ✅ Never concatenate user input into SQL strings
- ✅ Use RLS policies for data access control
- ❌ Avoid raw SQL queries with user input

```typescript
// ✅ CORRECT: Using query builder
const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', orgId)
    .ilike('name', `%${searchTerm}%`);

// ❌ WRONG: String concatenation
const query = `SELECT * FROM contacts WHERE name LIKE '%${searchTerm}%'`;
```

#### XSS Prevention

```typescript
// Content Security Policy
export const CSP_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://aistudiocdn.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ')
};

// HTML sanitization
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'title']
    });
}
```

### 3. Authentication & Authorization

#### Multi-Factor Authentication (2FA)

Already implemented in Phase 1. Additional enhancements:

```sql
-- 2FA enforcement policies
CREATE TABLE IF NOT EXISTS auth_policies (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id),
    
    -- 2FA Settings
    require_2fa_all_users BOOLEAN DEFAULT false,
    require_2fa_admins BOOLEAN DEFAULT true,
    require_2fa_sensitive_ops BOOLEAN DEFAULT true,
    
    -- Session Settings
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
    idle_timeout_minutes INTEGER DEFAULT 30,
    max_concurrent_sessions INTEGER DEFAULT 3,
    
    -- Password Policy
    min_password_length INTEGER DEFAULT 12,
    require_uppercase BOOLEAN DEFAULT true,
    require_lowercase BOOLEAN DEFAULT true,
    require_numbers BOOLEAN DEFAULT true,
    require_symbols BOOLEAN DEFAULT true,
    password_expiry_days INTEGER DEFAULT 90,
    
    -- Account Lockout
    max_failed_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### JWT Security

```typescript
// JWT validation and refresh
export async function validateAndRefreshJWT(
    token: string
): Promise<{ valid: boolean; newToken?: string }> {
    try {
        // Verify token signature and expiration
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return { valid: false };
        }
        
        // Check if token is about to expire (within 5 minutes)
        const expiresAt = user.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (expiresAt - now < fiveMinutes) {
            // Refresh token
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && data.session) {
                return {
                    valid: true,
                    newToken: data.session.access_token
                };
            }
        }
        
        return { valid: true };
    } catch (error) {
        return { valid: false };
    }
}
```

### 4. Data Protection

#### Encryption at Rest

```sql
-- Sensitive data encryption (example)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted column function
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted, key);
END;
$$ LANGUAGE plpgsql;
```

#### Encryption in Transit

- ✅ HTTPS only (enforced by Vercel and Supabase)
- ✅ TLS 1.3 minimum
- ✅ HSTS headers
- ✅ Certificate pinning for critical APIs

```typescript
// Security headers
export const SECURITY_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

### 5. Breach Detection & Response

#### Anomaly Detection

```typescript
interface SecurityAnomaly {
    type: 'unusual_access' | 'multiple_failures' | 'data_exfiltration' | 'privilege_escalation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    user_id?: string;
    ip_address: string;
    timestamp: string;
    details: Record<string, any>;
}

export async function detectAnomalies(): Promise<SecurityAnomaly[]> {
    const anomalies: SecurityAnomaly[] = [];
    
    // Check 1: Multiple failed login attempts
    const recentFailures = await checkFailedLogins();
    if (recentFailures.count > 10) {
        anomalies.push({
            type: 'multiple_failures',
            severity: 'high',
            ip_address: recentFailures.ip,
            timestamp: new Date().toISOString(),
            details: { count: recentFailures.count }
        });
    }
    
    // Check 2: Unusual access patterns
    const accessPattern = await analyzeAccessPatterns();
    if (accessPattern.isUnusual) {
        anomalies.push({
            type: 'unusual_access',
            severity: 'medium',
            user_id: accessPattern.userId,
            ip_address: accessPattern.ip,
            timestamp: new Date().toISOString(),
            details: accessPattern.details
        });
    }
    
    // Check 3: Data exfiltration
    const dataTransfer = await monitorDataTransfer();
    if (dataTransfer.volumeGB > 10) {
        anomalies.push({
            type: 'data_exfiltration',
            severity: 'critical',
            user_id: dataTransfer.userId,
            ip_address: dataTransfer.ip,
            timestamp: new Date().toISOString(),
            details: { volume_gb: dataTransfer.volumeGB }
        });
    }
    
    return anomalies;
}
```

#### Automated Response

```typescript
export async function respondToSecurityIncident(
    anomaly: SecurityAnomaly
): Promise<void> {
    switch (anomaly.severity) {
        case 'critical':
            // Immediate lockdown
            await lockdownCriticalOperations(anomaly.user_id);
            await notifySecurityTeam(anomaly, 'immediate');
            await triggerIncidentResponse(anomaly);
            break;
            
        case 'high':
            // Alert and monitor
            await notifySecurityTeam(anomaly, 'urgent');
            await increaseMonitoring(anomaly.user_id);
            break;
            
        case 'medium':
            // Log and review
            await logSecurityEvent(anomaly);
            await notifySecurityTeam(anomaly, 'normal');
            break;
            
        case 'low':
            // Log only
            await logSecurityEvent(anomaly);
            break;
    }
}

async function lockdownCriticalOperations(userId?: string): Promise<void> {
    if (userId) {
        // Suspend user account
        await supabase
            .from('profiles')
            .update({ is_suspended: true, suspended_at: new Date().toISOString() })
            .eq('id', userId);
    }
    
    // Disable sensitive operations
    await supabase
        .from('system_settings')
        .update({ critical_operations_enabled: false })
        .eq('setting_key', 'security');
}
```

### 6. Audit & Compliance

#### Comprehensive Audit Logging

```sql
-- Enhanced audit logging
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Actor
    user_id UUID,
    user_email VARCHAR(255),
    organization_id UUID,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    session_id TEXT,
    
    -- Action
    action TEXT NOT NULL,
    resource_type VARCHAR(50),
    resource_id TEXT,
    
    -- Result
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    
    -- Data
    before_state JSONB,
    after_state JSONB,
    
    -- Compliance
    compliance_tags TEXT[] DEFAULT '{}',
    retention_required BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_security_audit_time (created_at DESC),
    INDEX idx_security_audit_user (user_id, created_at DESC),
    INDEX idx_security_audit_severity (severity, created_at DESC),
    INDEX idx_security_audit_org (organization_id, created_at DESC)
);

-- Immutable audit log (prevent modification)
CREATE OR REPLACE RULE security_audit_no_delete AS
    ON DELETE TO security_audit_logs DO INSTEAD NOTHING;

CREATE OR REPLACE RULE security_audit_no_update AS
    ON UPDATE TO security_audit_logs DO INSTEAD NOTHING;
```

#### Compliance Monitoring

```typescript
export interface ComplianceCheck {
    regulation: 'GDPR' | 'HIPAA' | 'SOC2' | 'ISO27001';
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    evidence: string[];
    lastChecked: string;
    nextCheckDue: string;
}

export async function runComplianceAudit(
    organizationId: string
): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    
    // GDPR Compliance
    checks.push({
        regulation: 'GDPR',
        requirement: 'Right to Access (Art. 15)',
        status: await verifyDataExportCapability(organizationId),
        evidence: ['Data export functionality tested', 'User portal available'],
        lastChecked: new Date().toISOString(),
        nextCheckDue: addDays(new Date(), 90).toISOString()
    });
    
    checks.push({
        regulation: 'GDPR',
        requirement: 'Right to Erasure (Art. 17)',
        status: await verifyDataDeletionCapability(organizationId),
        evidence: ['Data deletion workflow implemented', 'Cascade delete configured'],
        lastChecked: new Date().toISOString(),
        nextCheckDue: addDays(new Date(), 90).toISOString()
    });
    
    // SOC2 Compliance
    checks.push({
        regulation: 'SOC2',
        requirement: 'Access Controls',
        status: await verifyAccessControls(organizationId),
        evidence: ['RLS policies enabled', 'JWT authentication', 'Role-based access'],
        lastChecked: new Date().toISOString(),
        nextCheckDue: addDays(new Date(), 30).toISOString()
    });
    
    return checks;
}
```

---

## 🔄 Automated Security Testing

### Dependency Scanning

```bash
# Install dependency check tools
npm install --save-dev npm-audit-resolver

# Run security audit
npm audit --audit-level=moderate

# Check for vulnerabilities
npm audit fix
```

### Static Code Analysis

```bash
# Install ESLint security plugin
npm install --save-dev eslint-plugin-security

# Add to .eslintrc.json
{
    "plugins": ["security"],
    "extends": ["plugin:security/recommended"]
}
```

### Penetration Testing Schedule

| Test Type | Frequency | Tools |
|-----------|-----------|-------|
| OWASP Top 10 | Monthly | OWASP ZAP |
| SQL Injection | Weekly | SQLMap |
| XSS Testing | Weekly | XSStrike |
| Authentication | Bi-weekly | Custom scripts |
| Authorization | Bi-weekly | Custom scripts |
| Full Pentest | Quarterly | Professional service |

---

## 📊 Security Metrics & KPIs

### Key Performance Indicators

1. **Mean Time to Detect (MTTD)**: < 5 minutes
2. **Mean Time to Respond (MTTR)**: < 30 minutes
3. **False Positive Rate**: < 5%
4. **Vulnerability Patch Time**: < 24 hours (critical), < 7 days (high)
5. **2FA Adoption Rate**: > 95%
6. **Security Training Completion**: 100%

### Monitoring Dashboard

```typescript
export interface SecurityMetrics {
    period: { start: string; end: string };
    incidents: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        resolved: number;
        avgResolutionTime: number;
    };
    authentication: {
        failedAttempts: number;
        lockedAccounts: number;
        mfaEnabled: number;
        mfaTotal: number;
    };
    vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        patched: number;
    };
}
```

---

## 🎓 Security Training & Awareness

### Required Training Modules

1. **Security Fundamentals** (All staff)
   - Password management
   - Phishing recognition
   - Data handling best practices

2. **Secure Development** (Developers)
   - OWASP Top 10
   - Input validation
   - Secure API design

3. **Incident Response** (Ops team)
   - Detection procedures
   - Response protocols
   - Communication plans

4. **Compliance** (Leadership)
   - Regulatory requirements
   - Audit procedures
   - Risk management

---

## 📋 Incident Response Playbook

### Phase 1: Detection (0-5 minutes)
- ✅ Automated monitoring detects anomaly
- ✅ Alert sent to security team
- ✅ Initial triage assessment

### Phase 2: Containment (5-30 minutes)
- ✅ Isolate affected systems
- ✅ Disable compromised accounts
- ✅ Prevent lateral movement

### Phase 3: Eradication (30 minutes - 2 hours)
- ✅ Identify root cause
- ✅ Remove malicious code/access
- ✅ Patch vulnerabilities

### Phase 4: Recovery (2-24 hours)
- ✅ Restore systems from backups
- ✅ Verify system integrity
- ✅ Monitor for recurrence

### Phase 5: Lessons Learned (24-48 hours)
- ✅ Post-incident review
- ✅ Update procedures
- ✅ Implement preventive measures

---

## ✅ Security Checklist

### Daily
- [ ] Review security alerts
- [ ] Check failed login attempts
- [ ] Monitor system health
- [ ] Verify backup completion

### Weekly
- [ ] Review audit logs
- [ ] Update security patches
- [ ] Test incident response procedures
- [ ] Review access controls

### Monthly
- [ ] Full vulnerability scan
- [ ] Compliance audit
- [ ] Security training updates
- [ ] Review and update policies

### Quarterly
- [ ] External penetration test
- [ ] Business continuity drill
- [ ] Risk assessment update
- [ ] Security architecture review

---

## 📞 Security Contacts

**Security Team**: security@guardian-ai-crm.com  
**Incident Reporting**: incidents@guardian-ai-crm.com  
**24/7 Hotline**: +1-XXX-XXX-XXXX  
**Bug Bounty**: bugbounty@guardian-ai-crm.com

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-02  
**Next Review**: 2025-04-02  
**Maintained By**: Security Team
