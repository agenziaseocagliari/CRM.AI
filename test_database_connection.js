import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Check if insurance_policies table exists
    console.log('\n🔍 Checking if insurance_policies table exists...');
    
    const { data: insuranceData, error: insuranceError } = await supabase
      .from('insurance_policies')
      .select('id')
      .limit(1);
    
    if (insuranceError) {
      if (insuranceError.code === 'PGRST116') {
        console.log('📋 insurance_policies table does NOT exist - need to create it');
        console.log('\n🔧 Please manually execute the migration SQL in Supabase dashboard:');
        console.log('👉 Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql');
        console.log('👉 Open the SQL editor and paste the contents of:');
        console.log('   supabase/migrations/20251018000000_insurance_policies.sql');
        return false;
      } else {
        console.error('❌ Error checking insurance_policies table:', insuranceError);
        return false;
      }
    } else {
      console.log('✅ insurance_policies table already exists!');
      console.log('📊 Found data:', insuranceData);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database is ready for insurance policies!');
    } else {
      console.log('\n⚠️ Manual migration required');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });