-- ===================================================================
-- GUARDIAN AI CRM - USAGE TRACKING & BILLING SYSTEM
-- Migration: Sistema Crediti e Tracking Usage per Pricing Model
-- Data: 2025-10-04
-- ===================================================================

-- 1. SUBSCRIPTION TIERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
  display_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
  price_cents INTEGER NOT NULL, -- Prezzo in centesimi (2900 = €29.00)
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Limiti per tier
  ai_requests_limit INTEGER NOT NULL,
  whatsapp_messages_limit INTEGER NOT NULL,
  email_marketing_limit INTEGER NOT NULL,
  contacts_limit INTEGER NOT NULL,
  storage_limit_gb INTEGER NOT NULL,
  
  -- Features
  features JSONB DEFAULT '{}', -- {"super_admin": false, "advanced_ai": true}
  
  -- Pricing overage (oltre i limiti)
  ai_overage_cents INTEGER DEFAULT 1, -- €0.01 per richiesta extra
  whatsapp_overage_cents INTEGER DEFAULT 2, -- €0.02 per messaggio extra
  email_overage_cents INTEGER DEFAULT 0, -- €0.001 per email extra (0 centesimi, frazione)
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert optimized 5-tier structure (margini 80%+)
INSERT INTO subscription_tiers (name, display_name, price_cents, ai_requests_limit, whatsapp_messages_limit, email_marketing_limit, contacts_limit, storage_limit_gb, features) VALUES
('starter', 'Starter', 1900, 200, 150, 1000, 500, 5, '{"super_admin": false, "advanced_ai": false, "priority_support": false, "users_limit": 1}'),
('professional', 'Professional', 3900, 400, 300, 3000, 2000, 10, '{"super_admin": false, "advanced_ai": true, "priority_support": false, "automations": true, "users_limit": 3}'),
('business', 'Business', 7900, 800, 600, 8000, 5000, 25, '{"super_admin": false, "advanced_ai": true, "priority_support": true, "automations": true, "api_access": true, "users_limit": 10}'),
('premium', 'Premium', 14900, 1500, 1200, 20000, 15000, 50, '{"super_admin": false, "advanced_ai": true, "priority_support": true, "automations": true, "api_access": true, "advanced_analytics": true, "users_limit": 25}'),
('enterprise', 'Enterprise', -1, -1, -1, -1, -1, -1, '{"super_admin": true, "advanced_ai": true, "priority_support": true, "automations": true, "api_access": true, "advanced_analytics": true, "white_label": true, "custom_integrations": true, "dedicated_manager": true, "users_limit": -1, "custom_quote": true}')
ON CONFLICT (name) DO NOTHING;

-- 2. ORGANIZATION SUBSCRIPTIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'cancelled', 'suspended', 'past_due'
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Billing
  stripe_subscription_id TEXT, -- ID Stripe subscription
  stripe_customer_id TEXT, -- ID Stripe customer
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Custom limits (overrides tier defaults if set)
  custom_limits JSONB DEFAULT '{}', -- {"ai_requests_limit": 1000}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- 3. USAGE TRACKING TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Service tracking
  service_type TEXT NOT NULL, -- 'ai_request', 'whatsapp_message', 'email_marketing', 'storage'
  service_action TEXT, -- 'lead_scoring', 'email_generation', 'chatbot', 'campaign_send'
  
  -- Usage data
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Cost tracking
  cost_cents INTEGER NOT NULL DEFAULT 0, -- Costo effettivo del servizio
  billable_cents INTEGER NOT NULL DEFAULT 0, -- Costo addebitabile al cliente
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- {"model": "gemini-2.5-flash", "tokens": 1500}
  
  -- References
  contact_id UUID REFERENCES contacts(id), -- Se applicabile
  automation_id UUID, -- Se parte di un'automazione
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes per performance
  INDEX idx_usage_org_date (organization_id, usage_date),
  INDEX idx_usage_service_type (service_type),
  INDEX idx_usage_date (usage_date)
);

-- 4. USAGE QUOTAS TABLE (Current period tracking)
-- ===================================================================
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Current usage counters
  ai_requests_used INTEGER DEFAULT 0,
  whatsapp_messages_used INTEGER DEFAULT 0,
  email_marketing_used INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  
  -- Overage tracking
  ai_overage INTEGER DEFAULT 0,
  whatsapp_overage INTEGER DEFAULT 0,
  email_overage INTEGER DEFAULT 0,
  
  -- Alert flags
  ai_alert_80_sent BOOLEAN DEFAULT FALSE,
  ai_alert_90_sent BOOLEAN DEFAULT FALSE,
  whatsapp_alert_80_sent BOOLEAN DEFAULT FALSE,
  whatsapp_alert_90_sent BOOLEAN DEFAULT FALSE,
  email_alert_80_sent BOOLEAN DEFAULT FALSE,
  email_alert_90_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start)
);

-- 5. BILLING EVENTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Event data
  event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'quota_exceeded', 'overage_charged'
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- References
  stripe_event_id TEXT, -- ID evento Stripe
  subscription_id UUID REFERENCES organization_subscriptions(id),
  
  -- Event metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_organization_subscriptions_updated_at ON organization_subscriptions;

CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_usage_quotas_updated_at ON usage_quotas;

CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON usage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize quota for new subscriptions
CREATE OR REPLACE FUNCTION initialize_usage_quota()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_quotas (
        organization_id,
        period_start,
        period_end
    ) VALUES (
        NEW.organization_id,
        NEW.current_period_start,
        NEW.current_period_end
    )
    ON CONFLICT (organization_id, period_start) DO NOTHING;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS init_quota_on_subscription ON organization_subscriptions;

CREATE TRIGGER init_quota_on_subscription AFTER INSERT ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION initialize_usage_quota();

-- ===================================================================
-- UTILITY VIEWS
-- ===================================================================

-- View for current organization usage with limits
CREATE VIEW organization_usage_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    st.name as tier_name,
    st.display_name as tier_display_name,
    st.price_cents,
    
    -- Current limits
    CASE WHEN st.ai_requests_limit = -1 THEN 999999 ELSE st.ai_requests_limit END as ai_limit,
    CASE WHEN st.whatsapp_messages_limit = -1 THEN 999999 ELSE st.whatsapp_messages_limit END as whatsapp_limit,
    CASE WHEN st.email_marketing_limit = -1 THEN 999999 ELSE st.email_marketing_limit END as email_limit,
    
    -- Current usage
    COALESCE(uq.ai_requests_used, 0) as ai_used,
    COALESCE(uq.whatsapp_messages_used, 0) as whatsapp_used, 
    COALESCE(uq.email_marketing_used, 0) as email_used,
    
    -- Usage percentages
    CASE 
        WHEN st.ai_requests_limit = -1 THEN 0
        ELSE ROUND((COALESCE(uq.ai_requests_used, 0) * 100.0) / st.ai_requests_limit, 2)
    END as ai_usage_percent,
    
    CASE 
        WHEN st.whatsapp_messages_limit = -1 THEN 0
        ELSE ROUND((COALESCE(uq.whatsapp_messages_used, 0) * 100.0) / st.whatsapp_messages_limit, 2) 
    END as whatsapp_usage_percent,
    
    CASE 
        WHEN st.email_marketing_limit = -1 THEN 0
        ELSE ROUND((COALESCE(uq.email_marketing_used, 0) * 100.0) / st.email_marketing_limit, 2)
    END as email_usage_percent,
    
    -- Subscription info
    os.status as subscription_status,
    os.current_period_end,
    
    -- Alert status
    uq.ai_alert_80_sent,
    uq.ai_alert_90_sent,
    uq.whatsapp_alert_80_sent,
    uq.whatsapp_alert_90_sent,
    uq.email_alert_80_sent,
    uq.email_alert_90_sent

FROM organizations o
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
LEFT JOIN subscription_tiers st ON os.subscription_tier_id = st.id
LEFT JOIN usage_quotas uq ON o.id = uq.organization_id 
    AND uq.period_start <= NOW() 
    AND uq.period_end > NOW()
WHERE o.deleted_at IS NULL;

-- ===================================================================
-- SECURITY & RLS POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_tiers (read-only for all users)
DROP POLICY IF EXISTS "subscription_tiers_read" ON subscription_tiers;CREATE POLICY "subscription_tiers_read" ON subscription_tiers FOR SELECT TO public USING (is_active = true);

-- Policies for organization data (users can only see their org data)
DROP POLICY IF EXISTS "org_subscriptions_policy" ON organization_subscriptions;CREATE POLICY "org_subscriptions_policy" ON organization_subscriptions FOR ALL TO public 
USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "usage_tracking_policy" ON usage_tracking;

CREATE POLICY "usage_tracking_policy" ON usage_tracking FOR ALL TO public 
USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "usage_quotas_policy" ON usage_quotas;

CREATE POLICY "usage_quotas_policy" ON usage_quotas FOR ALL TO public 
USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "billing_events_policy" ON billing_events;

CREATE POLICY "billing_events_policy" ON billing_events FOR ALL TO public 
USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

-- Super admin can see all data
DROP POLICY IF EXISTS "super_admin_all_access" ON organization_subscriptions;CREATE POLICY "super_admin_all_access" ON organization_subscriptions FOR ALL TO public 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "super_admin_usage_access" ON usage_tracking;

CREATE POLICY "super_admin_usage_access" ON usage_tracking FOR ALL TO public 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "super_admin_quota_access" ON usage_quotas;

CREATE POLICY "super_admin_quota_access" ON usage_quotas FOR ALL TO public 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "super_admin_billing_access" ON billing_events;

CREATE POLICY "super_admin_billing_access" ON billing_events FOR ALL TO public 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- ===================================================================
-- INITIAL DATA & INDEXES
-- ===================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_service ON usage_tracking(organization_id, service_type);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_org_period ON usage_quotas(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id);

-- Note: Permissions managed by Supabase RLS policies

COMMENT ON TABLE subscription_tiers IS 'Definizione dei tier di abbonamento con limiti e prezzi';
COMMENT ON TABLE organization_subscriptions IS 'Abbonamenti attivi delle organizzazioni';
COMMENT ON TABLE usage_tracking IS 'Tracking dettagliato dell''utilizzo dei servizi';
COMMENT ON TABLE usage_quotas IS 'Quote di utilizzo per periodo corrente';
COMMENT ON TABLE billing_events IS 'Eventi di fatturazione e pagamento';