// Deploy Edge Function via Supabase API
// This bypasses the Docker requirement of Supabase CLI

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_API_URL = 'https://api.supabase.com';
const PROJECT_REF = 'qjtaqrlpronohgpfdxsi';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || (() => {
    console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set');
    process.exit(1);
})();

async function deployEdgeFunction() {
  try {
    // Read the Edge Function code
    const functionPath = path.join(__dirname, 'supabase', 'functions', 'parse-csv-upload', 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf-8');
    
    console.log('📦 Deploying Edge Function: parse-csv-upload');
    console.log('📁 Function size:', Math.round(functionCode.length / 1024), 'KB');
    
    // Prepare the deployment payload
    const deploymentData = {
      name: 'parse-csv-upload',
      slug: 'parse-csv-upload', 
      body: functionCode,
      verify_jwt: false
    };

    // Deploy via Supabase API (UPDATE existing function)
    const response = await fetch(`${SUPABASE_API_URL}/v1/projects/${PROJECT_REF}/functions/parse-csv-upload`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deployment failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('✅ Edge Function deployed successfully!');
    console.log('🌐 Function URL:', `https://${PROJECT_REF}.supabase.co/functions/v1/parse-csv-upload`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
deployEdgeFunction()
  .then(() => {
    console.log('\n🎉 Deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  });