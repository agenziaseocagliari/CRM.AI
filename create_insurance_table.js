import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error(
    '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql) {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Statement ${i + 1}/${statements.length}:`);
      console.log(
        statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
      );

      try {
        // Use the SQL function to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement,
        });

        if (error) {
          // If exec_sql doesn't exist, try alternative methods
          if (error.code === 'PGRST202') {
            console.log(
              '⚠️ exec_sql function not available, trying alternative...'
            );

            // For CREATE TABLE statements, we can't execute directly
            // Let's check if it's a CREATE TABLE for insurance_policies
            if (
              statement.toLowerCase().includes('create table') &&
              statement.toLowerCase().includes('insurance_policies')
            ) {
              console.log(
                '🏗️ This is the CREATE TABLE statement for insurance_policies'
              );
              console.log(
                '📋 Manual execution required via Supabase dashboard'
              );
              return {
                success: false,
                requiresManualExecution: true,
                sql: statement,
              };
            }
          }

          throw error;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`❌ Statement ${i + 1} failed:`, stmtError);
        throw stmtError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ SQL execution failed:', error);
    return { success: false, error };
  }
}

async function createInsurancePoliciesTable() {
  try {
    console.log('🚀 Starting Insurance Policies Table Creation...\n');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      'supabase',
      'migrations',
      '20251018000000_insurance_policies.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded from:', migrationPath);

    const result = await executeSQL(migrationSQL);

    if (result.requiresManualExecution) {
      console.log('\n🔧 MANUAL EXECUTION REQUIRED:');
      console.log('=====================================');
      console.log(
        '1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql'
      );
      console.log('2. Open the SQL editor');
      console.log('3. Copy and paste the entire contents of:');
      console.log(
        '   supabase/migrations/20251018000000_insurance_policies.sql'
      );
      console.log('4. Click "Run" to execute the migration');
      console.log('5. Come back and run this script again to verify');
      console.log('=====================================\n');
      return false;
    }

    if (!result.success) {
      throw result.error;
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');

    const { error: verifyError } = await supabase
      .from('insurance_policies')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log(
        '⚠️ Table verification failed, but migration may have succeeded'
      );
      console.log('Error:', verifyError.message);
    } else {
      console.log('✅ Table verification successful!');
    }

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Execute the migration
createInsurancePoliciesTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Insurance Policies table is ready!');
      console.log('✅ You can now proceed with Phase 1.1 testing');
    } else {
      console.log('\n⚠️ Migration requires manual intervention');
      console.log('📋 Please follow the instructions above');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
