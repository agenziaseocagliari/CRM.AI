// SuperAdmin Test Console - Test the automated subscription management
// Usage: node scripts/test-superadmin.cjs

const { superAdminAI } = require('../src/lib/ai/superAdminAgent');

async function testSuperAdmin() {
  console.log('🤖 Testing SuperAdmin AI Agent...\n');
  
  try {
    // Test 1: Upgrade webproseoid@gmail.com to enterprise (should work instantly)
    console.log('TEST 1: Upgrade webproseoid@gmail.com to enterprise');
    const result1 = await superAdminAI.upgradeUser('webproseoid@gmail.com', 'enterprise');
    console.log('✅ Result:', JSON.stringify(result1, null, 2));
    console.log('\n---\n');
    
    // Test 2: Try downgrade (to test the full workflow)
    console.log('TEST 2: Test downgrade to business tier');
    const result2 = await superAdminAI.downgradeUser('webproseoid@gmail.com', 'business');
    console.log('✅ Result:', JSON.stringify(result2, null, 2));
    console.log('\n---\n');
    
    // Test 3: Admin override back to enterprise
    console.log('TEST 3: Admin override back to enterprise');
    const result3 = await superAdminAI.adminOverride('webproseoid@gmail.com', 'enterprise');
    console.log('✅ Result:', JSON.stringify(result3, null, 2));
    
  } catch (error) {
    console.error('❌ SuperAdmin Test Failed:', error);
  }
}

// Run tests
testSuperAdmin().then(() => {
  console.log('\n🏁 SuperAdmin tests completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});