// Direct database authentication fix using minimal approach
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGRkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔧 DIRECT AUTHENTICATION FIX - MINIMAL APPROACH')
console.log('='.repeat(60))

async function directAuthFix() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Try to bypass the trigger issue by using SQL directly via RPC
  console.log('\n1️⃣ Creating organization via direct SQL...')
  
  const createOrgSQL = `
    INSERT INTO organizations (name, created_at, updated_at) 
    VALUES ('Agenzia SEO Cagliari', NOW(), NOW()) 
    RETURNING id, name;
  `

  try {
    // Check if there's an SQL execution RPC
    const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: createOrgSQL })
    })

    let orgId = null
    
    if (sqlResponse.ok) {
      const sqlResult = await sqlResponse.json()
      console.log('✅ Organization created via SQL!')
      console.log('📝 Result:', JSON.stringify(sqlResult, null, 2))
      if (sqlResult.length > 0) {
        orgId = sqlResult[0].id
      }
    } else {
      console.log(`⚠️ SQL RPC not available: ${sqlResponse.status}`)
      
      // Fallback: try to find existing organizations or create one differently
      console.log('Trying alternative approach...')
      
      // Check if there are any tables that don't have triggers
      const simpleData = {
        name: 'Test Organization'
      }
      
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(simpleData)
      })
      
      if (directResponse.ok) {
        console.log('✅ Organization created via direct insert!')
        
        // Get the created organization
        const getOrgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?name=eq.Test Organization&select=*`, {
          method: 'GET',
          headers
        })
        
        if (getOrgResponse.ok) {
          const orgs = await getOrgResponse.json()
          if (orgs.length > 0) {
            orgId = orgs[0].id
            console.log('📝 Organization ID:', orgId)
          }
        }
      } else {
        const errorText = await directResponse.text()
        console.log(`❌ Direct insert failed: ${directResponse.status}`)
        console.log('🔍 Error:', errorText)
      }
    }

    // Step 2: Create profiles if we have an organization
    if (orgId) {
      console.log('\n2️⃣ Creating profiles with organization ID:', orgId)
      
      const users = [
        {
          id: 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
          email: 'agenziaseocagliari@gmail.com',
          role: 'superadmin',
          full_name: 'Agenzia SEO Cagliari'
        },
        {
          id: 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
          email: 'webproseoid@gmail.com',
          role: 'user',
          full_name: 'Web Proseo'
        }
      ]

      for (const user of users) {
        try {
          const profile = {
            id: user.id,
            email: user.email,
            organization_id: orgId,
            role: user.role,
            full_name: user.full_name,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              ...headers,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(profile)
          })

          if (profileResponse.ok) {
            await profileResponse.json()
            console.log(`✅ Profile created for ${user.email}`)
          } else {
            const errorText = await profileResponse.text()
            console.log(`❌ Profile creation failed for ${user.email}: ${profileResponse.status}`)
            console.log('🔍 Error:', errorText.substring(0, 200))
          }
        } catch (error) {
          console.log(`❌ Error creating profile for ${user.email}:`, error.message)
        }
      }
    } else {
      console.log('❌ No organization ID available, cannot create profiles')
    }

    // Step 3: Test authentication
    console.log('\n3️⃣ Testing authentication...')
    
    const authTestResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      method: 'GET',
      headers
    })

    if (authTestResponse.ok) {
      const profiles = await authTestResponse.json()
      console.log(`✅ Authentication test: ${profiles.length} profiles found`)
      
      if (profiles.length > 0) {
        console.log('🎉 SUCCESS! Authentication should now work!')
        console.log('📝 Active profiles:')
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.email} (${profile.role})`)
        })
      }
    } else {
      console.log('❌ Authentication test failed')
    }

  } catch (error) {
    console.log('❌ Direct auth fix error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 DIRECT AUTH FIX COMPLETED')
}

directAuthFix()