// Verifica migrazione database con fetch API semplice
async function checkDatabaseMigration() {
  const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

  console.log('🔍 Verificando database: qjtaqrlpronohgpfdxsi');
  
  try {
    // 1. Verifica se la tabella vertical_pricing_tiers esiste
    const response = await fetch(`${supabaseUrl}/rest/v1/vertical_pricing_tiers?select=*&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Tabella vertical_pricing_tiers TROVATA');
      console.log('📊 Numero record:', data.length);
      
      if (data.length > 0) {
        console.log('🔍 Primo record:', JSON.stringify(data[0], null, 2));
        
        // Verifica se features è in formato JSONB corretto
        if (data[0].features && typeof data[0].features === 'object') {
          console.log('✅ Features in formato JSONB corretto');
        } else {
          console.log('❌ Features NON in formato JSONB:', typeof data[0].features);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Errore accesso tabella:', response.status, errorText);
      
      if (response.status === 404) {
        console.log('💡 La tabella vertical_pricing_tiers NON ESISTE');
        console.log('🔧 La migrazione NON è stata applicata');
      }
    }

  } catch (error) {
    console.error('❌ Errore verifica:', error.message);
  }
}

// Esegui la verifica
checkDatabaseMigration();