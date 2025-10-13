/* eslint-env node */
/* global FormData, Blob */
// Test the deployed Edge Function
const FUNCTION_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload';

async function testDeployedFunction() {
  try {
    console.log('🧪 Testing deployed CSV parser function...');
    
    // Create test CSV content
    const csvContent = `name,email,phone,company
John Doe,john@example.com,+1-555-0123,Acme Corp
Jane Smith,jane@example.com,+1-555-0124,Tech Inc
Bob Johnson,bob@example.com,+1-555-0125,StartupCo`;

    // Create FormData with CSV file
    const formData = new FormData();
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', csvBlob, 'test-contacts.csv');

    console.log('📡 Sending request to deployed function...');

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0`
      }
    });

    console.log('📊 Response status:', response.status);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Function test PASSED!');
      console.log('📋 Preview data:');
      console.log('   Headers:', result.preview?.headers);
      console.log('   Total rows:', result.preview?.total_rows);
      console.log('   Sample row:', result.preview?.rows?.[0]);
      console.log('📁 File info:', result.file_info);
      
      if (result.import_id) {
        console.log('🆔 Import ID created:', result.import_id);
      }
      
    } else {
      console.log('❌ Function test FAILED');
      console.log('🔍 Error details:', result);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testDeployedFunction();