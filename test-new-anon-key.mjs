import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testNewAnonKey() {
    console.log('🧪 TEST NUOVA ANON KEY...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const oldAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Questa è la nuova anon key dalla API
    const newAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODI2MTQsImV4cCI6MjA1ODE1ODYxNH0.mRGGr9gQFtYNL4OMGX4q7cplJxRBZUyL5FPzZNxcgM4";

    console.log('🔑 Chiave vecchia (primi 30):', oldAnonKey?.substring(0, 30));
    console.log('🔑 Chiave nuova (primi 30):', newAnonKey.substring(0, 30));

    console.log('\n🧪 TEST CHIAVE VECCHIA...');
    try {
        const oldClient = createClient(supabaseUrl, oldAnonKey);
        const { data: oldData, error: oldError } = await oldClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (oldError) {
            console.log('❌ VECCHIA - Errore:', oldError.message);
        } else {
            console.log('✅ VECCHIA - Funziona! Records:', oldData?.length || 0);
        }
    } catch (err) {
        console.log('❌ VECCHIA - Eccezione:', err.message);
    }

    console.log('\n🧪 TEST CHIAVE NUOVA...');
    try {
        const newClient = createClient(supabaseUrl, newAnonKey);
        const { data: newData, error: newError } = await newClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (newError) {
            console.log('❌ NUOVA - Errore:', newError.message);
        } else {
            console.log('✅ NUOVA - Funziona! Records:', newData?.length || 0);
            console.log('🎯 SOLUZIONE TROVATA!');

            console.log('\n📝 AGGIORNA IL FILE .env:');
            console.log(`VITE_SUPABASE_ANON_KEY=${newAnonKey}`);
        }
    } catch (err) {
        console.log('❌ NUOVA - Eccezione:', err.message);
    }

    // Analizziamo entrambe le chiavi JWT
    console.log('\n🔍 ANALISI JWT...');

    function analyzeJWT(token, name) {
        try {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            console.log(`🔍 ${name}:`, {
                role: payload.role,
                iat: new Date(payload.iat * 1000).toISOString(),
                exp: new Date(payload.exp * 1000).toISOString(),
                expired: payload.exp * 1000 < Date.now()
            });
        } catch (err) {
            console.log(`❌ ${name}: Errore parsing:`, err.message);
        }
    }

    analyzeJWT(oldAnonKey, 'VECCHIA KEY');
    analyzeJWT(newAnonKey, 'NUOVA KEY');
}

testNewAnonKey();