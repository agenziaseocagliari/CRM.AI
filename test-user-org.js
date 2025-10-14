// Test which organization the current user is associated with
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserOrganization() {
  console.log('🔍 Testing user-organization relationship...\n')

  try {
    // Test 1: Get all users
    console.log('1. Testing all profiles:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.log('   ❌ Profiles error:', profilesError)
    } else {
      console.log(`   ✅ Found ${profiles?.length || 0} profiles:`)
      profiles?.forEach(profile => {
        console.log(`   - User ${profile.id}: org=${profile.organization_id}`)
      })
    }

    // Test 2: Get user_organizations junction table
    console.log('\n2. Testing user_organizations:')
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')

    if (userOrgsError) {
      console.log('   ❌ User organizations error:', userOrgsError)
    } else {
      console.log(`   ✅ Found ${userOrgs?.length || 0} user-org relationships:`)
      userOrgs?.forEach(uo => {
        console.log(`   - User ${uo.user_id} → Org ${uo.organization_id} (${uo.role})`)
      })
    }

    // Test 3: Check which organization has the opportunity
    console.log('\n3. Opportunity organization check:')
    const { data: oppOrg, error: oppOrgError } = await supabase
      .from('opportunities')
      .select('id, organization_id, contact_name')
      .single()

    if (oppOrgError) {
      console.log('   ❌ Opportunity org error:', oppOrgError)
    } else {
      console.log('   ✅ Opportunity belongs to organization:', oppOrg.organization_id)
      console.log('   Contact Name:', oppOrg.contact_name)
      
      // Get org details
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', oppOrg.organization_id)
        .single()
      
      console.log('   Organization Name:', org?.name || 'Unknown')
    }

  } catch (error) {
    console.error('💥 Critical error:', error)
  }
}

testUserOrganization()
  .then(() => {
    console.log('\n✅ User organization test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })