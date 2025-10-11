import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseKeys() {
    console.log('🔑 TEST CHIAVI SUPABASE...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🌐 URL Supabase:', supabaseUrl);
    console.log('🔑 Anon Key (primi 20):', anonKey?.substring(0, 20));
    console.log('🔑 Service Key (primi 20):', serviceKey?.substring(0, 20));

    // Test con ANON KEY
    console.log('\n🧪 TEST 1: ANON KEY...');
    try {
        const anonClient = createClient(supabaseUrl, anonKey);
        const { data: anonData, error: anonError } = await anonClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (anonError) {
            console.log('❌ ANON KEY - Errore:', anonError.message);
        } else {
            console.log('✅ ANON KEY - Funziona! Records:', anonData?.length || 0);
        }
    } catch (err) {
        console.log('❌ ANON KEY - Eccezione:', err.message);
    }

    // Test con SERVICE ROLE KEY
    console.log('\n🧪 TEST 2: SERVICE ROLE KEY...');
    try {
        const serviceClient = createClient(supabaseUrl, serviceKey);
        const { data: serviceData, error: serviceError } = await serviceClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (serviceError) {
            console.log('❌ SERVICE KEY - Errore:', serviceError.message);
        } else {
            console.log('✅ SERVICE KEY - Funziona! Records:', serviceData?.length || 0);
        }
    } catch (err) {
        console.log('❌ SERVICE KEY - Eccezione:', err.message);
    }

    // Controlliamo la validità delle chiavi JWT
    console.log('\n🔍 ANALISI CHIAVI JWT...');

    function analyzeJWT(token, name) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.log(`❌ ${name}: Non è un JWT valido`);
                return;
            }

            const payload = JSON.parse(atob(parts[1]));
            console.log(`🔍 ${name}:`, {
                iss: payload.iss,
                ref: payload.ref,
                role: payload.role,
                exp: new Date(payload.exp * 1000).toISOString(),
                expired: payload.exp * 1000 < Date.now()
            });
        } catch (err) {
            console.log(`❌ ${name}: Errore parsing JWT:`, err.message);
        }
    }

    analyzeJWT(anonKey, 'ANON KEY');
    analyzeJWT(serviceKey, 'SERVICE KEY');
}

testSupabaseKeys();