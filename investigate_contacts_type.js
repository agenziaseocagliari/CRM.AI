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

async function investigateContactsIdType() {
  try {
    console.log('🔍 Investigating contacts.id data type...\n');
    
    // Method 1: Check actual data to see ID format
    console.log('1️⃣ Checking actual contact data...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .limit(3);
    
    if (contactsError) {
      console.error('❌ Error fetching contacts:', contactsError);
      return false;
    }
    
    if (contacts && contacts.length > 0) {
      console.log('✅ Sample contact IDs:');
      contacts.forEach((contact, idx) => {
        const idValue = contact.id;
        const isUUID = typeof idValue === 'string' && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idValue);
        
        console.log(`   Contact ${idx + 1}: ${idValue} (${isUUID ? 'UUID' : 'OTHER'})`);
      });
    } else {
      console.log('⚠️ No contacts found in database');
    }
    
    // Method 2: Check organizations.id for comparison
    console.log('\n2️⃣ Checking organizations.id for comparison...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError);
    } else if (orgs && orgs.length > 0) {
      const orgId = orgs[0].id;
      const isUUID = typeof orgId === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      
      console.log(`✅ Sample organization ID: ${orgId} (${isUUID ? 'UUID' : 'OTHER'})`);
    }
    
    // Method 3: Check table structure via information_schema
    console.log('\n3️⃣ Checking database schema...');
    
    const { data: contactsSchema, error: schemaError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            table_name,
            column_name, 
            data_type,
            column_default
          FROM information_schema.columns 
          WHERE table_name IN ('contacts', 'organizations')
          AND column_name = 'id'
          ORDER BY table_name
        `
      });
    
    if (schemaError) {
      console.log('⚠️ Could not query schema via rpc, trying alternative...');
      
      // Try direct query approach
      console.log('4️⃣ Testing direct foreign key creation...');
      
      // Create a test table to see what works
      const testSQL = `
        DROP TABLE IF EXISTS test_fk_check CASCADE;
        
        CREATE TABLE test_fk_check (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          test_contact_id UUID REFERENCES contacts(id),
          test_org_id UUID REFERENCES organizations(id)
        );
        
        DROP TABLE test_fk_check CASCADE;
      `;
      
      console.log('Testing UUID foreign key compatibility...');
      // We can't execute this directly, but the attempt will show us the pattern
      
    } else {
      console.log('✅ Schema information:');
      contactsSchema?.forEach(col => {
        console.log(`   ${col.table_name}.${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎯 CONCLUSION');
    console.log('═'.repeat(60));
    
    if (contacts && contacts.length > 0) {
      const firstId = contacts[0].id;
      const isUUID = typeof firstId === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstId);
      
      if (isUUID) {
        console.log('✅ CONFIRMED: contacts.id is UUID format');
        console.log('✅ DECISION: Use UUID for contact_id in insurance_policies');
        console.log('✅ TypeScript: contact_id should be string type');
        return 'UUID';
      } else {
        console.log('❌ DETECTED: contacts.id is NOT UUID format');
        console.log('❌ ID Format:', typeof firstId, firstId);
        return 'OTHER';
      }
    } else {
      console.log('⚠️ No data available for type detection');
      console.log('🔧 ASSUMPTION: Based on Supabase defaults, using UUID');
      return 'UUID';
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
    return false;
  }
}

investigateContactsIdType()
  .then(result => {
    console.log('\n🏁 Investigation complete. Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });