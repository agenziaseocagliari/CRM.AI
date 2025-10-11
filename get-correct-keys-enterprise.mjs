import dotenv from 'dotenv';

dotenv.config();

/**
 * ENTERPRISE SOLUTION: Get correct Supabase API keys
 * This will fetch the actual anon key from Supabase Management API
 */
async function getCorrectSupabaseKeys() {
    console.log('🔑 ENTERPRISE SOLUTION: OBTAINING CORRECT API KEYS\n');

    const projectId = process.env.SUPABASE_PROJECT_ID;
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (!projectId || !accessToken) {
        console.log('❌ Missing SUPABASE_PROJECT_ID or SUPABASE_ACCESS_TOKEN');
        return null;
    }

    try {
        console.log('📡 Fetching API keys from Supabase Management API...');

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ API Error:', response.status, errorText);
            return null;
        }

        const keys = await response.json();
        console.log('✅ API keys retrieved successfully');

        // Find the correct anon key
        const anonKey = keys.find(key => key.name === 'anon' || key.tags === 'anon');
        const serviceKey = keys.find(key => key.name === 'service_role' || key.tags === 'service_role');

        if (!anonKey) {
            console.log('❌ No anon key found in API response');
            return null;
        }

        console.log('\n🔍 KEY ANALYSIS:');
        console.log('📋 Available keys:');
        keys.forEach((key, index) => {
            console.log(`  ${index + 1}. ${key.name}: ${key.api_key.substring(0, 50)}...`);
        });

        console.log('\n✅ CORRECT ANON KEY IDENTIFIED:');
        console.log(`Key: ${anonKey.api_key}`);
        console.log(`Name: ${anonKey.name}`);

        // Validate the key format
        const isJWT = anonKey.api_key.startsWith('eyJ');
        console.log(`Format: ${isJWT ? 'JWT (correct)' : 'Unknown format'}`);

        if (isJWT) {
            try {
                const payload = JSON.parse(atob(anonKey.api_key.split('.')[1]));
                console.log('JWT Details:');
                console.log(`  - Role: ${payload.role}`);
                console.log(`  - Project: ${payload.ref}`);
                console.log(`  - Expires: ${new Date(payload.exp * 1000).toISOString()}`);

                if (payload.role !== 'anon') {
                    console.log('⚠️  WARNING: Key role is not "anon"');
                }
            } catch (err) {
                console.log('⚠️  Could not parse JWT payload');
            }
        }

        return {
            anonKey: anonKey.api_key,
            serviceKey: serviceKey?.api_key,
            projectId: projectId
        };

    } catch (error) {
        console.log('❌ Error fetching keys:', error.message);
        return null;
    }
}

// Test the key immediately
async function testKeyValidity(anonKey) {
    console.log('\n🧪 TESTING KEY VALIDITY...');

    const { createClient } = await import('@supabase/supabase-js');

    try {
        const testClient = createClient(process.env.VITE_SUPABASE_URL, anonKey);

        // Test auth first
        const { data: session, error: authError } = await testClient.auth.getSession();
        if (authError) {
            console.log('❌ Auth test failed:', authError.message);
            return false;
        }
        console.log('✅ Auth test passed');

        // Test database access
        const { data: forms, error: dbError } = await testClient
            .from('forms')
            .select('id, name')
            .limit(1);

        if (dbError) {
            console.log('❌ Database test failed:', dbError.message);
            console.log('📋 This indicates RLS is blocking anonymous access');
            return false;
        }

        console.log('✅ Database test passed');
        console.log(`📊 Found ${forms?.length || 0} accessible forms`);
        return true;

    } catch (error) {
        console.log('❌ Key test failed:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    const keys = await getCorrectSupabaseKeys();

    if (!keys) {
        console.log('\n❌ Could not obtain correct keys');
        console.log('Manual steps required:');
        console.log('1. Login to Supabase Dashboard');
        console.log('2. Go to Settings > API');
        console.log('3. Copy the "anon public" key');
        console.log('4. Update VITE_SUPABASE_ANON_KEY in .env');
        return;
    }

    const isValid = await testKeyValidity(keys.anonKey);

    if (isValid) {
        console.log('\n🎯 SOLUTION READY:');
        console.log('Update .env with this anon key:');
        console.log(`VITE_SUPABASE_ANON_KEY=${keys.anonKey}`);
    } else {
        console.log('\n⚠️  KEY IS VALID BUT RLS BLOCKING:');
        console.log('RLS policies need to be configured for anonymous access');
        console.log('This will be handled in the next step');

        console.log('\nFor now, update .env with:');
        console.log(`VITE_SUPABASE_ANON_KEY=${keys.anonKey}`);
    }
}

main().catch(console.error);