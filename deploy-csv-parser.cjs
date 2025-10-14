const fs = require('fs');
const https = require('https');

// Configuration
const PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || (() => {
    console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set');
    process.exit(1);
})();
const FUNCTION_NAME = 'parse-csv-upload';

console.log('🚀 Deploying CSV parser function...');

// Read function code
let functionCode;
try {
    functionCode = fs.readFileSync('supabase/functions/parse-csv-upload/index.ts', { encoding: 'utf8' });
    console.log(`📖 Function code loaded: ${functionCode.length} characters`);
    
    if (!functionCode || functionCode.trim().length === 0) {
        throw new Error('File empty or unreadable');
    }
} catch (error) {
    console.error('❌ Error reading file:', error.message);
    process.exit(1);
}

// Payload for updating existing function
const updateData = JSON.stringify({
    body: functionCode,
    verify_jwt: false
});

const postOptions = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`,
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateData)
    }
};

console.log('📡 Updating function via Supabase API...');

const req = https.request(postOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        
        try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 || res.statusCode === 201) {
                console.log('✅ Function updated successfully!');
                console.log('📋 Response:', JSON.stringify(response, null, 2));
                
                console.log('\\n🎯 Next steps:');
                console.log('1. Wait 5-10 seconds for deployment');
                console.log('2. Test function: node test-csv-upload-real.cjs');
                console.log('3. Check response status should be 200');
                
            } else {
                console.error('❌ Update failed:');
                console.error('📋 Response:', JSON.stringify(response, null, 2));
            }
        } catch (e) {
            console.error('❌ Invalid JSON response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error);
});

req.write(updateData);
req.end();