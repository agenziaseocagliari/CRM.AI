// Test avanzato connessione Supabase con diagnostica dettagliata
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.kFo4Cj6rrAY4SLcLLwXyTOLi7YhLMHMKSXpqS9RzCmQ'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 ADVANCED SUPABASE CONNECTIVITY DIAGNOSIS')
console.log('='.repeat(60))

async function diagnosticTest() {
  // Test 1: Basic connectivity
  console.log('\n1️⃣ Testing DNS resolution and basic connectivity...')
  try {
    const basicResponse = await fetch(supabaseUrl, {
      method: 'GET'
    })
    console.log('✅ DNS resolution: SUCCESS')
    console.log(`📊 Basic response: ${basicResponse.status} ${basicResponse.statusText}`)
  } catch (error) {
    console.log('❌ DNS/Network issue:', error.message)
    return
  }

  // Test 2: Health endpoint
  console.log('\n2️⃣ Testing Supabase health endpoint...')
  try {
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey
      }
    })
    console.log(`📊 Health check: ${healthResponse.status} ${healthResponse.statusText}`)
    
    if (healthResponse.ok) {
      await healthResponse.text()
      console.log('✅ REST API is accessible')
    } else {
      console.log('❌ REST API access failed')
      const errorText = await healthResponse.text()
      console.log('🔍 Error response:', errorText.substring(0, 300))
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
  }

  // Test 3: Edge Functions endpoint
  console.log('\n3️⃣ Testing Edge Functions endpoint...')
  try {
    const functionsResponse = await fetch(`${supabaseUrl}/functions/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    console.log(`📊 Functions endpoint: ${functionsResponse.status} ${functionsResponse.statusText}`)
  } catch (error) {
    console.log('❌ Functions endpoint test failed:', error.message)
  }

  // Test 4: Auth endpoint
  console.log('\n4️⃣ Testing Auth endpoint...')
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey
      }
    })
    console.log(`📊 Auth settings: ${authResponse.status} ${authResponse.statusText}`)
    
    if (authResponse.ok) {
      const authSettings = await authResponse.json()
      console.log('✅ Auth endpoint accessible')
      console.log('📝 Auth settings:', JSON.stringify(authSettings, null, 2))
    }
  } catch (error) {
    console.log('❌ Auth endpoint test failed:', error.message)
  }

  // Test 5: Service role database access
  console.log('\n5️⃣ Testing database access with correct headers...')
  try {
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    console.log(`📊 Database query: ${dbResponse.status} ${dbResponse.statusText}`)
    
    if (dbResponse.ok) {
      const profiles = await dbResponse.json()
      console.log('✅ Database access: SUCCESS')
      console.log(`📈 Found ${profiles.length} profiles`)
      if (profiles.length > 0) {
        console.log('📝 Sample profile:', JSON.stringify(profiles[0], null, 2))
      }
    } else {
      console.log('❌ Database access failed')
      const errorBody = await dbResponse.text()
      console.log('🔍 Error details:', errorBody)
    }
  } catch (error) {
    console.log('❌ Database query failed:', error.message)
  }

  // Test 6: Check project status
  console.log('\n6️⃣ Testing project metadata...')
  try {
    const metaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'OPTIONS',
      headers: {
        'apikey': serviceRoleKey
      }
    })
    console.log(`📊 Project metadata: ${metaResponse.status} ${metaResponse.statusText}`)
    
    // Check response headers for project info
    console.log('📋 Response headers:')
    metaResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('supabase') || key.toLowerCase().includes('x-')) {
        console.log(`  ${key}: ${value}`)
      }
    })
  } catch (error) {
    console.log('❌ Metadata check failed:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 ADVANCED DIAGNOSTIC COMPLETED')
}

diagnosticTest()