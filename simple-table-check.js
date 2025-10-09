// Simple table content check
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 SIMPLE TABLE CONTENT AND OPTIONS ANALYSIS')
console.log('='.repeat(60))

async function checkTableOptions() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Check organizations table with OPTIONS to see allowed methods and schema
  console.log('\n1️⃣ Checking organizations table schema...')
  try {
    const optionsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'OPTIONS',
      headers
    })

    console.log(`📊 Organizations OPTIONS: ${optionsResponse.status}`)
    console.log('📋 Headers:')
    optionsResponse.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
  } catch (error) {
    console.log('❌ Organizations OPTIONS error:', error.message)
  }

  // Try to get any existing data to understand the structure
  console.log('\n2️⃣ Checking for any existing data...')
  
  const tables = ['organizations', 'profiles', 'contacts', 'leads']
  
  for (const tableName of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=1`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${tableName}: ${data.length} records`)
        if (data.length > 0) {
          console.log(`📝 Sample ${tableName}:`, JSON.stringify(data[0], null, 2))
        }
      } else {
        console.log(`❌ ${tableName}: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
    }
  }

  // Create a very simple organization manually using UUID generation
  console.log('\n3️⃣ Creating organization with auto-generated ID...')
  try {
    // Let the database generate the ID
    const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Agenzia SEO Cagliari'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Organization created with auto ID!')
      console.log('📝 Result:', JSON.stringify(result, null, 2))
      
      // Now try to create a profile using this org ID
      if (result.length > 0 && result[0].id) {
        const orgId = result[0].id
        console.log('\n4️⃣ Creating profile with organization ID:', orgId)
        
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', // agenziaseocagliari user ID
            email: 'agenziaseocagliari@gmail.com',
            organization_id: orgId,
            role: 'superadmin',
            full_name: 'Agenzia SEO Cagliari'
          })
        })

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json()
          console.log('✅ Profile created successfully!')
          console.log('📝 Profile:', JSON.stringify(profileResult, null, 2))
        } else {
          const errorText = await profileResponse.text()
          console.log(`❌ Profile creation failed: ${profileResponse.status}`)
          console.log('🔍 Error:', errorText)
        }
      }
    } else {
      const errorText = await response.text()
      console.log(`❌ Organization creation failed: ${response.status}`)
      console.log('🔍 Error:', errorText)
    }
  } catch (error) {
    console.log('❌ Organization creation error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 SIMPLE ANALYSIS COMPLETED')
}

checkTableOptions()