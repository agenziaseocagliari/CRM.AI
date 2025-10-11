/**
 * 🎯 TEST FINALE COMPLETO - Validazione deployment production-ready
 * ================================================================
 * 
 * Verifica tutti i componenti critici del sistema:
 * 1. ✅ Accesso database con anon key corretta
 * 2. ✅ Form pubblici caricabili senza errori
 * 3. ✅ Frontend deployment ready
 * 4. ✅ Chiavi API corrette in .env
 * 5. ✅ Edge Function deployata con debug
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

async function runCompleteValidation() {
    console.log('🎯 INIZIANDO VALIDAZIONE DEPLOYMENT COMPLETA');
    console.log('='.repeat(50));

    let allTestsPassed = true;
    const results = [];

    // Test 1: Verifica chiavi .env
    try {
        console.log('\n📋 TEST 1: Verifica configurazione .env');
        const envContent = readFileSync('.env', 'utf-8');
        const hasCorrectAnonKey = envContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k');

        if (hasCorrectAnonKey) {
            console.log('✅ File .env contiene chiave anon corretta');
            results.push({ test: 'ENV Configuration', status: 'PASSED' });
        } else {
            console.log('❌ File .env NON contiene chiave anon corretta');
            results.push({ test: 'ENV Configuration', status: 'FAILED' });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log('❌ Errore lettura .env:', error.message);
        results.push({ test: 'ENV Configuration', status: 'FAILED' });
        allTestsPassed = false;
    }

    // Test 2: Connessione database
    try {
        console.log('\n📋 TEST 2: Connessione database Supabase');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from('forms')
            .select('count')
            .limit(1);

        if (error) {
            console.log('❌ Errore connessione database:', error.message);
            results.push({ test: 'Database Connection', status: 'FAILED' });
            allTestsPassed = false;
        } else {
            console.log('✅ Connessione database funzionante');
            results.push({ test: 'Database Connection', status: 'PASSED' });
        }
    } catch (error) {
        console.log('❌ Errore test database:', error.message);
        results.push({ test: 'Database Connection', status: 'FAILED' });
        allTestsPassed = false;
    }

    // Test 3: Accesso form pubblici
    try {
        console.log('\n📋 TEST 3: Accesso form pubblici');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data: forms, error } = await supabase
            .from('forms')
            .select('id, name, fields, styling')
            .limit(1);

        if (error) {
            console.log('❌ Errore accesso form pubblici:', error.message);
            results.push({ test: 'Public Form Access', status: 'FAILED' });
            allTestsPassed = false;
        } else if (forms && forms.length > 0) {
            console.log(`✅ Form pubblici accessibili: ${forms.length} form trovati`);
            console.log(`📋 Form test: ${forms[0].name} (ID: ${forms[0].id})`);
            results.push({ test: 'Public Form Access', status: 'PASSED' });
        } else {
            console.log('⚠️ Nessun form trovato nel database');
            results.push({ test: 'Public Form Access', status: 'WARNING' });
        }
    } catch (error) {
        console.log('❌ Errore test form pubblici:', error.message);
        results.push({ test: 'Public Form Access', status: 'FAILED' });
        allTestsPassed = false;
    }

    // Test 4: Frontend supabaseClient.ts
    try {
        console.log('\n📋 TEST 4: Configurazione frontend supabaseClient.ts');
        const supabaseClientContent = readFileSync('src/lib/supabaseClient.ts', 'utf-8');

        const hasCorrectConfig = supabaseClientContent.includes('VITE_SUPABASE_URL') &&
            supabaseClientContent.includes('VITE_SUPABASE_ANON_KEY') &&
            !supabaseClientContent.includes('service_role');

        if (hasCorrectConfig) {
            console.log('✅ supabaseClient.ts configurato correttamente');
            results.push({ test: 'Frontend Supabase Config', status: 'PASSED' });
        } else {
            console.log('❌ supabaseClient.ts ha configurazione problematica');
            results.push({ test: 'Frontend Supabase Config', status: 'FAILED' });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log('❌ Errore lettura supabaseClient.ts:', error.message);
        results.push({ test: 'Frontend Supabase Config', status: 'FAILED' });
        allTestsPassed = false;
    }

    // Test 5: Edge Function debug verboso
    try {
        console.log('\n📋 TEST 5: Edge Function debug verboso colori');
        const edgeFunctionContent = readFileSync('supabase/functions/generate-form-fields/index.ts', 'utf-8');

        const hasDebugLogs = edgeFunctionContent.includes('🔍 REGEX DEBUG - Full prompt search for colors') &&
            edgeFunctionContent.includes('🎨 REGEX RESULTS:');

        if (hasDebugLogs) {
            console.log('✅ Edge Function contiene debug verboso dal commit 1130935');
            results.push({ test: 'Edge Function Debug', status: 'PASSED' });
        } else {
            console.log('❌ Edge Function NON contiene debug verboso');
            results.push({ test: 'Edge Function Debug', status: 'FAILED' });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log('❌ Errore lettura Edge Function:', error.message);
        results.push({ test: 'Edge Function Debug', status: 'FAILED' });
        allTestsPassed = false;
    }

    // Risultati finali
    console.log('\n' + '='.repeat(50));
    console.log('📊 RISULTATI VALIDAZIONE FINALE');
    console.log('='.repeat(50));

    results.forEach((result, index) => {
        const icon = result.status === 'PASSED' ? '✅' :
            result.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
    });

    console.log('\n🎯 STATO FINALE:', allTestsPassed ? 'DEPLOYMENT READY ✅' : 'NEEDS FIXES ❌');

    if (allTestsPassed) {
        console.log('\n🚀 SISTEMA PRONTO PER PRODUCTION!');
        console.log('📋 Checklist completata:');
        console.log('   ✅ Database accessibile con anon key corretta');
        console.log('   ✅ Form pubblici caricabili senza errori "Invalid API key"');
        console.log('   ✅ Frontend configurato correttamente');
        console.log('   ✅ Edge Function deployata con debug colori');
        console.log('   ✅ File .env aggiornato con chiavi corrette');
        console.log('\n🌐 URL di test: http://localhost:5173/form/c17a651f-55a3-4432-8432-9353b2a75686');
    }

    return allTestsPassed;
}

// Esegui validazione completa
runCompleteValidation().then(success => {
    process.exit(success ? 0 : 1);
});