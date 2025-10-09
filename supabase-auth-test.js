// Test di connessione Supabase semplificato
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.kFo4Cj6rrAY4SLcLLwXyTOLi7YhLMHMKSXpqS9RzCmQ'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 SUPABASE AUTH DIAGNOSTIC REPORT')
console.log('='.repeat(60))

async function testSupabaseConnection() {
  try {
    // Test base connection con fetch API
    console.log('\n1️⃣ Testing basic API connectivity...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    if (response.ok) {
      console.log('✅ Basic API connectivity: SUCCESS')
      console.log('📊 Status:', response.status, response.statusText)
    } else {
      console.log('❌ Basic API connectivity: FAILED')
      console.log('📊 Status:', response.status, response.statusText)
      return
    }

    // Test auth endpoint
    console.log('\n2️⃣ Testing Auth endpoint...')
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    if (authResponse.status === 401 || authResponse.status === 400) {
      console.log('✅ Auth endpoint accessible (401/400 expected without valid token)')
    } else {
      console.log('⚠️ Auth endpoint response:', authResponse.status, authResponse.statusText)
    }

    // Test database access con Service Role
    console.log('\n3️⃣ Testing database access with Service Role...')
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    })

    if (dbResponse.ok) {
      const count = dbResponse.headers.get('content-range')
      console.log('✅ Database access: SUCCESS')
      console.log('📈 Profiles table accessible, range:', count)
    } else {
      console.log('❌ Database access: FAILED')
      console.log('📊 Status:', dbResponse.status, dbResponse.statusText)
      const errorBody = await dbResponse.text()
      console.log('🔍 Error details:', errorBody.substring(0, 200))
    }

    // Test organizations table
    console.log('\n4️⃣ Testing organizations table...')
    const orgsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id,name&limit=5`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (orgsResponse.ok) {
      const orgs = await orgsResponse.json()
      console.log('✅ Organizations table: SUCCESS')
      console.log('📊 Found', orgs.length, 'organizations')
      if (orgs.length > 0) {
        console.log('📝 Sample org:', orgs[0])
      }
    } else {
      console.log('❌ Organizations table: FAILED')
      console.log('📊 Status:', orgsResponse.status, orgsResponse.statusText)
    }

    // Test user_organizations table 
    console.log('\n5️⃣ Testing user_organizations table...')
    const userOrgsResponse = await fetch(`${supabaseUrl}/rest/v1/user_organizations?select=user_id,organization_id,role&limit=5`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (userOrgsResponse.ok) {
      const userOrgs = await userOrgsResponse.json()
      console.log('✅ User-Organizations table: SUCCESS')
      console.log('📊 Found', userOrgs.length, 'user-org relationships')
      if (userOrgs.length > 0) {
        console.log('📝 Sample relationship:', userOrgs[0])
      }
    } else {
      console.log('❌ User-Organizations table: FAILED')
      console.log('📊 Status:', userOrgsResponse.status, userOrgsResponse.statusText)
    }

    // Test RLS policies
    console.log('\n6️⃣ Testing RLS Policies...')
    const rlsResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,  // Using anon key to test RLS
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (rlsResponse.status === 401) {
      console.log('✅ RLS Policies: ACTIVE (401 expected with anon key)')
    } else if (rlsResponse.ok) {
      const data = await rlsResponse.json()
      console.log('⚠️ RLS Policies: May be misconfigured (got data with anon key)')
      console.log('📝 Data received:', data)
    } else {
      console.log('❌ RLS Test: Unexpected response', rlsResponse.status)
    }

  } catch (error) {
    console.error('❌ Critical connection error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 DIAGNOSTIC COMPLETED')
}

testSupabaseConnection()