// SEED DEMO COMMISSIONS - Node.js Script
// Using correct credentials from MEMORIZED_CREDENTIALS.md

import { createClient } from '@supabase/supabase-js';

// Correct credentials - DO NOT CHANGE
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

// Organization ID for "Assicurazioni" 
const orgId = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';

const supabase = createClient(supabaseUrl, serviceKey);

async function seedDemoCommissions() {
  console.log('🎯 SEED DEMO COMMISSION RECORDS');
  console.log('=================================');
  
  try {
    // STEP 1: Get existing contacts
    console.log('📊 Step 1: Extracting existing contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('organization_id', orgId)
      .limit(3);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      console.log('❌ No contacts found for organization');
      return;
    }

    console.log(`✅ Found ${contacts.length} contacts:`);
    contacts.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} (${c.id})`);
    });

    // STEP 2: Get existing policies
    console.log('📊 Step 2: Extracting existing policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('insurance_policies')
      .select('id, policy_number, contact_id')
      .eq('organization_id', orgId)
      .limit(3);

    if (policiesError) throw policiesError;

    if (!policies || policies.length === 0) {
      console.log('❌ No policies found for organization');
      return;
    }

    console.log(`✅ Found ${policies.length} policies:`);
    policies.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.policy_number} (${p.id})`);
    });

    // STEP 3: Insert demo commission records
    console.log('📊 Step 3: Inserting demo commission records...');
    
    const demoCommissions = [
      {
        organization_id: orgId,
        policy_id: policies[0]?.id,
        contact_id: contacts[0]?.id,
        commission_type: 'base',
        base_premium: 1200.00,
        commission_rate: 5.00,
        commission_amount: 60.00,
        status: 'paid',
        calculation_date: '2025-10-05',
        payment_date: '2025-10-10',
        notes: 'Demo base commission - October payment processed'
      },
      {
        organization_id: orgId,
        policy_id: policies[1]?.id || policies[0]?.id,
        contact_id: contacts[1]?.id || contacts[0]?.id,
        commission_type: 'renewal',
        base_premium: 1500.00,
        commission_rate: 7.50,
        commission_amount: 112.50,
        status: 'pending',
        calculation_date: '2025-10-12',
        payment_date: null,
        notes: 'Demo renewal commission - awaiting approval'
      },
      {
        organization_id: orgId,
        policy_id: policies[2]?.id || policies[0]?.id,
        contact_id: contacts[2]?.id || contacts[0]?.id,
        commission_type: 'bonus',
        base_premium: 2000.00,
        commission_rate: 10.00,
        commission_amount: 200.00,
        status: 'calculated',
        calculation_date: '2025-10-15',
        payment_date: null,
        notes: 'Demo bonus commission - Q3 performance target achieved'
      }
    ];

    const { data: insertedCommissions, error: insertError } = await supabase
      .from('insurance_commissions')
      .insert(demoCommissions)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Successfully inserted ${insertedCommissions.length} demo commissions:`);
    insertedCommissions.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.commission_type} - €${c.commission_amount} (${c.status})`);
    });

    // STEP 4: Verify total commissions
    console.log('📊 Step 4: Verifying total commissions...');
    const { data: totalCount, error: countError } = await supabase
      .from('insurance_commissions')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (countError) throw countError;

    console.log(`✅ Total commissions in organization: ${totalCount.length}`);

    // STEP 5: Summary for dashboard
    console.log('📊 Step 5: Commission summary for dashboard verification...');
    const { data: summary, error: summaryError } = await supabase
      .from('insurance_commissions')
      .select('commission_type, status, commission_amount')
      .eq('organization_id', orgId);

    if (summaryError) throw summaryError;

    const summaryStats = {};
    let totalAmount = 0;

    summary.forEach(commission => {
      const key = `${commission.commission_type}_${commission.status}`;
      if (!summaryStats[key]) {
        summaryStats[key] = { count: 0, amount: 0 };
      }
      summaryStats[key].count++;
      summaryStats[key].amount += parseFloat(commission.commission_amount);
      totalAmount += parseFloat(commission.commission_amount);
    });

    console.log('📈 Commission Summary:');
    Object.entries(summaryStats).forEach(([key, stats]) => {
      console.log(`   ${key}: ${stats.count} records, €${stats.amount.toFixed(2)}`);
    });
    console.log(`   💰 TOTAL AMOUNT: €${totalAmount.toFixed(2)}`);

    console.log('🎉 SEED DEMO COMMISSIONS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Check Dashboard KPIs at /assicurazioni/provvigioni');
    console.log('   2. Verify List at /assicurazioni/provvigioni/list');
    console.log('   3. Test Export CSV/PDF functionality');

  } catch (error) {
    console.error('❌ Error seeding demo commissions:', error.message);
    process.exit(1);
  }
}

// Execute the seeding
seedDemoCommissions();