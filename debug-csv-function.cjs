/* eslint-env node */
/* global console, fetch, FormData */
// Simple test to check if function endpoint works
const FormData = require('form-data');

async function testBasicEndpoint() {
  const FUNCTION_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload';
  
  console.log('🧪 Testing basic endpoint access...');
  
  try {
    // Test OPTIONS request (CORS preflight)
    console.log('📡 Testing CORS preflight...');
    const optionsResponse = await fetch(FUNCTION_URL, {
      method: 'OPTIONS'
    });
    
    console.log(`📊 OPTIONS Status: ${optionsResponse.status}`);
    
    if (optionsResponse.ok) {
      console.log('✅ CORS preflight successful');
    } else {
      console.log('❌ CORS preflight failed');
    }
    
    // Test POST without file (should return error but not 503)
    console.log('\n📡 Testing POST without file...');
    const postResponse = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log(`📊 POST Status: ${postResponse.status}`);
    
    if (postResponse.status !== 503) {
      console.log('✅ Function is responding (not 503)');
      const result = await postResponse.text();
      console.log('📋 Response:', result.substring(0, 200));
    } else {
      console.log('❌ Function returning 503 (runtime error)');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testBasicEndpoint();