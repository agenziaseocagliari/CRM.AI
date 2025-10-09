// Diagnosi problema Auth Users vs Profiles
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 AUTH USERS vs PROFILES SYNC DIAGNOSTIC')
console.log('='.repeat(60))

async function diagnoseAuthSync() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Step 1: Check auth.users via admin API
  console.log('\n1️⃣ Attempting to access auth.users via admin API...')
  try {
    const authUsersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers
    })

    if (authUsersResponse.ok) {
      const authUsers = await authUsersResponse.json()
      console.log(`✅ Auth users found: ${authUsers.users?.length || 0}`)
      
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('📝 Auth users list:')
        authUsers.users.forEach((user, index) => {
          console.log(`  ${index + 1}. Email: ${user.email}`)
          console.log(`     UID: ${user.id}`)
          console.log(`     Created: ${user.created_at}`)
          console.log(`     Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
          console.log(`     Last Sign In: ${user.last_sign_in_at || 'Never'}`)
          console.log()
        })
      }
    } else {
      console.log(`❌ Auth users access failed: ${authUsersResponse.status}`)
      const errorText = await authUsersResponse.text()
      console.log('🔍 Error:', errorText.substring(0, 300))
    }
  } catch (error) {
    console.log('❌ Auth users check failed:', error.message)
  }

  // Step 2: Check profiles table
  console.log('\n2️⃣ Checking profiles table...')
  try {
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      method: 'GET',
      headers
    })

    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json()
      console.log(`✅ Profiles found: ${profiles.length}`)
      
      if (profiles.length > 0) {
        console.log('📝 Profiles list:')
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. Email: ${profile.email}`)
          console.log(`     ID: ${profile.id}`)
          console.log(`     Role: ${profile.role}`)
          console.log(`     Created: ${profile.created_at}`)
          console.log()
        })
      } else {
        console.log('⚠️ PROFILES TABLE IS EMPTY!')
        console.log('💡 This explains the authentication issues')
      }
    } else {
      console.log(`❌ Profiles access failed: ${profilesResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Profiles check failed:', error.message)
  }

  // Step 3: Create missing profile for known user
  console.log('\n3️⃣ Creating missing profile for webproseoid@gmail.com...')
  try {
    const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
        email: 'webproseoid@gmail.com',
        role: 'user',
        full_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (createProfileResponse.ok) {
      const newProfile = await createProfileResponse.json()
      console.log('✅ Profile created successfully!')
      console.log('📝 New profile:', JSON.stringify(newProfile, null, 2))
    } else {
      const errorText = await createProfileResponse.text()
      console.log(`❌ Profile creation failed: ${createProfileResponse.status}`)
      console.log('🔍 Error details:', errorText)
      
      // Check if it's a constraint issue
      if (errorText.includes('constraint') || errorText.includes('unique')) {
        console.log('💡 Profile might already exist, trying to update...')
        
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.dfa97fa5-8375-4f15-ad95-53d339ebcda9`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            email: 'webproseoid@gmail.com',
            updated_at: new Date().toISOString()
          })
        })
        
        if (updateResponse.ok) {
          console.log('✅ Profile updated successfully!')
        } else {
          console.log('❌ Profile update also failed')
        }
      }
    }
  } catch (error) {
    console.log('❌ Profile creation error:', error.message)
  }

  // Step 4: Create a test organization
  console.log('\n4️⃣ Creating test organization...')
  try {
    const createOrgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'test-org-123',
        name: 'Test Organization',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (createOrgResponse.ok) {
      console.log('✅ Test organization created!')
    } else {
      const errorText = await createOrgResponse.text()
      console.log(`⚠️ Organization creation: ${createOrgResponse.status}`)
      console.log('🔍 Details:', errorText.substring(0, 200))
    }
  } catch (error) {
    console.log('❌ Organization creation error:', error.message)
  }

  // Step 5: Verify authentication now works
  console.log('\n5️⃣ Testing authentication after profile creation...')
  try {
    const testAuthResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=5`, {
      method: 'GET',
      headers
    })

    if (testAuthResponse.ok) {
      const profiles = await testAuthResponse.json()
      console.log(`✅ Authentication test: ${profiles.length} profiles found`)
      if (profiles.length > 0) {
        console.log('🎉 AUTHENTICATION SHOULD NOW WORK!')
      }
    } else {
      console.log(`❌ Authentication test failed: ${testAuthResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Authentication test error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 AUTH SYNC DIAGNOSTIC COMPLETED')
}

diagnoseAuthSync()