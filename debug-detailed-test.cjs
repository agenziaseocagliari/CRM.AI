/**
 * Detailed CSV upload test with error capturing
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

async function detailedTest() {
  console.log('🔍 DETAILED CSV UPLOAD TEST\n');
  
  try {
    // Create form data
    const form = new FormData();
    const csvContent = fs.readFileSync('test-data/sample-contacts.csv');
    form.append('csvFile', csvContent, {
      filename: 'sample-contacts.csv',
      contentType: 'text/csv'
    });
    form.append('organizationId', '00000000-0000-0000-0000-000000000001');
    
    console.log('📡 Making request with detailed error capture...');
    
    const response = await fetch('https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'
      }
    });
    
    const responseText = await response.text();
    
    console.log(`📊 RESPONSE DETAILS:`);
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`Body: ${responseText}`);
    
    // Try to parse as JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n📋 PARSED RESPONSE:');
      console.log(JSON.stringify(responseJson, null, 2));
      
      if (responseJson.message) {
        console.log(`\n🔍 ERROR MESSAGE: ${responseJson.message}`);
      }
      if (responseJson.error) {
        console.log(`🔍 ERROR TYPE: ${responseJson.error}`);
      }
      if (responseJson.details) {
        console.log(`🔍 ERROR DETAILS: ${responseJson.details}`);
      }
    } catch (parseError) {
      console.log('\n⚠️ Response is not valid JSON');
    }
    
  } catch (error) {
    console.error('🚨 Request failed:', error.message);
  }
}

detailedTest();