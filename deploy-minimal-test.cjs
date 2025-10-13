const fetch = require('node-fetch');
const fs = require('fs');

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2NDIwOTcsImV4cCI6MjA0MTIxODA5N30.nlT_nJ8zG_aP_BgCB_QUdHmgXKWgcc3r-z2xvKQMHEY';

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