#!/usr/bin/env node

/**
 * 🔐 TEST CREDENZIALI - Verifica Login
 * Testa se le credenziali funzionano con il database attuale
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.V9O8kPhCuIZiZaOOE-lLKv_yfUqwM9uMnXZojXANkzk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔐 TEST SISTEMA AUTENTICAZIONE\n');

async function testAuth() {
    try {
        console.log('1️⃣ Test connessione base...');

        // Test 1: Verifica connessione
        const { data: tables, error: tablesError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        if (tablesError) {
            console.log('❌ Errore connessione:', tablesError.message);
            return;
        }

        console.log('✅ Connessione database OK\n');

        // Test 2: Lista utenti esistenti (solo conteggio per privacy)
        console.log('2️⃣ Controllo utenti esistenti...');

        const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Utenti registrati: ${usersCount || 0}\n`);

        // Test 3: Verifica organizzazioni
        console.log('3️⃣ Controllo organizzazioni...');

        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, created_at')
            .limit(3);

        if (orgsError) {
            console.log('❌ Errore organizzazioni:', orgsError.message);
        } else {
            console.log(`📊 Organizzazioni trovate: ${orgs?.length || 0}`);
            orgs?.forEach(org => {
                console.log(`   • ${org.name} (${org.id})`);
            });
        }

        console.log('\n🎯 SUGGERIMENTI PER LOGIN:');
        console.log('   1. Verifica che l\'account esista in Vercel');
        console.log('   2. Usa CTRL+F5 per hard refresh');
        console.log('   3. Cancella cache browser per localhost:5173');
        console.log('   4. Verifica che .env sia caricato correttamente');

        // Test 4: Prova login con dati test (non reali)
        console.log('\n4️⃣ Test login generico...');

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'test123456'
        });

        if (authError) {
            if (authError.message.includes('Invalid login credentials')) {
                console.log('✅ Sistema auth funziona (credenziali test non valide - normale)');
            } else {
                console.log('⚠️  Possibile problema auth:', authError.message);
            }
        } else {
            console.log('🎉 Login test riuscito!');
        }

    } catch (error) {
        console.error('💥 Errore generale:', error);
    }
}

testAuth();