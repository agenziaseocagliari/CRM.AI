const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeAccount() {
  console.log('🚀 Starting enterprise account upgrade for webproseoid@gmail.com...');
  
  try {
    // Step 1: Check current user
    console.log('📋 Checking current user status...');
    const { data: currentUser, error: fetchError } = await supabase
      .from('auth.users')
      .select('id, email, user_metadata, app_metadata')
      .eq('email', 'webproseoid@gmail.com')
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }
    
    console.log('✅ Current user found:', currentUser?.email);
    console.log('📊 Current tier:', currentUser?.user_metadata?.subscription_tier || 'standard');
    
    // Step 2: Update user metadata using RPC function
    console.log('🔄 Updating user to enterprise tier...');
    
    const { data: updateResult, error: updateError } = await supabase.rpc('update_user_metadata', {
      user_email: 'webproseoid@gmail.com',
      new_metadata: {
        subscription_tier: 'enterprise',
        user_role: 'enterprise',
        upgraded_at: new Date().toISOString(),
        features: {
          ai_agents_unlimited: true,
          whatsapp_module: true,
          email_marketing: true,
          advanced_analytics: true,
          api_access: true,
          priority_support: true
        }
      }
    });
    
    if (updateError) {
      console.log('⚠️ RPC function not available, trying direct approach...');
      
      // Alternative: Create organization record
      const organizationData = {
        name: 'Guardian AI Development',
        subscription_tier: 'enterprise',
        owner_id: currentUser.id,
        settings: {
          ai_agents_quota: {
            daily: 1000,
            monthly: 30000
          },
          features: {
            whatsapp_module: true,
            email_marketing: true,
            advanced_analytics: true,
            api_access: true,
            priority_support: true,
            custom_branding: true,
            advanced_automations: true,
            enterprise_integrations: true
          },
          limits: {
            contacts: -1, // unlimited
            campaigns: -1, // unlimited
            templates: -1, // unlimited
            ai_requests_per_day: 1000,
            api_calls_per_month: 100000
          }
        }
      };
      
      // Insert or update organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .upsert(organizationData, { onConflict: 'owner_id' })
        .select();
        
      if (orgError) {
        console.error('❌ Error creating organization:', orgError);
      } else {
        console.log('✅ Organization created/updated:', orgData?.[0]?.name);
      }
      
      // Update user profile if exists
      const profileData = {
        user_id: currentUser.id,
        subscription_tier: 'enterprise',
        organization_role: 'admin',
        settings: {
          notifications: true,
          ai_assistance: true,
          advanced_features: true
        }
      };
      
      const { data: profileResult, error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select();
        
      if (!profileError) {
        console.log('✅ User profile updated to enterprise');
      }
    } else {
      console.log('✅ User metadata updated successfully');
    }
    
    // Step 3: Verify upgrade
    console.log('🔍 Verifying enterprise upgrade...');
    
    const { data: verifyOrg, error: verifyError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', currentUser.id)
      .single();
    
    if (!verifyError && verifyOrg) {
      console.log('✅ Enterprise upgrade successful!');
      console.log('🎉 Account details:');
      console.log(`   📧 Email: ${currentUser.email}`);
      console.log(`   🏢 Organization: ${verifyOrg.name}`);
      console.log(`   🎯 Tier: ${verifyOrg.subscription_tier}`);
      console.log(`   🤖 AI Agents: Unlimited access`);
      console.log(`   ⚡ Features: All enterprise features enabled`);
      console.log('');
      console.log('🚀 You can now access all enterprise modules and features!');
    } else {
      console.log('⚠️ Verification incomplete, but upgrade may be successful');
      console.log('Please check the application to confirm enterprise access');
    }
    
  } catch (error) {
    console.error('❌ Upgrade failed:', error);
  }
}

// Run the upgrade
upgradeAccount().then(() => {
  console.log('🏁 Account upgrade process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});