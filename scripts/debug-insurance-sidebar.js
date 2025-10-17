import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInsuranceSidebar() {
  console.log('🔍 Fetching insurance sidebar configuration...\n');

  const { data, error } = await supabase
    .from('vertical_configurations')
    .select('*')
    .eq('vertical', 'insurance')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Insurance Vertical Config:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n📋 Sidebar Config Structure:');
  const sidebarConfig = data.sidebar_config;

  if (!sidebarConfig) {
    console.error('❌ NO SIDEBAR CONFIG!');
    return;
  }

  if (!sidebarConfig.sections) {
    console.error('❌ NO SECTIONS IN SIDEBAR CONFIG!');
    return;
  }

  console.log('Sections:', sidebarConfig.sections.length);

  sidebarConfig.sections.forEach((section, i) => {
    console.log(`\nSection ${i + 1}: "${section.title}"`);
    console.log('Items:', section.items?.length || 0);

    if (!section.items) {
      console.error('  ❌ NO ITEMS!');
      return;
    }

    section.items.forEach((item, j) => {
      console.log(`  ${j + 1}. ${item.name}`);
      console.log(`     Path: ${item.path || '❌ UNDEFINED'}`);
      console.log(`     Icon: ${item.icon || '❌ UNDEFINED'}`);
      
      // CHECK FOR UNDEFINED PATH
      if (!item.path) {
        console.error(`     ⚠️ FOUND IT! Item "${item.name}" has NO PATH!`);
      }
      
      // CHECK FOR SPLIT USAGE
      if (item.path && typeof item.path === 'string') {
        console.log(`     Split test: ${item.path.split('/').length} segments`);
      }
    });
  });
}

debugInsuranceSidebar();