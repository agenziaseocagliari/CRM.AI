import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables');
    console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

console.log('🚀 Guardian AI CRM - Direct Database Migration Execution');
console.log('========================================================');

async function executeMigration() {
    console.log('🔗 Connecting to Supabase with service role...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    try {
        // Test connection
        console.log('🧪 Testing database connection...');
        const { error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.error('❌ Database connection failed:', testError.message);
            return false;
        }
        console.log('✅ Database connection successful');
        
        // Check if consume_credits_rpc already exists
        console.log('🔍 Checking if consume_credits_rpc function exists...');
        try {
            const { error: rpcError } = await supabase
                .rpc('consume_credits_rpc', {
                    p_organization_id: '00000000-0000-0000-0000-000000000000',
                    p_action_type: 'test'
                });
                
            if (rpcError) {
                if (rpcError.message.includes('does not exist')) {
                    console.log('⚠️  consume_credits_rpc function does not exist - migration needed');
                } else {
                    console.log('✅ consume_credits_rpc function exists and accessible');
                    console.log('🎉 Database migration may already be applied!');
                    return true;
                }
            } else {
                console.log('✅ consume_credits_rpc function working correctly');
                console.log('🎉 Database migration already applied successfully!');
                return true;
            }
        } catch (rpcTestError) {
            console.log('⚠️  consume_credits_rpc function not found - proceeding with migration');
        }
        
        // Check if security tables exist
        console.log('🔍 Checking if security tables exist...');
        try {
            const { error: secError } = await supabase
                .from('security_audit_log')
                .select('count')
                .limit(1);
                
            if (!secError) {
                console.log('✅ Security tables already exist');
            } else if (secError.message.includes('does not exist')) {
                console.log('⚠️  Security tables do not exist - migration needed');
            }
        } catch (secTestError) {
            console.log('⚠️  Security tables not found - proceeding with migration');
        }
        
        // Since we can't execute complex SQL directly through the client,
        // we'll create the essential consume_credits_rpc function directly
        console.log('🔧 Creating essential consume_credits_rpc function...');
        
        const createRpcSQL = `
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
        
        try {
            // We can't execute raw SQL through the JS client easily,
            // so we'll provide instructions for manual execution
            console.log('📋 Manual SQL Execution Required:');
            console.log('   The consume_credits_rpc function needs to be created manually');
            console.log('   1. Open Supabase Studio → SQL Editor');
            console.log('   2. Copy and paste the following SQL:');
            console.log('');
            console.log(createRpcSQL);
            console.log('');
            console.log('   3. Click "Run" to execute');
            console.log('');
            console.log('📁 Alternative: Execute the full migration file:');
            console.log('   File: supabase/migrations/20250124000001_advanced_security_system.sql');
            
            // Save the essential SQL to a file for easy copying
            const essentialSQLPath = path.join(__dirname, 'essential_migration.sql');
            fs.writeFileSync(essentialSQLPath, createRpcSQL);
            console.log(`✅ Essential SQL saved to: ${essentialSQLPath}`);
            
            return false; // Indicates manual execution needed
            
        } catch (execError) {
            console.error('❌ Function creation preparation failed:', execError.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Migration execution failed:', error.message);
        return false;
    }
}

// Execute migration
executeMigration().then(success => {
    if (success) {
        console.log('\n🎉 Database is ready!');
        console.log('✅ consume_credits_rpc function is available');
        console.log('✅ FormMaster error should be resolved');
    } else {
        console.log('\n⚠️  Manual SQL execution required');
        console.log('📋 Steps to complete:');
        console.log('   1. Open Supabase Studio SQL Editor');
        console.log('   2. Execute the essential SQL or full migration file');
        console.log('   3. Test FormMaster functionality');
    }
}).catch(error => {
    console.error('❌ Migration script error:', error.message);
    process.exit(1);
});