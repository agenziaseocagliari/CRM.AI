// Debug 503 Error - Minimal Test
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function debugAPI() {
  console.log('🔍 DEBUGGING 503 ERROR');

  try {
    // Simple GET request first
    console.log('\n1. Testing GET request...');
    const getResponse = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload'
    );
    console.log(`GET Status: ${getResponse.status}`);

    // OPTIONS request
    console.log('\n2. Testing OPTIONS request...');
    const optionsResponse = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
      {
        method: 'OPTIONS',
      }
    );
    console.log(`OPTIONS Status: ${optionsResponse.status}`);

    // Simple POST without file
    console.log('\n3. Testing empty POST...');
    const emptyPostResponse = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      }
    );
    console.log(`Empty POST Status: ${emptyPostResponse.status}`);
    console.log(`Empty POST Response: ${await emptyPostResponse.text()}`);

    // POST with form-data (no file)
    console.log('\n4. Testing form-data POST...');
    const form = new FormData();
    form.append('organization_id', '00000000-0000-0000-0000-000000000001');

    const formResponse = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
      {
        method: 'POST',
        body: form,
        headers: {
          ...form.getHeaders(),
        },
      }
    );
    console.log(`Form POST Status: ${formResponse.status}`);
    console.log(`Form POST Response: ${await formResponse.text()}`);
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugAPI();
