# 🔍 Monitoring & Observability Guide - Guardian AI CRM

**Version**: 1.0  
**Date**: January 2025  
**Status**: Production Ready

---

## 📋 Executive Summary

This guide provides comprehensive strategies for implementing observability, monitoring, and alerting across the Guardian AI CRM platform to ensure 99.99% uptime and proactive issue detection.

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────┐
│                  Observability Layer                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Metrics  │  │  Logs    │  │ Traces   │  │ Alerts  ││
│  │Collection│  │Aggregation│  │Distribution│ │ Engine  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Database   │  │ Edge         │  │  Frontend    │  │ Integrations │
│   Metrics    │  │ Functions    │  │   Metrics    │  │   Metrics    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 Monitoring Objectives

### 1. Four Golden Signals

#### Latency
**Definition**: Time taken to service a request  
**Target**: p50 < 200ms, p95 < 500ms, p99 < 1000ms

**Metrics to Track**:
```typescript
interface LatencyMetrics {
  api_response_time_ms: number;
  database_query_time_ms: number;
  edge_function_execution_ms: number;
  external_api_call_ms: number;
  frontend_render_time_ms: number;
}
```

#### Traffic
**Definition**: Demand on the system  
**Target**: Handle 1000 req/min sustained, 5000 req/min peak

**Metrics to Track**:
```typescript
interface TrafficMetrics {
  requests_per_minute: number;
  active_users: number;
  concurrent_workflows: number;
  api_calls_per_endpoint: Record<string, number>;
}
```

#### Errors
**Definition**: Rate of requests that fail  
**Target**: Error rate < 1%, zero critical errors

**Metrics to Track**:
```typescript
interface ErrorMetrics {
  error_rate_percent: number;
  errors_by_type: Record<string, number>;
  errors_by_endpoint: Record<string, number>;
  critical_errors: number;
}
```

#### Saturation
**Definition**: How "full" the service is  
**Target**: CPU < 70%, Memory < 80%, DB connections < 80%

**Metrics to Track**:
```typescript
interface SaturationMetrics {
  cpu_usage_percent: number;
  memory_usage_percent: number;
  db_connection_pool_percent: number;
  disk_usage_percent: number;
  network_bandwidth_percent: number;
}
```

---

## 📊 Metrics Collection

### Database Metrics

**Collection Function** (Edge Function):

```typescript
// supabase/functions/collect-database-metrics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

interface DatabaseMetrics {
  connection_pool: {
    active: number;
    idle: number;
    waiting: number;
    max: number;
  };
  query_performance: {
    slow_queries_count: number;
    avg_query_time_ms: number;
    total_queries: number;
  };
  storage: {
    total_size_mb: number;
    table_sizes: Record<string, number>;
  };
}

async function collectDatabaseMetrics(): Promise<DatabaseMetrics> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get connection pool stats
  const { data: poolStats } = await supabase
    .rpc('get_connection_pool_stats');

  // Get slow queries
  const { data: slowQueries } = await supabase
    .rpc('get_slow_queries', { threshold_ms: 1000 });

  // Get table sizes
  const { data: tableSizes } = await supabase
    .from('v_table_stats')
    .select('*');

  // Record metrics
  await supabase.rpc('record_metric', {
    p_metric_name: 'db_active_connections',
    p_metric_value: poolStats.active,
    p_metric_type: 'gauge',
  });

  return {
    connection_pool: poolStats,
    query_performance: {
      slow_queries_count: slowQueries?.length || 0,
      avg_query_time_ms: calculateAvgQueryTime(slowQueries),
      total_queries: poolStats.total_queries,
    },
    storage: {
      total_size_mb: calculateTotalSize(tableSizes),
      table_sizes: formatTableSizes(tableSizes),
    },
  };
}

serve(async (req) => {
  try {
    const metrics = await collectDatabaseMetrics();
    return new Response(JSON.stringify(metrics), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### Edge Function Metrics

**Instrumentation Wrapper**:

```typescript
// supabase/functions/_shared/instrumentation.ts
import { createClient } from '@supabase/supabase-js';

export function withMetrics<T>(
  functionName: string,
  handler: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  return handler()
    .then((result) => {
      const duration = Date.now() - startTime;

      // Record success metric
      supabase.rpc('record_metric', {
        p_metric_name: 'edge_function_duration_ms',
        p_metric_value: duration,
        p_metric_type: 'histogram',
        p_tags: { function: functionName, status: 'success' },
      });

      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;

      // Record error metric
      supabase.rpc('record_metric', {
        p_metric_name: 'edge_function_duration_ms',
        p_metric_value: duration,
        p_metric_type: 'histogram',
        p_tags: { function: functionName, status: 'error' },
      });

      // Record error
      supabase.rpc('record_metric', {
        p_metric_name: 'edge_function_errors',
        p_metric_value: 1,
        p_metric_type: 'counter',
        p_tags: { function: functionName, error: error.name },
      });

      throw error;
    });
}

// Usage example
export const handler = async (req: Request) => {
  return withMetrics('my-function', async () => {
    // Your function logic here
    return new Response('OK');
  });
};
```

### Frontend Metrics

**Web Vitals Collection**:

```typescript
// src/utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function initWebVitals() {
  const sendToAnalytics = async (metric: WebVitalsMetric) => {
    // Send to backend
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric_name: `web_vitals_${metric.name.toLowerCase()}`,
        metric_value: metric.value,
        metric_unit: 'ms',
        metric_type: 'histogram',
        tags: { rating: metric.rating },
      }),
    });
  };

  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Initialize in main app
// App.tsx
import { initWebVitals } from './utils/webVitals';

useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    initWebVitals();
  }
}, []);
```

**Performance Monitoring Hook**:

```typescript
// src/hooks/usePerformanceMonitoring.ts
import { useEffect } from 'react';

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      
      // Record component render time
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_name: 'component_render_time_ms',
          metric_value: duration,
          metric_type: 'histogram',
          tags: { component: componentName },
        }),
      });
    };
  }, [componentName]);
}

// Usage
export const MyComponent: React.FC = () => {
  usePerformanceMonitoring('MyComponent');
  
  return <div>Content</div>;
};
```

---

## 🚨 Alerting System

### Alert Rule Configuration

**Default Alert Rules** (already in migration):

```sql
-- High response time (Warning)
INSERT INTO alert_rules (
  rule_name,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'high_response_time',
  'api_response_time_ms',
  'greater_than',
  2000,
  'warning',
  5,
  ARRAY['system', 'email']
);

-- Critical response time
INSERT INTO alert_rules (
  rule_name,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'critical_response_time',
  'api_response_time_ms',
  'greater_than',
  5000,
  'critical',
  5,
  ARRAY['system', 'email', 'slack']
);
```

### Alert Evaluation Engine

**Edge Function** (`supabase/functions/evaluate-alerts/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Evaluate all active alert rules
  const { data: evaluations } = await supabase
    .rpc('evaluate_alert_rules');

  // Trigger alerts that should fire
  for (const evaluation of evaluations || []) {
    if (evaluation.should_trigger) {
      await supabase.rpc('trigger_alert', {
        p_alert_rule_id: evaluation.rule_id,
        p_metric_value: evaluation.current_value,
        p_metadata: {
          evaluation_time: new Date().toISOString(),
          threshold_breached: evaluation.threshold,
        },
      });

      // Send notifications
      await sendNotifications(evaluation);
    }
  }

  return new Response(JSON.stringify({ 
    evaluated: evaluations?.length || 0,
    triggered: evaluations?.filter(e => e.should_trigger).length || 0,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function sendNotifications(alert: any) {
  // Implementation for email, Slack, webhook notifications
  // Based on alert.notification_channels
}
```

### Alert Notification Templates

**Email Template**:

```typescript
interface AlertEmailData {
  ruleName: string;
  severity: 'info' | 'warning' | 'critical';
  metricValue: number;
  threshold: number;
  timestamp: Date;
}

function generateAlertEmail(data: AlertEmailData): string {
  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  };

  return `
    ${severityEmoji[data.severity]} Alert: ${data.ruleName}
    
    Severity: ${data.severity.toUpperCase()}
    Metric Value: ${data.metricValue}
    Threshold: ${data.threshold}
    Time: ${data.timestamp.toISOString()}
    
    Action Required:
    1. Check system health dashboard
    2. Review recent changes
    3. Investigate root cause
    4. Acknowledge alert when addressed
    
    View Details: https://app.guardian-ai-crm.com/admin/alerts
  `;
}
```

---

## 📈 Dashboards

### System Health Dashboard

**Component** (`src/components/monitoring/SystemHealthDashboard.tsx`):

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'down';
  components: {
    database: HealthStatus;
    edge_functions: HealthStatus;
    integrations: HealthStatus;
    frontend: HealthStatus;
  };
  metrics: {
    avg_response_time_ms: number;
    error_rate_percent: number;
    active_users: number;
    credits_consumed_24h: number;
  };
  alerts: Alert[];
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms?: number;
  last_check: Date;
}

export const SystemHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadSystemHealth() {
    try {
      const { data } = await supabase
        .rpc('get_system_health');
      setHealth(data);
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">System Health</h2>
        <div className={`text-4xl font-bold ${getStatusColor(health?.overall_status)}`}>
          {health?.overall_status.toUpperCase()}
        </div>
      </div>

      {/* Component Health */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(health?.components || {}).map(([name, status]) => (
          <div key={name} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">{name}</h3>
            <div className={`text-xl ${getStatusColor(status.status)}`}>
              {status.status}
            </div>
            {status.response_time_ms && (
              <div className="text-sm text-gray-600 mt-2">
                Response: {status.response_time_ms}ms
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Key Metrics (Last 24h)</h3>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Avg Response Time"
            value={`${health?.metrics.avg_response_time_ms}ms`}
            trend={calculateTrend('response_time')}
          />
          <MetricCard
            label="Error Rate"
            value={`${health?.metrics.error_rate_percent}%`}
            trend={calculateTrend('error_rate')}
          />
          <MetricCard
            label="Active Users"
            value={health?.metrics.active_users}
            trend={calculateTrend('active_users')}
          />
          <MetricCard
            label="Credits Consumed"
            value={health?.metrics.credits_consumed_24h}
            trend={calculateTrend('credits')}
          />
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Active Alerts</h3>
        {health?.alerts.length === 0 ? (
          <div className="text-green-600">No active alerts ✓</div>
        ) : (
          <div className="space-y-2">
            {health?.alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getStatusColor(status?: string): string {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'degraded': return 'text-yellow-600';
    case 'down': return 'text-red-600';
    default: return 'text-gray-600';
  }
}
```

### Metrics Dashboard

**Component** (`src/components/monitoring/MetricsDashboard.tsx`):

```typescript
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  async function loadMetrics() {
    const { data } = await supabase
      .from('v_metric_trends_hourly')
      .select('*')
      .gte('hour', getStartTime(timeRange))
      .order('hour', { ascending: true });

    setMetrics(data || []);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Metrics</h2>
        <div className="flex space-x-2">
          <button onClick={() => setTimeRange('1h')}>1 Hour</button>
          <button onClick={() => setTimeRange('24h')}>24 Hours</button>
          <button onClick={() => setTimeRange('7d')}>7 Days</button>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Response Time</h3>
        <LineChart width={800} height={300} data={getMetricData('api_response_time_ms')}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_value" stroke="#8884d8" name="Avg" />
          <Line type="monotone" dataKey="max_value" stroke="#ff0000" name="Max" />
        </LineChart>
      </div>

      {/* Error Rate Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Error Rate</h3>
        <LineChart width={800} height={300} data={getMetricData('error_rate_percent')}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_value" stroke="#ff7300" />
        </LineChart>
      </div>

      {/* Database Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Database Query Time</h3>
        <LineChart width={800} height={300} data={getMetricData('database_query_time_ms')}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_value" stroke="#00C49F" />
        </LineChart>
      </div>
    </div>
  );

  function getMetricData(metricName: string) {
    return metrics.filter(m => m.metric_name === metricName);
  }
};
```

---

## 🔧 Implementation Checklist

### Phase 1: Foundation (Week 1)

- [x] Create metrics collection infrastructure (SQL migration)
- [x] Setup alert rules and triggers
- [ ] Implement database metrics collection edge function
- [ ] Add frontend web vitals tracking

### Phase 2: Dashboards (Week 2)

- [ ] Build System Health Dashboard component
- [ ] Build Metrics Dashboard component
- [ ] Create Alert Management UI
- [ ] Add real-time updates via subscriptions

### Phase 3: Alerting (Week 3)

- [ ] Implement alert evaluation engine
- [ ] Setup email notifications
- [ ] Configure Slack integration
- [ ] Add webhook support for external systems

### Phase 4: Advanced Monitoring (Week 4)

- [ ] Implement distributed tracing (OpenTelemetry)
- [ ] Add custom business metrics
- [ ] Setup anomaly detection
- [ ] Create automated reports

---

## 📚 Best Practices

### Metric Naming Convention

```typescript
// Pattern: <component>_<metric>_<unit>
const metricNames = {
  // API metrics
  'api_response_time_ms': 'API response time in milliseconds',
  'api_request_count': 'Total API requests',
  'api_error_rate_percent': 'API error rate as percentage',
  
  // Database metrics
  'db_query_time_ms': 'Database query execution time',
  'db_connection_pool_percent': 'Database connection pool usage',
  'db_active_connections': 'Active database connections',
  
  // Business metrics
  'workflow_execution_count': 'Workflow executions',
  'workflow_success_rate_percent': 'Workflow success rate',
  'credits_consumed': 'Credits consumed',
};
```

### Alert Fatigue Prevention

1. **Use appropriate thresholds**: Don't alert on every anomaly
2. **Implement cooldown periods**: Prevent alert spam (15-30 min cooldown)
3. **Group related alerts**: Single alert for related issues
4. **Auto-resolve**: Automatically resolve alerts when condition clears
5. **Escalation policy**: Warning → Critical → Page on-call

### Dashboard Design Principles

1. **At-a-glance status**: Overall health visible immediately
2. **Drill-down capability**: Click for detailed views
3. **Time-based filtering**: 1h, 24h, 7d, 30d views
4. **Comparison views**: Current vs previous period
5. **Auto-refresh**: Update every 30-60 seconds

---

## 🎯 Success Criteria

### Monitoring Coverage

- [ ] 100% of API endpoints monitored
- [ ] 100% of edge functions instrumented
- [ ] All critical user flows traced
- [ ] Real-time alerts for all SLOs

### Response Times

- [ ] Alert notification < 1 minute
- [ ] Dashboard load time < 2 seconds
- [ ] Metrics collection overhead < 10ms

### Reliability

- [ ] 99.99% monitoring uptime
- [ ] Zero false positives in critical alerts
- [ ] 100% alert delivery rate

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: February 2025
