// Crea SQL semplificato per applicazione diretta
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// SQL ottimizzato per esecuzione diretta via Supabase Studio
const simplifiedSQL = `
-- ===================================================================
-- GUARDIAN AI CRM - MIGRAZIONE SISTEMA PRICING VERTICALI  
-- Esecuzione diretta via Supabase Studio SQL Editor
-- ===================================================================

-- 1. CREAZIONE ENUM PRICING TIERS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier') THEN
        CREATE TYPE pricing_tier AS ENUM (
            'starter',
            'freelancer', 
            'professional',
            'agency',
            'premium',
            'studio'
        );
    END IF;
END
$$;

-- 2. CREAZIONE TABELLA VERTICAL_PRICING_TIERS
CREATE TABLE IF NOT EXISTS vertical_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vertical_name TEXT NOT NULL,
    tier pricing_tier NOT NULL,
    tier_name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,  
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(vertical_name, tier)
);

-- 3. INSERIMENTO DATI INSURANCE AGENCY
INSERT INTO vertical_pricing_tiers (vertical_name, tier, tier_name, price_monthly, price_yearly, features, is_popular, is_recommended) VALUES
('insurance-agency', 'starter', 'Starter', 29, 290, '["Basic CRM", "Lead Management", "Client Portal", "Basic Reporting"]'::jsonb, false, false),
('insurance-agency', 'freelancer', 'Freelancer', 59, 590, '["Everything in Starter", "Advanced CRM", "Email Marketing", "Document Management", "Integration APIs"]'::jsonb, false, false), 
('insurance-agency', 'professional', 'Professional', 149, 1490, '["Everything in Freelancer", "Advanced Reporting", "Multi-user Access", "Custom Workflows", "Priority Support"]'::jsonb, true, true),
('insurance-agency', 'agency', 'Agency', 299, 2990, '["Everything in Professional", "White Label", "Advanced Analytics", "Custom Integrations", "Dedicated Support"]'::jsonb, false, false),
('insurance-agency', 'premium', 'Premium', 599, 5990, '["Everything in Agency", "Enterprise Features", "Custom Development", "Dedicated Account Manager", "SLA Support"]'::jsonb, false, false),
('insurance-agency', 'studio', 'Studio', 869, 8690, '["Everything in Premium", "Full Custom Solution", "Unlimited Users", "Custom Branding", "24/7 Premium Support"]'::jsonb, false, false);

-- 4. INSERIMENTO DATI MARKETING AGENCY  
INSERT INTO vertical_pricing_tiers (vertical_name, tier, tier_name, price_monthly, price_yearly, features, is_popular, is_recommended) VALUES
('marketing-agency', 'starter', 'Starter', 19, 190, '["Campaign Tracking", "Client Portal", "Basic Reporting", "Social Media Integration"]'::jsonb, false, false),
('marketing-agency', 'freelancer', 'Freelancer', 49, 490, '["Everything in Starter", "Advanced Analytics", "A/B Testing", "Email Campaigns", "Lead Scoring"]'::jsonb, false, false),
('marketing-agency', 'professional', 'Professional', 99, 990, '["Everything in Freelancer", "Multi-client Management", "Advanced Automation", "Custom Reports", "Priority Support"]'::jsonb, true, true), 
('marketing-agency', 'agency', 'Agency', 199, 1990, '["Everything in Professional", "White Label Solution", "Team Collaboration", "Advanced Integrations", "Dedicated Support"]'::jsonb, false, false),
('marketing-agency', 'premium', 'Premium', 399, 3990, '["Everything in Agency", "Enterprise Analytics", "Custom Development", "Account Manager", "SLA Support"]'::jsonb, false, false),
('marketing-agency', 'studio', 'Studio', 699, 6990, '["Everything in Premium", "Full Custom Platform", "Unlimited Clients", "Custom Branding", "24/7 Premium Support"]'::jsonb, false, false);

-- 5. CREAZIONE INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vertical_pricing_vertical_name ON vertical_pricing_tiers(vertical_name);
CREATE INDEX IF NOT EXISTS idx_vertical_pricing_tier ON vertical_pricing_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_vertical_pricing_popular ON vertical_pricing_tiers(is_popular) WHERE is_popular = true;

-- 6. TRIGGER PER UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vertical_pricing_tiers_updated_at ON vertical_pricing_tiers;
CREATE TRIGGER update_vertical_pricing_tiers_updated_at 
    BEFORE UPDATE ON vertical_pricing_tiers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. VERIFICA FINALE
SELECT 
    vertical_name,
    tier,
    tier_name, 
    price_monthly,
    features
FROM vertical_pricing_tiers 
ORDER BY vertical_name, price_monthly;
`;

// Salva il file SQL ottimizzato
fs.writeFileSync('EXECUTE_IN_SUPABASE_STUDIO.sql', simplifiedSQL, 'utf8');

console.log('✅ File SQL ottimizzato creato: EXECUTE_IN_SUPABASE_STUDIO.sql');
console.log('');
console.log('🚀 ISTRUZIONI PER ESECUZIONE MANUALE:');
console.log('');
console.log('1. Vai su: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi');
console.log('2. Clicca su "SQL Editor" nel menu laterale');
console.log('3. Crea una "New Query"');
console.log('4. Copia e incolla il contenuto di EXECUTE_IN_SUPABASE_STUDIO.sql');
console.log('5. Clicca "Run" per eseguire la migrazione');
console.log('');
console.log('📊 La migrazione creerà:');
console.log('- Enum pricing_tier con 6 livelli');
console.log('- Tabella vertical_pricing_tiers con struttura JSONB');
console.log('- 12 record di pricing (6 insurance + 6 marketing)');
console.log('- Indici per performance');
console.log('- Trigger per updated_at automatico');
console.log('');
console.log('⚡ Dopo l\'esecuzione, gli errori GitHub CI/CD dovrebbero risolversi!');