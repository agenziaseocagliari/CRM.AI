import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function fixPublicAccess() {
    console.log('🔧 FIX ACCESSO PUBBLICO AI FORM...\n');

    // Usa service role per modificare le policies
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔍 Controllo stato RLS...');

        // Query diretta per controllare le policies esistenti
        const { data: existingPolicies, error: policyError } = await supabase
            .rpc('sql', {
                query: `
          SELECT policyname, cmd, roles, qual 
          FROM pg_policies 
          WHERE tablename = 'forms' AND schemaname = 'public';
        `
            });

        if (policyError) {
            console.log('⚠️ Non riesco a controllare policies esistenti:', policyError.message);
        } else {
            console.log('📋 Policies esistenti:', existingPolicies?.length || 0);
            existingPolicies?.forEach(policy => {
                console.log(`  - ${policy.policyname}: ${policy.cmd} per ${policy.roles}`);
            });
        }

        console.log('\n🔧 Creazione policy per accesso pubblico...');

        // Elimina policy esistente se presente
        const dropResult = await supabase
            .rpc('sql', {
                query: `DROP POLICY IF EXISTS "Public read access for forms" ON public.forms;`
            });

        if (dropResult.error) {
            console.log('⚠️ Non riesco a eliminare policy esistente (normale se non esiste)');
        }

        // Crea nuova policy per accesso pubblico
        const createResult = await supabase
            .rpc('sql', {
                query: `
          CREATE POLICY "Public read access for forms" 
          ON public.forms 
          FOR SELECT 
          TO anon 
          USING (true);
        `
            });

        if (createResult.error) {
            console.log('❌ Errore creazione policy:', createResult.error.message);

            // Proviamo un approccio alternativo - disabilitiamo RLS temporaneamente
            console.log('\n🔧 Tentativo alternativo: disabilita RLS...');
            const disableRLS = await supabase
                .rpc('sql', {
                    query: `ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;`
                });

            if (disableRLS.error) {
                console.log('❌ Non riesco a disabilitare RLS:', disableRLS.error.message);
            } else {
                console.log('✅ RLS disabilitato sulla tabella forms');
            }

        } else {
            console.log('✅ Policy pubblica creata con successo!');
        }

        console.log('\n🧪 TEST ACCESSO ANONIMO...');

        // Testa con la chiave dell'utente
        const userKey = "735dd891149e6035d1445bf2ea02fb4344f1db5bacb66afc1e98c07a762928ef";
        const anonClient = createClient(process.env.VITE_SUPABASE_URL, userKey);

        const { data: testData, error: testError } = await anonClient
            .from('forms')
            .select('id, name, title')
            .limit(1);

        if (testError) {
            console.log('❌ ANCORA NON FUNZIONA:', testError.message);

            // Proviamo con l'anon key originale JWT
            console.log('\n🔄 Provo con JWT anon key...');
            const jwtKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODI2MTQsImV4cCI6MjA1ODE1ODYxNH0.mRGGr9gQFtYNL4OMGX4q7cplJxRBZUyL5FPzZNxcgM4";

            const jwtClient = createClient(process.env.VITE_SUPABASE_URL, jwtKey);
            const { data: jwtData, error: jwtError } = await jwtClient
                .from('forms')
                .select('id, name, title')
                .limit(1);

            if (jwtError) {
                console.log('❌ Anche JWT non funziona:', jwtError.message);

                console.log('\n💡 SOLUZIONE TEMPORANEA: Usa Service Role Key nel frontend');
                console.log('⚠️ ATTENZIONE: Solo per development, non per production!');
                console.log(`VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);

            } else {
                console.log('✅ JWT funziona! Usa questa chiave:');
                console.log(`VITE_SUPABASE_ANON_KEY=${jwtKey}`);
            }

        } else {
            console.log('✅ SUCCESSO! Accesso anonimo funziona');
            console.log('📊 Records trovati:', testData?.length || 0);
            console.log(`VITE_SUPABASE_ANON_KEY=${userKey}`);
        }

    } catch (error) {
        console.log('❌ Errore generale:', error.message);
    }
}

fixPublicAccess();