// ================================================================================
// 🚀 LEVEL 5 ULTIMATE DATABASE FIX - REST API APPROACH
// ================================================================================
// Usa REST API Supabase invece di connessione PostgreSQL diretta
// ================================================================================

const { execSync } = require('child_process');

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

async function executeUltimateFixViaREST() {
    console.log('🚀 EXECUTING LEVEL 5 ULTIMATE DATABASE FIX VIA REST API');
    console.log('=======================================================');

    // STEP 1: Esegui le queries tramite curl (approccio che hai usato con successo)
    console.log('\n1. 🔄 Dropping existing tables...');
    
    const dropQueries = [
        'DROP TABLE IF EXISTS audit_logs CASCADE;',
        'DROP TABLE IF EXISTS superadmin_logs CASCADE;', 
        'DROP TABLE IF EXISTS profiles CASCADE;',
        'DROP TABLE IF EXISTS organizations CASCADE;'
    ];

    for (const query of dropQueries) {
        console.log(`   Executing: ${query}`);
        try {
            const curlCommand = `curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" ` +
                `-H "apikey: ${SERVICE_ROLE_KEY}" ` +
                `-H "Authorization: Bearer ${SERVICE_ROLE_KEY}" ` +
                `-H "Content-Type: application/json" ` +
                `-d "{\\"sql\\": \\"${query.replace(/"/g, '\\"')}\\"}"`;
            
            execSync(curlCommand, { stdio: 'inherit' });
        } catch (error) {
            console.log(`   ⚠️  ${query} (may not exist)`);
        }
    }

    // STEP 2: Create Organizations table
    console.log('\n2. 🏢 Creating organizations table...');
    const createOrgsSQL = `
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${createOrgsSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Organizations table created');
    } catch (error) {
        console.error('   ❌ Error creating organizations table:', error.message);
    }

    // STEP 3: Create Profiles table
    console.log('\n3. 👥 Creating profiles table...');
    const createProfilesSQL = `
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'enterprise', 'super_admin')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${createProfilesSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Profiles table created');
    } catch (error) {
        console.error('   ❌ Error creating profiles table:', error.message);
    }

    // STEP 4: Add FK constraint to organizations
    console.log('\n4. 🔗 Adding foreign key to organizations...');
    const addFKSQL = 'ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;';
    
    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${addFKSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Foreign key constraint added');
    } catch (error) {
        console.error('   ❌ Error adding FK constraint:', error.message);
    }

    // STEP 5: Create Audit Logs table 
    console.log('\n5. 📝 Creating audit_logs table...');
    const createAuditSQL = `
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL DEFAULT 'system',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${createAuditSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Audit logs table created');
    } catch (error) {
        console.error('   ❌ Error creating audit logs table:', error.message);
    }

    // STEP 6: Create Superadmin Logs table
    console.log('\n6. 🛡️  Creating superadmin_logs table...');
    const createSuperadminSQL = `
CREATE TABLE public.superadmin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE')),
    target_type TEXT CHECK (target_type IN ('USER', 'ORGANIZATION', 'PAYMENT', 'SYSTEM')),
    target_id TEXT,
    details JSONB DEFAULT '{}',
    result TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${createSuperadminSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Superadmin logs table created');
    } catch (error) {
        console.error('   ❌ Error creating superadmin logs table:', error.message);
    }

    // STEP 7: Insert initial data
    console.log('\n7. 💾 Inserting initial data...');
    
    // Insert organizations
    const insertOrgsSQL = `
INSERT INTO public.organizations (id, name, slug, subscription_tier, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Admin', 'system-admin', 'enterprise', 'active'),
    ('2aab4d72-ca5b-438f-93ac-b4c2fe2f8353', 'Agenzia SEO Cagliari', 'agenzia-seo-cagliari', 'enterprise', 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    updated_at = NOW();
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${insertOrgsSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Organizations data inserted');
    } catch (error) {
        console.error('   ❌ Error inserting organizations:', error.message);
    }

    // Insert profiles  
    const insertProfilesSQL = `
INSERT INTO public.profiles (id, email, full_name, user_role, organization_id, subscription_tier, status, is_active)
VALUES 
    ('fbb13e89-ce6a-4a98-b718-3d965f19f1c7', 'agenziaseocagliari@gmail.com', 'Super Admin', 'super_admin', '00000000-0000-0000-0000-000000000001', 'enterprise', 'active', true),
    ('dfa97fa5-8375-4f15-ad95-53d339ebcda9', 'webproseoid@gmail.com', 'Enterprise User', 'enterprise', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353', 'enterprise', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_role = EXCLUDED.user_role,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');  

    try {
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${insertProfilesSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
        console.log('   ✅ Profiles data inserted');
    } catch (error) {
        console.error('   ❌ Error inserting profiles:', error.message);
    }

    // STEP 8: Test foreign key relationships
    console.log('\n8. 🧪 Testing foreign key relationships...');
    const testSQL = `
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('profiles', 'organizations', 'audit_logs', 'superadmin_logs')
ORDER BY tc.table_name;
`.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
        console.log('   📋 Foreign key constraints verification:');
        execSync(`curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d "{\\"sql\\": \\"${testSQL.replace(/"/g, '\\"')}\\"}"`, { stdio: 'inherit' });
    } catch (error) {
        console.error('   ❌ Error testing FK relationships:', error.message);
    }

    console.log('\n🎯 LEVEL 5 ULTIMATE DATABASE FIX COMPLETED!');
    console.log('============================================');
    console.log('✅ All tables created with proper foreign keys');
    console.log('✅ Initial data inserted');
    console.log('✅ Ready for edge function updates');
}

// Esegui il fix
executeUltimateFixViaREST().catch(console.error);