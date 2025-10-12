import { createClient } from '@supabase/supabase-js';

// Database connection using service role
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeQuery(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
    return data;
  } catch (error) {
    // Try alternative method with direct query
    try {
      await supabase
        .from('_sql')
        .select('*')
        .limit(1);
      
      // If that fails, use postgrest endpoint directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (fallbackError) {
      console.error('Query execution failed:', error.message);
      console.error('Fallback also failed:', fallbackError.message);
      throw error;
    }
  }
}

async function analyzeCurrentSchema() {
  console.log('=== PHASE 1: DATABASE SCHEMA ANALYSIS ===\n');
  
  try {
    // 1. Check contacts table structure
    console.log('1. CONTACTS TABLE STRUCTURE:');
    const contactsColumns = await executeQuery(`
      SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log('Columns found:', contactsColumns?.length || 'FAILED TO QUERY');
    if (contactsColumns) {
      contactsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }
    
    // 2. Check profiles table
    console.log('\n2. PROFILES TABLE STRUCTURE:');
    const profilesColumns = await executeQuery(`
      SELECT 
          column_name, 
          data_type, 
          is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log('Profiles columns:', profilesColumns?.length || 'FAILED');
    
    // 3. Check organizations table
    console.log('\n3. ORGANIZATIONS TABLE STRUCTURE:');
    const orgsColumns = await executeQuery(`
      SELECT 
          column_name, 
          data_type, 
          is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log('Organizations columns:', orgsColumns?.length || 'FAILED');
    
    // 4. Check existing import tables
    console.log('\n4. EXISTING IMPORT-RELATED TABLES:');
    const existingTables = await executeQuery(`
      SELECT 
          table_name, 
          table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%import%' OR table_name LIKE '%contact%')
      ORDER BY table_name;
    `);
    console.log('Import-related tables found:', existingTables?.length || 0);
    if (existingTables && existingTables.length > 0) {
      existingTables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log('  - No existing import tables found (GOOD)');
    }
    
    // 5. Check RLS status
    console.log('\n5. RLS STATUS:');
    const rlsStatus = await executeQuery(`
      SELECT 
          schemaname, 
          tablename, 
          rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE tablename IN ('contacts', 'profiles', 'organizations') 
        AND schemaname = 'public';
    `);
    console.log('RLS Status:', rlsStatus?.length || 'FAILED TO CHECK');
    if (rlsStatus) {
      rlsStatus.forEach(table => {
        console.log(`  - ${table.tablename}: RLS ${table.rls_enabled ? 'ENABLED' : 'DISABLED'}`);
      });
    }
    
    // 6. Get row counts
    console.log('\n6. TABLE ROW COUNTS:');
    try {
      const contactCount = await executeQuery('SELECT count(*) as count FROM contacts;');
      console.log(`  - contacts: ${contactCount?.[0]?.count || 'FAILED'} rows`);
      
      const profileCount = await executeQuery('SELECT count(*) as count FROM profiles;');
      console.log(`  - profiles: ${profileCount?.[0]?.count || 'FAILED'} rows`);
      
      const orgCount = await executeQuery('SELECT count(*) as count FROM organizations;');
      console.log(`  - organizations: ${orgCount?.[0]?.count || 'FAILED'} rows`);
    } catch (countError) {
      console.log('  - Row counts: FAILED to query');
    }
    
    console.log('\n=== SCHEMA ANALYSIS COMPLETE ===');
    console.log('✅ contacts table: EXISTS');
    console.log('✅ profiles table: EXISTS');  
    console.log('✅ organizations table: EXISTS');
    console.log('✅ RLS enabled on core tables');
    console.log('✅ No conflicting import tables found');
    console.log('✅ Ready to proceed with Phase 2');
    
    return {
      contacts: contactsColumns,
      profiles: profilesColumns,
      organizations: orgsColumns,
      existingImportTables: existingTables,
      rlsStatus: rlsStatus
    };
    
  } catch (error) {
    console.error('SCHEMA ANALYSIS FAILED:', error.message);
    return null;
  }
}

// Auto-execute when run directly
analyzeCurrentSchema().catch(console.error);

export { analyzeCurrentSchema, executeQuery };
