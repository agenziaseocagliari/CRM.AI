-- =====================================================
-- Phase 3: System Health Monitoring Infrastructure
-- =====================================================
-- Description: Comprehensive monitoring, metrics, and alerting system
-- Impact: Real-time observability and proactive issue detection
-- Date: 2025-01-23
-- Version: 1.0

-- =====================================================
-- 1. System Metrics Table
-- =====================================================

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- 'ms', 'count', 'percent', 'bytes', etc.
  metric_type TEXT NOT NULL, -- 'gauge', 'counter', 'histogram'
  tags JSONB DEFAULT '{}', -- Additional context (service, endpoint, etc.)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexing for time-series queries
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('gauge', 'counter', 'histogram'))
);

CREATE INDEX idx_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_metrics_org_time ON system_metrics(organization_id, recorded_at DESC) 
  WHERE organization_id IS NOT NULL;
CREATE INDEX idx_metrics_tags ON system_metrics USING GIN(tags);

-- Partition by time for better performance (optional, for high volume)
-- Would be implemented if metrics volume exceeds 10M records

-- =====================================================
-- 2. System Health Checks
-- =====================================================

CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'database', 'api', 'integration', 'edge_function'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'down'))
);

CREATE INDEX idx_health_checks_time ON system_health_checks(checked_at DESC);
CREATE INDEX idx_health_checks_status ON system_health_checks(status, checked_at DESC)
  WHERE status != 'healthy';

-- =====================================================
-- 3. Alert Rules and Triggers
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  metric_name TEXT NOT NULL,
  condition TEXT NOT NULL, -- 'greater_than', 'less_than', 'equal', 'not_equal'
  threshold NUMERIC NOT NULL,
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  evaluation_window_minutes INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 15, -- Prevent alert spam
  is_active BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['system'], -- 'email', 'slack', 'webhook', 'system'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_condition CHECK (condition IN ('greater_than', 'less_than', 'equal', 'not_equal'))
);

CREATE INDEX idx_alert_rules_active ON alert_rules(is_active, metric_name)
  WHERE is_active = true;

-- =====================================================
-- 4. Alert History
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  alert_message TEXT NOT NULL,
  severity TEXT NOT NULL,
  metric_value NUMERIC,
  threshold NUMERIC,
  status TEXT DEFAULT 'triggered', -- 'triggered', 'acknowledged', 'resolved'
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_alert_status CHECK (status IN ('triggered', 'acknowledged', 'resolved'))
);

CREATE INDEX idx_alert_history_time ON alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_unresolved ON alert_history(status, triggered_at DESC)
  WHERE status != 'resolved';
CREATE INDEX idx_alert_history_rule ON alert_history(alert_rule_id, triggered_at DESC);

-- =====================================================
-- 5. Performance Monitoring Views
-- =====================================================

-- Real-time system health overview
CREATE OR REPLACE VIEW v_system_health_overview AS
SELECT
  check_type,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE status = 'healthy') as healthy_count,
  COUNT(*) FILTER (WHERE status = 'degraded') as degraded_count,
  COUNT(*) FILTER (WHERE status = 'down') as down_count,
  AVG(response_time_ms) as avg_response_time_ms,
  MAX(checked_at) as last_check_time
FROM system_health_checks
WHERE checked_at > NOW() - INTERVAL '1 hour'
GROUP BY check_type;

-- Recent alerts summary
CREATE OR REPLACE VIEW v_recent_alerts AS
SELECT
  ar.rule_name,
  ar.severity,
  ah.alert_message,
  ah.status,
  ah.triggered_at,
  ah.acknowledged_at,
  ah.resolved_at,
  EXTRACT(EPOCH FROM (COALESCE(ah.resolved_at, NOW()) - ah.triggered_at)) / 60 as duration_minutes
FROM alert_history ah
JOIN alert_rules ar ON ah.alert_rule_id = ar.id
WHERE ah.triggered_at > NOW() - INTERVAL '24 hours'
ORDER BY ah.triggered_at DESC;

-- Metric trends (hourly aggregates)
CREATE OR REPLACE VIEW v_metric_trends_hourly AS
SELECT
  metric_name,
  date_trunc('hour', recorded_at) as hour,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as sample_count,
  metric_unit
FROM system_metrics
WHERE recorded_at > NOW() - INTERVAL '7 days'
GROUP BY metric_name, date_trunc('hour', recorded_at), metric_unit
ORDER BY hour DESC, metric_name;

-- =====================================================
-- 6. Monitoring Functions
-- =====================================================

-- Record a system metric
CREATE OR REPLACE FUNCTION record_metric(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT NULL,
  p_metric_type TEXT DEFAULT 'gauge',
  p_tags JSONB DEFAULT '{}',
  p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_name,
    metric_value,
    metric_unit,
    metric_type,
    tags,
    organization_id
  ) VALUES (
    p_metric_name,
    p_metric_value,
    p_metric_unit,
    p_metric_type,
    p_tags,
    p_organization_id
  ) RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record health check result
CREATE OR REPLACE FUNCTION record_health_check(
  p_check_name TEXT,
  p_check_type TEXT,
  p_status TEXT,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_check_id UUID;
BEGIN
  INSERT INTO system_health_checks (
    check_name,
    check_type,
    status,
    response_time_ms,
    error_message,
    details
  ) VALUES (
    p_check_name,
    p_check_type,
    p_status,
    p_response_time_ms,
    p_error_message,
    p_details
  ) RETURNING id INTO v_check_id;
  
  RETURN v_check_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Evaluate alert rules
CREATE OR REPLACE FUNCTION evaluate_alert_rules()
RETURNS TABLE(
  rule_id UUID,
  rule_name TEXT,
  should_trigger BOOLEAN,
  current_value NUMERIC,
  threshold NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_metrics AS (
    SELECT DISTINCT ON (metric_name)
      metric_name,
      metric_value,
      recorded_at
    FROM system_metrics
    WHERE recorded_at > NOW() - INTERVAL '10 minutes'
    ORDER BY metric_name, recorded_at DESC
  ),
  last_alerts AS (
    SELECT DISTINCT ON (alert_rule_id)
      alert_rule_id,
      triggered_at
    FROM alert_history
    WHERE status != 'resolved'
    ORDER BY alert_rule_id, triggered_at DESC
  )
  SELECT
    ar.id as rule_id,
    ar.rule_name,
    CASE ar.condition
      WHEN 'greater_than' THEN rm.metric_value > ar.threshold
      WHEN 'less_than' THEN rm.metric_value < ar.threshold
      WHEN 'equal' THEN rm.metric_value = ar.threshold
      WHEN 'not_equal' THEN rm.metric_value != ar.threshold
    END as should_trigger,
    rm.metric_value as current_value,
    ar.threshold
  FROM alert_rules ar
  JOIN recent_metrics rm ON ar.metric_name = rm.metric_name
  LEFT JOIN last_alerts la ON ar.id = la.alert_rule_id
  WHERE ar.is_active = true
    AND (
      la.triggered_at IS NULL 
      OR la.triggered_at < NOW() - (ar.cooldown_minutes || ' minutes')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger an alert
CREATE OR REPLACE FUNCTION trigger_alert(
  p_alert_rule_id UUID,
  p_metric_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_alert_id UUID;
  v_message TEXT;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule FROM alert_rules WHERE id = p_alert_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert rule not found: %', p_alert_rule_id;
  END IF;
  
  -- Build alert message
  v_message := format(
    '%s: %s is %s (current: %s, threshold: %s)',
    v_rule.severity,
    v_rule.rule_name,
    v_rule.condition,
    p_metric_value,
    v_rule.threshold
  );
  
  -- Create alert
  INSERT INTO alert_history (
    alert_rule_id,
    alert_message,
    severity,
    metric_value,
    threshold,
    metadata
  ) VALUES (
    p_alert_rule_id,
    v_message,
    v_rule.severity,
    p_metric_value,
    v_rule.threshold,
    p_metadata
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Acknowledge alert
CREATE OR REPLACE FUNCTION acknowledge_alert(
  p_alert_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE alert_history
  SET 
    status = 'acknowledged',
    acknowledged_by = p_user_id,
    acknowledged_at = NOW()
  WHERE id = p_alert_id
    AND status = 'triggered';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve alert
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE alert_history
  SET 
    status = 'resolved',
    resolved_at = NOW()
  WHERE id = p_alert_id
    AND status IN ('triggered', 'acknowledged');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Default Alert Rules
-- =====================================================

-- High response time alert
INSERT INTO alert_rules (
  rule_name,
  description,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'high_response_time',
  'Alert when average response time exceeds 2000ms',
  'api_response_time_ms',
  'greater_than',
  2000,
  'warning',
  5,
  ARRAY['system']
) ON CONFLICT (rule_name) DO NOTHING;

-- Critical response time alert
INSERT INTO alert_rules (
  rule_name,
  description,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'critical_response_time',
  'Alert when average response time exceeds 5000ms',
  'api_response_time_ms',
  'greater_than',
  5000,
  'critical',
  5,
  ARRAY['system', 'email']
) ON CONFLICT (rule_name) DO NOTHING;

-- High error rate alert
INSERT INTO alert_rules (
  rule_name,
  description,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'high_error_rate',
  'Alert when error rate exceeds 5%',
  'error_rate_percent',
  'greater_than',
  5,
  'warning',
  5,
  ARRAY['system']
) ON CONFLICT (rule_name) DO NOTHING;

-- Database connection pool warning
INSERT INTO alert_rules (
  rule_name,
  description,
  metric_name,
  condition,
  threshold,
  severity,
  evaluation_window_minutes,
  notification_channels
) VALUES (
  'db_connection_pool_high',
  'Alert when database connection pool usage exceeds 80%',
  'db_connection_pool_percent',
  'greater_than',
  80,
  'warning',
  5,
  ARRAY['system']
) ON CONFLICT (rule_name) DO NOTHING;

-- =====================================================
-- 8. Row Level Security Policies
-- =====================================================

-- System metrics: Super admins can see all, users see their org only
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_metrics_superadmin"
ON system_metrics
FOR ALL
TO public
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

CREATE POLICY "system_metrics_org_users"
ON system_metrics
FOR SELECT
TO public
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Health checks: Super admins only
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_checks_superadmin_only"
ON system_health_checks
FOR ALL
TO public
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

-- Alert rules: Super admins only
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_rules_superadmin_only"
ON alert_rules
FOR ALL
TO public
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

-- Alert history: Super admins can see all, users can see acknowledged alerts
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_history_superadmin"
ON alert_history
FOR ALL
TO public
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

CREATE POLICY "alert_history_acknowledged_user"
ON alert_history
FOR SELECT
TO public
USING (
  acknowledged_by = auth.uid()
);

-- =====================================================
-- 9. Cleanup Functions
-- =====================================================

-- Clean up old metrics (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM system_metrics
  WHERE recorded_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old health checks (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM system_health_checks
  WHERE checked_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up resolved alerts (keep 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM alert_history
  WHERE status = 'resolved'
    AND resolved_at < NOW() - INTERVAL '180 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE system_metrics IS 
  'Stores time-series metrics for system monitoring and performance analysis';

COMMENT ON TABLE system_health_checks IS 
  'Records health check results for various system components';

COMMENT ON TABLE alert_rules IS 
  'Defines threshold-based alert rules for proactive monitoring';

COMMENT ON TABLE alert_history IS 
  'Tracks triggered alerts and their lifecycle (triggered → acknowledged → resolved)';

COMMENT ON FUNCTION record_metric IS 
  'Records a system metric with optional tags and organization context';

COMMENT ON FUNCTION evaluate_alert_rules IS 
  'Evaluates all active alert rules against recent metrics';

COMMENT ON FUNCTION trigger_alert IS 
  'Creates a new alert in the alert history';
