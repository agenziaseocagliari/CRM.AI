// Engineering Fellow - Direct Supabase API Deploy Script
const fs = require('fs');
const https = require('https');

const SUPABASE_PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || (() => {
    console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set');
    process.exit(1);
})();
const FUNCTION_NAME = 'generate-form-fields';

console.log('🚀 Engineering Fellow - Direct API Deployment');
console.log('===============================================');

// Read the corrected function code
const functionPath = `./supabase/functions/${FUNCTION_NAME}/index.ts`;
const functionCode = fs.readFileSync(functionPath, 'utf8');

console.log(`📁 Function loaded: ${functionCode.length} characters`);

// Verify the fix is applied
if (functionCode.includes('supabaseClient.functions.invoke')) {
    console.error('❌ CRITICAL: Function still contains broken invoke method!');
    process.exit(1);
}

if (functionCode.includes('fetch(`${supabaseUrl}/functions/v1/consume-credits`')) {
    console.log('✅ CONFIRMED: Direct fetch implementation found');
} else {
    console.error('❌ WARNING: Expected direct fetch not found');
}

console.log('🔧 Deploying via Supabase API...');

const deployData = JSON.stringify({
    slug: FUNCTION_NAME,
    body: functionCode,
    verify_jwt: false
});

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${SUPABASE_PROJECT_REF}/functions/${FUNCTION_NAME}`,
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(deployData)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ SUCCESS: Edge Function deployed successfully!');
            console.log('🎯 FormMaster should now be operational!');
        } else {
            console.error('❌ DEPLOYMENT FAILED');
            console.error('Response:', data);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Network Error:', err.message);
});

req.write(deployData);
req.end();