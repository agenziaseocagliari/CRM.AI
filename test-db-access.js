// Database test script using Supabase client
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0' // CORRECT SERVICE ROLE KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database connection and opportunities query...\n')

  try {
    // Test 1: Check opportunities table schema
    console.log('1. Testing opportunities table schema:')
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec', {
        query: `SELECT column_name, data_type FROM information_schema.columns 
                WHERE table_name = 'opportunities' 
                ORDER BY ordinal_position`
      })

    if (schemaError) {
      console.log('   ❌ Schema error:', schemaError)
    } else {
      console.log('   ✅ Schema columns:', schemaData)
    }

    // Test 2: Count all opportunities
    console.log('\n2. Testing opportunities count:')
    const { count, error: countError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('   ❌ Count error:', countError)
    } else {
      console.log('   ✅ Total opportunities:', count)
    }

    // Test 3: Get all opportunities data
    console.log('\n3. Testing opportunities data:')
    const { data: oppsData, error: oppsError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(10)

    if (oppsError) {
      console.log('   ❌ Data error:', oppsError)
    } else {
      console.log('   ✅ Opportunities data:')
      console.log('   Count:', oppsData?.length || 0)
      if (oppsData && oppsData.length > 0) {
        console.log('   Sample record:', JSON.stringify(oppsData[0], null, 2))
        
        // Check each opportunity
        oppsData.forEach((opp, idx) => {
          console.log(`   ${idx + 1}. ID: ${opp.id}, contact_name: "${opp.contact_name}", stage: "${opp.stage}", value: ${opp.value}`)
        })
      }
    }

    // Test 4: Get organizations
    console.log('\n4. Testing organizations:')
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')

    if (orgsError) {
      console.log('   ❌ Organizations error:', orgsError)
    } else {
      console.log('   ✅ Organizations found:', orgsData?.length || 0)
      orgsData?.forEach(org => {
        console.log(`   - ${org.name} (ID: ${org.id})`)
      })
    }

    // Test 5: Check specific organization opportunities
    if (orgsData && orgsData.length > 0) {
      const firstOrgId = orgsData[0].id
      console.log(`\n5. Testing opportunities for organization ${firstOrgId}:`)
      
      const { data: orgOppsData, error: orgOppsError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', firstOrgId)

      if (orgOppsError) {
        console.log('   ❌ Organization opportunities error:', orgOppsError)
      } else {
        console.log('   ✅ Opportunities for this organization:', orgOppsData?.length || 0)
        orgOppsData?.forEach(opp => {
          console.log(`   - ${opp.contact_name} (Stage: ${opp.stage}, Value: €${opp.value})`)
        })
      }
    }

  } catch (error) {
    console.error('💥 Critical error:', error)
  }
}

testDatabase()
  .then(() => {
    console.log('\n✅ Database test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Database test failed:', error)
    process.exit(1)
  })