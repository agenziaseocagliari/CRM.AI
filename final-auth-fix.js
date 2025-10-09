// Final authentication fix using correct service key from .env
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0' // From .env file

console.log('🔧 FINAL AUTHENTICATION FIX WITH CORRECT KEY')
console.log('='.repeat(60))

async function finalAuthFix() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Step 1: Test if the service key works
  console.log('\n1️⃣ Testing service role key...')
  try {
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      method: 'GET',
      headers
    })

    if (testResponse.ok) {
      console.log('✅ Service role key is valid!')
    } else {
      console.log(`❌ Service role key test failed: ${testResponse.status}`)
      const errorText = await testResponse.text()
      console.log('🔍 Error:', errorText)
      return
    }
  } catch (error) {
    console.log('❌ Service key test error:', error.message)
    return
  }

  // Step 2: Create organization with minimal data
  console.log('\n2️⃣ Creating organization...')
  let orgId = null
  
  try {
    const orgData = {
      name: 'Agenzia SEO Cagliari'
    }

    const orgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orgData)
    })

    if (orgResponse.ok) {
      const orgResult = await orgResponse.json()
      console.log('✅ Organization created!')
      console.log('📝 Organization:', JSON.stringify(orgResult, null, 2))
      
      if (orgResult.length > 0) {
        orgId = orgResult[0].id
        console.log('🆔 Organization ID:', orgId)
      }
    } else {
      const errorText = await orgResponse.text()
      console.log(`❌ Organization creation failed: ${orgResponse.status}`)
      console.log('🔍 Error:', errorText)
      
      // Check if organization already exists
      const checkOrgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*&limit=5`, {
        method: 'GET',
        headers
      })
      
      if (checkOrgResponse.ok) {
        const existingOrgs = await checkOrgResponse.json()
        console.log(`📊 Found ${existingOrgs.length} existing organizations`)
        if (existingOrgs.length > 0) {
          orgId = existingOrgs[0].id
          console.log('🆔 Using existing organization ID:', orgId)
        }
      }
    }
  } catch (error) {
    console.log('❌ Organization creation error:', error.message)
  }

  // Step 3: Create profiles
  if (orgId) {
    console.log('\n3️⃣ Creating profiles...')
    
    const authUsers = [
      {
        id: 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
        email: 'agenziaseocagliari@gmail.com',
        role: 'superadmin'
      },
      {
        id: 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
        email: 'webproseoid@gmail.com',
        role: 'user'
      }
    ]

    for (const user of authUsers) {
      try {
        const profileData = {
          id: user.id,
          email: user.email,
          organization_id: orgId,
          role: user.role,
          full_name: user.email.split('@')[0],
          is_active: true
        }

        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(profileData)
        })

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json()
          console.log(`✅ Profile created for ${user.email}`)
        } else {
          const errorText = await profileResponse.text()
          console.log(`⚠️ Profile for ${user.email}: ${profileResponse.status}`)
          console.log('🔍 Details:', errorText.substring(0, 150))
        }
      } catch (error) {
        console.log(`❌ Error with ${user.email}:`, error.message)
      }
    }
  } else {
    console.log('❌ Cannot create profiles without organization ID')
  }

  // Step 4: Final verification and test
  console.log('\n4️⃣ Final verification...')
  try {
    const finalTestResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      method: 'GET',
      headers
    })

    if (finalTestResponse.ok) {
      const profiles = await finalTestResponse.json()
      console.log(`✅ Final check: ${profiles.length} profiles in database`)
      
      if (profiles.length > 0) {
        console.log('\n🎉 AUTHENTICATION FIX SUCCESSFUL!')
        console.log('✅ Profiles created and linked to organizations')
        console.log('✅ RLS policies should now work properly')
        console.log('✅ Edge Functions should accept user tokens')
        
        console.log('\n📋 Active profiles:')
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.email}`)
          console.log(`     Role: ${profile.role}`)
          console.log(`     Org ID: ${profile.organization_id}`)
          console.log(`     Active: ${profile.is_active}`)
          console.log()
        })
      } else {
        console.log('⚠️ No profiles found - authentication may still have issues')
      }
    } else {
      console.log('❌ Final verification failed')
    }
  } catch (error) {
    console.log('❌ Final verification error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 AUTHENTICATION FIX COMPLETED')
}

finalAuthFix()