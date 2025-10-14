const fetch = require('node-fetch');
const fs = require('fs');

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || (() => {
    console.error('❌ SECURITY ERROR: SUPABASE_ANON_KEY environment variable not set');
    process.exit(1);
})();

async function deployMinimalFunction() {
    console.log('📦 Deploying Minimal Test Function');
    
    const functionCode = fs.readFileSync('./supabase/functions/parse-csv-upload-minimal/index.ts', 'utf-8');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-csv-upload-minimal`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/typescript'
            },
            body: functionCode
        });
        
        console.log(`Response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Response: ${responseText}`);
        
        if (response.ok) {
            console.log('✅ Minimal function deployed successfully!');
        } else {
            console.log('❌ Deployment failed');
        }
    } catch (error) {
        console.error('❌ Deploy error:', error.message);
    }
}

deployMinimalFunction();