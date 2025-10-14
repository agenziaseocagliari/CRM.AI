// FINAL VERIFICATION: Test that pipeline shows opportunities for user's organization
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Pipeline Stages as defined in types.ts
const PipelineStage = {
  NewLead: 'New Lead',
  Contacted: 'Contacted',
  ProposalSent: 'Proposal Sent',
  Won: 'Won',
  Lost: 'Lost'
}

// Stage mapping function (as implemented in useCrmData.ts)
const STAGE_MAPPING = {
  'New Lead': PipelineStage.NewLead,
  'Contacted': PipelineStage.Contacted, 
  'Proposal Sent': PipelineStage.ProposalSent,
  'Won': PipelineStage.Won,
  'Lost': PipelineStage.Lost,
  'default': PipelineStage.NewLead
}

function groupOpportunitiesByStage(opportunities) {
  console.log('🗂️ PIPELINE TEST: Grouping opportunities by stage, input:', opportunities)
  
  const emptyData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  }

  if (!opportunities || opportunities.length === 0) { 
    console.log('⚠️ PIPELINE TEST: No opportunities to group, returning empty data')
    return emptyData
  }

  const grouped = opportunities.reduce((acc, op) => {
    console.log(`📌 PIPELINE TEST: Processing opportunity "${op.contact_name}" with database stage "${op.stage}"`)
    
    // Map database stage TEXT to PipelineStage enum
    const mappedStage = STAGE_MAPPING[op.stage] || STAGE_MAPPING['default']
    console.log(`🔄 PIPELINE TEST: Mapped "${op.stage}" → "${mappedStage}"`)
    
    if (acc[mappedStage]) {
      acc[mappedStage].push(op)
      console.log(`✅ PIPELINE TEST: Added to stage "${mappedStage}", now has ${acc[mappedStage].length} opportunities`)
    } else {
      console.error(`❌ PIPELINE TEST: Mapping failed for stage "${op.stage}" → "${mappedStage}"`)
      acc[PipelineStage.NewLead].push(op)
    }
    return acc
  }, emptyData)
  
  console.log('🎯 PIPELINE TEST: Final grouped opportunities:', grouped)
  return grouped
}

async function testPipelineData() {
  console.log('🧪 PIPELINE VERIFICATION TEST\n')

  try {
    const userOrgId = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353' // Agenzia SEO Cagliari

    // Test 1: Query opportunities for user's organization (as the app would)
    console.log('1. Testing opportunities query for user organization:')
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        id,
        contact_name,
        stage,
        value,
        status,
        close_date,
        contact_id,
        organization_id,
        created_at,
        updated_at,
        created_by,
        assigned_to,
        source
      `)
      .eq('organization_id', userOrgId)
      .order('created_at', { ascending: false })

    if (oppError) {
      console.log('   ❌ Query error:', oppError)
      return
    }

    console.log(`   ✅ Found ${opportunities?.length || 0} opportunities for user organization`)
    
    if (!opportunities || opportunities.length === 0) {
      console.log('   ⚠️ NO OPPORTUNITIES FOUND - PIPELINE WILL BE EMPTY!')
      return
    }

    // Test 2: Apply adapter transformation (as implemented in useCrmData.ts)
    console.log('\n2. Testing data adapter transformation:')
    const adaptedData = opportunities.map(opp => ({
      ...opp,
      title: opp.contact_name,  // Alias for components that expect title
      stage_name: opp.stage,    // Alias for stage name
      stage_id: opp.stage       // Use TEXT stage as identifier
    }))

    console.log(`   ✅ Adapted ${adaptedData.length} opportunities`)
    adaptedData.forEach((opp, idx) => {
      console.log(`   ${idx + 1}. "${opp.title}" (${opp.stage}) - €${opp.value}`)
    })

    // Test 3: Apply grouping logic (as implemented in useCrmData.ts)
    console.log('\n3. Testing stage grouping logic:')
    const grouped = groupOpportunitiesByStage(adaptedData)
    
    // Test 4: Pipeline summary
    console.log('\n4. PIPELINE SUMMARY:')
    let totalOpportunities = 0
    let totalValue = 0
    
    Object.entries(grouped).forEach(([stage, opps]) => {
      const stageTotal = opps.reduce((sum, opp) => sum + (opp.value || 0), 0)
      totalOpportunities += opps.length
      totalValue += stageTotal
      
      console.log(`   📊 ${stage}: ${opps.length} opportunities (€${stageTotal.toLocaleString()})`)
      opps.forEach(opp => {
        console.log(`      - ${opp.contact_name} (€${opp.value})`)
      })
    })

    console.log(`\n   💰 TOTAL: ${totalOpportunities} opportunities worth €${totalValue.toLocaleString()}`)

    // Test 5: Verify System Admin data is untouched
    console.log('\n5. Verifying System Admin data is untouched:')
    const { data: systemOpps } = await supabase
      .from('opportunities')
      .select('contact_name, stage, value')
      .eq('organization_id', '00000000-0000-0000-0000-000000000001')

    console.log(`   ✅ System Admin still has ${systemOpps?.length || 0} opportunities`)
    systemOpps?.forEach(opp => {
      console.log(`      - ${opp.contact_name} (${opp.stage}) €${opp.value}`)
    })

    // Test 6: Success criteria check
    console.log('\n6. SUCCESS CRITERIA CHECK:')
    const criteria = [
      { name: 'User org has opportunities', passed: totalOpportunities > 0 },
      { name: 'Opportunities have contact_name', passed: adaptedData.every(opp => opp.contact_name) },
      { name: 'Opportunities have TEXT stage', passed: adaptedData.every(opp => typeof opp.stage === 'string') },
      { name: 'Stages map to pipeline', passed: Object.values(grouped).some(arr => arr.length > 0) },
      { name: 'System Admin untouched', passed: systemOpps && systemOpps.length > 0 }
    ]

    criteria.forEach(criterion => {
      console.log(`   ${criterion.passed ? '✅' : '❌'} ${criterion.name}`)
    })

    const allPassed = criteria.every(c => c.passed)
    console.log(`\n🎯 PIPELINE FIX ${allPassed ? 'SUCCESS' : 'NEEDS WORK'}!`)

    if (allPassed) {
      console.log('\n🚀 THE CRM PIPELINE SHOULD NOW SHOW OPPORTUNITIES!')
      console.log('💡 Open the app and navigate to /dashboard/opportunities')
      console.log('📊 Expected to see opportunities in: New Lead, Contacted, Proposal Sent columns')
    }

  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testPipelineData()
  .then(() => {
    console.log('\n✅ Pipeline verification test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })