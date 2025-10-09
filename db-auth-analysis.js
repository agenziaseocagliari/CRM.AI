// Database Authentication Schema Analysis
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 DATABASE AUTHENTICATION SCHEMA ANALYSIS')
console.log('='.repeat(60))

async function analyzeAuthSchema() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Test 1: Auth users table (Supabase built-in)
  console.log('\n1️⃣ Checking auth.users table...')
  try {
    const authUsersResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_auth_users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    })
    
    if (authUsersResponse.ok) {
      const authUsers = await authUsersResponse.json()
      console.log(`✅ Auth users found: ${authUsers.length}`)
      if (authUsers.length > 0) {
        console.log('📝 Sample auth user:', JSON.stringify(authUsers[0], null, 2))
      }
    } else {
      console.log(`⚠️ Auth users RPC not available: ${authUsersResponse.status}`)
    }
  } catch (error) {
    console.log('⚠️ Auth users check failed:', error.message)
  }

  // Test 2: Profiles table structure
  console.log('\n2️⃣ Analyzing profiles table structure...')
  try {
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=10`, {
      method: 'GET',
      headers
    })

    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json()
      console.log(`✅ Profiles table accessible: ${profiles.length} records`)
      
      if (profiles.length === 0) {
        console.log('⚠️ NO PROFILES FOUND - This might be the authentication issue!')
        console.log('💡 Suggestion: Create test profiles to enable authentication')
      } else {
        console.log('📝 Sample profile:', JSON.stringify(profiles[0], null, 2))
      }
    } else {
      console.log(`❌ Profiles table access failed: ${profilesResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Profiles analysis failed:', error.message)
  }

  // Test 3: Organizations table
  console.log('\n3️⃣ Checking organizations table...')
  try {
    const orgsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?limit=10`, {
      method: 'GET',
      headers
    })

    if (orgsResponse.ok) {
      const orgs = await orgsResponse.json()
      console.log(`✅ Organizations table: ${orgs.length} records`)
      if (orgs.length > 0) {
        console.log('📝 Sample organization:', JSON.stringify(orgs[0], null, 2))
      } else {
        console.log('⚠️ No organizations found')
      }
    } else {
      console.log(`❌ Organizations table access failed: ${orgsResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Organizations analysis failed:', error.message)
  }

  // Test 4: User-Organizations relationships
  console.log('\n4️⃣ Checking user_organizations table...')
  try {
    const userOrgsResponse = await fetch(`${supabaseUrl}/rest/v1/user_organizations?limit=10`, {
      method: 'GET',
      headers
    })

    if (userOrgsResponse.ok) {
      const userOrgs = await userOrgsResponse.json()
      console.log(`✅ User-Organizations table: ${userOrgs.length} records`)
      if (userOrgs.length > 0) {
        console.log('📝 Sample relationship:', JSON.stringify(userOrgs[0], null, 2))
      } else {
        console.log('⚠️ No user-organization relationships found')
      }
    } else {
      console.log(`❌ User-Organizations table access failed: ${userOrgsResponse.status}`)
    }
  } catch (error) {
    console.log('❌ User-Organizations analysis failed:', error.message)
  }

  // Test 5: Credits system
  console.log('\n5️⃣ Checking credits system...')
  try {
    const creditsResponse = await fetch(`${supabaseUrl}/rest/v1/organization_credits?limit=5`, {
      method: 'GET',
      headers
    })

    if (creditsResponse.ok) {
      const credits = await creditsResponse.json()
      console.log(`✅ Organization credits: ${credits.length} records`)
      if (credits.length > 0) {
        console.log('📝 Sample credits:', JSON.stringify(credits[0], null, 2))
      } else {
        console.log('⚠️ No organization credits found')
      }
    } else {
      console.log(`❌ Credits table access failed: ${creditsResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Credits analysis failed:', error.message)
  }

  // Test 6: Check all tables in schema
  console.log('\n6️⃣ Listing all database tables...')
  try {
    const tablesQuery = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: tablesQuery })
    })

    if (tablesResponse.ok) {
      const tables = await tablesResponse.json()
      console.log('✅ Database tables found:')
      tables.forEach(table => {
        console.log(`  📁 ${table.table_name} (${table.table_type})`)
      })
    } else {
      console.log(`⚠️ Tables listing not available: ${tablesResponse.status}`)
    }
  } catch (error) {
    console.log('⚠️ Tables listing failed:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 DATABASE SCHEMA ANALYSIS COMPLETED')
}

analyzeAuthSchema()