import { createClient } from '@supabase/supabase-js';

console.log('🔍 DEBUG VARIABILI D&apos;AMBIENTE NEL FRONTEND...');

// Come fa supabaseClient.ts
const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

console.log('🌐 URL Supabase:', supabaseUrl);
console.log('🔑 Anon Key presente:', !!supabaseAnonKey);
console.log('🔑 Anon Key (primi 50):', supabaseAnonKey?.substring(0, 50));

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ VARIABILI MANCANTI!');
} else {
    console.log('✅ Variabili presenti, test connessione...');

    try {
        const testClient = createClient(supabaseUrl, supabaseAnonKey);

        // Test immediato
        const testQuery = async () => {
            const { data, error } = await testClient
                .from('forms')
                .select('id, name')
                .limit(1);

            if (error) {
                console.log('❌ ERRORE CONNESSIONE:', error.message);
                console.log('📋 Codice:', error.code);
                console.log('📋 Hint:', error.hint);
            } else {
                console.log('✅ CONNESSIONE FUNZIONA!');
                console.log('📊 Forms trovati:', data?.length || 0);
            }
        };

        testQuery();

    } catch (err) {
        console.log('❌ ERRORE CLIENT:', err instanceof Error ? err.message : String(err));
    }
}

export default function DebugPage() {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Debug Variabili d&apos;Ambiente</h1>
            <p>Controlla la console del browser per i dettagli.</p>
            <div>
                <p><strong>URL Supabase:</strong> {supabaseUrl}</p>
                <p><strong>Anon Key presente:</strong> {supabaseAnonKey ? 'Sì' : 'No'}</p>
                {supabaseAnonKey && (
                    <p><strong>Anon Key (primi 50 caratteri):</strong> {supabaseAnonKey.substring(0, 50)}...</p>
                )}
            </div>
        </div>
    );
}