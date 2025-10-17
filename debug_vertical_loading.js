// Quick debug script to test vertical loading behavior
// Add this to browser console when logged in as Insurance user

// Test 1: Check current session data
console.log('=== DEBUG: Current Session ===');
const { data: session } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);
console.log('User metadata:', session?.user?.user_metadata);
console.log('Raw metadata:', session?.user?.raw_user_meta_data);

// Test 2: Check profile data directly
console.log('\n=== DEBUG: Profile Query ===');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session?.user?.id)
  .single();

console.log('Profile:', profile);
console.log('Profile error:', profileError);
console.log('Profile vertical:', profile?.vertical);

// Test 3: Check vertical configuration query
console.log('\n=== DEBUG: Vertical Config Query ===');
const vertical = profile?.vertical || 'standard';
console.log('Querying for vertical:', vertical);

const { data: config, error: configError } = await supabase
  .from('vertical_configurations')
  .select('*')
  .eq('vertical', vertical)
  .eq('is_active', true)
  .single();

console.log('Config:', config);
console.log('Config error:', configError);
console.log('Sidebar config:', config?.sidebar_config);

// Test 4: Check if config has Insurance sidebar
if (config?.sidebar_config?.sections) {
  console.log('\n=== DEBUG: Menu Items ===');
  console.log('Number of sections:', config.sidebar_config.sections.length);
  config.sidebar_config.sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.label} (${section.id})`);
  });
} else {
  console.log('❌ No sidebar config sections found!');
}

// Test 5: Check what useVertical hook would return
console.log('\n=== DEBUG: Expected Hook Behavior ===');
console.log('Expected vertical:', vertical);
console.log('Expected config display name:', config?.display_name);
console.log(
  'Expected sidebar items:',
  config?.sidebar_config?.sections?.length || 0
);
