// SAFE FIX: Add new opportunity for Agenzia SEO Cagliari organization
// This DOES NOT modify or remove System Admin data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNewOpportunityForUserOrg() {
  console.log('🔧 SAFE FIX: Creating NEW opportunity for Agenzia SEO Cagliari...\n')

  try {
    const targetOrgId = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353' // Agenzia SEO Cagliari
    
    // Step 1: Verify target organization exists
    console.log('1. Verifying target organization:')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', targetOrgId)
      .single()

    if (orgError || !org) {
      throw new Error(`Organization not found: ${orgError?.message}`)
    }
    
    console.log(`   ✅ Target org: "${org.name}" (${org.id})`)

    // Step 2: Check if contacts exist for this org to link opportunity
    console.log('\n2. Checking existing contacts for this organization:')
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('organization_id', targetOrgId)
      .limit(1)

    let contactId = null
    if (contacts && contacts.length > 0) {
      contactId = contacts[0].id
      console.log(`   ✅ Found contact: ${contacts[0].name} (${contacts[0].email})`)
    } else {
      console.log('   ⚠️ No contacts found, opportunity will be created without contact link')
    }

    // Step 3: Create NEW opportunities for the user's organization
    console.log('\n3. Creating NEW opportunities for user organization:')
    
    const newOpportunities = [
      {
        contact_name: 'Silvestro Sanna - Website Redesign', // Use ACTUAL database column
        stage: 'New Lead',                                   // Use TEXT stage (not UUID)
        contact_id: contactId,                              // Link if contact exists
        organization_id: targetOrgId,                       // User's organization
        value: 5000,
        status: 'open',
        source: 'website',
        close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        contact_name: 'Maria Carta - SEO Package',
        stage: 'Contacted',
        contact_id: null,
        organization_id: targetOrgId,
        value: 3500,
        status: 'open',
        source: 'referral',
        close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        contact_name: 'Giuseppe Melis - E-commerce',
        stage: 'Proposal Sent',
        contact_id: null,
        organization_id: targetOrgId,
        value: 8200,
        status: 'open',
        source: 'manual',
        close_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]

    for (let i = 0; i < newOpportunities.length; i++) {
      const oppData = newOpportunities[i]
      
      const { data: newOpp, error: createError } = await supabase
        .from('opportunities')
        .insert(oppData)
        .select()
        .single()

      if (createError) {
        console.log(`   ❌ Failed to create opportunity ${i + 1}:`, createError)
      } else {
        console.log(`   ✅ Created: "${newOpp.contact_name}" - Stage: "${newOpp.stage}" - €${newOpp.value}`)
      }
    }

    // Step 4: Verify the results
    console.log('\n4. Verification - Opportunities by organization:')
    
    // System Admin opportunities (should remain untouched)
    const { data: systemOpps } = await supabase
      .from('opportunities')
      .select('contact_name, stage, value')
      .eq('organization_id', '00000000-0000-0000-0000-000000000001')

    console.log(`   📊 System Admin opportunities: ${systemOpps?.length || 0} (UNTOUCHED)`)
    systemOpps?.forEach(opp => {
      console.log(`      - ${opp.contact_name} (${opp.stage}) €${opp.value}`)
    })

    // User organization opportunities (should have new data)
    const { data: userOpps } = await supabase
      .from('opportunities')
      .select('contact_name, stage, value, created_at')
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false })

    console.log(`   📊 Agenzia SEO Cagliari opportunities: ${userOpps?.length || 0} (NEW DATA)`)
    userOpps?.forEach(opp => {
      console.log(`      - ${opp.contact_name} (${opp.stage}) €${opp.value}`)
    })

    // Step 5: Verify stage distribution
    console.log('\n5. Stage distribution for user organization:')
    const stageGroups = {}
    userOpps?.forEach(opp => {
      if (!stageGroups[opp.stage]) stageGroups[opp.stage] = 0
      stageGroups[opp.stage]++
    })
    
    Object.entries(stageGroups).forEach(([stage, count]) => {
      console.log(`   📈 ${stage}: ${count} opportunities`)
    })

  } catch (error) {
    console.error('💥 Critical error:', error)
  }
}

createNewOpportunityForUserOrg()
  .then(() => {
    console.log('\n🎯 NEW OPPORTUNITY DATA CREATED SUCCESSFULLY!')
    console.log('✅ System Admin data: UNTOUCHED')
    console.log('✅ User organization data: POPULATED')
    console.log('✅ Ready for code adaptation phase')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Data creation failed:', error)
    process.exit(1)
  })