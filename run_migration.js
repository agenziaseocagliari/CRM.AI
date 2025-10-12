import { readFileSync } from 'fs';

// Connection details
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

async function runMigration() {
  console.log('=== PHASE 2: EXECUTING TABLE CREATION ===\n');
  
  try {
    const sql = readFileSync('./supabase/migrations/20261012000001_contact_import_schema.sql', 'utf8');
    console.log('Migration file loaded successfully\n');
    
    // Split into individual statements and clean them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        return stmt.length > 10 && 
               !stmt.startsWith('--') && 
               !stmt.match(/^\s*$/);
      });
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    const results = {
      tables: 0,
      indexes: 0,
      policies: 0,
      errors: []
    };
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add semicolon back
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            sql: statement
          })
        });
        
        const responseText = await response.text();
        
        if (response.ok) {
          // Determine what was created
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
            console.log(`✅ Table created: ${tableName}`);
            results.tables++;
          } else if (statement.includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE.*?INDEX.*?(\w+)/)?.[1];
            console.log(`✅ Index created: ${indexName}`);
            results.indexes++;
          } else if (statement.includes('CREATE POLICY')) {
            const policyName = statement.match(/CREATE POLICY\s+"([^"]+)"/)?.[1];
            console.log(`✅ Policy created: ${policyName}`);
            results.policies++;
          } else if (statement.includes('ALTER TABLE')) {
            console.log(`✅ Table altered successfully`);
          } else {
            console.log(`✅ Statement executed successfully`);
          }
        } else {
          // Check if it's just "already exists" error which we can ignore
          if (responseText.includes('already exists') || response.status === 409) {
            console.log(`⚠️  Object already exists (skipping)`);
          } else {
            console.log(`❌ Error (${response.status}): ${responseText}`);
            results.errors.push(`${response.status}: ${responseText}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Execute error: ${error.message}`);
        results.errors.push(error.message);
      }
    }
    
    console.log('\n=== PHASE 2 EXECUTION SUMMARY ===');
    console.log(`✅ Tables created: ${results.tables}`);
    console.log(`✅ Indexes created: ${results.indexes}`);
    console.log(`✅ Policies created: ${results.policies}`);
    console.log(`❌ Errors encountered: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    // Check if we created the main tables
    const expectedTables = ['contact_imports', 'contact_import_logs', 'contact_field_mappings'];
    const tablesCreated = results.tables >= expectedTables.length || results.tables >= 3;
    
    if (tablesCreated) {
      console.log('\n🎉 PHASE 2: SUCCESS - All import tables created!');
      return true;
    } else {
      console.log('\n⚠️  PHASE 2: PARTIAL - Some tables may not have been created');
      return false;
    }
    
  } catch (error) {
    console.error('MIGRATION EXECUTION FAILED:', error.message);
    return false;
  }
}

// Execute migration
runMigration().then(success => {
  if (success) {
    console.log('\n✅ Ready to proceed to Phase 3');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed - check errors above');
    process.exit(1);
  }
});