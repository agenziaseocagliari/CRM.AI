// scripts/fix-insurance-sidebar-routes.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSidebarRoutes() {
  console.log('🔧 Fixing insurance sidebar routes...\n');

  const correctConfig = {
    sections: [
      {
        title: 'Gestione',
        items: [
          {
            name: 'Dashboard',
            path: '/assicurazioni/dashboard', // REMOVED /dashboard prefix
            icon: 'LayoutDashboard',
          },
          {
            name: 'Polizze',
            path: '/assicurazioni/polizze', // CORRECT
            icon: 'FileText',
          },
          {
            name: 'Sinistri',
            path: '/assicurazioni/sinistri', // CORRECT
            icon: 'AlertCircle',
          },
          {
            name: 'Provvigioni',
            path: '/assicurazioni/provvigioni', // CORRECT
            icon: 'DollarSign',
          },
          {
            name: 'Scadenzario',
            path: '/assicurazioni/scadenzario', // CORRECT
            icon: 'Calendar',
          },
        ],
      },
      {
        title: 'Strumenti',
        items: [
          {
            name: 'Contatti',
            path: '/contatti', // REMOVED /dashboard prefix
            icon: 'Users',
          },
          {
            name: 'Calendario',
            path: '/calendario', // REMOVED /dashboard prefix
            icon: 'CalendarDays',
          },
          {
            name: 'Automazioni',
            path: '/automazioni', // REMOVED /dashboard prefix
            icon: 'Zap',
          },
          {
            name: 'Report',
            path: '/report', // REMOVED /dashboard prefix
            icon: 'BarChart',
          },
        ],
      },
    ],
  };

  const { data, error } = await supabase
    .from('vertical_configurations')
    .update({ sidebar_config: correctConfig })
    .eq('vertical', 'insurance')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    throw error;
  }

  console.log('✅ Sidebar config updated successfully!');
  console.log('\nNew config:');
  console.log(JSON.stringify(data[0].sidebar_config, null, 2));

  console.log('\n📋 Routes now configured:');
  data[0].sidebar_config.sections.forEach(section => {
    console.log(`\n${section.title}:`);
    section.items.forEach(item => {
      console.log(`  ✅ ${item.name}: ${item.path}`);
    });
  });
}

fixSidebarRoutes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
