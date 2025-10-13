// Simple CSV upload test
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function simpleTest() {
  try {
    // Create simple form data
    const form = new FormData();
    form.append('organization_id', '00000000-0000-0000-0000-000000000001');
    form.append('file', fs.createReadStream('test-data/sample-contacts.csv'), {
      filename: 'test.csv',
      contentType: 'text/csv'
    });

    console.log('📤 Sending request...');
    console.log('Headers:', form.getHeaders());

    const response = await fetch('https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('📥 Response Status:', response.status);
    const text = await response.text();
    console.log('📄 Response Body:', text);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest();