// Script per applicare la migrazione via API REST SQL
const fs = require('fs');

async function applyMigration() {
  const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

  console.log('🚀 Applicando migrazione al database: qjtaqrlpronohgpfdxsi');
  
  try {
    // Leggi il file di migrazione
    const migrationSQL = fs.readFileSync('supabase/migrations/20251005000003_five_tier_pricing_system.sql', 'utf8');
    
    console.log('📖 Migrazione letta:', migrationSQL.length, 'caratteri');
    
    // Supabase Edge Functions per eseguire SQL raw
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migrazione applicata con successo!');
      console.log('📊 Risultato:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Errore applicazione migrazione:', response.status, errorText);
      
      // Proviamo con un approccio diverso - creazione diretta tramite RPC
      console.log('🔄 Tentativo alternativo...');
      await createTableDirectly(supabaseUrl, serviceKey);
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.log('🔄 Tentativo alternativo...');
    await createTableDirectly(supabaseUrl, serviceKey);
  }
}

async function createTableDirectly(supabaseUrl, serviceKey) {
  console.log('🔧 Creazione diretta tabella vertical_pricing_tiers...');
  
  // SQL semplificato per creare solo la tabella essenziale
  const createTableSQL = `
    -- Crea enum se non esiste
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier') THEN
            CREATE TYPE pricing_tier AS ENUM (
                'starter', 'freelancer', 'professional', 
                'agency', 'premium', 'studio'
            );
        END IF;
    END
    $$;

    -- Crea tabella se non esiste  
    CREATE TABLE IF NOT EXISTS vertical_pricing_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vertical_name TEXT NOT NULL,
        tier pricing_tier NOT NULL,
        tier_name TEXT NOT NULL,
        price_monthly INTEGER NOT NULL,
        price_yearly INTEGER NOT NULL,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Inserisci dati di test
    INSERT INTO vertical_pricing_tiers (vertical_name, tier, tier_name, price_monthly, price_yearly, features) 
    VALUES 
    ('insurance-agency', 'starter', 'Starter', 29, 290, '["Basic CRM", "Lead Management"]'::jsonb),
    ('marketing-agency', 'starter', 'Starter', 19, 190, '["Campaign Tracking", "Client Portal"]'::jsonb)
    ON CONFLICT DO NOTHING;
  `;

  try {
    // Proviamo con una funzione SQL diretta
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST', 
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'exec_raw_sql',
        args: { sql_query: createTableSQL }
      })
    });

    const result = await response.text();
    console.log('📊 Risposta creazione:', response.status, result);
    
  } catch (error) {
    console.error('❌ Errore creazione diretta:', error.message);
  }
}

applyMigration();