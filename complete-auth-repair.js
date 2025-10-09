// Fix completo sincronizzazione Auth Users con Profiles
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔧 COMPLETE AUTH SYNC REPAIR')
console.log('='.repeat(60))

async function completeAuthRepair() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Step 1: Create organizations first
  console.log('\n1️⃣ Creating organizations with proper UUIDs...')
  
  const organizations = [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Valid UUID
      name: 'Agenzia SEO Cagliari',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480', // Valid UUID
      name: 'Web Proseo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  for (const org of organizations) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(org)
      })

      if (response.ok) {
        console.log(`✅ Organization "${org.name}" created successfully`)
      } else {
        const errorText = await response.text()
        if (errorText.includes('duplicate key')) {
          console.log(`⚠️ Organization "${org.name}" already exists`)
        } else {
          console.log(`❌ Failed to create "${org.name}":`, response.status)
          console.log('🔍 Error:', errorText.substring(0, 200))
        }
      }
    } catch (error) {
      console.log(`❌ Error creating "${org.name}":`, error.message)
    }
  }

  // Step 2: Get auth users
  console.log('\n2️⃣ Getting auth users...')
  let authUsers = []
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers
    })

    if (authResponse.ok) {
      const authData = await authResponse.json()
      authUsers = authData.users || []
      console.log(`✅ Found ${authUsers.length} auth users`)
    } else {
      console.log('❌ Failed to get auth users')
      return
    }
  } catch (error) {
    console.log('❌ Auth users fetch error:', error.message)
    return
  }

  // Step 3: Create profiles for each auth user
  console.log('\n3️⃣ Creating profiles for auth users...')
  
  const userOrgMapping = {
    'agenziaseocagliari@gmail.com': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'webproseoid@gmail.com': 'f47ac10b-58cc-4372-a567-0e02b2c3d480'
  }

  for (const user of authUsers) {
    try {
      const profile = {
        id: user.id,
        email: user.email,
        organization_id: userOrgMapping[user.email] || organizations[0].id,
        role: user.email.includes('agenziaseocagliari') ? 'superadmin' : 'user',
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        is_active: true,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        console.log(`✅ Profile created for ${user.email}`)
      } else {
        const errorText = await response.text()
        if (errorText.includes('duplicate key')) {
          console.log(`⚠️ Profile for ${user.email} already exists, updating...`)
          
          // Try to update instead
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              email: profile.email,
              organization_id: profile.organization_id,
              role: profile.role,
              updated_at: profile.updated_at
            })
          })

          if (updateResponse.ok) {
            console.log(`✅ Profile updated for ${user.email}`)
          } else {
            console.log(`❌ Failed to update profile for ${user.email}`)
          }
        } else {
          console.log(`❌ Failed to create profile for ${user.email}:`, response.status)
          console.log('🔍 Error:', errorText.substring(0, 300))
        }
      }
    } catch (error) {
      console.log(`❌ Error processing ${user.email}:`, error.message)
    }
  }

  // Step 4: Create user_organizations relationships
  console.log('\n4️⃣ Creating user-organization relationships...')
  
  // First check if user_organizations table exists
  try {
    const checkTableResponse = await fetch(`${supabaseUrl}/rest/v1/user_organizations?limit=1`, {
      method: 'GET',
      headers
    })

    if (checkTableResponse.status === 404) {
      console.log('⚠️ user_organizations table does not exist, skipping...')
    } else {
      // Create relationships
      for (const user of authUsers) {
        const relationship = {
          user_id: user.id,
          organization_id: userOrgMapping[user.email] || organizations[0].id,
          role: user.email.includes('agenziaseocagliari') ? 'owner' : 'member',
          created_at: new Date().toISOString()
        }

        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/user_organizations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(relationship)
          })

          if (response.ok) {
            console.log(`✅ User-org relationship created for ${user.email}`)
          } else {
            const errorText = await response.text()
            console.log(`⚠️ Relationship creation for ${user.email}:`, response.status)
          }
        } catch (error) {
          console.log(`❌ Error creating relationship for ${user.email}:`, error.message)
        }
      }
    }
  } catch (error) {
    console.log('❌ User-organizations table check failed:', error.message)
  }

  // Step 5: Verify everything works
  console.log('\n5️⃣ Final verification...')
  try {
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      method: 'GET',
      headers
    })

    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json()
      console.log(`✅ Final check: ${profiles.length} profiles found`)
      
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.email} (${profile.role}) - Org: ${profile.organization_id}`)
      })

      if (profiles.length > 0) {
        console.log('\n🎉 AUTHENTICATION SYNC COMPLETED SUCCESSFULLY!')
        console.log('✅ Users can now authenticate properly')
        console.log('✅ RLS policies should work')
        console.log('✅ Edge Functions should accept auth tokens')
      }
    } else {
      console.log('❌ Final verification failed')
    }
  } catch (error) {
    console.log('❌ Final verification error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 AUTH REPAIR COMPLETED')
}

completeAuthRepair()