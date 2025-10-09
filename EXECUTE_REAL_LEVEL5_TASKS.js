// ============================================================================
// 🎯 SUPABASE DIRECT CONNECTION - ENGINEERING FELLOW LEVEL 5 - NODE.JS VERSION
// ============================================================================

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ2OTU3NiwiZXhwIjoyMDQ0MDQ1NTc2fQ.5Zo3z3qLm8LN4Z1AqWRnfzd8DJqzXpJpDnF0nT-ydOQ'

/**
 * 🚀 EXECUTE DATABASE SETUP DIRECTLY
 */
async function executeDirectDatabaseSetup() {
  console.log('🗄️ Starting direct database setup...')
  
  try {
    // Read SQL file content
    const sqlPath = path.join(__dirname, 'FORMMASTER_LEVEL5_DATABASE_SETUP.sql');
    let sqlContent;
    
    try {
      sqlContent = await fs.readFile(sqlPath, 'utf8');
      console.log('✅ SQL file loaded successfully');
    } catch (readError) {
      console.log('⚠️ SQL file not found, using embedded SQL');
      sqlContent = `
-- FORMMASTER LEVEL 5 - COMPLETE DATABASE SETUP
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    organization_id UUID NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable insert for authenticated users only" ON public.forms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read based on organization_id" ON public.forms
  FOR SELECT USING (organization_id = auth.jwt() ->> 'organization_id');

-- Insert test data
INSERT INTO public.forms (title, name, organization_id) 
VALUES ('Test Form', 'test-form', uuid_generate_v4())
ON CONFLICT DO NOTHING;
      `;
    }

    const result = await executeSQL(sqlContent);
    
    if (result.success) {
      console.log('✅ Database setup completed successfully');
      return { success: true, message: 'Database setup completed' };
    } else {
      console.error('❌ Database setup failed:', result.error);
      return { success: false, error: result.error };
    }
    
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
    // Read the Edge Function code
    const functionPath = path.join(__dirname, 'TEST_generate-form-fields.ts');
    let functionCode;
    
    try {
      functionCode = await fs.readFile(functionPath, 'utf8');
      console.log('✅ Edge Function code loaded successfully');
    } catch (readError) {
      console.error('❌ Edge Function file not found:', functionPath);
      return { success: false, error: 'Edge Function file not found' };
    }

    // Deploy via Management API
    const deployResult = await deployToSupabase(functionCode);
    
    if (deployResult.success) {
      console.log('✅ Edge Function deployed successfully');
      return { success: true, message: 'Edge Function deployed' };
    } else {
      console.error('❌ Edge Function deployment failed:', deployResult.error);
      return { success: false, error: deployResult.error };
    }
    
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
      console.error('❌ FormMaster system test failed:', testResult.error);
      return { success: false, error: testResult.error };
    }
    
  } catch (error) {
    console.error('❌ System test error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * 🔧 UTILITY: Execute SQL via REST API
 */
async function executeSQL(sql) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qjtaqrlpronohgpfdxsi.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: body });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${body}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * 🔧 UTILITY: Deploy to Supabase
 */
async function deployToSupabase(functionCode) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      name: 'generate-form-fields',
      source: functionCode,
      verify_jwt: false
    });
    
    const options = {
      hostname: 'qjtaqrlpronohgpfdxsi.supabase.co',
      port: 443,
      path: '/functions/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: body });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${body}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
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
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(body);
            const hasGDPR = result.fields && result.fields.some(f => f.name === 'privacy_consent');
            if (hasGDPR) {
              resolve({ success: true, data: result });
            } else {
              resolve({ success: false, error: 'GDPR compliance not working' });
            }
          } catch (parseError) {
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

// Export functions
module.exports = {
  executeDirectDatabaseSetup,
  deployEdgeFunctionDirect,
  testFormMasterComplete,
  executeAllTasks
};

// Run if called directly
if (require.main === module) {
  executeAllTasks()
    .then(results => {
      process.exit(results.database.success && results.edgeFunctions.success && results.integrationTest.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}