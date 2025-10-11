import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testUserProvidedKey() {
    console.log('🧪 TEST CHIAVE FORNITA DALL\'UTENTE...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const userKey = "735dd891149e6035d1445bf2ea02fb4344f1db5bacb66afc1e98c07a762928ef";

    console.log('🌐 URL Supabase:', supabaseUrl);
    console.log('🔑 Chiave utente:', userKey);
    console.log('📅 Data chiave: 10 Oct 2025 21:47:55 (+0000)');

    console.log('\n🔍 ANALISI FORMATO CHIAVE...');
    console.log('  - Lunghezza:', userKey.length, 'caratteri');
    console.log('  - Formato:', userKey.length === 64 ? 'HEX (64 chars)' : 'Formato sconosciuto');
    console.log('  - Tipo:', userKey.startsWith('eyJ') ? 'JWT' : 'Non-JWT');

    console.log('\n🧪 TEST CONNESSIONE CON CHIAVE UTENTE...');

    try {
        const testClient = createClient(supabaseUrl, userKey);

        // Test auth
        console.log('🔐 Test autenticazione...');
        const { data: session, error: authError } = await testClient.auth.getSession();

        if (authError) {
            console.log('❌ AUTH - Errore:', authError.message);
        } else {
            console.log('✅ AUTH - Funziona! Session:', !!session.session);
        }

        // Test database query
        console.log('\n📊 Test query database...');
        const { data: formsData, error: dbError } = await testClient
            .from('forms')
            .select('id, name, title')
            .limit(1);

        if (dbError) {
            console.log('❌ DATABASE - Errore:', dbError.message);
            console.log('📋 Codice:', dbError.code);
            console.log('📋 Hint:', dbError.hint);
        } else {
            console.log('✅ DATABASE - Funziona! Records:', formsData?.length || 0);
            if (formsData?.length > 0) {
                console.log('📄 Primo form:', formsData[0]);
            }
        }

        // Test specifico per form pubblico
        console.log('\n🌐 Test caricamento form pubblico...');
        const { data: publicForm, error: publicError } = await testClient
            .from('forms')
            .select('*')
            .eq('id', '26e1ad32-7952-46d2-9777-51fe6ccee01d')
            .single();

        if (publicError) {
            console.log('❌ PUBLIC FORM - Errore:', publicError.message);
        } else {
            console.log('✅ PUBLIC FORM - Trovato!');
            console.log('  - ID:', publicForm.id);
            console.log('  - Nome:', publicForm.name);
            console.log('  - Styling presente:', !!publicForm.styling);
        }

    } catch (error) {
        console.log('❌ ERRORE GENERALE:', error.message);
    }

    // Se funziona, aggiorniamo il .env
    console.log('\n📝 Se la chiave funziona, aggiorna .env con:');
    console.log(`VITE_SUPABASE_ANON_KEY=${userKey}`);
}

testUserProvidedKey();