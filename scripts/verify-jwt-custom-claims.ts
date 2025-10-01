/**
 * JWT Custom Claims Verification Script
 * 
 * This script verifies that the custom_access_token_hook is properly configured
 * and that JWTs contain the required user_role custom claim.
 * 
 * Usage:
 *   npx tsx scripts/verify-jwt-custom-claims.ts
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY in .env file
 *   - A test user account (preferably with super_admin role)
 */

import { createClient } from '@supabase/supabase-js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
    return jsonPayload;
  } catch (error) {
    return null;
  }
}

async function verifyJWTCustomClaims() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('JWT Custom Claims Verification Script', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log('❌ ERROR: Missing environment variables', colors.red);
    log('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', colors.yellow);
    log('   Please check your .env file\n', colors.yellow);
    process.exit(1);
  }

  log('✅ Environment variables found', colors.green);
  log(`   URL: ${supabaseUrl}`, colors.blue);
  log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`, colors.blue);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Check for existing session
  log('\n' + '-'.repeat(60), colors.cyan);
  log('Step 1: Checking for existing session...', colors.bright);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    log('⚠️  No active session found', colors.yellow);
    log('   This script requires a logged-in user to test JWT claims', colors.yellow);
    log('   Please login to your application first, then run this script again\n', colors.yellow);
    
    log('Alternative: Test with email/password (if you have test credentials):', colors.blue);
    log('   You can modify this script to include test credentials', colors.blue);
    process.exit(0);
  }

  log('✅ Active session found', colors.green);
  log(`   User ID: ${session.user.id}`, colors.blue);
  log(`   Email: ${session.user.email}`, colors.blue);

  // Decode and analyze JWT
  log('\n' + '-'.repeat(60), colors.cyan);
  log('Step 2: Analyzing JWT Token...', colors.bright);
  
  const decoded = decodeJWT(session.access_token);
  
  if (!decoded) {
    log('❌ ERROR: Could not decode JWT token', colors.red);
    process.exit(1);
  }

  log('✅ JWT decoded successfully', colors.green);
  
  // Check for required standard claims
  log('\nStandard Claims:', colors.bright);
  log(`   sub (user ID): ${decoded.sub || 'MISSING'}`, decoded.sub ? colors.green : colors.red);
  log(`   email: ${decoded.email || 'MISSING'}`, decoded.email ? colors.green : colors.red);
  log(`   role: ${decoded.role || 'MISSING'}`, decoded.role ? colors.green : colors.yellow);
  
  // Calculate token age and expiration
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = decoded.iat ? now - decoded.iat : 'UNKNOWN';
  const timeUntilExpiry = decoded.exp ? decoded.exp - now : 'UNKNOWN';
  const isExpired = decoded.exp ? decoded.exp < now : false;
  
  log(`   issued at: ${decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'UNKNOWN'}`, colors.blue);
  log(`   expires at: ${decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'UNKNOWN'}`, colors.blue);
  log(`   token age: ${typeof tokenAge === 'number' ? `${Math.floor(tokenAge / 60)} minutes` : tokenAge}`, colors.blue);
  log(`   time until expiry: ${typeof timeUntilExpiry === 'number' ? `${Math.floor(timeUntilExpiry / 60)} minutes` : timeUntilExpiry}`, 
      isExpired ? colors.red : colors.blue);
  
  if (isExpired) {
    log('   ⚠️  TOKEN IS EXPIRED!', colors.red);
  }

  // Check for custom claims
  log('\n' + '-'.repeat(60), colors.cyan);
  log('Step 3: Checking Custom Claims...', colors.bright);
  
  const hasUserRole = 'user_role' in decoded;
  const hasOrgId = 'organization_id' in decoded;
  
  log(`\n   user_role: ${decoded.user_role || 'NOT FOUND'}`, hasUserRole ? colors.green : colors.red);
  log(`   organization_id: ${decoded.organization_id || 'NOT FOUND'}`, hasOrgId ? colors.green : colors.yellow);

  // Overall assessment
  log('\n' + '='.repeat(60), colors.cyan);
  log('Assessment:', colors.bright);
  
  if (hasUserRole) {
    log('✅ SUCCESS: user_role custom claim is present!', colors.green);
    log('   The custom_access_token_hook is working correctly', colors.green);
    log(`   Current role: ${decoded.user_role}`, colors.blue);
  } else {
    log('❌ CRITICAL: user_role custom claim is MISSING!', colors.red);
    log('\n   This indicates the custom_access_token_hook is NOT configured or failing', colors.red);
    log('\n   Required Actions:', colors.yellow);
    log('   1. Verify the custom_access_token_hook SQL function exists:', colors.yellow);
    log('      SELECT * FROM pg_proc WHERE proname = \'custom_access_token_hook\';', colors.blue);
    log('\n   2. Configure the hook in Supabase Dashboard:', colors.yellow);
    log('      - Go to Dashboard > Authentication > Hooks', colors.blue);
    log('      - Enable "Custom Access Token" hook', colors.blue);
    log('      - Select "custom_access_token_hook" function', colors.blue);
    log('      - Save configuration', colors.blue);
    log('\n   3. Or use Supabase CLI:', colors.yellow);
    log('      supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"', colors.blue);
    log('\n   4. After configuration, users MUST logout and login again', colors.yellow);
    log('      (Simply refreshing the session will NOT add missing claims)', colors.yellow);
  }

  if (!hasOrgId && decoded.user_role !== 'super_admin') {
    log('\n⚠️  WARNING: organization_id custom claim is missing', colors.yellow);
    log('   This is expected for super_admin users but may cause issues for regular users', colors.yellow);
  }

  // Check profile in database
  log('\n' + '-'.repeat(60), colors.cyan);
  log('Step 4: Verifying profile in database...', colors.bright);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, organization_id, created_at')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    log('❌ ERROR: Could not fetch profile from database', colors.red);
    log(`   Error: ${profileError.message}`, colors.red);
  } else if (!profile) {
    log('❌ ERROR: No profile found for this user', colors.red);
  } else {
    log('✅ Profile found in database', colors.green);
    log(`   Database role: ${profile.role || 'NULL'}`, colors.blue);
    log(`   Database organization_id: ${profile.organization_id || 'NULL'}`, colors.blue);
    log(`   Profile created: ${profile.created_at}`, colors.blue);
    
    // Compare JWT vs Database
    if (hasUserRole && profile.role !== decoded.user_role) {
      log('\n⚠️  MISMATCH: JWT role differs from database role!', colors.yellow);
      log(`   JWT: ${decoded.user_role}`, colors.yellow);
      log(`   Database: ${profile.role}`, colors.yellow);
      log('   This indicates the role was changed after the JWT was issued', colors.yellow);
      log('   User should logout and login again to get updated role', colors.yellow);
    } else if (hasUserRole && profile.role === decoded.user_role) {
      log('\n✅ JWT and database roles match', colors.green);
    }
  }

  log('\n' + '='.repeat(60), colors.cyan);
  log('Verification Complete', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  // Exit with appropriate code
  process.exit(hasUserRole ? 0 : 1);
}

// Run the verification
verifyJWTCustomClaims().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
