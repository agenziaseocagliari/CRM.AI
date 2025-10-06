// Direct Database Test and Migration for Guardian AI CRM
console.log('🚀 Guardian AI CRM - Database Connection Test');
console.log('============================================');

// Read environment variables directly from process.env
const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

async function testDatabase() {
    try {
        // Test direct REST API call to check connection
        console.log('🔗 Testing Supabase connection...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Database connection successful');
            
            // Test if consume_credits_rpc function exists
            console.log('🔍 Testing consume_credits_rpc function...');
            
            const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_credits_rpc`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_organization_id: '00000000-0000-0000-0000-000000000000',
                    p_action_type: 'test'
                })
            });
            
            if (rpcResponse.ok) {
                const rpcData = await rpcResponse.json();
                console.log('✅ consume_credits_rpc function exists and working');
                console.log('📊 Function response:', rpcData);
                
                console.log('\n🎉 DATABASE STATUS: READY');
                console.log('✅ All required functions are available');
                console.log('✅ FormMaster error should be resolved');
                return true;
                
            } else if (rpcResponse.status === 404) {
                console.log('⚠️  consume_credits_rpc function does not exist');
                console.log('📋 Manual migration required in Supabase Studio');
                return false;
                
            } else {
                const errorText = await rpcResponse.text();
                console.log('⚠️  RPC function test failed:', errorText);
                return false;
            }
            
        } else {
            console.error('❌ Database connection failed:', response.status, response.statusText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        return false;
    }
}

// Create essential SQL for manual execution
const ESSENTIAL_SQL = `
-- Essential consume_credits_rpc function for FormMaster
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_organization_record RECORD;
    v_credits_consumed INTEGER := 1;
    v_remaining_credits INTEGER;
BEGIN
    -- Get organization record
    SELECT * INTO v_organization_record
    FROM organizations 
    WHERE id = p_organization_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization not found',
            'remaining_credits', 0
        );
    END IF;
    
    -- Check if organization has enough credits
    IF COALESCE(v_organization_record.credits, 0) < v_credits_consumed THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'remaining_credits', COALESCE(v_organization_record.credits, 0)
        );
    END IF;
    
    -- Consume credits
    UPDATE organizations 
    SET credits = COALESCE(credits, 0) - v_credits_consumed,
        updated_at = NOW()
    WHERE id = p_organization_id;
    
    -- Get remaining credits
    SELECT COALESCE(credits, 0) INTO v_remaining_credits
    FROM organizations 
    WHERE id = p_organization_id;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'remaining_credits', v_remaining_credits,
        'credits_consumed', v_credits_consumed,
        'action_type', p_action_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

console.log('Essential SQL for manual execution saved below:');
console.log('='.repeat(50));
console.log(ESSENTIAL_SQL);
console.log('='.repeat(50));

// Execute the test
testDatabase().then(success => {
    console.log('\n📋 NEXT STEPS:');
    
    if (success) {
        console.log('✅ Database is ready - no further action needed');
        console.log('🎯 FormMaster should work without "Errore di rete" error');
        
    } else {
        console.log('⚠️  Manual SQL execution required:');
        console.log('   1. Open Supabase Studio → SQL Editor');
        console.log('   2. Copy the essential SQL above');
        console.log('   3. Paste and execute in SQL Editor');
        console.log('   4. Alternative: Execute full migration file');
        console.log('      File: supabase/migrations/20250124000001_advanced_security_system.sql');
    }
    
    console.log('\n🔗 Supabase Studio URL:');
    console.log('   https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql');
    
}).catch(error => {
    console.error('❌ Test execution failed:', error.message);
});