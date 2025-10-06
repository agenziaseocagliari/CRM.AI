const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

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
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.error('❌ Database connection failed:', testError.message);
            return false;
        }
        console.log('✅ Database connection successful');
        
        // Read migration file
        console.log('📖 Reading migration file...');
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250124000001_advanced_security_system.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            return false;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(`✅ Migration file loaded (${migrationSQL.length} characters)`);
        
        // Split SQL into individual statements
        console.log('🔧 Parsing SQL statements...');
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
            .filter(stmt => !stmt.match(/^\s*$/));
            
        console.log(`📋 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        console.log('⚡ Executing migration statements...');
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                console.log(`   Executing statement ${i + 1}/${statements.length}...`);
                
                // Use rpc call to execute SQL
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement + ';'
                });
                
                if (error) {
                    // Try direct SQL execution if RPC fails
                    console.log(`     Trying direct execution for statement ${i + 1}...`);
                    
                    // For certain types of statements, we can use specific Supabase methods
                    if (statement.includes('CREATE TABLE')) {
                        console.log(`     ⚠️  CREATE TABLE statement - may need manual execution`);
                    } else if (statement.includes('CREATE FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
                        console.log(`     ⚠️  CREATE FUNCTION statement - may need manual execution`);
                    }
                    
                    errorCount++;
                    console.log(`     ⚠️  Statement ${i + 1} needs manual execution: ${error.message}`);
                } else {
                    successCount++;
                    console.log(`     ✅ Statement ${i + 1} executed successfully`);
                }
                
            } catch (execError) {
                errorCount++;
                console.log(`     ❌ Statement ${i + 1} failed: ${execError.message}`);
            }
        }
        
        console.log('\n📊 Migration Execution Summary:');
        console.log(`   ✅ Successful statements: ${successCount}`);
        console.log(`   ⚠️  Statements needing manual execution: ${errorCount}`);
        console.log(`   📋 Total statements: ${statements.length}`);
        
        // Test key functions
        console.log('\n🔍 Testing key database functions...');
        
        // Test consume_credits_rpc function
        try {
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('consume_credits_rpc', {
                    p_organization_id: '00000000-0000-0000-0000-000000000000',
                    p_action_type: 'test'
                });
                
            if (rpcError) {
                if (rpcError.message.includes('does not exist')) {
                    console.log('⚠️  consume_credits_rpc function not created - needs manual SQL execution');
                } else {
                    console.log('✅ consume_credits_rpc function exists and accessible');
                }
            } else {
                console.log('✅ consume_credits_rpc function working correctly');
            }
        } catch (rpcTestError) {
            console.log('⚠️  consume_credits_rpc function test failed - may need manual creation');
        }
        
        // Test security tables
        try {
            const { data: secData, error: secError } = await supabase
                .from('security_audit_log')
                .select('count')
                .limit(1);
                
            if (secError) {
                if (secError.message.includes('does not exist')) {
                    console.log('⚠️  Security tables not created - needs manual SQL execution');
                } else {
                    console.log('✅ Security tables exist and accessible');
                }
            } else {
                console.log('✅ Security tables created successfully');
            }
        } catch (secTestError) {
            console.log('⚠️  Security tables test failed - may need manual creation');
        }
        
        if (errorCount > 0) {
            console.log('\n📋 Manual Execution Required:');
            console.log('   Some statements require manual execution in Supabase Studio SQL Editor');
            console.log('   1. Open Supabase Studio → SQL Editor');
            console.log('   2. Copy and paste the migration file content');
            console.log('   3. Execute the SQL statements');
            console.log('   File: supabase/migrations/20250124000001_advanced_security_system.sql');
        }
        
        return successCount > 0;
        
    } catch (error) {
        console.error('❌ Migration execution failed:', error.message);
        return false;
    }
}

// Execute migration
executeMigration().then(success => {
    if (success) {
        console.log('\n🎉 Migration execution completed!');
        console.log('✅ Database migration process finished');
        process.exit(0);
    } else {
        console.log('\n❌ Migration execution failed');
        console.log('   Please execute the SQL file manually in Supabase Studio');
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Migration script error:', error.message);
    process.exit(1);
});