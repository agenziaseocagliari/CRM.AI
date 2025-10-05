// Applica migrazione database con credenziali corrette
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

async function applyMigrationWithCorrectCredentials() {
  const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
  const serviceKey = 'sb_secret_ZgM5LbqFB9DZHvMV8kIEEw_V8lgUZFs';

  console.log('🚀 Applicando migrazione con credenziali corrette...');
  console.log('📍 Project: qjtaqrlpronohgpfdxsi');
  
  try {
    // Prima verifichiamo l'accesso al database
    console.log('🔍 Verifica accesso database...');
    
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });

    if (!healthCheck.ok) {
      console.log('❌ Errore accesso database:', healthCheck.status, await healthCheck.text());
      return;
    }

    console.log('✅ Accesso database confermato');

    // Leggi la migrazione
    const migrationSQL = fs.readFileSync('supabase/migrations/20251005000003_five_tier_pricing_system.sql', 'utf8');
    console.log('📖 Migrazione letta:', migrationSQL.length, 'caratteri');

    // Dividiamo la migrazione in blocchi più piccoli per evitare problemi
    const sqlStatements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📦 Divisa in', sqlStatements.length, 'statements');

    // Esegui ogni statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      if (statement.length < 10) continue; // Salta statements troppo corti
      
      console.log(`🔄 Eseguendo statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        // Prova con una chiamata RPC personalizzata
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        });

        if (response.ok) {
          console.log(`  ✅ Statement ${i + 1} eseguito`);
        } else {
          const errorText = await response.text();
          console.log(`  ⚠️ Statement ${i + 1} non eseguito:`, response.status, errorText);
        }
      } catch (error) {
        console.log(`  ❌ Errore statement ${i + 1}:`, error.message);
      }
    }

    // Verifica finale
    console.log('🔍 Verifica finale...');
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/vertical_pricing_tiers?select=*&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });

    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log('✅ SUCCESSO! Tabella vertical_pricing_tiers creata');
      console.log('📊 Record trovati:', data.length);
    } else {
      console.log('⚠️ Verifica:', verifyResponse.status, await verifyResponse.text());
    }

  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

applyMigrationWithCorrectCredentials();