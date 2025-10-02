# 🏢 Multi-Tenancy Architecture Guide

**Guardian AI CRM - Enterprise Multi-Tenant Implementation**

---

## 📋 Overview

This document outlines the multi-tenancy architecture for Guardian AI CRM, ensuring complete data isolation, regulatory compliance, and scalable performance across multiple organizations.

---

## 🎯 Architecture Principles

### Core Tenets

1. **Data Isolation**: Complete separation of tenant data at database level
2. **Performance**: No performance degradation as tenant count scales
3. **Compliance**: GDPR, HIPAA, SOC2 compliance built-in
4. **Flexibility**: Support for different tenant tiers and configurations
5. **Security**: Zero-trust architecture with defense in depth

---

## 🗄️ Database Schema Design

### Tenant Management Tables

```sql
-- Core tenant/organization table (already exists)
-- Extended with multi-tenancy specific fields

-- Tenant settings and configuration
CREATE TABLE IF NOT EXISTS tenant_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Regional Configuration
    region VARCHAR(50) NOT NULL DEFAULT 'eu-west-1',
    locale VARCHAR(10) NOT NULL DEFAULT 'it-IT',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
    
    -- Data Residency
    data_residency_requirement VARCHAR(50) CHECK (data_residency_requirement IN ('eu', 'us', 'global', 'uk', 'apac')),
    data_classification VARCHAR(20) CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
    
    -- Compliance
    compliance_flags JSONB DEFAULT '{
        "gdpr": true,
        "hipaa": false,
        "soc2": false,
        "iso27001": false
    }'::jsonb,
    
    -- Quotas and Limits
    max_users INTEGER DEFAULT 10,
    max_contacts INTEGER DEFAULT 1000,
    max_storage_gb INTEGER DEFAULT 10,
    max_api_calls_per_day INTEGER DEFAULT 10000,
    
    -- Features
    enabled_features JSONB DEFAULT '{
        "ai_assistant": true,
        "workflow_automation": true,
        "advanced_analytics": false,
        "custom_integrations": false
    }'::jsonb,
    
    -- Billing
    subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
    billing_email VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    trial_ends_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_trial_period CHECK (
        (is_trial = false) OR (is_trial = true AND trial_ends_at IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY tenant_settings_select ON tenant_settings
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY tenant_settings_update ON tenant_settings
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Tenant audit log
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'auth', 'data', 'config', 'billing'
    
    -- Actor
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Details
    action TEXT NOT NULL,
    resource_type VARCHAR(50),
    resource_id TEXT,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Result
    status VARCHAR(20) CHECK (status IN ('success', 'failure', 'partial')),
    error_message TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_tenant_audit_org_time (organization_id, created_at DESC),
    INDEX idx_tenant_audit_user (user_id, created_at DESC),
    INDEX idx_tenant_audit_event_type (event_type, created_at DESC)
);

-- Enable RLS
ALTER TABLE tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their org's audit logs
CREATE POLICY tenant_audit_logs_select ON tenant_audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Policy: Only superadmins can insert audit logs (via functions)
CREATE POLICY tenant_audit_logs_insert ON tenant_audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Tenant usage statistics
CREATE TABLE IF NOT EXISTS tenant_usage_stats (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Time Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Usage Metrics
    api_calls INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10, 2) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_contacts INTEGER DEFAULT 0,
    workflows_executed INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint on period
    UNIQUE (organization_id, period_start),
    
    -- Indexes
    INDEX idx_tenant_usage_org_period (organization_id, period_start DESC)
);

-- Enable RLS
ALTER TABLE tenant_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY tenant_usage_stats_select ON tenant_usage_stats
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### Row-Level Security (RLS) Enforcement

Every table must have RLS policies that enforce tenant isolation:

```sql
-- Example: contacts table RLS
CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Example: opportunities table RLS
CREATE POLICY opportunities_tenant_isolation ON opportunities
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
```

---

## 🔐 Security Model

### Authentication Flow

```typescript
// JWT Token Claims
interface JWTClaims {
    sub: string;              // User ID
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    organization_id: string;  // Primary organization
    organizations: string[];   // All accessible organizations
    iat: number;
    exp: number;
}
```

### Authorization Checks

```typescript
// Server-side authorization helper
export async function verifyTenantAccess(
    userId: string,
    organizationId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .single();
    
    return !error && data !== null;
}

// Usage in edge functions
export async function handler(req: Request): Promise<Response> {
    const { userId, organizationId } = await extractAuthContext(req);
    
    if (!await verifyTenantAccess(userId, organizationId)) {
        return new Response('Forbidden', { status: 403 });
    }
    
    // Proceed with request
}
```

### Cross-Tenant Protection

**Database Level**:
- RLS policies on all tables
- Foreign key constraints
- Check constraints on organization_id

**Application Level**:
- JWT validation on every request
- Organization ID verification
- Audit logging of all operations

**API Level**:
- Rate limiting per tenant
- Quota enforcement
- Request validation

---

## 🎨 Frontend Implementation

### Organization Switcher Component

```typescript
// OrganizationSwitcher.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Organization {
    id: string;
    name: string;
    is_active: boolean;
}

export const OrganizationSwitcher: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrgId, setCurrentOrgId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load user's profile to get organization
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id, organizations(id, name)')
                .eq('id', user.id)
                .single();

            if (profile) {
                setCurrentOrgId(profile.organization_id);
                // In multi-org scenario, load all accessible orgs
                // For now, single org per user
                setOrganizations([profile.organizations]);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    };

    const switchOrganization = async (orgId: string) => {
        setLoading(true);
        try {
            // Update user's current organization
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Verify user has access to this organization
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .eq('organization_id', orgId)
                .single();

            if (error || !data) {
                throw new Error('Access denied to this organization');
            }

            setCurrentOrgId(orgId);
            toast.success('Organization switched');
            
            // Reload the page to fetch new data
            window.location.reload();
        } catch (error: any) {
            toast.error(`Failed to switch organization: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="organization-switcher">
            <select
                value={currentOrgId}
                onChange={(e) => switchOrganization(e.target.value)}
                disabled={loading || organizations.length <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
                {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                        {org.name}
                    </option>
                ))}
            </select>
        </div>
    );
};
```

### Tenant Statistics Dashboard

```typescript
// TenantStatsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface TenantStats {
    api_calls: number;
    storage_used_gb: number;
    active_users: number;
    total_contacts: number;
    workflows_executed: number;
}

export const TenantStatsDashboard: React.FC = () => {
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile) return;

            // Load latest stats
            const { data: statsData } = await supabase
                .from('tenant_usage_stats')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('period_start', { ascending: false })
                .limit(1)
                .single();

            if (statsData) {
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading statistics...</div>;
    }

    if (!stats) {
        return <div>No statistics available</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="API Calls" value={stats.api_calls} />
            <StatCard label="Storage Used" value={`${stats.storage_used_gb} GB`} />
            <StatCard label="Active Users" value={stats.active_users} />
            <StatCard label="Total Contacts" value={stats.total_contacts} />
            <StatCard label="Workflows Executed" value={stats.workflows_executed} />
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-bold text-text-primary mt-1">{value}</div>
    </div>
);
```

---

## 🌍 Data Residency & Compliance

### Regional Configuration

```typescript
interface RegionConfig {
    code: string;
    name: string;
    data_center: string;
    compliance: string[];
    available: boolean;
}

const REGIONS: RegionConfig[] = [
    {
        code: 'eu-west-1',
        name: 'Europe (Ireland)',
        data_center: 'Dublin',
        compliance: ['GDPR', 'ISO27001'],
        available: true
    },
    {
        code: 'us-east-1',
        name: 'US East (N. Virginia)',
        data_center: 'Virginia',
        compliance: ['SOC2', 'HIPAA'],
        available: true
    },
    {
        code: 'ap-south-1',
        name: 'Asia Pacific (Mumbai)',
        data_center: 'Mumbai',
        compliance: ['ISO27001'],
        available: true
    }
];
```

### GDPR Compliance Features

**Data Subject Rights**:
- Right to access (data export)
- Right to erasure (data deletion)
- Right to portability (data transfer)
- Right to rectification (data correction)

**Implementation**:
```sql
-- Data export function
CREATE OR REPLACE FUNCTION export_user_data(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', (SELECT row_to_json(p.*) FROM profiles p WHERE p.id = user_id_param),
        'contacts', (SELECT jsonb_agg(row_to_json(c.*)) FROM contacts c WHERE c.created_by = user_id_param),
        'opportunities', (SELECT jsonb_agg(row_to_json(o.*)) FROM opportunities o WHERE o.created_by = user_id_param)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data deletion function
CREATE OR REPLACE FUNCTION delete_user_data(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete in correct order to respect foreign keys
    DELETE FROM contacts WHERE created_by = user_id_param;
    DELETE FROM opportunities WHERE created_by = user_id_param;
    DELETE FROM profiles WHERE id = user_id_param;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Monitoring & Analytics

### Tenant Health Monitoring

```typescript
interface TenantHealth {
    organization_id: string;
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
        api_latency_ms: number;
        error_rate: number;
        storage_usage_percent: number;
        quota_usage_percent: number;
    };
    alerts: Alert[];
}

async function checkTenantHealth(orgId: string): Promise<TenantHealth> {
    // Implementation
    const metrics = await fetchTenantMetrics(orgId);
    const alerts = await fetchActiveAlerts(orgId);
    
    const status = determineHealthStatus(metrics);
    
    return {
        organization_id: orgId,
        status,
        metrics,
        alerts
    };
}
```

### Usage Analytics

Track and visualize tenant usage patterns:
- API call patterns
- Peak usage times
- Feature adoption rates
- Storage growth trends
- User activity levels

---

## 🚀 Scaling Strategy

### Horizontal Scaling

**Database**:
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Query optimization
- Partitioning large tables by organization_id

**Application**:
- Stateless edge functions
- Auto-scaling based on load
- CDN for static assets
- Caching layer (Redis)

### Vertical Scaling

**Tenant Isolation**:
- Premium tenants on dedicated instances
- Resource allocation by subscription tier
- Priority queuing for enterprise customers

---

## 📋 Migration Guide

### Migrating Existing Tenants

```sql
-- Add multi-tenancy fields to existing tables
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Migrate existing data
UPDATE contacts c
SET organization_id = p.organization_id
FROM profiles p
WHERE c.created_by = p.id
AND c.organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE contacts
ALTER COLUMN organization_id SET NOT NULL;

-- Add RLS policy
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));
```

---

## ✅ Testing Checklist

### Tenant Isolation Tests

- [ ] User cannot see other tenant's data
- [ ] User cannot modify other tenant's data
- [ ] User cannot delete other tenant's data
- [ ] API calls respect tenant boundaries
- [ ] Audit logs are tenant-specific

### Performance Tests

- [ ] Query performance with multiple tenants
- [ ] RLS policy performance
- [ ] Connection pool under load
- [ ] API response times per tenant

### Compliance Tests

- [ ] Data export functionality
- [ ] Data deletion functionality
- [ ] Audit trail completeness
- [ ] Regional data storage verification

---

## 📞 Support

For multi-tenancy implementation questions:
- Email: architecture@guardian-ai-crm.com
- Slack: #multi-tenancy-support
- Documentation: docs.guardian-ai-crm.com/multi-tenancy

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-02  
**Status**: Production Ready
