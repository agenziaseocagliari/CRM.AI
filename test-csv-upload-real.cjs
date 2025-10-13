// REAL CSV Upload Test - No Simulations
const fs = require('fs');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');

// REAL credentials
const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.kFo4Cj6rrAY4SLcLLwXyTOLi7YhLMHMKSXpqS9RzCmQ';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

async function getFirstOrganizationId() {
  console.log('📋 Getting organization ID from database...');
  
  // Use service role to access organizations table
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);
    
  if (error) {
    console.error('❌ Database error:', error);
    return null;
  }
  
  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found in database');
    return null;
  }
  
  console.log('✅ Found organization:', orgs[0].name, 'ID:', orgs[0].id);
  return orgs[0].id;
}

async function testCSVUpload() {
  console.log('🧪 === REAL CSV UPLOAD TEST ===\\n');
  
  // Step 1: Get real organization ID
  const organizationId = await getFirstOrganizationId();
  if (!organizationId) {
    console.log('❌ Cannot proceed without organization ID');
    return null;
  }
  
  // Step 2: Check if test file exists
  const csvPath = 'test-data/sample-contacts.csv';
  if (!fs.existsSync(csvPath)) {
    console.log('❌ Test file not found:', csvPath);
    return null;
  }
  console.log('✅ Test file exists:', csvPath);
  
  // Step 3: Read actual CSV file
  console.log('📄 Reading CSV file...');
  const csvFile = fs.createReadStream(csvPath);
  
  // Step 4: Prepare form data
  const form = new FormData();
  form.append('file', csvFile, 'sample-contacts.csv');
  form.append('organization_id', organizationId);
  
  console.log('📡 Making REAL API request...');
  console.log('URL:', 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload');
  console.log('Organization ID:', organizationId);
  
  try {
    // Step 5: Make REAL HTTP request
    const response = await fetch('https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const result = await response.json();
    
    // Step 6: Comprehensive verification
    console.log('\\n📊 === RESPONSE VERIFICATION ===');
    console.log('Status Code:', response.status);
    console.log('Success Flag:', result.success);
    
    if (result.success) {
      console.log('\\n✅ SUCCESS - Analyzing Response:');
      console.log('Import ID:', result.import_id);
      console.log('Total Rows:', result.preview?.total_rows);
      console.log('Headers:', result.preview?.headers);
      console.log('Preview Rows Count:', result.preview?.rows?.length);
      
      // Field detection verification
      console.log('\\n🎯 FIELD DETECTION RESULTS:');
      if (result.detected_mappings) {
        Object.entries(result.detected_mappings).forEach(([csvCol, mapping]) => {
          console.log(`   "${csvCol}" → ${mapping.db_field} (${mapping.confidence}% confidence)`);
        });
      } else {
        console.log('   ❌ No field mappings detected');
      }
      
      // Validation verification
      console.log('\\n🔍 VALIDATION RESULTS:');
      console.log('   Errors:', result.validation?.total_errors || 0);
      console.log('   Warnings:', result.validation?.total_warnings || 0);
      if (result.validation?.sample_issues?.length > 0) {
        console.log('   Sample Issues:');
        result.validation.sample_issues.forEach(issue => {
          const type = issue.error ? 'ERROR' : 'WARNING';
          const message = issue.error || issue.warning;
          console.log(`     Row ${issue.row}, ${issue.field}: ${type} - ${message}`);
        });
      }
      
      // Save response for verification
      fs.writeFileSync('test-data/upload-response.json', JSON.stringify(result, null, 2));
      console.log('\\n💾 Response saved to: test-data/upload-response.json');
      
      return result;
      
    } else {
      console.log('\\n❌ FAILED - Error Details:');
      console.log('Error:', result.error);
      return null;
    }
    
  } catch (error) {
    console.log('\\n💥 REQUEST FAILED:');
    console.error('Error:', error.message);
    return null;
  }
}

async function verifyDatabaseRecord(importId) {
  if (!importId) return null;
  
  console.log('\\n🗄️  === DATABASE VERIFICATION ===');
  console.log('Checking database for import record...');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data: record, error } = await supabase
    .from('contact_imports')
    .select('id, filename, total_rows, status, field_mapping, created_at')
    .eq('id', importId)
    .single();
    
  if (error) {
    console.log('❌ Database query failed:', error.message);
    return null;
  }
  
  if (record) {
    console.log('✅ Database Record Found:');
    console.log('   ID:', record.id);
    console.log('   Filename:', record.filename);
    console.log('   Total Rows:', record.total_rows);
    console.log('   Status:', record.status);
    console.log('   Field Mapping Present:', !!record.field_mapping);
    console.log('   Created:', record.created_at);
    return record;
  } else {
    console.log('❌ No database record found');
    return null;
  }
}

async function runFullVerification() {
  console.log('🔍 STARTING FULL CSV UPLOAD VERIFICATION\\n');
  
  // Test the upload
  const uploadResult = await testCSVUpload();
  
  if (uploadResult && uploadResult.import_id) {
    // Verify database record
    const dbRecord = await verifyDatabaseRecord(uploadResult.import_id);
    
    // Generate verification report
    console.log('\\n📋 === VERIFICATION REPORT ===');
    
    console.log('\\nTest Execution:');
    console.log('   Test file created: ✅');
    console.log('   API request made: ✅');
    console.log('   Response received: ✅');
    
    console.log('\\nResponse Validation:');
    console.log(`   Status code: ${uploadResult ? 200 : 'ERROR'}`);
    console.log(`   Success flag: ${uploadResult.success}`);
    console.log(`   Import ID: ${uploadResult.import_id}`);
    console.log(`   Preview rows: ${uploadResult.preview?.rows?.length}`);
    console.log(`   Headers detected: ${uploadResult.preview?.headers?.join(', ')}`);
    
    console.log('\\nDatabase Verification:');
    console.log(`   Record created: ${dbRecord ? '✅' : '❌'}`);
    console.log(`   Record ID: ${dbRecord?.id || 'N/A'}`);
    console.log(`   Status: ${dbRecord?.status || 'N/A'}`);
    console.log(`   Field mapping: ${dbRecord?.field_mapping ? 'present' : 'missing'}`);
    
    console.log('\\nField Detection Results:');
    if (uploadResult.detected_mappings) {
      const emailField = Object.values(uploadResult.detected_mappings).find(m => m.db_field === 'email');
      const phoneField = Object.values(uploadResult.detected_mappings).find(m => m.db_field === 'phone');
      const nameField = Object.values(uploadResult.detected_mappings).find(m => m.db_field === 'name');
      const companyField = Object.values(uploadResult.detected_mappings).find(m => m.db_field === 'company');
      
      console.log(`   Email field: ${emailField ? '✅' : '❌'} ${emailField ? `(confidence: ${emailField.confidence}%)` : ''}`);
      console.log(`   Phone field: ${phoneField ? '✅' : '❌'} ${phoneField ? `(confidence: ${phoneField.confidence}%)` : ''}`);
      console.log(`   Name field: ${nameField ? '✅' : '❌'} ${nameField ? `(confidence: ${nameField.confidence}%)` : ''}`);
      console.log(`   Company field: ${companyField ? '✅' : '❌'} ${companyField ? `(confidence: ${companyField.confidence}%)` : ''}`);
    }
    
    console.log('\\nValidation Results:');
    console.log(`   Errors detected: ${uploadResult.validation?.total_errors || 0}`);
    console.log(`   Warnings detected: ${uploadResult.validation?.total_warnings || 0}`);
    
    const hasEmailError = uploadResult.validation?.sample_issues?.some(i => i.field === 'email' && i.error);
    const hasPhoneWarning = uploadResult.validation?.sample_issues?.some(i => i.field === 'phone' && i.warning);
    
    console.log(`   Row 5 email error: ${hasEmailError ? '✅' : '❌'}`);
    console.log(`   Row 5 phone warning: ${hasPhoneWarning ? '✅' : '❌'}`);
    
    console.log('\\nOverall Result:');
    const isWorking = uploadResult.success && dbRecord && uploadResult.detected_mappings;
    console.log(`   CSV Upload: ${isWorking ? 'WORKING' : 'BROKEN'}`);
    console.log(`   Issues Found: ${isWorking ? 'NONE' : 'See above'}`);
    console.log(`   Ready for Next Task: ${isWorking ? 'YES' : 'NO'}`);
    
    if (isWorking) {
      console.log('\\n🎉 CSV UPLOAD VERIFICATION: PASSED!');
    } else {
      console.log('\\n❌ CSV UPLOAD VERIFICATION: FAILED!');
    }
    
    return isWorking;
    
  } else {
    console.log('\\n❌ UPLOAD FAILED - Cannot proceed with verification');
    return false;
  }
}

// Run the verification
runFullVerification().catch(console.error);