/**
 * Check actual contact_imports table structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 CHECKING contact_imports TABLE STRUCTURE\n');
  
  try {
    // Get actual table structure by querying it
    const { data: sample, error } = await supabase
      .from('contact_imports')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying contact_imports:', error);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('✅ EXISTING COLUMNS:');
      const columns = Object.keys(sample[0]);
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log('📋 Table is empty, checking with insert attempt...');
      
      // Try a test insert to see what fields are expected
      const testRecord = {
        filename: 'test.csv',
        status: 'pending'
      };
      
      const { error: insertError } = await supabase
        .from('contact_imports')
        .insert(testRecord);
      
      if (insertError) {
        console.log('❌ Insert error reveals required fields:', insertError);
      } else {
        console.log('✅ Basic insert works');
      }
    }
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
  }
}

checkTableStructure();