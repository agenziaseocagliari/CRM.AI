import dotenv from 'dotenv';

// Carica le variabili dal file .env
dotenv.config();

console.log('🔍 VERIFICA VARIABILI D\'AMBIENTE...\n');

console.log('📁 File .env variables:');
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('  VITE_SUPABASE_ANON_KEY presente:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('  VITE_SUPABASE_ANON_KEY (primi 20 chars):', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

console.log('\n🧪 TEST CONNESSIONE SUPABASE...');

import { createClient } from '@supabase/supabase-js';

try {
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log('✅ Client Supabase creato correttamente');

    // Test semplice
    const { data, error } = await supabase
        .from('forms')
        .select('id, name')
        .limit(1);

    if (error) {
        console.log('❌ Errore nel test query:', error.message);
        console.log('📋 Dettagli errore:', error);
    } else {
        console.log('✅ Query test riuscita:', data?.length || 0, 'records trovati');
    }

} catch (err) {
    console.log('❌ Errore creazione client:', err.message);
}

console.log('\n🌐 SIMULAZIONE FRONTEND...');
console.log('Nel frontend, le variabili sono accessibili via import.meta.env');
console.log('Questo potrebbe essere il problema - le variabili non sono disponibili nel runtime del browser');