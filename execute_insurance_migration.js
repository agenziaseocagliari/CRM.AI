import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeInsuranceMigration() {
  console.log('🚀 Executing Insurance Policies Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251018000000_insurance_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration SQL loaded, executing...');
    
    // Execute the migration SQL using the RPC function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tableInfo, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'insurance_policies');
    
    if (verifyError) {
      console.error('⚠️ Could not verify table creation:', verifyError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('✅ insurance_policies table created successfully!');
    } else {
      console.log('⚠️ Table verification inconclusive');
    }
    
    // Check columns
    console.log('\n📊 Checking table structure...');
    
    const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'insurance_policies' 
          AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (!columnError && columns) {
      console.log('Columns created:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }
    
    console.log('\n🎉 Insurance Policies Migration Complete!');
    return true;
    
  } catch (error) {
    console.error('💥 Migration error:', error);
    return false;
  }
}

// Execute migration
executeInsuranceMigration().then(success => {
  if (success) {
    console.log('\n✅ Phase 1.1 Database Ready - Proceeding to TypeScript updates...');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed - Manual intervention required');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});