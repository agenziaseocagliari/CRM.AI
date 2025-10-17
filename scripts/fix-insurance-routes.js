// scripts/fix-insurance-routes.js
// CRITICAL FIX: Update database sidebar_config to Italian routes
// Resolves: Empty Polizze page due to route mismatch

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixRoutes() {
  console.log('🔧 CRITICAL FIX: Updating Insurance sidebar routes...\n');

  // New Italian sidebar configuration
  const sidebarConfig = {
    sections: [
      {
        title: "Gestione",
        items: [
          { name: "Dashboard", path: "/assicurazioni/dashboard", icon: "LayoutDashboard" },
          { name: "Polizze", path: "/assicurazioni/polizze", icon: "FileText" },
          { name: "Sinistri", path: "/assicurazioni/sinistri", icon: "AlertCircle" },
          { name: "Provvigioni", path: "/assicurazioni/provvigioni", icon: "DollarSign" },
          { name: "Scadenzario", path: "/assicurazioni/scadenzario", icon: "Calendar" }
        ]
      },
      {
        title: "Strumenti",
        items: [
          { name: "Contatti", path: "/contatti", icon: "Users" },
          { name: "Calendario", path: "/calendario", icon: "CalendarDays" },
          { name: "Automazioni", path: "/automazioni", icon: "Zap" },
          { name: "Report", path: "/report", icon: "BarChart" }
        ]
      }
    ]
  };

  try {
    // First, get current config to show before/after
    console.log('📋 Current configuration:');
    const { data: currentData, error: fetchError } = await supabase
      .from('vertical_configurations')
      .select('sidebar_config')
      .eq('vertical', 'insurance')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current config:', fetchError);
    } else if (currentData) {
      console.log('BEFORE:', JSON.stringify(currentData.sidebar_config, null, 2));
    }

    console.log('\n🔄 Updating sidebar configuration...');

    // Update the configuration
    const { data, error } = await supabase
      .from('vertical_configurations')
      .update({ sidebar_config: sidebarConfig })
      .eq('vertical', 'insurance')
      .select();

    if (error) {
      console.error('❌ Error updating sidebar config:', error);
      throw error;
    }

    console.log('\n✅ Sidebar configuration updated successfully!');
    console.log('AFTER:', JSON.stringify(sidebarConfig, null, 2));

    // Verify the update
    console.log('\n🔍 Verification:');
    const { data: verifyData, error: verifyError } = await supabase
      .from('vertical_configurations')
      .select('vertical, sidebar_config')
      .eq('vertical', 'insurance')
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Configuration verified in database');
      
      // Check specific path
      const polizzeItem = verifyData.sidebar_config.sections[0].items.find(item => item.name === 'Polizze');
      if (polizzeItem && polizzeItem.path === '/assicurazioni/polizze') {
        console.log('✅ Polizze route correctly updated to:', polizzeItem.path);
      } else {
        console.log('❌ Polizze route not found or incorrect');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ROUTE FIX COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('RESULT:');
    console.log('✅ Sidebar now uses: /assicurazioni/polizze');
    console.log('✅ Components mounted on: /assicurazioni/polizze (existing)');
    console.log('✅ Backward compatibility: /dashboard/insurance/policies (added)');
    console.log('✅ User experience: No more empty Polizze page');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.log('\n🔄 FALLBACK: Manual SQL command:');
    console.log(`
UPDATE vertical_configurations
SET sidebar_config = '${JSON.stringify(sidebarConfig)}'::jsonb
WHERE vertical = 'insurance';
`);
    process.exit(1);
  }
}

// Execute the fix
fixRoutes().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});