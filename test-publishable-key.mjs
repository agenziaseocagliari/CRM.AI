import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testPublishableKey() {
    console.log('🧪 TEST PUBLISHABLE KEY...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    // Questa è la publishable key dalla API
    const publishableKey = "sb_publishable_asHI5rlFCnNIiYDzrGnIKA_1l9FRbYKJGFNZdH4YQaDJD8tNvSKaJ3lUIb7-qB";

    console.log('🔑 Publishable Key (primi 40):', publishableKey.substring(0, 40));

    console.log('\n🧪 TEST PUBLISHABLE KEY...');
    try {
        const publishableClient = createClient(supabaseUrl, publishableKey);
        const { data: publishableData, error: publishableError } = await publishableClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (publishableError) {
            console.log('❌ PUBLISHABLE - Errore:', publishableError.message);
            console.log('📋 Dettagli:', publishableError);
        } else {
            console.log('✅ PUBLISHABLE - Funziona! Records:', publishableData?.length || 0);
            console.log('🎯 SOLUZIONE TROVATA!');

            console.log('\n📝 AGGIORNA IL FILE .env:');
            console.log(`VITE_SUPABASE_ANON_KEY=${publishableKey}`);

            console.log('\n✅ QUESTA È LA CHIAVE CORRETTA DA USARE NEL FRONTEND!');
        }
    } catch (err) {
        console.log('❌ PUBLISHABLE - Eccezione:', err.message);
    }

    // Test anche auth per essere sicuri
    console.log('\n🔐 TEST AUTENTICAZIONE...');
    try {
        const authClient = createClient(supabaseUrl, publishableKey);
        const { data: session, error: authError } = await authClient.auth.getSession();

        if (authError) {
            console.log('❌ AUTH - Errore:', authError.message);
        } else {
            console.log('✅ AUTH - Funziona! Session:', !!session.session);
        }
    } catch (err) {
        console.log('❌ AUTH - Eccezione:', err.message);
    }
}

testPublishableKey();