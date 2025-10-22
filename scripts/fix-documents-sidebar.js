import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDocumentsSidebar() {
  console.log('🔧 FIXING DOCUMENTS SIDEBAR PLACEMENT\n');
  console.log('─'.repeat(60));

  try {
    // Step 1: Fetch current configuration
    console.log('\n📊 Step 1: Fetching current sidebar configuration...');
    const { data: currentData, error: fetchError } = await supabase
      .from('vertical_configurations')
      .select('sidebar_config')
      .eq('vertical', 'insurance')
      .single();

    if (fetchError) {
      console.error('❌ Fetch Error:', fetchError);
      return false;
    }

    console.log('✅ Configuration fetched successfully');

    // Step 2: Analyze current state
    console.log('\n📋 Step 2: Analyzing current sidebar structure...');
    const sections = currentData.sidebar_config.sections;
    
    sections.forEach((section, idx) => {
      console.log(`\n   Section ${idx}: ${section.title || 'Untitled'}`);
      const documentiInSection = section.items.find(item => item.name === 'Documenti' || item.id === 'documenti');
      if (documentiInSection) {
        console.log(`   ⚠️  FOUND "Documenti" in this section (WRONG if idx !== 0)`);
      }
      section.items.forEach((item, itemIdx) => {
        const marker = (item.name === 'Documenti' || item.id === 'documenti') ? '🔴' : '  ';
        console.log(`   ${marker} ${itemIdx + 1}. ${item.name || item.label}`);
      });
    });

    // Step 3: Remove Documenti from all sections
    console.log('\n🗑️  Step 3: Removing "Documenti" from all sections...');
    const cleanedSections = sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.name !== 'Documenti' && 
        item.id !== 'documenti' &&
        item.label !== 'Documenti'
      )
    }));

    // Step 4: Add Documenti to Assicurazioni section (index 0)
    console.log('\n➕ Step 4: Adding "Documenti" to Assicurazioni section...');
    
    // Check if already exists in section 0
    const alreadyInCorrectSection = cleanedSections[0].items.some(item => 
      item.name === 'Documenti' || item.id === 'documenti'
    );

    if (alreadyInCorrectSection) {
      console.log('✅ "Documenti" already in correct section!');
    } else {
      cleanedSections[0].items.push({
        name: 'Documenti',
        path: '/assicurazioni/documenti',
        icon: 'FileText'
      });
      console.log('✅ "Documenti" added to Assicurazioni section');
    }

    // Step 5: Update database
    console.log('\n💾 Step 5: Updating database...');
    const { error: updateError } = await supabase
      .from('vertical_configurations')
      .update({
        sidebar_config: {
          ...currentData.sidebar_config,
          sections: cleanedSections
        }
      })
      .eq('vertical', 'insurance');

    if (updateError) {
      console.error('❌ Update Error:', updateError);
      return false;
    }

    console.log('✅ Database updated successfully!');

    // Step 6: Verify changes
    console.log('\n✅ Step 6: Verifying changes...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('vertical_configurations')
      .select('sidebar_config')
      .eq('vertical', 'insurance')
      .single();

    if (verifyError) {
      console.error('❌ Verify Error:', verifyError);
      return false;
    }

    console.log('\n📊 FINAL SIDEBAR STRUCTURE:');
    console.log('─'.repeat(60));
    
    verifyData.sidebar_config.sections.forEach((section, idx) => {
      console.log(`\nSection ${idx}: ${section.title || 'Untitled'}`);
      section.items.forEach((item, itemIdx) => {
        const marker = (item.name === 'Documenti' || item.id === 'documenti') ? '🆕' : '  ';
        console.log(`${marker} ${itemIdx + 1}. ${item.name || item.label} → ${item.path}`);
      });
    });

    // Final check
    const documentiInSection0 = verifyData.sidebar_config.sections[0].items.some(item => 
      item.name === 'Documenti' || item.id === 'documenti'
    );

    console.log('\n' + '─'.repeat(60));
    if (documentiInSection0) {
      console.log('✅ SUCCESS: "Documenti" is now in the CORRECT section (Assicurazioni)!');
      console.log('🎯 Status: READY FOR USER TEST');
      return true;
    } else {
      console.log('❌ ERROR: "Documenti" not found in Assicurazioni section');
      return false;
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error(error);
    return false;
  }
}

// Execute
fixDocumentsSidebar().then(success => {
  console.log('\n' + '─'.repeat(60));
  if (success) {
    console.log('✅ SIDEBAR FIX COMPLETE - EXIT CODE 0');
    process.exit(0);
  } else {
    console.log('❌ SIDEBAR FIX FAILED - EXIT CODE 1');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ UNHANDLED ERROR:', error);
  process.exit(1);
});
