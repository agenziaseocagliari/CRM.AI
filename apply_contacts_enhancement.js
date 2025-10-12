import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qjtaqrlpronohgpfdxsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'
);

console.log('🔧 APPLICAZIONE ENHANCEMENT TABELLA CONTACTS');
console.log('===========================================');

async function applyEnhancement() {
    const commands = [
        // 1. Aggiunta colonne
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS imported_from VARCHAR(255)`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_row_number INTEGER`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_import_update TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_metadata JSONB`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS normalized_email VARCHAR(255)`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS normalized_phone VARCHAR(50)`,
        `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS duplicate_check_hash VARCHAR(64)`,
        
        // 2. Indici
        `CREATE INDEX IF NOT EXISTS idx_contacts_imported_from ON contacts(imported_from)`,
        `CREATE INDEX IF NOT EXISTS idx_contacts_normalized_email ON contacts(normalized_email)`,
        `CREATE INDEX IF NOT EXISTS idx_contacts_normalized_phone ON contacts(normalized_phone)`,
        `CREATE INDEX IF NOT EXISTS idx_contacts_duplicate_hash ON contacts(duplicate_check_hash)`
    ];
    
    console.log(`⚙️ Esecuzione di ${commands.length} comandi SQL...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`${i + 1}. ${command.substring(0, 60)}...`);
        
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: command });
            
            if (error) {
                console.log(`   ❌ ERRORE: ${error.message}`);
                errorCount++;
            } else {
                console.log(`   ✅ OK`);
                successCount++;
            }
        } catch (e) {
            console.log(`   💥 ECCEZIONE: ${e.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📊 RISULTATI ENHANCEMENT:');
    console.log(`✅ Successi: ${successCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    
    // Verifica finale
    console.log('\n🔍 Verifica finale enhancement...');
    try {
        const { error } = await supabase
            .from('contacts')
            .select(`
                id,
                imported_from,
                import_row_number,
                last_import_update,
                import_metadata,
                normalized_email,
                normalized_phone,
                duplicate_check_hash
            `)
            .limit(1);
            
        if (error) {
            console.log('❌ Verifica fallita:', error.message);
            return false;
        } else {
            console.log('✅ Verifica passata - tutte le colonne sono accessibili!');
            console.log('🎉 Enhancement tabella contacts completato!');
            return true;
        }
    } catch (error) {
        console.log('💥 Errore verifica:', error.message);
        return false;
    }
}

applyEnhancement().then(success => {
    if (success) {
        console.log('\n🚀 PROSSIMO STEP: Rilanciare test suite completo');
    } else {
        console.log('\n⚠️ RICHIESTA VERIFICA MANUALE');
    }
}).catch(error => {
    console.error('💥 ERRORE CRITICO:', error);
});