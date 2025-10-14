// Create missing contacts for demo opportunities
// Fixes the issue where opportunities exist without corresponding contacts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingContacts() {
  console.log('🔍 Creating missing demo contacts...\n');

  const contactsToCreate = [
    {
      name: 'Maria Carta',
      email: 'maria.carta@example.com',
      phone: '+393921234567', 
      company: 'Carta Marketing',
      organization_id: '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353'
    },
    {
      name: 'Giuseppe Melis',
      email: 'giuseppe.melis@example.com',
      phone: '+393929876543',
      company: 'Melis eCommerce', 
      organization_id: '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353'
    }
  ];

  for (const contact of contactsToCreate) {
    console.log(`📝 Creating contact: ${contact.name}...`);
    
    // Create the contact
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating contact:', contact.name, error.message);
      continue;
    }
    
    console.log('✅ Created contact:', data.name, 'ID:', data.id);

    // Link opportunity to contact by updating contact_id
    console.log(`🔗 Linking opportunity to ${contact.name}...`);
    
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ contact_id: data.id })
      .eq('contact_name', contact.name)
      .eq('organization_id', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353');

    if (updateError) {
      console.log('⚠️ Warning linking opportunity:', updateError.message);
    } else {
      console.log('✅ Linked opportunity to contact:', contact.name);
    }
    
    console.log('');
  }

  // Verification query
  console.log('🔍 Verifying all contacts and opportunities...\n');
  
  const { data: verification, error: verifyError } = await supabase
    .from('contacts')
    .select(`
      id,
      name,
      email,
      company,
      opportunities:opportunities(id, contact_name, value, stage)
    `)
    .eq('organization_id', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353')
    .order('name');

  if (verifyError) {
    console.log('❌ Verification error:', verifyError.message);
    return;
  }

  console.log('📊 FINAL VERIFICATION:');
  console.log('====================');
  
  verification.forEach(contact => {
    console.log(`👤 ${contact.name} (${contact.email})`);
    console.log(`   Company: ${contact.company}`);
    console.log(`   Opportunities: ${contact.opportunities?.length || 0}`);
    
    if (contact.opportunities?.length > 0) {
      contact.opportunities.forEach(opp => {
        console.log(`   └─ ${opp.contact_name} - €${opp.value} (${opp.stage})`);
      });
    }
    console.log('');
  });

  console.log('✅ ALL DEMO CONTACTS CREATED AND LINKED!');
  console.log('📈 Pipeline should now show 3 complete opportunities with contacts');
}

createMissingContacts().catch(console.error);