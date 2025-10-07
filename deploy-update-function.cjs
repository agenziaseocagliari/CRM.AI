const fs = require('fs');
const https = require('https');

// Configurazione
const PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const ACCESS_TOKEN = 'sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f';
const FUNCTION_NAME = 'generate-form-fields';

console.log('🚀 Aggiornando funzione esistente generate-form-fields...');

// Leggi il codice della funzione
let functionCode;
try {
    functionCode = fs.readFileSync('TEST_generate-form-fields.ts', { encoding: 'utf8' });
    console.log(`📖 Codice funzione caricato: ${functionCode.length} caratteri`);
    
    if (!functionCode || functionCode.trim().length === 0) {
        throw new Error('File vuoto o non leggibile');
    }
} catch (error) {
    console.error('❌ Errore lettura file:', error.message);
    process.exit(1);
}

// Payload per UPDATE della funzione esistente
const updateData = JSON.stringify({
    body: functionCode,
    verify_jwt: false
});

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`,
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateData),
        'User-Agent': 'Engineering-Fellow-Update/1.0'
    }
};

console.log(`🌐 Aggiornamento a: https://${options.hostname}${options.path}`);
console.log(`📊 Payload size: ${updateData.length} bytes`);

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
            if (responseData.trim()) {
                const parsed = JSON.parse(responseData);
                console.log('\n📊 Parsed Response:', JSON.stringify(parsed, null, 2));
            }
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('\n✅ UPDATE RIUSCITO!');
                console.log('🧪 Ora testa la funzione generate-form-fields...');
                
                // Test immediato della funzione
                setTimeout(() => {
                    console.log('\n🧪 Testing function...');
                    testFunction();
                }, 2000);
                
            } else {
                console.log('\n❌ UPDATE FALLITO!');
            }
        } catch (parseError) {
            console.log('\n⚠️ Risposta non JSON o vuota:', responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ Ma status code positivo - probabilmente riuscito!');
            }
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Errore nella richiesta:', error.message);
});

console.log('📤 Invio richiesta di update...');
req.write(updateData);
req.end();

// Funzione per testare dopo l'update
function testFunction() {
    const testData = JSON.stringify({
        prompt: "Test form generation",
        organization_id: "test-org-123"
    });

    const testOptions = {
        hostname: 'qjtaqrlpronohgpfdxsi.supabase.co',
        port: 443,
        path: '/functions/v1/generate-form-fields',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Length': Buffer.byteLength(testData)
        }
    };

    const testReq = https.request(testOptions, (testRes) => {
        console.log(`🧪 Test Status: ${testRes.statusCode}`);
        let testData = '';
        
        testRes.on('data', (chunk) => {
            testData += chunk;
        });

        testRes.on('end', () => {
            console.log('🧪 Test Response:', testData);
            if (testRes.statusCode === 200) {
                console.log('🎉 FUNZIONE OPERATIVA!');
            } else {
                console.log('⚠️ Funzione ancora non funzionante...');
            }
        });
    });

    testReq.on('error', (error) => {
        console.log('❌ Errore nel test:', error.message);
    });

    testReq.write(testData);
    testReq.end();
}