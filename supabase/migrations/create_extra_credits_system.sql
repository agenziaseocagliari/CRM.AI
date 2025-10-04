-- ===================================================================
-- GUARDIAN AI CRM - EXTRA CREDITS SYSTEM
-- Migration: Sistema Acquisto Crediti Extra per Revenue Aggiuntivo
-- Data: 2025-10-04
-- ===================================================================

-- 1. EXTRA CREDITS PACKAGES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS extra_credits_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'ai_100', 'whatsapp_500', 'email_5000'
  display_name TEXT NOT NULL, -- 'AI Credits Pack 100', 'WhatsApp Pack 500'
  credit_type TEXT NOT NULL CHECK (credit_type IN ('ai', 'whatsapp', 'email')),
  credits_amount INTEGER NOT NULL, -- Quantità di crediti nel pacchetto
  price_cents INTEGER NOT NULL, -- Prezzo in centesimi
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Margine tracking (per analytics)
  cost_cents INTEGER DEFAULT 0, -- Costo nostro per questo pacchetto
  margin_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN price_cents > 0 AND cost_cents >= 0 
      THEN ((price_cents - cost_cents)::decimal / price_cents * 100)
      ELSE 0
    END
  ) STORED,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert extra credits packages (margini 80%+)
INSERT INTO extra_credits_packages (name, display_name, credit_type, credits_amount, price_cents, cost_cents) VALUES
-- AI Credits Packages
('ai_100', '100 AI Credits', 'ai', 100, 800, 120, TRUE), -- €8, costo €1.20, margine 85%
('ai_500', '500 AI Credits', 'ai', 500, 3500, 600, TRUE), -- €35, costo €6, margine 83%
('ai_1000', '1000 AI Credits', 'ai', 1000, 6500, 1200, TRUE), -- €65, costo €12, margine 82%

-- WhatsApp Credits Packages  
('whatsapp_100', '100 WhatsApp Credits', 'whatsapp', 100, 500, 70, TRUE), -- €5, costo €0.70, margine 86%
('whatsapp_500', '500 WhatsApp Credits', 'whatsapp', 500, 2000, 350, TRUE), -- €20, costo €3.50, margine 83%
('whatsapp_1000', '1000 WhatsApp Credits', 'whatsapp', 1000, 3500, 700, TRUE), -- €35, costo €7, margine 80%

-- Email Credits Packages
('email_5000', '5,000 Email Credits', 'email', 5000, 1000, 200, TRUE), -- €10, costo €2, margine 80%
('email_10000', '10,000 Email Credits', 'email', 10000, 1800, 400, TRUE), -- €18, costo €4, margine 78%
('email_25000', '25,000 Email Credits', 'email', 25000, 4000, 1000, TRUE) -- €40, costo €10, margine 75%
ON CONFLICT (name) DO NOTHING;

-- 2. ORGANIZATION EXTRA CREDITS PURCHASES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS organization_extra_credits_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  extra_credits_package_id UUID NOT NULL REFERENCES extra_credits_packages(id),
  
  -- Purchase details
  credits_amount INTEGER NOT NULL, -- Crediti acquistati
  credit_type TEXT NOT NULL CHECK (credit_type IN ('ai', 'whatsapp', 'email')),
  price_paid_cents INTEGER NOT NULL, -- Prezzo pagato
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  credits_consumed INTEGER DEFAULT 0, -- Crediti già utilizzati
  credits_remaining INTEGER GENERATED ALWAYS AS (credits_amount - credits_consumed) STORED,
  
  -- Scadenza crediti (12 mesi dalla data acquisto)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months'),
  
  -- Metadata
  purchase_metadata JSONB DEFAULT '{}', -- Dati aggiuntivi per tracking
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORGANIZATION CREDITS BALANCE VIEW
-- ===================================================================
-- Vista aggregata per crediti disponibili per organizzazione
CREATE OR REPLACE VIEW organization_credits_balance AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  
  -- Crediti inclusi nell'abbonamento
  st.ai_requests_limit as subscription_ai_limit,
  st.whatsapp_messages_limit as subscription_whatsapp_limit,
  st.email_marketing_limit as subscription_email_limit,
  
  -- Crediti extra acquistati e disponibili (non scaduti)
  COALESCE(SUM(CASE WHEN ecp.credit_type = 'ai' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0) as extra_ai_credits,
  COALESCE(SUM(CASE WHEN ecp.credit_type = 'whatsapp' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0) as extra_whatsapp_credits,
  COALESCE(SUM(CASE WHEN ecp.credit_type = 'email' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0) as extra_email_credits,
  
  -- Totali disponibili
  CASE 
    WHEN st.ai_requests_limit = -1 THEN -1 -- Unlimited
    ELSE st.ai_requests_limit + COALESCE(SUM(CASE WHEN ecp.credit_type = 'ai' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0)
  END as total_ai_credits_available,
  
  CASE 
    WHEN st.whatsapp_messages_limit = -1 THEN -1 -- Unlimited
    ELSE st.whatsapp_messages_limit + COALESCE(SUM(CASE WHEN ecp.credit_type = 'whatsapp' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0)
  END as total_whatsapp_credits_available,
  
  CASE 
    WHEN st.email_marketing_limit = -1 THEN -1 -- Unlimited  
    ELSE st.email_marketing_limit + COALESCE(SUM(CASE WHEN ecp.credit_type = 'email' AND ecp.expires_at > NOW() THEN ecp.credits_remaining ELSE 0 END), 0)
  END as total_email_credits_available

FROM organizations o
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id AND os.status = 'active'
LEFT JOIN subscription_tiers st ON os.subscription_tier_id = st.id
LEFT JOIN organization_extra_credits_purchases ecp ON o.id = ecp.organization_id 
  AND ecp.payment_status = 'completed' 
  AND ecp.expires_at > NOW()
GROUP BY o.id, o.name, st.ai_requests_limit, st.whatsapp_messages_limit, st.email_marketing_limit;

-- 4. INDEXES FOR PERFORMANCE
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_extra_credits_packages_type ON extra_credits_packages(credit_type);
CREATE INDEX IF NOT EXISTS idx_extra_credits_packages_active ON extra_credits_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_extra_credits_purchases_org ON organization_extra_credits_purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_extra_credits_purchases_type ON organization_extra_credits_purchases(credit_type);
CREATE INDEX IF NOT EXISTS idx_extra_credits_purchases_status ON organization_extra_credits_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_extra_credits_purchases_expires ON organization_extra_credits_purchases(expires_at);

-- 5. RLS POLICIES
-- ===================================================================
ALTER TABLE extra_credits_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_extra_credits_purchases ENABLE ROW LEVEL SECURITY;

-- Extra credits packages sono pubblici (tutti possono vedere)
CREATE POLICY "extra_credits_packages_read" ON extra_credits_packages FOR SELECT TO public USING (is_active = true);

-- Organization extra credits purchases - solo la propria org
CREATE POLICY "extra_credits_purchases_policy" ON organization_extra_credits_purchases FOR ALL TO public 
USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

-- Super admin può vedere tutto
CREATE POLICY "super_admin_extra_credits_purchases" ON organization_extra_credits_purchases FOR ALL TO public 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- 6. FUNCTIONS PER GESTIONE CREDITI
-- ===================================================================

-- Funzione per consumare crediti extra
CREATE OR REPLACE FUNCTION consume_extra_credits(
  org_id UUID,
  credit_type_param TEXT,
  amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  purchase_record RECORD;
  remaining_to_consume INTEGER := amount;
  consumed_from_purchase INTEGER;
BEGIN
  -- Consuma crediti dai pacchetti più vecchi per primi (FIFO)
  FOR purchase_record IN 
    SELECT id, credits_remaining 
    FROM organization_extra_credits_purchases 
    WHERE organization_id = org_id 
      AND credit_type = credit_type_param
      AND payment_status = 'completed'
      AND expires_at > NOW()
      AND credits_remaining > 0
    ORDER BY created_at ASC
  LOOP
    -- Calcola quanto consumare da questo pacchetto
    consumed_from_purchase := LEAST(remaining_to_consume, purchase_record.credits_remaining);
    
    -- Aggiorna il record
    UPDATE organization_extra_credits_purchases 
    SET 
      credits_consumed = credits_consumed + consumed_from_purchase,
      updated_at = NOW()
    WHERE id = purchase_record.id;
    
    -- Riduce la quantità rimanente da consumare
    remaining_to_consume := remaining_to_consume - consumed_from_purchase;
    
    -- Se abbiamo consumato tutto, esci dal loop
    IF remaining_to_consume = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Ritorna true se siamo riusciti a consumare tutti i crediti richiesti
  RETURN remaining_to_consume = 0;
END;
$$ LANGUAGE plpgsql;

-- Commenti per documentazione
COMMENT ON TABLE extra_credits_packages IS 'Pacchetti di crediti extra acquistabili per AI, WhatsApp, Email';
COMMENT ON TABLE organization_extra_credits_purchases IS 'Storico acquisti crediti extra per organizzazione';
COMMENT ON VIEW organization_credits_balance IS 'Vista aggregata crediti disponibili (abbonamento + extra)';
COMMENT ON FUNCTION consume_extra_credits IS 'Consuma crediti extra con logica FIFO';