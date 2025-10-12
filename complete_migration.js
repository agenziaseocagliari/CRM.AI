import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 ESECUZIONE DIRETTA MIGRAZIONE DATABASE');
console.log('=========================================');

// Prima verifico che le tabelle non esistano già
async function checkExistingTables() {
    console.log('\n1️⃣ Verifica tabelle esistenti...');
    
    const tablesToCheck = ['contact_imports', 'contact_import_logs', 'contact_field_mappings'];
    const results = {};
    
    for (const table of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                if (error.message.includes('does not exist') || error.code === 'PGRST116') {
                    results[table] = 'NON_ESISTE';
                    console.log(`  ❌ ${table}: Non esiste (OK per migrazione)`);
                } else {
                    results[table] = 'ERRORE';
                    console.log(`  ⚠️  ${table}: Errore - ${error.message}`);
                }
            } else {
                results[table] = 'ESISTE';
                console.log(`  ✅ ${table}: Già esiste`);
            }
        } catch (error) {
            results[table] = 'ERRORE';
            console.log(`  ❌ ${table}: Errore verifica - ${error.message}`);
        }
    }
    
    return results;
}

// Eseguo una migrazione step by step usando Supabase CLI con commands
async function executeMigrationWithCLI() {
    console.log('\n2️⃣ Esecuzione migrazione con Supabase CLI...');
    
    try {
        // Prima creo la migrazione locale se non esiste
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Provo a deployare la migrazione esistente
        console.log('📤 Deploy migrazione al database remoto...');
        const deployResult = await execAsync('npx supabase db push --include-all', {
            cwd: process.cwd()
        });
        
        console.log('✅ Migrazione deployata:', deployResult.stdout);
        return true;
        
    } catch (error) {
        console.log('❌ Deploy CLI fallito:', error.message);
        
        // Se il CLI fallisce, provo con approccio diretto
        return await executeMigrationDirect();
    }
}

// Approccio alternativo: creo le tabelle direttamente usando il client Supabase
async function executeMigrationDirect() {
    console.log('\n3️⃣ Esecuzione diretta con client Supabase...');
    
    // Step 1: Provo a creare la prima tabella per vedere se ho i permessi
    console.log('📝 Test permessi database...');
    
    try {
        // Uso una query di test per verificare che posso accedere
        const { data: orgCount } = await supabase
            .from('organizations')
            .select('id', { count: 'exact', head: true });
            
        console.log(`✅ Accesso database OK - ${orgCount || 0} organizzazioni`);
        
        // Ora provo a eseguire SQL via RPC se disponibile
        const testSQL = `SELECT table_name FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'contact_imports'`;
        
        try {
            const { data, error } = await supabase.rpc('sql', { query: testSQL });
            
            if (!error) {
                console.log('✅ RPC SQL disponibile, uso questo metodo');
                return await executeSQLViaRPC();
            } else {
                console.log('❌ RPC SQL non disponibile:', error.message);
            }
        } catch (rpcError) {
            console.log('❌ RPC non disponibile:', rpcError.message);
        }
        
        // Se arrivo qui, devo usare un approccio alternativo
        console.log('⚠️  Uso approccio manuale con istruzioni dettagliate');
        return false;
        
    } catch (error) {
        console.error('❌ Errore accesso database:', error.message);
        return false;
    }
}

async function executeSQLViaRPC() {
    console.log('\n4️⃣ Esecuzione SQL via RPC...');
    
    // Carico il file SQL completo
    const { readFileSync } = await import('fs');
    const sqlFile = readFileSync('./supabase/migrations/20261012000002_contact_import_complete.sql', 'utf8');
    
    try {
        const { data, error } = await supabase.rpc('sql', { query: sqlFile });
        
        if (error) {
            console.error('❌ Errore esecuzione SQL:', error);
            return false;
        }
        
        console.log('✅ SQL eseguito con successo:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Errore RPC:', error.message);
        return false;
    }
}

// Verifica che le tabelle siano state create correttamente
async function verifyMigration() {
    console.log('\n5️⃣ Verifica migrazione completata...');
    
    const tablesToCheck = [
        'contact_imports',
        'contact_import_logs', 
        'contact_field_mappings'
    ];
    
    let allTablesCreated = true;
    
    for (const tableName of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${tableName}: NON CREATA - ${error.message}`);
                allTablesCreated = false;
            } else {
                console.log(`✅ ${tableName}: CREATA E ACCESSIBILE`);
            }
        } catch (error) {
            console.log(`❌ ${tableName}: ERRORE VERIFICA - ${error.message}`);
            allTablesCreated = false;
        }
    }
    
    // Verifica anche che la tabella contacts abbia le nuove colonne
    console.log('\n🔍 Verifica enhancement tabella contacts...');
    
    try {
        const { data: contactsSample } = await supabase
            .from('contacts')
            .select('imported_from, normalized_email, duplicate_check_hash')
            .limit(1);
            
        if (contactsSample !== null) {
            console.log('✅ Tabella contacts: Colonne di import trovate');
        } else {
            console.log('⚠️  Tabella contacts: Verifica manuale necessaria');
        }
    } catch (error) {
        console.log('❌ Tabella contacts: Enhancement non rilevabile automaticamente');
    }
    
    return allTablesCreated;
}

// Funzione principale
async function main() {
    const existingTables = await checkExistingTables();
    
    // Se le tabelle esistono già, skip la migrazione
    const allExist = Object.values(existingTables).every(status => status === 'ESISTE');
    if (allExist) {
        console.log('\n🎉 Tutte le tabelle esistono già! Migrazione già completata.');
        return await verifyMigration();
    }
    
    // Prova prima con CLI, poi con approccio diretto
    let migrationSuccess = await executeMigrationWithCLI();
    
    if (!migrationSuccess) {
        migrationSuccess = await executeMigrationDirect();
    }
    
    if (migrationSuccess) {
        console.log('\n🎉 MIGRAZIONE COMPLETATA!');
        return await verifyMigration();
    } else {
        console.log('\n⚠️ MIGRAZIONE NON AUTOMATICA - ISTRUZIONI MANUALI:');
        console.log('1. Apri https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi');
        console.log('2. Vai su SQL Editor');
        console.log('3. Esegui il file: supabase/migrations/20261012000002_contact_import_complete.sql');
        console.log('4. Richiama questo script per la verifica');
        return false;
    }
}

// Esegui
main().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
        console.log('🎉 TASK 1 PHASE 4.1 - COMPLETATO AL 100%! 🎉');
        console.log('✅ Database schema pronto per Task 2');
    } else {
        console.log('⚠️ COMPLETAMENTO MANUALE RICHIESTO');
        console.log('📋 Segui le istruzioni sopra');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 ERRORE CRITICO:', error);
    process.exit(1);
});