-- ===================================================================
-- GUARDIAN AI CRM - SUPABASE FUNCTIONS FOR USAGE TRACKING
-- File: supabase/migrations/create_usage_functions.sql
-- Funzioni necessarie per il sistema di usage tracking
-- ===================================================================

-- Function to increment usage quota
CREATE OR REPLACE FUNCTION increment_usage_quota(
  org_id UUID,
  field_name TEXT,
  increment_value INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update current period quota
  UPDATE usage_quotas 
  SET 
    updated_at = NOW(),
    ai_requests_used = CASE WHEN field_name = 'ai_requests_used' THEN ai_requests_used + increment_value ELSE ai_requests_used END,
    whatsapp_messages_used = CASE WHEN field_name = 'whatsapp_messages_used' THEN whatsapp_messages_used + increment_value ELSE whatsapp_messages_used END,
    email_marketing_used = CASE WHEN field_name = 'email_marketing_used' THEN email_marketing_used + increment_value ELSE email_marketing_used END
  WHERE organization_id = org_id
    AND period_start <= NOW() 
    AND period_end > NOW();
    
  -- If no current period found, create one
  IF NOT FOUND THEN
    -- Get current subscription to determine period
    INSERT INTO usage_quotas (
      organization_id,
      period_start,
      period_end,
      ai_requests_used,
      whatsapp_messages_used,
      email_marketing_used
    )
    SELECT 
      org_id,
      COALESCE(os.current_period_start, date_trunc('month', NOW())),
      COALESCE(os.current_period_end, date_trunc('month', NOW()) + INTERVAL '1 month'),
      CASE WHEN field_name = 'ai_requests_used' THEN increment_value ELSE 0 END,
      CASE WHEN field_name = 'whatsapp_messages_used' THEN increment_value ELSE 0 END,
      CASE WHEN field_name = 'email_marketing_used' THEN increment_value ELSE 0 END
    FROM organization_subscriptions os
    WHERE os.organization_id = org_id
    LIMIT 1;
    
    -- If still no subscription found, create with default monthly period
    IF NOT FOUND THEN
      INSERT INTO usage_quotas (
        organization_id,
        period_start,
        period_end,
        ai_requests_used,
        whatsapp_messages_used,
        email_marketing_used
      ) VALUES (
        org_id,
        date_trunc('month', NOW()),
        date_trunc('month', NOW()) + INTERVAL '1 month',
        CASE WHEN field_name = 'ai_requests_used' THEN increment_value ELSE 0 END,
        CASE WHEN field_name = 'whatsapp_messages_used' THEN increment_value ELSE 0 END,
        CASE WHEN field_name = 'email_marketing_used' THEN increment_value ELSE 0 END
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and get usage limits for organization
CREATE OR REPLACE FUNCTION get_usage_limits(org_id UUID)
RETURNS TABLE(
  ai_requests_limit INTEGER,
  whatsapp_messages_limit INTEGER,
  email_marketing_limit INTEGER,
  contacts_limit INTEGER,
  storage_limit_gb INTEGER,
  ai_overage_cents INTEGER,
  whatsapp_overage_cents INTEGER,
  email_overage_cents INTEGER,
  tier_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((os.custom_limits->>'ai_requests_limit')::INTEGER, st.ai_requests_limit) as ai_requests_limit,
    COALESCE((os.custom_limits->>'whatsapp_messages_limit')::INTEGER, st.whatsapp_messages_limit) as whatsapp_messages_limit,
    COALESCE((os.custom_limits->>'email_marketing_limit')::INTEGER, st.email_marketing_limit) as email_marketing_limit,
    COALESCE((os.custom_limits->>'contacts_limit')::INTEGER, st.contacts_limit) as contacts_limit,
    COALESCE((os.custom_limits->>'storage_limit_gb')::INTEGER, st.storage_limit_gb) as storage_limit_gb,
    st.ai_overage_cents,
    st.whatsapp_overage_cents,
    st.email_overage_cents,
    st.name as tier_name
  FROM organization_subscriptions os
  JOIN subscription_tiers st ON os.subscription_tier_id = st.id
  WHERE os.organization_id = org_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to reset quotas for new billing period
CREATE OR REPLACE FUNCTION reset_usage_quota(org_id UUID)
RETURNS VOID AS $$
DECLARE
  current_subscription RECORD;
BEGIN
  -- Get current subscription info
  SELECT current_period_start, current_period_end 
  INTO current_subscription
  FROM organization_subscriptions 
  WHERE organization_id = org_id;
  
  IF FOUND THEN
    -- Insert new quota period
    INSERT INTO usage_quotas (
      organization_id,
      period_start,
      period_end,
      ai_requests_used,
      whatsapp_messages_used,
      email_marketing_used,
      storage_used_gb
    ) VALUES (
      org_id,
      current_subscription.current_period_start,
      current_subscription.current_period_end,
      0, 0, 0, 0
    )
    ON CONFLICT (organization_id, period_start) 
    DO UPDATE SET
      ai_requests_used = 0,
      whatsapp_messages_used = 0,
      email_marketing_used = 0,
      storage_used_gb = 0,
      ai_alert_80_sent = FALSE,
      ai_alert_90_sent = FALSE,
      whatsapp_alert_80_sent = FALSE,
      whatsapp_alert_90_sent = FALSE,
      email_alert_80_sent = FALSE,
      email_alert_90_sent = FALSE,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate usage costs for period
CREATE OR REPLACE FUNCTION calculate_period_costs(org_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
  total_cost_cents INTEGER,
  ai_cost_cents INTEGER,
  whatsapp_cost_cents INTEGER,
  email_cost_cents INTEGER,
  overage_cost_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ut.billable_cents), 0)::INTEGER as total_cost_cents,
    COALESCE(SUM(CASE WHEN ut.service_type = 'ai_request' THEN ut.billable_cents ELSE 0 END), 0)::INTEGER as ai_cost_cents,
    COALESCE(SUM(CASE WHEN ut.service_type = 'whatsapp_message' THEN ut.billable_cents ELSE 0 END), 0)::INTEGER as whatsapp_cost_cents,
    COALESCE(SUM(CASE WHEN ut.service_type = 'email_marketing' THEN ut.billable_cents ELSE 0 END), 0)::INTEGER as email_cost_cents,
    -- Calculate overage costs separately
    COALESCE(SUM(CASE WHEN ut.billable_cents > ut.cost_cents THEN ut.billable_cents - ut.cost_cents ELSE 0 END), 0)::INTEGER as overage_cost_cents
  FROM usage_tracking ut
  WHERE ut.organization_id = org_id
    AND ut.usage_date >= start_date
    AND ut.usage_date <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get usage summary for organization
CREATE OR REPLACE FUNCTION get_usage_summary(org_id UUID)
RETURNS TABLE(
  organization_name TEXT,
  tier_name TEXT,
  tier_display_name TEXT,
  price_cents INTEGER,
  ai_limit INTEGER,
  ai_used INTEGER,
  ai_percentage NUMERIC,
  whatsapp_limit INTEGER,
  whatsapp_used INTEGER,
  whatsapp_percentage NUMERIC,
  email_limit INTEGER,
  email_used INTEGER,
  email_percentage NUMERIC,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name as organization_name,
    st.name as tier_name,
    st.display_name as tier_display_name,
    st.price_cents,
    -- Limits (convert -1 to 999999 for unlimited)
    CASE WHEN st.ai_requests_limit = -1 THEN 999999 ELSE st.ai_requests_limit END as ai_limit,
    COALESCE(uq.ai_requests_used, 0) as ai_used,
    CASE 
      WHEN st.ai_requests_limit = -1 THEN 0
      ELSE ROUND((COALESCE(uq.ai_requests_used, 0) * 100.0) / st.ai_requests_limit, 2)
    END as ai_percentage,
    
    CASE WHEN st.whatsapp_messages_limit = -1 THEN 999999 ELSE st.whatsapp_messages_limit END as whatsapp_limit,
    COALESCE(uq.whatsapp_messages_used, 0) as whatsapp_used,
    CASE 
      WHEN st.whatsapp_messages_limit = -1 THEN 0
      ELSE ROUND((COALESCE(uq.whatsapp_messages_used, 0) * 100.0) / st.whatsapp_messages_limit, 2)
    END as whatsapp_percentage,
    
    CASE WHEN st.email_marketing_limit = -1 THEN 999999 ELSE st.email_marketing_limit END as email_limit,
    COALESCE(uq.email_marketing_used, 0) as email_used,
    CASE 
      WHEN st.email_marketing_limit = -1 THEN 0
      ELSE ROUND((COALESCE(uq.email_marketing_used, 0) * 100.0) / st.email_marketing_limit, 2)
    END as email_percentage,
    
    -- Period info
    os.current_period_start as period_start,
    os.current_period_end as period_end,
    GREATEST(0, EXTRACT(days FROM (os.current_period_end - NOW()))::INTEGER) as days_remaining,
    os.status as subscription_status
    
  FROM organizations o
  LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
  LEFT JOIN subscription_tiers st ON os.subscription_tier_id = st.id
  LEFT JOIN usage_quotas uq ON o.id = uq.organization_id 
    AND uq.period_start <= NOW() 
    AND uq.period_end > NOW()
  WHERE o.id = org_id
    AND o.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create billing event
CREATE OR REPLACE FUNCTION create_billing_event(
  org_id UUID,
  event_type_param TEXT,
  amount_cents_param INTEGER,
  metadata_param JSONB DEFAULT '{}',
  stripe_event_id_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO billing_events (
    organization_id,
    event_type,
    amount_cents,
    currency,
    stripe_event_id,
    metadata
  ) VALUES (
    org_id,
    event_type_param,
    amount_cents_param,
    'EUR',
    stripe_event_id_param,
    metadata_param
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Note: Function permissions managed by Supabase RLS policies

-- Comments for documentation
COMMENT ON FUNCTION increment_usage_quota IS 'Incrementa il contatore di utilizzo per un servizio specifico';
COMMENT ON FUNCTION get_usage_limits IS 'Restituisce i limiti di utilizzo per una organizzazione';
COMMENT ON FUNCTION reset_usage_quota IS 'Resetta le quote di utilizzo per un nuovo periodo di fatturazione';
COMMENT ON FUNCTION calculate_period_costs IS 'Calcola i costi per un periodo specifico';
COMMENT ON FUNCTION get_usage_summary IS 'Restituisce un riepilogo completo dell''utilizzo per una organizzazione';
COMMENT ON FUNCTION create_billing_event IS 'Crea un evento di fatturazione';