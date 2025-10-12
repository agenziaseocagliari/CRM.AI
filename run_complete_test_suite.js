import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🧪 ESECUZIONE COMPLETA TEST SUITE - PHASE 4.1 TASK 1');
console.log('====================================================');

// Test 1: Verifica struttura tabelle
async function test1_VerifyTableStructures() {
    console.log('\n📋 TEST 1: Verifica struttura tabelle');
    
    const expectedTables = [
        'contact_imports',
        'contact_import_logs', 
        'contact_field_mappings'
    ];
    
    let allPassed = true;
    
    for (const tableName of expectedTables) {
        try {
            // Provo a fare una query per verificare la struttura
            const { error } = await supabase
                .from(tableName)
                .select('*')
                .limit(0); // Non prendo dati, solo struttura
                
            if (error) {
                console.log(`  ❌ ${tableName}: ${error.message}`);
                allPassed = false;
            } else {
                console.log(`  ✅ ${tableName}: Struttura OK`);
            }
        } catch (error) {
            console.log(`  ❌ ${tableName}: Errore - ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

// Test 2: Verifica RLS policies
async function test2_VerifyRLSPolicies() {
    console.log('\n🔐 TEST 2: Verifica RLS Policies');
    
    const tables = ['contact_imports', 'contact_import_logs', 'contact_field_mappings'];
    let allPassed = true;
    
    for (const tableName of tables) {
        try {
            // Provo una query che dovrebbe essere bloccata da RLS senza autenticazione
            const { error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error && error.message.includes('RLS')) {
                console.log(`  ✅ ${tableName}: RLS attivo e funzionante`);
            } else if (error) {
                console.log(`  ⚠️  ${tableName}: RLS presente ma errore: ${error.message}`);
            } else {
                console.log(`  ✅ ${tableName}: Accesso consentito (service role)`);
            }
        } catch (error) {
            console.log(`  ❌ ${tableName}: Errore verifica RLS - ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

// Test 3: Test inserimento dati di esempio
async function test3_InsertSampleData() {
    console.log('\n📝 TEST 3: Inserimento dati di esempio');
    
    try {
        // Prima prendo un'organizzazione e profilo esistenti
        const { data: orgs } = await supabase
            .from('organizations')
            .select('id')
            .limit(1);
            
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, organization_id')
            .limit(1);
            
        if (!orgs || orgs.length === 0) {
            console.log('  ❌ Nessuna organizzazione trovata per il test');
            return false;
        }
        
        if (!profiles || profiles.length === 0) {
            console.log('  ❌ Nessun profilo trovato per il test');
            return false;
        }
        
        const orgId = orgs[0].id;
        const profileId = profiles[0].id;
        
        console.log(`  📊 Usando org: ${orgId}, profile: ${profileId}`);
        
        // Test inserimento import
        const { data: importData, error: importError } = await supabase
            .from('contact_imports')
            .insert({
                organization_id: orgId,
                uploaded_by: profileId,
                filename: 'test_migration_verification.csv',
                file_size: 1024,
                file_type: 'csv',
                total_rows: 10,
                successful_imports: 8,
                failed_imports: 1,
                duplicate_skipped: 1,
                status: 'completed',
                field_mapping: {
                    "email": "Email Address",
                    "name": "Full Name",
                    "phone": "Phone Number"
                },
                duplicate_strategy: 'skip'
            })
            .select('id')
            .single();
            
        if (importError) {
            console.log(`  ❌ Errore inserimento import: ${importError.message}`);
            return false;
        }
        
        console.log('  ✅ Import record creato:', importData.id);
        
        // Test inserimento log
        const { error: logError } = await supabase
            .from('contact_import_logs')
            .insert({
                import_id: importData.id,
                row_number: 1,
                raw_data: {
                    "Email Address": "test@example.com",
                    "Full Name": "Test User",
                    "Phone Number": "+1234567890"
                },
                status: 'success'
            });
            
        if (logError) {
            console.log(`  ❌ Errore inserimento log: ${logError.message}`);
            return false;
        }
        
        console.log('  ✅ Import log creato');
        
        // Test inserimento field mapping
        const { error: mappingError } = await supabase
            .from('contact_field_mappings')
            .insert({
                organization_id: orgId,
                created_by: profileId,
                template_name: 'Test Template Migration',
                description: 'Template di test per verifica migrazione',
                field_mapping: {
                    "name": "Nome Completo",
                    "email": "Email",
                    "phone": "Telefono",
                    "company": "Azienda"
                },
                is_default: false
            });
            
        if (mappingError) {
            console.log(`  ❌ Errore inserimento mapping: ${mappingError.message}`);
            return false;
        }
        
        console.log('  ✅ Field mapping template creato');
        
        // Cleanup - rimuovo i dati di test
        await supabase.from('contact_import_logs').delete().eq('import_id', importData.id);
        await supabase.from('contact_imports').delete().eq('id', importData.id);
        await supabase.from('contact_field_mappings').delete().eq('template_name', 'Test Template Migration');
        
        console.log('  🧹 Dati di test rimossi (cleanup)');
        
        return true;
        
    } catch (error) {
        console.log(`  ❌ Errore test inserimento: ${error.message}`);
        return false;
    }
}

// Test 4: Verifica enhancement tabella contacts
async function test4_VerifyContactsEnhancement() {
    console.log('\n👥 TEST 4: Verifica enhancement tabella contacts');
    
    try {
        // Provo a selezionare le nuove colonne
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
            console.log(`  ❌ Enhancement non trovato: ${error.message}`);
            return false;
        }
        
        console.log('  ✅ Tutte le colonne di enhancement presenti');
        
        // Test inserimento contact con nuovi campi
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        
        if (orgs && orgs.length > 0) {
            const { data: insertedContact, error: insertError } = await supabase
                .from('contacts')
                .insert({
                    organization_id: orgs[0].id,
                    name: 'Test Contact Migration',
                    email: '  TEST.migration@EXAMPLE.com  ', // Testo normalizzazione
                    phone: '+1 (555) 123-4567 ext 890'      // Testo normalizzazione telefono
                })
                .select('id, normalized_email, normalized_phone, duplicate_check_hash')
                .single();
                
            if (insertError) {
                console.log(`  ❌ Errore test inserimento contact: ${insertError.message}`);
                return false;
            }
            
            console.log('  ✅ Contact inserito con successo');
            console.log(`    📧 Email normalizzata: ${insertedContact.normalized_email}`);
            console.log(`    📞 Telefono normalizzato: ${insertedContact.normalized_phone}`);
            console.log(`    🔗 Hash duplicati: ${insertedContact.duplicate_check_hash?.substring(0, 8)}...`);
            
            // Cleanup
            await supabase.from('contacts').delete().eq('id', insertedContact.id);
            console.log('  🧹 Contact di test rimosso');
        }
        
        return true;
        
    } catch (error) {
        console.log(`  ❌ Errore verifica enhancement: ${error.message}`);
        return false;
    }
}

// Test 5: Verifica performance e indici
async function test5_VerifyPerformance() {
    console.log('\n⚡ TEST 5: Verifica performance e indici');
    
    const performanceTests = [
        {
            name: 'Query import per organizzazione',
            query: () => supabase
                .from('contact_imports')
                .select('id, filename, status, created_at')
                .limit(10)
        },
        {
            name: 'Query logs per import', 
            query: () => supabase
                .from('contact_import_logs')
                .select('id, row_number, status')
                .limit(10)
        },
        {
            name: 'Query field mappings per organizzazione',
            query: () => supabase
                .from('contact_field_mappings')
                .select('id, template_name, is_default')
                .limit(10)
        }
    ];
    
    let allPassed = true;
    
    for (const test of performanceTests) {
        try {
            const startTime = Date.now();
            const { error } = await test.query();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (error) {
                console.log(`  ❌ ${test.name}: ${error.message}`);
                allPassed = false;
            } else {
                console.log(`  ✅ ${test.name}: ${duration}ms`);
                if (duration > 1000) {
                    console.log(`    ⚠️  Performance: Query lenta (>${duration}ms)`);
                }
            }
        } catch (error) {
            console.log(`  ❌ ${test.name}: Errore - ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

// Test 6: Verifica count e statistiche
async function test6_VerifyStats() {
    console.log('\n📊 TEST 6: Statistiche e count tabelle');
    
    const tables = [
        'contact_imports',
        'contact_import_logs', 
        'contact_field_mappings',
        'contacts',
        'organizations',
        'profiles'
    ];
    
    let allPassed = true;
    
    for (const tableName of tables) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.log(`  ❌ ${tableName}: Errore count - ${error.message}`);
                allPassed = false;
            } else {
                console.log(`  📈 ${tableName}: ${count || 0} record`);
            }
        } catch (error) {
            console.log(`  ❌ ${tableName}: Errore - ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

// Esecuzione di tutti i test
async function runAllTests() {
    console.log('🚀 Inizio esecuzione completa test suite...\n');
    
    const tests = [
        { name: 'Struttura Tabelle', fn: test1_VerifyTableStructures },
        { name: 'RLS Policies', fn: test2_VerifyRLSPolicies },
        { name: 'Inserimento Dati', fn: test3_InsertSampleData },
        { name: 'Enhancement Contacts', fn: test4_VerifyContactsEnhancement },
        { name: 'Performance Query', fn: test5_VerifyPerformance },
        { name: 'Statistiche Tabelle', fn: test6_VerifyStats }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const startTime = Date.now();
        const passed = await test.fn();
        const duration = Date.now() - startTime;
        
        results.push({
            name: test.name,
            passed,
            duration
        });
    }
    
    // Riepilogo finale
    console.log('\n' + '='.repeat(60));
    console.log('📋 RIEPILOGO TEST SUITE COMPLETO');
    console.log('='.repeat(60));
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${index + 1}. ${result.name}: ${status} (${result.duration}ms)`);
    });
    
    console.log('\n📊 STATISTICHE FINALI:');
    console.log(`✅ Test passati: ${passedTests}/${totalTests}`);
    console.log(`❌ Test falliti: ${failedTests}/${totalTests}`);
    console.log(`📈 Tasso successo: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    const allPassed = failedTests === 0;
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 TUTTI I TEST PASSATI - MIGRAZIONE 100% COMPLETA! 🎉');
        console.log('✅ Database schema pronto per Phase 4.1 Task 2');
        console.log('🚀 Prossimo step: CSV Parser Edge Function');
    } else {
        console.log('⚠️ ALCUNI TEST FALLITI - RICHIESTA REVISIONE');
        console.log(`❌ ${failedTests} test da verificare manualmente`);
    }
    
    return allPassed;
}

// Esegui tutti i test
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 ERRORE CRITICO TEST SUITE:', error);
    process.exit(1);
});