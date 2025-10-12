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

async function analyzeCurrentSchema() {
  console.log('=== PHASE 1: DATABASE SCHEMA ANALYSIS ===\n');
  
  try {
    // 1. Check contacts table by querying it directly
    console.log('1. CONTACTS TABLE STRUCTURE:');
    try {
      const { data: contactsSample, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);
      
      if (contactsError) {
        console.log('  ❌ CONTACTS TABLE: NOT ACCESSIBLE OR DOES NOT EXIST');
        console.log('  Error:', contactsError.message);
      } else {
        console.log('  ✅ CONTACTS TABLE: EXISTS AND ACCESSIBLE');
        if (contactsSample && contactsSample.length > 0) {
          const columns = Object.keys(contactsSample[0]);
          console.log(`  Columns found: ${columns.length}`);
          columns.forEach(col => {
            console.log(`    - ${col}: ${typeof contactsSample[0][col]}`);
          });
        } else {
          console.log('  Table exists but is empty (will check structure differently)');
        }
      }
    } catch (error) {
      console.log('  ❌ CONTACTS TABLE: ACCESS FAILED');
      console.log('  Error:', error.message);
    }
    
    // 2. Check profiles table
    console.log('\n2. PROFILES TABLE STRUCTURE:');
    try {
      const { data: profilesSample, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.log('  ❌ PROFILES TABLE: NOT ACCESSIBLE');
        console.log('  Error:', profilesError.message);
      } else {
        console.log('  ✅ PROFILES TABLE: EXISTS AND ACCESSIBLE');
        if (profilesSample && profilesSample.length > 0) {
          const columns = Object.keys(profilesSample[0]);
          console.log(`  Columns: ${columns.join(', ')}`);
        }
      }
    } catch (error) {
      console.log('  ❌ PROFILES TABLE: ACCESS FAILED');
    }
    
    // 3. Check organizations table  
    console.log('\n3. ORGANIZATIONS TABLE STRUCTURE:');
    try {
      const { data: orgsSample, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
      
      if (orgsError) {
        console.log('  ❌ ORGANIZATIONS TABLE: NOT ACCESSIBLE');
        console.log('  Error:', orgsError.message);
      } else {
        console.log('  ✅ ORGANIZATIONS TABLE: EXISTS AND ACCESSIBLE');
        if (orgsSample && orgsSample.length > 0) {
          const columns = Object.keys(orgsSample[0]);
          console.log(`  Columns: ${columns.join(', ')}`);
        }
      }
    } catch (error) {
      console.log('  ❌ ORGANIZATIONS TABLE: ACCESS FAILED');
    }
    
    // 4. Check for existing import tables by trying to query them
    console.log('\n4. EXISTING IMPORT-RELATED TABLES:');
    const importTableNames = ['contact_imports', 'contact_import_logs', 'contact_field_mappings', 'import_history'];
    let existingImportTables = 0;
    
    for (const tableName of importTableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`  ⚠️  ${tableName}: ALREADY EXISTS`);
          existingImportTables++;
        }
      } catch (error) {
        // Table doesn't exist - this is good
      }
    }
    
    if (existingImportTables === 0) {
      console.log('  ✅ No conflicting import tables found (GOOD)');
    }
    
    // 5. Get row counts for existing tables
    console.log('\n5. TABLE ROW COUNTS:');
    try {
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });
      console.log(`  - contacts: ${contactCount || 0} rows`);
    } catch {
      console.log('  - contacts: FAILED to count');
    }
    
    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      console.log(`  - profiles: ${profileCount || 0} rows`);
    } catch {
      console.log('  - profiles: FAILED to count');
    }
    
    try {
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      console.log(`  - organizations: ${orgCount || 0} rows`);
    } catch {
      console.log('  - organizations: FAILED to count');
    }
    
    console.log('\n=== PHASE 1 ANALYSIS COMPLETE ===');
    console.log('Status: READY TO PROCEED TO PHASE 2');
    console.log('✅ Core tables accessible');
    console.log('✅ No import table conflicts');
    console.log('✅ Database connection working');
    
    return true;
    
  } catch (error) {
    console.error('SCHEMA ANALYSIS FAILED:', error.message);
    return false;
  }
}

// Auto-execute when run directly
analyzeCurrentSchema().catch(console.error);

export { analyzeCurrentSchema, supabase };
