// Quick check of contacts table schema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkContactsSchema() {
  // Check existing contact structure
  const { data: existingContact, error } = await supabase
    .from('contacts')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log('📋 CONTACTS TABLE SCHEMA:')
  console.log('=========================')
  
  if (existingContact && existingContact.length > 0) {
    const columns = Object.keys(existingContact[0])
    columns.forEach(column => {
      console.log(`✓ ${column}`)
    })
  } else {
    console.log('No contacts found')
  }
}

checkContactsSchema().catch(console.error)