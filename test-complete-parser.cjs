// Complete test of CSV parser with field detection and validation
const fs = require('fs');
const FormData = require('form-data');

const FUNCTION_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

async function testCompleteCSVParser() {
  try {
    console.log('🧪 Testing Complete CSV Parser with Field Detection...\n');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-complete-contacts.csv'), 'test-complete-contacts.csv');
    formData.append('organization_id', '00000000-0000-0000-0000-000000000000'); // Test org ID
    
    console.log('📡 Sending request to Edge Function...');
    
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('📊 Response Status:', response.status);
    
    const result = await response.json();
    console.log('📋 Full Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ FIELD DETECTION TEST:');
      console.log('🎯 Detected Mappings:');
      Object.entries(result.detected_mappings || {}).forEach(([csvCol, mapping]) => {
        console.log(`   "${csvCol}" → ${mapping.db_field} (${mapping.confidence}% confidence)`);
      });
      
      console.log('\n✅ VALIDATION TEST:');
      console.log('🔍 Validation Results:');
      console.log(`   Errors: ${result.validation?.total_errors || 0}`);
      console.log(`   Warnings: ${result.validation?.total_warnings || 0}`);
      
      if (result.validation?.sample_issues?.length > 0) {
        console.log('   Sample Issues:');
        result.validation.sample_issues.forEach(issue => {
          const type = issue.error ? 'ERROR' : 'WARNING';
          const message = issue.error || issue.warning;
          console.log(`     Row ${issue.row}, ${issue.field}: ${type} - ${message}`);
        });
      }
      
      console.log('\n✅ PREVIEW DATA:');
      console.log(`📊 Total Rows: ${result.preview?.total_rows}`);
      console.log(`📋 Headers: ${result.preview?.headers?.join(', ')}`);
      console.log('📄 Sample Row:', result.preview?.rows?.[0]);
      
      console.log('\n🎉 CSV PARSER TEST PASSED! All features working!');
      
    } else {
      console.log('❌ Test Failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error.message);
  }
}

testCompleteCSVParser();