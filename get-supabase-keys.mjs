import dotenv from 'dotenv';

dotenv.config();

async function getSupabaseKeys() {
    console.log('🔑 RECUPERO CHIAVI SUPABASE CORRETTE...\n');

    const projectId = process.env.SUPABASE_PROJECT_ID;
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    console.log('📋 Project ID:', projectId);
    console.log('🎫 Access Token presente:', !!accessToken);

    try {
        console.log('\n📡 Chiamata API Supabase Management...');

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('❌ Errore API:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('📋 Dettagli errore:', errorText);
            return;
        }

        const keys = await response.json();
        console.log('✅ Chiavi recuperate con successo!');

        console.log('\n🔍 CHIAVI DISPONIBILI:');
        keys.forEach((key, index) => {
            console.log(`\n${index + 1}. ${key.name}:`);
            console.log(`   Role: ${key.tags}`);
            console.log(`   Key: ${key.api_key.substring(0, 50)}...`);

            if (key.tags === 'anon') {
                console.log('   ⭐ QUESTA È LA ANON KEY CORRETTA!');
            }
            if (key.tags === 'service_role') {
                console.log('   ⚙️ Service Role Key');
            }
        });

        // Trova la anon key corretta
        const anonKey = keys.find(k => k.tags === 'anon');
        if (anonKey) {
            console.log('\n✅ ANON KEY CORRETTA TROVATA:');
            console.log('VITE_SUPABASE_ANON_KEY=' + anonKey.api_key);

            console.log('\n📝 AGGIORNA IL FILE .env CON:');
            console.log(`VITE_SUPABASE_ANON_KEY=${anonKey.api_key}`);
        }

    } catch (error) {
        console.log('❌ Errore durante il recupero chiavi:', error.message);
    }
}

getSupabaseKeys();