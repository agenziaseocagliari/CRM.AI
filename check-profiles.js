// Check available profiles for CSV parser
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTA3NjQ3MSwiZXhwIjoyMDQ0NjUyNDcxfQ.CnMBr2eC8Sm3yHG15SUTYmNf2jUzx8R2ADL3rnFKBxM'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

console.log('=== CHECKING AVAILABLE PROFILES ===\n')

async function checkDatabase() {
try {
  // Get available profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, organization_id')
    .limit(5)
  
  if (profilesError) {
    console.log('❌ Profiles Error:', profilesError)
  } else {
    console.log('📊 Available Profiles:')
    profiles.forEach(profile => {
      console.log(`  - ID: ${profile.id}`)
      console.log(`    Email: ${profile.email}`)
      console.log(`    Org: ${profile.organization_id}\n`)
    })
  }

  // Get available organizations  
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5)
  
  if (orgsError) {
    console.log('❌ Organizations Error:', orgsError)
  } else {
    console.log('🏢 Available Organizations:')
    orgs.forEach(org => {
      console.log(`  - ID: ${org.id}`)
      console.log(`    Name: ${org.name}\n`)
    })
  }

} catch (error) {
  console.log('❌ Query Error:', error)
}
}

// Execute the check
checkDatabase()