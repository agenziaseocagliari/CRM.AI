/**
 * Quick database check for CSV import table structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE STRUCTURE...\n');
  
  try {
    // Check if contact_imports table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%import%');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📋 Tables with "import":', tables?.map(t => t.table_name) || 'None found');
    }
    
    // Try to describe contact_imports table
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'contact_imports' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (columnsError) {
      console.error('❌ Error getting columns:', columnsError);
      
      // Try direct query to see if table exists
      const { data: testQuery, error: testError } = await supabase
        .from('contact_imports')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Table contact_imports ERROR:', testError.message);
      } else {
        console.log('✅ Table contact_imports EXISTS and accessible');
      }
    } else {
      console.log('\n📊 CONTACT_IMPORTS TABLE STRUCTURE:');
      if (columns && columns.length > 0) {
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });
      } else {
        console.log('  No columns found or RPC not available');
      }
    }
    
    // Check organizations table for valid IDs
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(3);
    
    if (orgsError) {
      console.error('❌ Error getting organizations:', orgsError);
    } else {
      console.log('\n🏢 AVAILABLE ORGANIZATIONS:');
      orgs?.forEach(org => {
        console.log(`  - ${org.name}: ${org.id}`);
      });
    }
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
  }
}

checkDatabase();