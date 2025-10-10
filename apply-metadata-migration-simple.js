#!/usr/bin/env node

/**
 * Apply metadata migration via Supabase Management API
 */

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const SQL = `
-- Add metadata column if not exists
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_forms_metadata 
ON public.forms USING gin (metadata);
`;

async function runMigration() {
  try {
    console.log('🔧 Applying metadata column migration...\n');
    console.log('📝 SQL to execute:');
    console.log(SQL);
    console.log('\n');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ query: SQL })
    });
    
    if (!response.ok) {
      console.log('⚠️  Direct SQL execution not available via REST API');
      console.log('\n📋 MANUAL STEPS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
      console.log('2. Paste the SQL above');
      console.log('3. Click "Run"');
      console.log('\n✅ Migration SQL is ready in: supabase/migrations/20251010_add_metadata_column.sql');
      return;
    }
    
    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 FALLBACK - Apply manually:');
    console.log('URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new');
    console.log('\nSQL file: supabase/migrations/20251010_add_metadata_column.sql');
  }
}

runMigration();
