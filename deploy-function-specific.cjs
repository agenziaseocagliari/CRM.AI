const fs = require('fs');
const https = require('https');

// Configurazione
const PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || (() => {
    console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set');
    process.exit(1);
})();
const FUNCTION_NAME = 'generate-form-fields';

console.log('🚀 Tentando deploy specifico per generate-form-fields...');

// Leggi il codice della funzione
let functionCode;
try {
    functionCode = fs.readFileSync('FINAL_DEPLOY_generate-form-fields.ts', { encoding: 'utf8' });
    console.log(`📖 Codice funzione caricato: ${functionCode.length} caratteri`);
    console.log(`📝 Prime 200 caratteri: ${functionCode.substring(0, 200)}`);
    
    if (!functionCode || functionCode.trim().length === 0) {
        throw new Error('File vuoto o non leggibile');
    }
} catch (error) {
    console.error('❌ Errore lettura file:', error.message);
    process.exit(1);
}

// Prepare deployment data
const deploymentData = JSON.stringify({
    name: FUNCTION_NAME,
    slug: FUNCTION_NAME,
    source: functionCode,
    verify_jwt: false,
    import_map: {},
    entrypoint: 'index.ts'
});

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/functions`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(deploymentData),
        'User-Agent': 'Engineering-Fellow-Deploy/1.0'
    }
};

console.log(`🌐 Connessione a: https://${options.hostname}${options.path}`);
console.log(`📊 Dati payload: ${deploymentData.length} bytes`);

const req = https.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('\n🔍 Risposta completa:');
        console.log(responseData);
        
        try {
            const parsed = JSON.parse(responseData);
            console.log('\n📊 Parsed Response:', JSON.stringify(parsed, null, 2));
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('\n✅ DEPLOY RIUSCITO!');
                console.log('🧪 Ora testa la funzione...');
            } else {
                console.log('\n❌ DEPLOY FALLITO!');
            }
        } catch (parseError) {
            console.log('\n⚠️ Risposta non JSON:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Errore nella richiesta:', error.message);
});

console.log('📤 Invio richiesta...');
req.write(deploymentData);
req.end();