// Test Edge Functions Authentication
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.kFo4Cj6rrAY4SLcLLwXyTOLi7YhLMHMKSXpqS9RzCmQ'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 EDGE FUNCTIONS AUTHENTICATION TEST')
console.log('='.repeat(60))

async function testEdgeFunctions() {
  // Test 1: Main FormMaster function
  console.log('\n1️⃣ Testing generate-form-fields function...')
  try {
    const formMasterResponse = await fetch(`${supabaseUrl}/functions/v1/generate-form-fields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test form for authentication check',
        organization_id: 'test-org-123'
      })
    })

    console.log(`📊 FormMaster status: ${formMasterResponse.status} ${formMasterResponse.statusText}`)
    
    if (formMasterResponse.ok) {
      const result = await formMasterResponse.json()
      console.log('✅ FormMaster function accessible with anon key')
      console.log('📝 Sample response:', JSON.stringify(result, null, 2).substring(0, 300) + '...')
    } else {
      const errorText = await formMasterResponse.text()
      console.log('❌ FormMaster function failed')
      console.log('🔍 Error:', errorText.substring(0, 400))
    }
  } catch (error) {
    console.log('❌ FormMaster function error:', error.message)
  }

  // Test 2: Try with Service Role key
  console.log('\n2️⃣ Testing generate-form-fields with service role...')
  try {
    const formMasterServiceResponse = await fetch(`${supabaseUrl}/functions/v1/generate-form-fields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test form for service role authentication',
        organization_id: 'test-org-service-123'
      })
    })

    console.log(`📊 FormMaster (service) status: ${formMasterServiceResponse.status} ${formMasterServiceResponse.statusText}`)
    
    if (formMasterServiceResponse.ok) {
      const result = await formMasterServiceResponse.json()
      console.log('✅ FormMaster function accessible with service key')
      console.log('📝 Sample response:', JSON.stringify(result, null, 2).substring(0, 300) + '...')
    } else {
      const errorText = await formMasterServiceResponse.text()
      console.log('❌ FormMaster function failed with service key')
      console.log('🔍 Error:', errorText.substring(0, 400))
    }
  } catch (error) {
    console.log('❌ FormMaster service function error:', error.message)
  }

  // Test 3: Check other functions
  const otherFunctions = [
    'consume-credits',
    'send-email',
    'test-api-integration'
  ]

  console.log('\n3️⃣ Testing other Edge Functions...')
  for (const functionName of otherFunctions) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      })

      console.log(`📊 ${functionName}: ${response.status} ${response.statusText}`)
      
      if (response.status === 404) {
        console.log(`❌ ${functionName}: Function not deployed`)
      } else if (response.ok) {
        console.log(`✅ ${functionName}: Accessible`)
      } else {
        console.log(`⚠️ ${functionName}: Error response (may need specific parameters)`)
      }
    } catch (error) {
      console.log(`❌ ${functionName}: Connection error`)
    }
  }

  // Test 4: List deployed functions
  console.log('\n4️⃣ Attempting to list deployed functions...')
  try {
    const functionsListResponse = await fetch(`${supabaseUrl}/functions/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    })

    console.log(`📊 Functions list: ${functionsListResponse.status} ${functionsListResponse.statusText}`)
    
    if (functionsListResponse.ok) {
      const functionsList = await functionsListResponse.text()
      console.log('✅ Functions list accessible')
      console.log('📝 Functions info:', functionsList.substring(0, 500))
    }
  } catch (error) {
    console.log('❌ Functions list error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 EDGE FUNCTIONS TEST COMPLETED')
}

testEdgeFunctions()