import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function executeMigrationViaAPI() {
  console.log('🚀 Executing Migration via Supabase API...\n');
  
  try {
    // Load credentials
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251018000000_insurance_policies_FIXED.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log(`✅ SQL length: ${migrationSQL.length} characters`);
    
    // Try to execute via Supabase API
    console.log('\n⚡ Attempting API execution...');
    
    const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ API method not available, providing manual instructions...');
      console.log('Error:', response.status, errorText);
      
      // Provide detailed manual instructions
      console.log('\n' + '═'.repeat(60));
      console.log('🔧 MANUAL EXECUTION REQUIRED');
      console.log('═'.repeat(60));
      console.log('1. Open Supabase SQL Editor:');
      console.log('   👉 https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql');
      console.log('\n2. Copy and paste the contents of:');
      console.log('   👉 supabase/migrations/20251018000000_insurance_policies_FIXED.sql');
      console.log('\n3. Click "Run" to execute the migration');
      console.log('\n4. Verify success by checking:');
      console.log('   - Table "insurance_policies" created');
      console.log('   - Foreign keys to organizations and contacts');
      console.log('   - RLS policies active');
      console.log('   - Indexes created');
      console.log('\n5. Come back and run: node scripts/verify-migration.js');
      console.log('═'.repeat(60));
      
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Migration executed successfully via API!');
    console.log('Result:', result);
    
    return true;
    
  } catch (error) {
    console.error('❌ API execution failed:', error.message);
    
    // Fall back to manual instructions
    console.log('\n' + '═'.repeat(60));
    console.log('📝 MANUAL EXECUTION INSTRUCTIONS');
    console.log('═'.repeat(60));
    console.log('Since automatic execution failed, please:');
    console.log('\n1. Go to Supabase SQL Editor');
    console.log('2. Execute the FIXED migration file');
    console.log('3. Run verification script');
    console.log('═'.repeat(60));
    
    return false;
  }
}

executeMigrationViaAPI()
  .then(success => {
    if (success) {
      console.log('\n🎉 Migration completed automatically!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Manual execution required');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });