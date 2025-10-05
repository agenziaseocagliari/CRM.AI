// Script per verificare lo stato della migrazione nel database CORRETTO
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qjtaqrlpronohgpfdxsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'
);

async function checkMigrationStatus() {
  console.log('🔍 Verificando stato migrazione database...');
  console.log('📍 Project ID: qjtaqrlpronohgpfdxsi');
  console.log('🌐 URL: https://qjtaqrlpronohgpfdxsi.supabase.co');
  
  try {
    // 1. Verifica se la tabella vertical_pricing_tiers esiste
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'vertical_pricing_tiers');

    if (tablesError) {
      console.error('❌ Errore controllo tabelle:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ Tabella vertical_pricing_tiers NON TROVATA');
      console.log('🔧 La migrazione NON è stata applicata al database');
      return;
    }

    console.log('✅ Tabella vertical_pricing_tiers TROVATA');

    // 2. Verifica la struttura della colonna features (deve essere jsonb)
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'vertical_pricing_tiers')
      .eq('column_name', 'features');

    if (columnsError) {
      console.error('❌ Errore controllo colonne:', columnsError.message);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ Colonna features trovata:', columns[0].data_type);
      if (columns[0].data_type !== 'jsonb') {
        console.log('⚠️  ATTENZIONE: La colonna features non è di tipo JSONB!');
        console.log('🔧 Tipo attuale:', columns[0].data_type);
      }
    }

    // 3. Verifica il contenuto dei dati
    const { data: pricingData, error: dataError } = await supabase
      .from('vertical_pricing_tiers')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Errore lettura dati:', dataError.message);
      return;
    }

    console.log('📊 Dati nella tabella:', pricingData?.length || 0, 'record');
    if (pricingData && pricingData.length > 0) {
      console.log('🔍 Esempio record:', JSON.stringify(pricingData[0], null, 2));
    }

    // 4. Verifica le migrazioni applicate
    const { data: migrations, error: migrationsError } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(10);

    if (!migrationsError && migrations) {
      console.log('📋 Ultime migrazioni applicate:');
      migrations.forEach(m => {
        console.log(`  - ${m.version}`);
      });
      
      const targetMigration = migrations.find(m => m.version.includes('20251005000003'));
      if (targetMigration) {
        console.log('✅ Migrazione 20251005000003 APPLICATA');
      } else {
        console.log('❌ Migrazione 20251005000003 NON TROVATA');
      }
    }

  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

checkMigrationStatus();