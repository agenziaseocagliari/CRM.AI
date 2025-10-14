// Level 6 Database Discovery Script
// Execute this to understand current database reality

import { createClient } from '@supabase/supabase-js';

// Use the correct production keys
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.bOVp6mXAUY2lL-REcBFwvKiAu2k6ATigL8j44mlZ4RU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 PHASE 0: DATABASE DISCOVERY STARTING...');
console.log('================================================');

async function executeDiscovery() {
  try {
    console.log('\n📊 QUERY 1: List ALL tables in database');
    console.log('--------------------------------------');

    const { data: tables, error: tablesError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
        SELECT
          schemaname,
          tablename,
          tableowner
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `,
      }
    );

    if (tablesError) {
      console.error('❌ Tables query failed:', tablesError);

      // Fallback - try direct table queries
      console.log('🔄 Trying fallback approach...');

      const tableChecks = [
        'contacts',
        'opportunities',
        'deals',
        'pipeline_stages',
        'contact_notes',
        'organizations',
      ];

      for (const tableName of tableChecks) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            console.log(`❌ ${tableName}: Does not exist or no access`);
          } else {
            console.log(`✅ ${tableName}: EXISTS`);
          }
        } catch (e) {
          console.log(`❌ ${tableName}: Does not exist`);
        }
      }
    } else {
      console.log('✅ Tables found:', tables);
    }

    console.log('\n📊 QUERY 2: Check contacts table structure');
    console.log('----------------------------------------');

    try {
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);

      if (contactsError) {
        console.log('❌ contacts table:', contactsError.message);
      } else {
        console.log('✅ contacts table exists');
        if (contacts && contacts.length > 0) {
          console.log('📋 Sample contact fields:', Object.keys(contacts[0]));
        }
      }
    } catch (e) {
      console.log('❌ contacts table: Does not exist');
    }

    console.log('\n📊 QUERY 3: Look for deals/opportunities tables');
    console.log('--------------------------------------------');

    // Check opportunities
    try {
      const { data: opps, error: oppsError } = await supabase
        .from('opportunities')
        .select('*')
        .limit(1);

      if (oppsError) {
        console.log('❌ opportunities table:', oppsError.message);
      } else {
        console.log('✅ opportunities table EXISTS');
        if (opps && opps.length > 0) {
          console.log('📋 Opportunities fields:', Object.keys(opps[0]));
        }

        // Get count
        const { count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true });
        console.log(`📊 Opportunities count: ${count}`);
      }
    } catch (e) {
      console.log('❌ opportunities: Does not exist');
    }

    // Check deals
    try {
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .limit(1);

      if (dealsError) {
        console.log('❌ deals table:', dealsError.message);
      } else {
        console.log('✅ deals table EXISTS');
        if (deals && deals.length > 0) {
          console.log('📋 Deals fields:', Object.keys(deals[0]));
        }

        const { count } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true });
        console.log(`📊 Deals count: ${count}`);
      }
    } catch (e) {
      console.log('❌ deals: Does not exist');
    }

    console.log('\n📊 QUERY 4: Check pipeline_stages table');
    console.log('-------------------------------------');

    try {
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('display_order');

      if (stagesError) {
        console.log('❌ pipeline_stages table:', stagesError.message);
      } else {
        console.log('✅ pipeline_stages table EXISTS');
        console.log('📋 Stages found:');
        stages?.forEach(stage => {
          console.log(
            `  - ${stage.name} (ID: ${stage.id}) [Order: ${stage.display_order}] [Color: ${stage.color}]`
          );
        });

        // Find New Lead stage
        const newLeadStage = stages?.find(
          s =>
            s.name.toLowerCase().includes('new') &&
            s.name.toLowerCase().includes('lead')
        );
        if (newLeadStage) {
          console.log(`🎯 "New Lead" stage ID: ${newLeadStage.id}`);
        } else {
          console.log('⚠️  "New Lead" stage NOT FOUND');
        }
      }
    } catch (e) {
      console.log('❌ pipeline_stages: Does not exist');
    }

    console.log('\n📊 QUERY 5: Check for contact_notes table');
    console.log('---------------------------------------');

    try {
      const { data: notes, error: notesError } = await supabase
        .from('contact_notes')
        .select('*')
        .limit(1);

      if (notesError) {
        console.log('❌ contact_notes table:', notesError.message);
      } else {
        console.log('✅ contact_notes table EXISTS');
        if (notes && notes.length > 0) {
          console.log('📋 Contact notes fields:', Object.keys(notes[0]));
        }

        const { count } = await supabase
          .from('contact_notes')
          .select('*', { count: 'exact', head: true });
        console.log(`📊 Contact notes count: ${count}`);
      }
    } catch (e) {
      console.log('❌ contact_notes: Does not exist');
    }

    console.log('\n📊 BONUS: Check organizations table');
    console.log('--------------------------------');

    try {
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);

      if (orgsError) {
        console.log('❌ organizations table:', orgsError.message);
      } else {
        console.log('✅ organizations table EXISTS');
        if (orgs && orgs.length > 0) {
          console.log('📋 Organizations fields:', Object.keys(orgs[0]));
        }
      }
    } catch (e) {
      console.log('❌ organizations: Does not exist');
    }

    console.log('\n🎯 DISCOVERY COMPLETE!');
    console.log('================================================');
    console.log('✅ Phase 0 finished - analyze results above');
    console.log('📋 Next: Document findings and proceed to Phase 1');
  } catch (error) {
    console.error('💥 DISCOVERY FAILED:', error);
  }
}

// Run discovery
executeDiscovery();
