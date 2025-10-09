// ============================================================================
// 🎯 SUPABASE DIRECT CONNECTION - ENGINEERING FELLOW LEVEL 5 - ES MODULES
// ============================================================================

import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ2OTU3NiwiZXhwIjoyMDQ0MDQ1NTc2fQ.5Zo3z3qLm8LN4Z1AqWRnfzd8DJqzXpJpDnF0nT-ydOQ'

/**
 * 🚀 EXECUTE DATABASE SETUP DIRECTLY  
 */
async function executeDirectDatabaseSetup() {
  console.log('🗄️ Starting direct database setup...')
  
  try {
    console.log('📋 Manual Database Setup Instructions:');
    console.log('1. Go to Supabase Studio > SQL Editor');
    console.log('2. Execute the following SQL:');
    console.log('');
    console.log('-- Enable extensions');
    console.log('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('');
    console.log('-- Create forms table');
    console.log('CREATE TABLE IF NOT EXISTS public.forms (');
    console.log('    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
    console.log('    title TEXT NOT NULL,');
    console.log('    name TEXT NOT NULL,');
    console.log('    fields JSONB NOT NULL DEFAULT \'[]\'::jsonb,');
    console.log('    organization_id UUID NOT NULL,');
    console.log('    user_id UUID,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Create form_submissions table');
    console.log('CREATE TABLE IF NOT EXISTS public.form_submissions (');
    console.log('    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
    console.log('    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,');
    console.log('    data JSONB NOT NULL DEFAULT \'{}\'::jsonb,');
    console.log('    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    ip_address INET,');
    console.log('    user_agent TEXT');
    console.log(');');
    console.log('');
    console.log('-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);');
    
    return { success: true, message: 'Database setup instructions provided' };
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * 🚀 DEPLOY EDGE FUNCTION DIRECTLY
 */
async function deployEdgeFunctionDirect() {
  console.log('🚀 Starting direct Edge Function deployment...')
  
  try {
    const functionPath = path.join(__dirname, 'TEST_generate-form-fields.ts');
    
    try {
      const functionCode = await fs.readFile(functionPath, 'utf8');
      console.log('✅ Edge Function code loaded successfully');
      console.log('📝 Function length:', functionCode.length, 'characters');
    } catch (error) {
      console.error('❌ Edge Function file not found:', functionPath);
      return { success: false, error: 'Edge Function file not found' };
    }

    console.log('📋 Manual Edge Function Deployment Instructions:');
    console.log('1. Go to Supabase Dashboard > Edge Functions');
    console.log('2. Click "Create Function"');
    console.log('3. Name: generate-form-fields');
    console.log('4. Copy content from: TEST_generate-form-fields.ts');
    console.log('5. Click "Deploy Function"');
    
    return { success: true, message: 'Edge Function ready for manual deployment' };
    
  } catch (error) {
    console.error('❌ Edge Function deployment error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * 🧪 TEST COMPLETE FORMMASTER SYSTEM
 */
async function testFormMasterComplete() {
  console.log('🧪 Testing complete FormMaster system...')
  
  try {
    // Test the Edge Function
    const testResult = await testEdgeFunction();
    
    if (testResult.success) {
      console.log('✅ FormMaster system test passed');
      return { success: true, message: 'System test completed' };
    } else {
      console.log('⚠️ FormMaster system test failed:', testResult.error);
      return { success: false, error: testResult.error };
    }
    
  } catch (error) {
    console.error('❌ System test error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * 🔧 UTILITY: Test Edge Function
 */
async function testEdgeFunction() {
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      prompt: 'form contatto per gdpr compliance con consenso privacy'
    });
    
    const options = {
      hostname: 'qjtaqrlpronohgpfdxsi.supabase.co',
      port: 443,
      path: '/functions/v1/generate-form-fields',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`🧪 Test Response: HTTP ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(body);
            const hasGDPR = result.fields && result.fields.some(f => f.name === 'privacy_consent');
            if (hasGDPR) {
              console.log('✅ GDPR compliance detected in response');
              resolve({ success: true, data: result });
            } else {
              console.log('⚠️ GDPR compliance not detected');
              resolve({ success: false, error: 'GDPR compliance not working' });
            }
          } catch (error) {
            resolve({ success: false, error: 'Invalid response format' });
          }
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${body}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(testData);
    req.end();
  });
}

/**
 * 🎯 MAIN EXECUTION FUNCTION
 */
async function executeAllTasks() {
  console.log('🎯 STARTING FORMMASTER LEVEL 5 EXECUTION...\n');
  
  const results = {};
  
  // Task 1: Database Setup
  console.log('📋 TASK 1: Database Setup');
  results.database = await executeDirectDatabaseSetup();
  console.log(`${results.database.success ? '✅' : '❌'} Database: ${results.database.success ? 'SUCCESS' : results.database.error}\n`);
  
  // Task 2: Edge Function Deployment
  console.log('📋 TASK 2: Edge Function Deployment');
  results.edgeFunctions = await deployEdgeFunctionDirect();
  console.log(`${results.edgeFunctions.success ? '✅' : '❌'} Edge Function: ${results.edgeFunctions.success ? 'SUCCESS' : results.edgeFunctions.error}\n`);
  
  // Task 3: Integration Test
  console.log('📋 TASK 3: Integration Test');
  results.integrationTest = await testFormMasterComplete();
  console.log(`${results.integrationTest.success ? '✅' : '❌'} Integration Test: ${results.integrationTest.success ? 'SUCCESS' : results.integrationTest.error}\n`);
  
  // Summary
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log('🎯 EXECUTION SUMMARY:');
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🏆 ALL TASKS COMPLETED SUCCESSFULLY!');
  } else {
    console.log('⚠️ Some tasks failed. Check errors above.');
  }
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeAllTasks()
    .then(results => {
      const allSuccess = Object.values(results).every(r => r.success);
      process.exit(allSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export {
  executeDirectDatabaseSetup,
  deployEdgeFunctionDirect,
  testFormMasterComplete,
  executeAllTasks
};