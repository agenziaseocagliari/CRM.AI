// Verifica struttura tabelle database
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 DATABASE TABLES STRUCTURE ANALYSIS')
console.log('='.repeat(60))

async function analyzeTableStructure() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Check organizations table structure by trying to insert minimal data
  console.log('\n1️⃣ Testing organizations table structure...')
  try {
    // Try with minimal fields first
    const minimalOrg = {
      name: 'Test Organization Minimal'
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(minimalOrg)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Organizations table accepts minimal data')
      console.log('📝 Created org:', JSON.stringify(result, null, 2))
      
      // Clean up
      if (result.id) {
        await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${result.id}`, {
          method: 'DELETE',
          headers
        })
      }
    } else {
      const errorText = await response.text()
      console.log(`⚠️ Organizations structure issue: ${response.status}`)
      console.log('🔍 Error details:', errorText)
    }
  } catch (error) {
    console.log('❌ Organizations test error:', error.message)
  }

  // Check profiles table structure
  console.log('\n2️⃣ Testing profiles table structure...')
  try {
    // First create a simple organization that works
    const simpleOrg = { name: 'Test Simple Org' }
    const orgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(simpleOrg)
    })

    let orgId = null
    if (orgResponse.ok) {
      const orgResult = await orgResponse.json()
      orgId = orgResult.id
      console.log('✅ Test organization created:', orgId)
    } else {
      console.log('❌ Could not create test organization')
      return
    }

    // Now test profiles with the created org
    const testProfile = {
      email: 'test@example.com',
      organization_id: orgId,
      role: 'user'
    }

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testProfile)
    })

    if (profileResponse.ok) {
      const profileResult = await profileResponse.json()
      console.log('✅ Profiles table structure working')
      console.log('📝 Test profile:', JSON.stringify(profileResult, null, 2))
      
      // Clean up profile
      if (profileResult.id) {
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profileResult.id}`, {
          method: 'DELETE',
          headers
        })
      }
    } else {
      const errorText = await profileResponse.text()
      console.log(`⚠️ Profiles structure issue: ${profileResponse.status}`)
      console.log('🔍 Error details:', errorText)
    }

    // Clean up organization
    if (orgId) {
      await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}`, {
        method: 'DELETE',
        headers
      })
    }

  } catch (error) {
    console.log('❌ Profiles test error:', error.message)
  }

  // Check what organizations currently exist
  console.log('\n3️⃣ Checking existing organizations...')
  try {
    const orgsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
      method: 'GET',
      headers
    })

    if (orgsResponse.ok) {
      const orgs = await orgsResponse.json()
      console.log(`✅ Found ${orgs.length} existing organizations`)
      orgs.forEach((org, index) => {
        console.log(`  ${index + 1}. ID: ${org.id}`)
        console.log(`     Name: ${org.name || 'N/A'}`)
        console.log(`     Created: ${org.created_at || 'N/A'}`)
        console.log()
      })
    } else {
      console.log('❌ Could not fetch existing organizations')
    }
  } catch (error) {
    console.log('❌ Existing orgs check error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 STRUCTURE ANALYSIS COMPLETED')
}

analyzeTableStructure()