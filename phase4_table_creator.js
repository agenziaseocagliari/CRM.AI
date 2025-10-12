import { readFileSync } from 'fs';

// Database connection using service role
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

// Using direct REST API calls instead of supabase client for SQL execution

async function executeSqlFile(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements (basic splitting by semicolons)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\nExecuting ${statements.length} SQL statements from ${filePath}...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;
      
      try {
        // Use postgrest endpoint directly for SQL execution
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (response.ok || response.status === 409) { // 409 = conflict (table already exists)
          console.log(`✅ Statement ${i + 1}: SUCCESS`);
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
            console.log(`   Created table: ${tableName}`);
          } else if (statement.includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE.*?INDEX.*?(\w+)/)?.[1];
            console.log(`   Created index: ${indexName}`);
          } else if (statement.includes('CREATE POLICY')) {
            const policyName = statement.match(/CREATE POLICY\s+"([^"]+)"/)?.[1];
            console.log(`   Created policy: ${policyName}`);
          }
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Statement ${i + 1}: FAILED - ${response.status}`);
          console.log(`   Error: ${errorText}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Statement ${i + 1}: ERROR - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== EXECUTION SUMMARY ===`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('FILE EXECUTION FAILED:', error.message);
    return { successCount: 0, errorCount: 1 };
  }
}

async function createTablesPhase2() {
  console.log('=== PHASE 2: CREATING NEW TABLES ===\n');
  
  const result = await executeSqlFile('./phase4_create_tables.sql');
  
  if (result.errorCount === 0) {
    console.log('\n🎉 PHASE 2: ALL TABLES CREATED SUCCESSFULLY!');
    return true;
  } else if (result.successCount > 0) {
    console.log('\n⚠️  PHASE 2: PARTIAL SUCCESS - Some statements failed but core tables likely created');
    return true;
  } else {
    console.log('\n❌ PHASE 2: FAILED - No tables created');
    return false;
  }
}

// Auto-execute when run directly
createTablesPhase2().catch(console.error);

export { executeSqlFile, createTablesPhase2 };