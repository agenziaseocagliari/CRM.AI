// Check current opportunities and fix linking
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixOpportunityLinking() {
  console.log('🔍 Checking current opportunities and contacts...\n')

  // Get all opportunities
  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .eq('organization_id', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353')
    .order('contact_name')

  if (oppError) {
    console.log('❌ Error fetching opportunities:', oppError.message)
    return
  }

  console.log('📊 CURRENT OPPORTUNITIES:')
  console.log('=========================')
  opportunities.forEach(opp => {
    console.log(`• ID: ${opp.id}`)
    console.log(`  Name: ${opp.contact_name}`)  
    console.log(`  Value: €${opp.value}`)
    console.log(`  Stage: ${opp.stage}`)
    console.log(`  Contact ID: ${opp.contact_id || 'NOT LINKED'}`)
    console.log('')
  })

  // Get all contacts
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353')
    .order('name')

  if (contactError) {
    console.log('❌ Error fetching contacts:', contactError.message)
    return
  }

  console.log('👥 CURRENT CONTACTS:')
  console.log('====================')
  contacts.forEach(contact => {
    console.log(`• ID: ${contact.id}`)
    console.log(`  Name: ${contact.name}`)
    console.log(`  Email: ${contact.email}`)
    console.log(`  Company: ${contact.company}`)
    console.log('')
  })

  // Now create proper linking strategy
  console.log('🔗 LINKING STRATEGY:')
  console.log('====================')

  const linkingMap = [
    {
      opportunityPattern: /Maria Carta/i,
      contactName: 'Maria Carta'
    },
    {
      opportunityPattern: /Giuseppe Melis/i,
      contactName: 'Giuseppe Melis'
    },
    {
      opportunityPattern: /Silvestro Sanna/i,
      contactName: 'Silvestro Sanna'
    }
  ]

  for (const link of linkingMap) {
    // Find matching opportunity
    const matchingOpp = opportunities.find(opp => 
      link.opportunityPattern.test(opp.contact_name)
    )
    
    // Find matching contact
    const matchingContact = contacts.find(contact => 
      contact.name === link.contactName
    )

    if (matchingOpp && matchingContact) {
      console.log(`🔗 Linking "${matchingOpp.contact_name}" to contact "${matchingContact.name}"...`)
      
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ contact_id: matchingContact.id })
        .eq('id', matchingOpp.id)

      if (updateError) {
        console.log('❌ Link error:', updateError.message)
      } else {
        console.log('✅ Successfully linked!')
      }
    } else {
      console.log(`⚠️ No match found for ${link.contactName}`)
      if (!matchingOpp) console.log(`   No opportunity matches pattern: ${link.opportunityPattern}`)
      if (!matchingContact) console.log(`   No contact named: ${link.contactName}`)
    }
    console.log('')
  }

  // Final verification
  console.log('🏁 FINAL VERIFICATION:')
  console.log('======================')
  
  const { data: finalCheck } = await supabase
    .from('contacts')
    .select(`
      id,
      name,
      email,
      company,
      opportunities:opportunities(id, contact_name, value, stage)
    `)
    .eq('organization_id', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353')
    .order('name')

  finalCheck?.forEach(contact => {
    console.log(`👤 ${contact.name}`)
    console.log(`   Email: ${contact.email}`)
    console.log(`   Company: ${contact.company}`)
    console.log(`   Opportunities: ${contact.opportunities?.length || 0}`)
    
    if (contact.opportunities?.length > 0) {
      contact.opportunities.forEach(opp => {
        console.log(`   └─ ${opp.contact_name} - €${opp.value} (${opp.stage})`)
      })
    }
    console.log('')
  })

  console.log('✅ CONTACT-OPPORTUNITY LINKING COMPLETE!')
}

fixOpportunityLinking().catch(console.error)