# ===================================================================
# GUARDIAN AI CRM - PRODUCTION DEPLOYMENT GUIDE  
# File: DEPLOYMENT.md
# Guida completa per deployment in produzione
# ===================================================================

# 🚀 **Deployment Guide - Guardian AI CRM Usage Tracking System**

## 📋 **Pre-Deployment Checklist**

### ✅ **1. Preparazione Environment**
- [ ] Setup Supabase progetto produzione
- [ ] Configurazione Vercel account
- [ ] Setup Stripe account per billing
- [ ] Configurazione SendGrid per email
- [ ] Setup Twilio per WhatsApp
- [ ] Gemini API key attiva

### ✅ **2. Database Preparazione**
- [ ] Database migration file pronti
- [ ] Schema usage tracking validato
- [ ] Stored procedures create
- [ ] Row Level Security configurata
- [ ] Indici performance ottimizzati

### ✅ **3. Code Quality Check**
- [ ] Build TypeScript senza errori
- [ ] Test suite completata
- [ ] Demo script validato
- [ ] Integration hooks testati
- [ ] Dashboard UI funzionante

---

## 🗄️ **Database Migration Deployment**

### Step 1: Setup Supabase Produzione
```bash
# Login to Supabase
npx supabase login

# Link to production project
npx supabase link --project-ref your-production-project-ref

# Push database schema
npx supabase db push

# Verify migration status
npx supabase migration list
```

### Step 2: Execute Usage Tracking Migration
```sql
-- Execute in Supabase SQL Editor or via CLI

-- 1. Create usage tracking schema
\i supabase/migrations/create_usage_tracking_system.sql

-- 2. Create stored procedures
\i supabase/migrations/create_usage_functions.sql

-- 3. Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%usage%' OR table_name LIKE '%subscription%';

-- 4. Test stored procedures
SELECT * FROM get_usage_summary(gen_random_uuid());
```

### Step 3: Seed Initial Data
```sql
-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, price_cents, ai_requests_limit, whatsapp_messages_limit, email_marketing_limit, contacts_limit, storage_limit_gb, ai_overage_cents, whatsapp_overage_cents, email_overage_cents) VALUES
('starter', 'Starter', 2900, 500, 100, 2000, 1000, 5, 10, 20, 1),
('professional', 'Professional', 6900, 2000, 500, 8000, 10000, 20, 8, 18, 1),
('enterprise', 'Enterprise', 14900, -1, -1, -1, -1, -1, 5, 15, 1);

-- Verify insertion
SELECT * FROM subscription_tiers ORDER BY price_cents;
```

---

## 🌐 **Vercel Deployment Setup**

### Step 1: Environment Variables
```bash
# Set production environment variables in Vercel Dashboard
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_GEMINI_API_KEY production
vercel env add SENDGRID_API_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add STRIPE_PUBLIC_KEY production
# ... add all required vars from .env.example
```

### Step 2: Build Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Step 3: Deploy Commands
```bash
# Build locally first
npm run build

# Deploy to production
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/health
```

---

## 🔌 **API Integrations Setup**

### 1. Stripe Webhook Configuration
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to development
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Create production webhook endpoint
stripe webhooks create \
  --url https://your-app.vercel.app/api/stripe/webhook \
  --events subscription.created,invoice.payment_succeeded,invoice.payment_failed
```

### 2. Supabase Edge Functions (if needed)
```sql
-- Create edge function for usage tracking
create or replace function track_usage_edge(
  org_id uuid,
  service_type text,
  quantity integer,
  metadata jsonb default '{}'
)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Call tracking service
  select increment_usage_quota into result
  from increment_usage_quota(org_id, service_type || '_used', quantity);
  
  -- Return response
  return json_build_object('success', true, 'quota_updated', true);
end;
$$;
```

### 3. SendGrid Domain Authentication
```bash
# Setup domain authentication in SendGrid dashboard
# Add DNS records to your domain:
# 1. CNAME: s1._domainkey -> s1.domainkey.sendgrid.net
# 2. CNAME: s2._domainkey -> s2.domainkey.sendgrid.net  
# 3. CNAME: mail -> sendgrid.net

# Verify domain
curl -X GET "https://api.sendgrid.com/v3/whitelabel/domains" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 🔐 **Security Configuration**

### 1. Supabase Row Level Security
```sql
-- Enable RLS on all usage tracking tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (already in migration, verify they exist)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('usage_tracking', 'usage_quotas', 'billing_events');
```

### 2. API Security Headers
```typescript
// middleware/security.ts
export function securityHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}
```

### 3. Environment Secrets Validation
```typescript
// utils/validateEnv.ts
export function validateEnvironment() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY',
    'SENDGRID_API_KEY',
    'STRIPE_PUBLIC_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

---

## 📊 **Monitoring Setup**

### 1. Usage Tracking Analytics
```typescript
// analytics/usageAnalytics.ts
export class UsageAnalytics {
  static async trackUsageEvent(event: {
    organizationId: string;
    serviceType: string;
    quantity: number;
    cost: number;
  }) {
    // Send to analytics service
    await fetch('/api/analytics/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  }

  static async getUsageInsights(organizationId: string) {
    const response = await fetch(`/api/analytics/insights/${organizationId}`);
    return response.json();
  }
}
```

### 2. Health Check Endpoints
```typescript
// api/health.ts
export default async function handler(req: Request) {
  const checks = {
    database: await checkDatabase(),
    supabase: await checkSupabase(),
    external_apis: await checkExternalAPIs(),
    usage_tracking: await checkUsageTracking()
  };

  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  return Response.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
}
```

### 3. Error Monitoring
```typescript
// utils/errorMonitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initializeErrorMonitoring() {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    tracesSampleRate: 0.1,
  });
}
```

---

## 🧪 **Production Testing**

### 1. Smoke Tests
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/usage/stats/test-org-id

# Test usage tracking
curl -X POST https://your-app.vercel.app/api/usage/track \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"test","serviceType":"ai_request","quantity":1}'
```

### 2. Load Testing
```javascript
// Use Artillery.io for load testing
// artillery.yml
config:
  target: 'https://your-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Usage Tracking Load Test'
    requests:
      - post:
          url: '/api/usage/track'
          json:
            organizationId: 'load-test-org'
            serviceType: 'ai_request'
            quantity: 1
```

### 3. Usage Flow Testing
```javascript
// test-production-usage.js
async function testUsageFlow() {
  const orgId = 'prod-test-' + Date.now();
  
  // 1. Test AI request tracking
  await testAITracking(orgId);
  
  // 2. Test WhatsApp tracking
  await testWhatsAppTracking(orgId);
  
  // 3. Test email tracking
  await testEmailTracking(orgId);
  
  // 4. Test quota limits
  await testQuotaLimits(orgId);
  
  // 5. Test dashboard data
  await testDashboardData(orgId);
  
  console.log('✅ All production tests passed!');
}
```

---

## 📈 **Performance Optimization**

### 1. Database Indexing
```sql
-- Performance indexes for usage tracking
CREATE INDEX CONCURRENTLY idx_usage_tracking_org_date 
  ON usage_tracking(organization_id, usage_date DESC);

CREATE INDEX CONCURRENTLY idx_usage_quotas_org_period 
  ON usage_quotas(organization_id, period_start, period_end);

CREATE INDEX CONCURRENTLY idx_billing_events_org_type 
  ON billing_events(organization_id, event_type);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM usage_tracking 
WHERE organization_id = 'test' 
AND usage_date >= NOW() - INTERVAL '30 days';
```

### 2. Caching Strategy
```typescript
// utils/cache.ts
export class CacheManager {
  static usageStatsCache = new Map();

  static async getUsageStats(organizationId: string) {
    const cacheKey = `usage_${organizationId}`;
    const cached = this.usageStatsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }
    
    const stats = await UsageTrackingService.getUsageStatistics(organizationId);
    this.usageStatsCache.set(cacheKey, {
      data: stats,
      timestamp: Date.now()
    });
    
    return stats;
  }
}
```

### 3. API Response Optimization
```typescript
// api/usage/[orgId].ts
export default async function handler(req: Request) {
  const { orgId } = req.params;
  
  // Enable response compression
  const stats = await CacheManager.getUsageStats(orgId);
  
  return Response.json(stats, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Content-Encoding': 'gzip'
    }
  });
}
```

---

## 🚨 **Troubleshooting**

### Common Deployment Issues

#### 1. Database Connection Issues
```bash
# Test database connection
npx supabase status
npx supabase db ping

# Check migration status
npx supabase migration list --local=false
```

#### 2. Environment Variables Missing
```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

#### 3. Build Failures
```bash
# Check build logs
vercel logs your-deployment-url

# Local build test
npm run build
npm run preview
```

#### 4. API Errors
```bash
# Check API logs
vercel logs --follow

# Test API endpoints
curl -v https://your-app.vercel.app/api/health
```

### Performance Issues

#### 1. Slow Database Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename = 'usage_tracking';
```

#### 2. High Memory Usage
```typescript
// Monitor memory usage
process.on('beforeExit', () => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
  });
});
```

---

## ✅ **Post-Deployment Checklist**

### Immediate (Day 1)
- [ ] Health checks passing
- [ ] All API endpoints responding
- [ ] Database connections stable
- [ ] Usage tracking working
- [ ] Dashboard loading correctly
- [ ] Error monitoring active

### Short-term (Week 1)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Validate usage calculations
- [ ] Test quota enforcement
- [ ] Monitor billing integration
- [ ] Check email notifications

### Long-term (Month 1)
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan feature improvements
- [ ] Monitor costs vs revenue

---

## 📞 **Support & Maintenance**

### Monitoring Tools
- **Uptime**: Use UptimeRobot or similar
- **Performance**: Vercel Analytics
- **Errors**: Sentry
- **Database**: Supabase Dashboard
- **Logs**: Vercel Logs

### Maintenance Schedule
- **Daily**: Check error rates and performance
- **Weekly**: Review usage trends and costs
- **Monthly**: Database maintenance and optimization
- **Quarterly**: Security audit and dependency updates

### Emergency Contacts
- **Database Issues**: Supabase Support
- **Deployment Issues**: Vercel Support  
- **API Issues**: Check internal logs first
- **Billing Issues**: Stripe Dashboard

---

**🎉 Il sistema Guardian AI CRM con Usage Tracking è ora completamente deployato e operativo in produzione!**