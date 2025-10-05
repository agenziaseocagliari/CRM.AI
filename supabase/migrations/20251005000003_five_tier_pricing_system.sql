-- GUARDIAN AI CRM - AGGIORNAMENTO SISTEMA PRICING A 5 LIVELLI
-- Migrazione per supportare la nuova struttura pricing verticali
-- Data: 2025-10-05

-- ===================================================================
-- 1. AGGIORNAMENTO ENUM PRICING TIERS
-- ===================================================================

-- Aggiungiamo i nuovi tiers per completare i 5 livelli
ALTER TYPE pricing_tier ADD VALUE IF NOT EXISTS 'premium' AFTER 'professional';

-- ===================================================================
-- 2. AGGIORNAMENTO TABELLA VERTICAL_PRICING_TIERS
-- ===================================================================

-- Aggiorniamo i pricing esistenti e aggiungiamo i nuovi tiers
DELETE FROM vertical_pricing_tiers WHERE account_type = 'insurance_agency';
DELETE FROM vertical_pricing_tiers WHERE account_type = 'marketing_agency';

-- PRICING ASSICURAZIONI (5 LIVELLI)
INSERT INTO vertical_pricing_tiers (
  account_type, 
  tier_name, 
  tier_level,
  price_monthly, 
  price_yearly,
  launch_price_monthly,
  launch_price_yearly, 
  description,
  features,
  limits,
  is_popular
) VALUES 
-- Tier 1: Starter
(
  'insurance_agency',
  'starter',
  1,
  39.00,
  390.00,
  29.00,
  290.00,
  'Perfetto per piccole agenzie che iniziano',
  ARRAY[
    '500 clienti',
    '100 polizze gestite', 
    '2.000 email/mese',
    '200 WhatsApp/mese',
    '50 SMS/mese',
    '2GB storage documenti',
    'Gestione rinnovi automatica',
    'Report base',
    'Supporto email'
  ],
  '{"clients": 500, "policies": 100, "emails_month": 2000, "whatsapp_month": 200, "sms_month": 50, "storage_gb": 2, "users": 2}'::jsonb,
  false
),
-- Tier 2: Professional  
(
  'insurance_agency',
  'professional',
  2,
  79.00,
  790.00,
  59.00,
  590.00,
  'Per agenzie in crescita con più clienti',
  ARRAY[
    '2.000 clienti',
    '500 polizze gestite',
    '8.000 email/mese', 
    '800 WhatsApp/mese',
    '200 SMS/mese',
    '8GB storage documenti',
    'Automazioni avanzate',
    'Integrazioni IVASS',
    'Report avanzati',
    'Supporto prioritario'
  ],
  '{"clients": 2000, "policies": 500, "emails_month": 8000, "whatsapp_month": 800, "sms_month": 200, "storage_gb": 8, "users": 5}'::jsonb,
  true
),
-- Tier 3: Premium
(
  'insurance_agency', 
  'premium',
  3,
  199.00,
  1990.00,
  159.00,
  1590.00,
  'Per agenzie multi-compagnia e specializzate',
  ARRAY[
    '5.000 clienti',
    '1.000 polizze gestite',
    '20.000 email/mese',
    '2.000 WhatsApp/mese', 
    '500 SMS/mese',
    '15GB storage documenti',
    'Multi-compagnia avanzata',
    'API personalizzate limitate',
    'Dashboard personalizzate',
    'Supporto telefonico prioritario'
  ],
  '{"clients": 5000, "policies": 1000, "emails_month": 20000, "whatsapp_month": 2000, "sms_month": 500, "storage_gb": 15, "users": 10}'::jsonb,
  false
),
-- Tier 4: Advanced
(
  'insurance_agency',
  'advanced', 
  4,
  399.00,
  3990.00,
  319.00, 
  3190.00,
  'Per agenzie consolidate con alto volume',
  ARRAY[
    '15.000 clienti',
    '3.000 polizze gestite',
    '50.000 email/mese',
    '5.000 WhatsApp/mese',
    '1.200 SMS/mese',
    '50GB storage documenti',
    'Multi-compagnia completa',
    'API personalizzate complete',
    'White label parziale',
    'Integrazioni enterprise',
    'Account manager dedicato'
  ],
  '{"clients": 15000, "policies": 3000, "emails_month": 50000, "whatsapp_month": 5000, "sms_month": 1200, "storage_gb": 50, "users": 25}'::jsonb,
  false
),
-- Tier 5: Business
(
  'insurance_agency',
  'business',
  5,
  699.00,
  6990.00,
  559.00,
  5590.00,
  'Per grandi agenzie e broker',
  ARRAY[
    '25.000 clienti',
    '5.000 polizze gestite',
    '100.000 email/mese',
    '8.000 WhatsApp/mese',
    '2.000 SMS/mese', 
    '100GB storage documenti',
    'White label completo',
    'Multi-agenzia',
    'Integrazioni enterprise complete', 
    'SLA garantito 99.9%',
    'Supporto dedicato 24/7'
  ],
  '{"clients": 25000, "policies": 5000, "emails_month": 100000, "whatsapp_month": 8000, "sms_month": 2000, "storage_gb": 100, "users": 50}'::jsonb,
  false
),
-- Tier 6: Enterprise  
(
  'insurance_agency',
  'enterprise',
  6,
  1299.00,
  12990.00,
  999.00,
  9990.00,
  'Soluzione personalizzata con servizi dedicati',
  ARRAY[
    'Clienti illimitati',
    'Polizze illimitate',
    'Email illimitate', 
    'WhatsApp illimitati',
    'SMS illimitati',
    'Storage illimitato',
    'Sviluppo personalizzato completo',
    'Hosting dedicato privato',
    'Integrazioni custom illimitate',
    'White label 100% personalizzato',
    'Team di sviluppo dedicato',
    'Supporto 24/7 con SLA <1h',
    'Formazione avanzata inclusa',
    'Consulenza strategica mensile',
    'Backup e disaster recovery dedicato'
  ],
  '{"clients": -1, "policies": -1, "emails_month": -1, "whatsapp_month": -1, "sms_month": -1, "storage_gb": -1, "users": -1}'::jsonb,
  false
);

-- PRICING MARKETING (5 LIVELLI)
INSERT INTO vertical_pricing_tiers (
  account_type,
  tier_name,
  tier_level, 
  price_monthly,
  price_yearly,
  launch_price_monthly,
  launch_price_yearly,
  description,
  features,
  limits,
  is_popular
) VALUES
-- Tier 1: Freelancer
(
  'marketing_agency',
  'freelancer', 
  1,
  29.00,
  290.00,
  19.00,
  190.00,
  'Perfetto per freelancer e consulenti',
  ARRAY[
    '100 clienti',
    '25 progetti attivi',
    '5 campagne simultanee',
    '5.000 email/mese',
    '5 landing page',
    '1GB storage',
    'Analytics base',
    'Supporto email'
  ],
  '{"clients": 100, "projects": 25, "campaigns": 5, "emails_month": 5000, "landing_pages": 5, "storage_gb": 1, "users": 1}'::jsonb,
  false
),
-- Tier 2: Agency
(
  'marketing_agency',
  'agency',
  2, 
  59.00,
  590.00,
  39.00,
  390.00,
  'Per piccole agenzie di marketing',
  ARRAY[
    '500 clienti',
    '100 progetti attivi',
    '20 campagne simultanee',
    '15.000 email/mese',
    '20 landing page',
    '5GB storage',
    'ROI tracking',
    'Report clienti',
    'Supporto prioritario'
  ],
  '{"clients": 500, "projects": 100, "campaigns": 20, "emails_month": 15000, "landing_pages": 20, "storage_gb": 5, "users": 3}'::jsonb,
  true
),
-- Tier 3: Professional
(
  'marketing_agency',
  'professional',
  3,
  89.00,
  890.00,
  69.00,
  690.00,
  'Per agenzie in crescita con più servizi',
  ARRAY[
    '1.000 clienti',
    '200 progetti attivi',
    '30 campagne simultanee',
    '25.000 email/mese',
    '30 landing page',
    '10GB storage',
    'A/B testing avanzato',
    'ROI tracking dettagliato',
    'Automazioni email avanzate',
    'Report personalizzati'
  ],
  '{"clients": 1000, "projects": 200, "campaigns": 30, "emails_month": 25000, "landing_pages": 30, "storage_gb": 10, "users": 5}'::jsonb,
  false
),
-- Tier 4: Studio
(
  'marketing_agency',
  'studio',
  4,
  199.00,
  1990.00,
  159.00,
  1590.00,
  'Per studi creativi e agenzie medie',
  ARRAY[
    '3.000 clienti',
    '750 progetti attivi',
    '75 campagne simultanee',
    '75.000 email/mese',
    '75 landing page',
    '30GB storage',
    'A/B testing avanzato',
    'Multi-channel campaigns',
    'Conversion tracking avanzato', 
    'Dashboard personalizzate',
    'White label parziale',
    'Account manager dedicato'
  ],
  '{"clients": 3000, "projects": 750, "campaigns": 75, "emails_month": 75000, "landing_pages": 75, "storage_gb": 30, "users": 15}'::jsonb,
  false
),
-- Tier 5: Business  
(
  'marketing_agency',
  'business',
  5,
  399.00,
  3990.00,
  319.00,
  3190.00,
  'Per network e holding di agenzie',
  ARRAY[
    '7.500 clienti',  
    '1.500 progetti attivi',
    '150 campagne simultanee',
    '150.000 email/mese',
    '150 landing page',
    '75GB storage',
    'White label completo',
    'Multi-agency',
    'API personalizzate complete',
    'Integrazioni enterprise',
    'SLA garantito 99.9%',
    'Supporto prioritario 24/7'
  ],
  '{"clients": 7500, "projects": 1500, "campaigns": 150, "emails_month": 150000, "landing_pages": 150, "storage_gb": 75, "users": 30}'::jsonb,
  false
),
-- Tier 6: Enterprise
(
  'marketing_agency',
  'enterprise',
  6,
  899.00,
  8990.00,
  699.00,
  6990.00,
  'Soluzione personalizzata con servizi dedicati',
  ARRAY[
    'Clienti illimitati',
    'Progetti illimitati',
    'Campagne illimitate',
    'Email illimitate',
    'Landing page illimitate',
    'Storage illimitato',
    'Sviluppo personalizzato completo',
    'Hosting dedicato privato',
    'Integrazioni custom illimitate',
    'White label 100% personalizzato',
    'Team di sviluppo dedicato', 
    'Supporto 24/7 con SLA <1h',
    'Consulenza strategica settimanale',
    'Formazione avanzata team',
    'Backup e disaster recovery dedicato'
  ],
  '{"clients": -1, "projects": -1, "campaigns": -1, "emails_month": -1, "landing_pages": -1, "storage_gb": -1, "users": -1}'::jsonb,
  false
);

-- ===================================================================
-- 3. AGGIORNAMENTO INDICI PER PERFORMANCE
-- ===================================================================

-- Aggiungiamo indice per tier_level per query ottimizzate
CREATE INDEX IF NOT EXISTS idx_vertical_pricing_tier_level 
ON vertical_pricing_tiers(account_type, tier_level);

-- Aggiungiamo indice per pricing queries
CREATE INDEX IF NOT EXISTS idx_vertical_pricing_popular
ON vertical_pricing_tiers(account_type, is_popular, tier_level);

-- ===================================================================
-- 4. TRIGGER PER VALIDAZIONE TIER LEVELS
-- ===================================================================

-- Function per validare che tier_level sia compreso tra 1 e 6
CREATE OR REPLACE FUNCTION validate_tier_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier_level < 1 OR NEW.tier_level > 6 THEN
    RAISE EXCEPTION 'tier_level must be between 1 and 6, got %', NEW.tier_level;
  END IF;
  
  -- Verifica che non ci siano duplicati tier_level per lo stesso account_type
  IF EXISTS (
    SELECT 1 FROM vertical_pricing_tiers 
    WHERE account_type = NEW.account_type 
    AND tier_level = NEW.tier_level 
    AND tier_name != NEW.tier_name
  ) THEN
    RAISE EXCEPTION 'tier_level % already exists for account_type %', NEW.tier_level, NEW.account_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per validazione tier levels
DROP TRIGGER IF EXISTS trigger_validate_tier_level ON vertical_pricing_tiers;
CREATE TRIGGER trigger_validate_tier_level
  BEFORE INSERT OR UPDATE ON vertical_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION validate_tier_level();

-- ===================================================================  
-- 5. VIEW PER QUERY PRICING OTTIMIZZATE
-- ===================================================================

-- View per ottenere pricing ordinati per tier_level
CREATE OR REPLACE VIEW vertical_pricing_ordered AS
SELECT 
  account_type,
  tier_name,
  tier_level,
  price_monthly,
  price_yearly,
  launch_price_monthly,
  launch_price_yearly,
  description,
  features,
  limits,
  is_popular,
  created_at,
  updated_at
FROM vertical_pricing_tiers
ORDER BY account_type, tier_level;

-- View per ottenere solo i pricing popolari
CREATE OR REPLACE VIEW vertical_pricing_popular AS  
SELECT *
FROM vertical_pricing_tiers
WHERE is_popular = true
ORDER BY account_type, tier_level;

-- ===================================================================
-- 6. FUNCTION PER OTTENERE PRICING PER ACCOUNT TYPE
-- ===================================================================

-- Function per ottenere tutti i tiers per un account type
CREATE OR REPLACE FUNCTION get_account_pricing(p_account_type account_type_enum)
RETURNS TABLE (
  tier_name varchar,
  tier_level integer,
  price_monthly numeric,
  price_yearly numeric, 
  launch_price_monthly numeric,
  launch_price_yearly numeric,
  description text,
  features text[],
  limits jsonb,
  is_popular boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vpt.tier_name,
    vpt.tier_level,
    vpt.price_monthly,
    vpt.price_yearly,
    vpt.launch_price_monthly,
    vpt.launch_price_yearly,
    vpt.description,
    vpt.features,
    vpt.limits,
    vpt.is_popular
  FROM vertical_pricing_tiers vpt
  WHERE vpt.account_type = p_account_type
  ORDER BY vpt.tier_level;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 7. COMMENTS PER DOCUMENTAZIONE
-- ===================================================================

COMMENT ON TABLE vertical_pricing_tiers IS 'Pricing tiers per account types verticali con 5-6 livelli';
COMMENT ON COLUMN vertical_pricing_tiers.tier_level IS 'Livello del tier da 1 (base) a 6 (enterprise)';
COMMENT ON COLUMN vertical_pricing_tiers.launch_price_monthly IS 'Prezzo lancio scontato per primi 6 mesi';
COMMENT ON COLUMN vertical_pricing_tiers.launch_price_yearly IS 'Prezzo lancio annuale scontato per primi 6 mesi';

-- Test finale per verificare dati
SELECT 
  account_type,
  tier_name, 
  tier_level,
  price_monthly,
  launch_price_monthly,
  is_popular
FROM vertical_pricing_tiers 
ORDER BY account_type, tier_level;