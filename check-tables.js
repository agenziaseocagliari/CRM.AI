// Simple database tables check
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 SIMPLE DATABASE TABLES CHECK')
console.log('='.repeat(50))

async function checkTables() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Get list of all tables using OpenAPI spec
  console.log('\n📋 Attempting to list all accessible tables...')
  try {
    const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers
    })

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      console.log('✅ API Schema accessible')
      console.log('📝 Available endpoints:', Object.keys(schemaData.paths || {}))
    } else {
      console.log(`❌ Schema access failed: ${schemaResponse.status}`)
    }
  } catch (error) {
    console.log('❌ Schema check failed:', error.message)
  }

  // Try common table names that should exist
  const commonTables = [
    'profiles',
    'organizations', 
    'user_organizations',
    'organization_credits',
    'credits_transactions',
    'form_submissions',
    'integrations',
    'audit_logs',
    'superadmin_sessions'
  ]

  console.log('\n🔍 Testing common table accessibility...')
  for (const tableName of commonTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=1`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${tableName}: accessible (${data.length} records)`)
      } else if (response.status === 404) {
        console.log(`❌ ${tableName}: table not found`)
      } else {
        console.log(`⚠️ ${tableName}: error ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${tableName}: connection error`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 TABLE CHECK COMPLETED')
}

checkTables()