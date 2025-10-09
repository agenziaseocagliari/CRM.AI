// 🗄️ DATABASE SETUP VIA REST API - LEVEL 5 EXECUTION
const https = require('https');

const SUPABASE_URL = 'qjtaqrlpronohgpfdxsi.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ2OTU3NiwiZXhwIjoyMDQ0MDQ1NTc2fQ.5Zo3z3qLm8LN4Z1AqWRnfzd8DJqzXpJpDnF0nT-ydOQ';

async function executeDatabaseSetup() {
  console.log('🗄️ Executing database setup via REST API...');
  
  // Create forms table via RPC
  const createFormsSQL = `
    CREATE TABLE IF NOT EXISTS public.forms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      organization_id UUID NOT NULL,
      user_id UUID,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const createSubmissionsSQL = `
    CREATE TABLE IF NOT EXISTS public.form_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ip_address INET,
      user_agent TEXT,
      status TEXT DEFAULT 'submitted'
    );
  `;

  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
  `;

  try {
    // Execute SQL via RPC
    await executeSQL(createFormsSQL);
    console.log('✅ Forms table created');
    
    await executeSQL(createSubmissionsSQL);
    console.log('✅ Form submissions table created');
    
    await executeSQL(createIndexesSQL);
    console.log('✅ Indexes created');
    
    // Insert test data
    const testData = {
      title: 'Test GDPR Form',
      name: 'test-gdpr-form-' + Date.now(),
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      fields: [
        {name: 'nome', label: 'Nome', type: 'text', required: true},
        {name: 'email', label: 'Email', type: 'email', required: true},
        {name: 'privacy_consent', label: 'Accetto privacy', type: 'checkbox', required: true}
      ]
    };
    
    await insertTestForm(testData);
    console.log('✅ Test form inserted');
    
    console.log('🎯 DATABASE SETUP COMPLETED SUCCESSFULLY');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ sql });
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function insertTestForm(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/forms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Execute setup
executeDatabaseSetup()
  .then(success => {
    if (success) {
      console.log('🏆 All database operations completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Database setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });