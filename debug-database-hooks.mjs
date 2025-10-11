#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabaseIssues() {
    console.log('🔍 DEEP DEBUGGING: Database Schema + Triggers');
    console.log('==============================================\n');

    // Test 1: Direct SQL query to see if updates work at database level
    console.log('1️⃣ TEST DIRECT SQL QUERY:');

    try {
        // Get a form ID
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('id, name, styling')
            .limit(1);

        if (formsError || !forms || forms.length === 0) {
            console.error('❌ No forms found');
            return;
        }

        const testForm = forms[0];
        console.log(`🎯 Using form: ${testForm.name} (${testForm.id})`);
        console.log(`🎨 Current styling:`, testForm.styling);

        // Direct RPC call to check if there are database functions interfering
        console.log('\n2️⃣ TEST RPC FUNCTION CALL:');

        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('get_table_schema', { table_name: 'forms' });

        if (rpcError) {
            console.log('ℹ️  No custom RPC function found (normal)');
        } else {
            console.log('⚠️  Found RPC functions:', rpcResult);
        }

        // Test 3: Check for triggers or constraints
        console.log('\n3️⃣ CHECK DATABASE CONSTRAINTS:');

        const { data: tableInfo, error: tableError } = await supabase
            .from('information_schema.columns')
            .select('*')
            .eq('table_name', 'forms')
            .eq('column_name', 'styling');

        if (tableError) {
            console.log('ℹ️  Cannot access schema info (permissions limited)');
        } else {
            console.log('📊 Styling column info:', tableInfo);
        }

        // Test 4: Multiple update attempts with different payloads
        console.log('\n4️⃣ MULTIPLE UPDATE TESTS:');

        const testCases = [
            {
                name: 'Simple color object',
                styling: { primary_color: '#ff0000' }
            },
            {
                name: 'Full styling object',
                styling: {
                    primary_color: '#00ff00',
                    background_color: '#f0f0f0',
                    text_color: '#333333',
                    secondary_color: '#f3f4f6',
                    border_color: '#00ff00',
                    border_radius: '8px',
                    font_family: 'Inter, system-ui, sans-serif'
                }
            },
            {
                name: 'JSON string (alternative format)',
                styling: JSON.stringify({
                    primary_color: '#0000ff',
                    background_color: '#ffffff',
                    text_color: '#000000'
                })
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n   Test ${i + 1}: ${testCase.name}`);

            const { data: updateResult, error: updateError } = await supabase
                .from('forms')
                .update({ styling: testCase.styling })
                .eq('id', testForm.id)
                .select('styling');

            if (updateError) {
                console.log(`   ❌ Error:`, updateError);
            } else {
                console.log(`   ✅ Update successful`);
                console.log(`   📊 Result:`, updateResult?.[0]?.styling);

                // Wait and verify
                await new Promise(resolve => setTimeout(resolve, 500));

                const { data: verifyResult, error: verifyError } = await supabase
                    .from('forms')
                    .select('styling')
                    .eq('id', testForm.id)
                    .single();

                if (verifyError) {
                    console.log(`   ❌ Verification error:`, verifyError);
                } else {
                    console.log(`   🔍 Verified styling:`, verifyResult.styling);

                    if (JSON.stringify(verifyResult.styling) === JSON.stringify(testCase.styling)) {
                        console.log(`   ✅ PERFECT MATCH!`);
                    } else {
                        console.log(`   ❌ MISMATCH - Something is overriding the update`);
                    }
                }
            }
        }

        // Test 5: Check for database hooks/functions
        console.log('\n5️⃣ CHECK FOR DATABASE HOOKS:');

        const { data: hooks, error: hooksError } = await supabase
            .from('pg_trigger')
            .select('*');

        if (hooksError) {
            console.log('ℹ️  Cannot access trigger info (normal for security)');
        } else {
            console.log('⚠️  Found database triggers:', hooks);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    console.log('\n🎯 CONCLUSIONS:');
    console.log('• If all tests fail → Database has trigger/constraint overriding updates');
    console.log('• If some tests work → Data format issue');
    console.log('• If updates work but revert → Background process resetting values');
}

debugDatabaseIssues().catch(console.error);