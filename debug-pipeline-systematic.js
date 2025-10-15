// EVIDENCE-BASED DEBUGGING SCRIPT
// Run: node debug-pipeline-systematic.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.bOVp6mXAUY2lL-REcBFwvKiAu2k6ATigL8j44mlZ4RU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 SYSTEMATIC PIPELINE DIAGNOSIS');
console.log('===============================\n');

// EXACT REPRODUCTION OF PRODUCTION CODE LOGIC
const PipelineStage = {
  NewLead: 'New Lead',
  Contacted: 'Contacted',
  ProposalSent: 'Proposal Sent',
  Won: 'Won',
  Lost: 'Lost',
};

const groupOpportunitiesByStage = opportunities => {
  console.log('🗂️ GROUPING FUNCTION: Input opportunities:', opportunities);

  const emptyData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  };

  if (!opportunities || opportunities.length === 0) {
    console.log(
      '⚠️ GROUPING FUNCTION: No opportunities to group, returning empty data'
    );
    return emptyData;
  }

  const grouped = opportunities.reduce((acc, op) => {
    console.log(
      `📌 GROUPING FUNCTION: Processing opportunity "${op.contact_name}" with stage "${op.stage}"`
    );

    if (acc[op.stage]) {
      acc[op.stage].push(op);
      console.log(
        `✅ GROUPING FUNCTION: Added to stage "${op.stage}", now has ${acc[op.stage].length} opportunities`
      );
    } else {
      console.error(
        `❌ GROUPING FUNCTION: Unknown stage "${op.stage}" for opportunity "${op.contact_name}"`
      );
      console.log('Available stages:', Object.keys(emptyData));
    }
    return acc;
  }, emptyData);

  console.log('🎯 GROUPING FUNCTION: Final grouped result:', grouped);
  return grouped;
};

async function systematicDebug() {
  try {
    console.log('STEP 1: Check database connection');
    console.log('----------------------------------');

    // Test basic connectivity
    const { data: testQuery, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connected successfully');

    console.log('\nSTEP 2: Query ALL opportunities (no filters)');
    console.log('------------------------------------------');

    const { data: allOpps, error: allOppsError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(50);

    if (allOppsError) {
      console.error('❌ Opportunities query failed:', allOppsError);
      return;
    }

    console.log(
      `📊 Found ${allOpps?.length || 0} total opportunities in database`
    );
    if (allOpps && allOpps.length > 0) {
      allOpps.forEach((opp, index) => {
        console.log(
          `  ${index + 1}. ID: ${opp.id}, Contact: "${opp.contact_name}", Stage: "${opp.stage}", Org: ${opp.organization_id}, Value: €${opp.value}`
        );
      });
    }

    console.log('\nSTEP 3: Query organizations');
    console.log('---------------------------');

    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(10);

    if (orgsError) {
      console.error('❌ Organizations query failed:', orgsError);
      return;
    }

    console.log(`📊 Found ${orgs?.length || 0} organizations:`);
    orgs?.forEach((org, index) => {
      console.log(`  ${index + 1}. ID: ${org.id}, Name: "${org.name}"`);
    });

    console.log('\nSTEP 4: Test opportunities per organization');
    console.log('------------------------------------------');

    if (orgs && orgs.length > 0) {
      for (const org of orgs) {
        const { data: orgOpps, error: orgOppsError } = await supabase
          .from('opportunities')
          .select('*')
          .eq('organization_id', org.id);

        console.log(
          `🏢 Organization "${org.name}" (${org.id}): ${orgOpps?.length || 0} opportunities`
        );

        if (orgOpps && orgOpps.length > 0) {
          console.log('   📋 Opportunities details:');
          orgOpps.forEach((opp, index) => {
            console.log(
              `     ${index + 1}. Contact: "${opp.contact_name}", Stage: "${opp.stage}", Value: €${opp.value}`
            );
          });

          console.log('\n   🧪 Testing grouping function for this org:');
          const grouped = groupOpportunitiesByStage(orgOpps);

          console.log('   📊 Grouped results:');
          Object.entries(grouped).forEach(([stage, opps]) => {
            console.log(`     ${stage}: ${opps.length} opportunities`);
          });
        }
      }
    }

    console.log('\nSTEP 5: Check user profiles');
    console.log('---------------------------');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .limit(10);

    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError);
      return;
    }

    console.log(`👤 Found ${profiles?.length || 0} user profiles:`);
    profiles?.forEach((profile, index) => {
      console.log(
        `  ${index + 1}. User ID: ${profile.id}, Org ID: ${profile.organization_id}`
      );
    });

    console.log('\n🎯 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log(`• Total opportunities: ${allOpps?.length || 0}`);
    console.log(`• Total organizations: ${orgs?.length || 0}`);
    console.log(`• Total profiles: ${profiles?.length || 0}`);

    if (allOpps && allOpps.length > 0 && orgs && orgs.length > 0) {
      console.log('\n✅ DATABASE IS HEALTHY');
      console.log('🔍 If pipeline still shows 0, the issue is in:');
      console.log('   1. User authentication/session');
      console.log('   2. Organization context resolution');
      console.log('   3. Frontend component rendering');
      console.log('   4. Real-time subscriptions or state updates');
    } else {
      console.log('\n❌ DATABASE ISSUE FOUND');
      if (!allOpps || allOpps.length === 0) {
        console.log('   • No opportunities exist in database');
      }
      if (!orgs || orgs.length === 0) {
        console.log('   • No organizations exist in database');
      }
    }
  } catch (error) {
    console.error('💥 Systematic debug failed:', error);
  }
}

systematicDebug();
