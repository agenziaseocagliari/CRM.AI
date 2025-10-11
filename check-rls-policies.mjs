import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkRLSPolicies() {
    console.log('🔒 VERIFICA RLS POLICIES...\n');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Query le policies della tabella forms
        console.log('🔍 Controllo policies tabella FORMS...');
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'forms');

        if (policiesError) {
            console.log('❌ Errore query policies:', policiesError.message);
        } else {
            console.log('📋 Policies trovate:', policies?.length || 0);

            policies?.forEach((policy, index) => {
                console.log(`\n${index + 1}. ${policy.policyname}:`);
                console.log(`   Comando: ${policy.cmd}`);
                console.log(`   Ruoli: ${policy.roles}`);
                console.log(`   Qual: ${policy.qual}`);
                console.log(`   With_check: ${policy.with_check}`);
            });
        }

        // Controlliamo se RLS è abilitato
        console.log('\n🔒 Controllo stato RLS...');
        const { data: tables, error: tablesError } = await supabase
            .from('pg_tables')
            .select('*')
            .eq('tablename', 'forms')
            .eq('schemaname', 'public');

        if (tablesError) {
            console.log('❌ Errore controllo tabelle:', tablesError.message);
        } else {
            console.log('📊 Tabelle:', tables?.length || 0);
        }

        // Test diretto con anon role
        console.log('\n🧪 TEST ACCESSO ANONIMO...');
        const anonClient = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: anonData, error: anonError } = await anonClient
            .from('forms')
            .select('id, name, title')
            .limit(1);

        if (anonError) {
            console.log('❌ ANON ACCESS - Errore:', anonError.message);
            console.log('📋 Codice errore:', anonError.code);
            console.log('📋 Hint:', anonError.hint);
        } else {
            console.log('✅ ANON ACCESS - Funziona! Records:', anonData?.length || 0);
        }

        // Test con policy per public access
        console.log('\n🌐 VERIFICA PUBLIC FORM ACCESS...');

        // Proviamo a creare una policy temporanea per l'accesso pubblico
        const createPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Allow public read access for forms" 
      ON public.forms 
      FOR SELECT 
      USING (true);
    `;

        console.log('🔧 Tentativo creazione policy pubblica...');
        const { error: createError } = await supabase.rpc('sql', {
            query: createPolicySQL
        });

        if (createError) {
            console.log('❌ Errore creazione policy:', createError.message);
        } else {
            console.log('✅ Policy pubblica creata/verificata');

            // Ritest con anon
            const { data: retestData, error: retestError } = await anonClient
                .from('forms')
                .select('id, name, title')
                .limit(1);

            if (retestError) {
                console.log('❌ RETEST - Errore:', retestError.message);
            } else {
                console.log('✅ RETEST - Funziona! Records:', retestData?.length || 0);
            }
        }

    } catch (error) {
        console.log('❌ Errore generale:', error.message);
    }
}

checkRLSPolicies();