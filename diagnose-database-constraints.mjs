#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDatabaseConstraints() {
    console.log('🔍 [DATABASE] Diagnosing forms table constraints and policies...\n');

    try {
        // 1. Check table constraints
        console.log('📋 [CONSTRAINTS] Checking table constraints...');
        const { data: constraints, error: constraintsError } = await supabase
            .rpc('exec_sql', {
                sql: `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            cc.check_clause,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          LEFT JOIN information_schema.check_constraints cc 
            ON tc.constraint_name = cc.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'forms'
          ORDER BY tc.constraint_type, tc.constraint_name;
        `
            });

        if (constraints) {
            console.log('✅ [CONSTRAINTS] Table constraints found:');
            console.table(constraints);
        } else {
            console.log('❌ [CONSTRAINTS] Error:', constraintsError?.message || 'Could not fetch constraints');
        }

        // 2. Check RLS policies
        console.log('\n🔒 [RLS] Checking Row Level Security policies...');
        const { data: policies, error: policiesError } = await supabase
            .rpc('exec_sql', {
                sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'forms'
          ORDER BY policyname;
        `
            });

        if (policies) {
            console.log('✅ [RLS] RLS policies found:');
            console.table(policies);
        } else {
            console.log('❌ [RLS] Error:', policiesError?.message || 'Could not fetch policies');
        }

        // 3. Check triggers
        console.log('\n⚡ [TRIGGERS] Checking triggers on forms table...');
        const { data: triggers, error: triggersError } = await supabase
            .rpc('exec_sql', {
                sql: `
          SELECT 
            t.trigger_name,
            t.event_manipulation,
            t.event_object_table,
            t.action_timing,
            t.action_statement,
            p.prosrc as function_definition
          FROM information_schema.triggers t
          LEFT JOIN pg_proc p ON p.proname = REPLACE(t.action_statement, 'EXECUTE FUNCTION ', '')
          WHERE t.event_object_table = 'forms'
          ORDER BY t.trigger_name;
        `
            });

        if (triggers) {
            console.log('✅ [TRIGGERS] Triggers found:');
            console.table(triggers);
        } else {
            console.log('❌ [TRIGGERS] Error:', triggersError?.message || 'Could not fetch triggers');
        }

        // 4. Check column defaults and specifics for styling column
        console.log('\n📊 [COLUMNS] Checking forms table column details...');
        const { data: columns, error: columnsError } = await supabase
            .rpc('exec_sql', {
                sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_name = 'forms'
          ORDER BY ordinal_position;
        `
            });

        if (columns) {
            console.log('✅ [COLUMNS] Column definitions:');
            console.table(columns);

            // Focus on styling column
            const stylingColumn = columns.find(col => col.column_name === 'styling');
            if (stylingColumn) {
                console.log('\n🎨 [STYLING] Styling column analysis:');
                console.log('   Default value:', stylingColumn.column_default);
                console.log('   Data type:', stylingColumn.data_type);
                console.log('   Nullable:', stylingColumn.is_nullable);
            }
        } else {
            console.log('❌ [COLUMNS] Error:', columnsError?.message || 'Could not fetch columns');
        }

        // 5. Test direct update bypassing RLS if possible
        console.log('\n🧪 [BYPASS TEST] Testing update with service role (bypass RLS)...');
        const testId = 'c17a651f-55a3-4432-8432-9353b2a75686'; // First form ID from previous test

        const testStyling = {
            text_color: "#FF0000",
            font_family: "Inter, system-ui, sans-serif",
            border_color: "#00FF00",
            button_style: {
                text_color: "#ffffff",
                border_radius: "6px",
                background_color: "#0000FF"
            },
            border_radius: "8px",
            primary_color: "#FF0000",
            secondary_color: "#00FF00",
            background_color: "#0000FF",
            bypass_test: Date.now()
        };

        console.log('🔄 [BYPASS TEST] Sending test styling:', JSON.stringify(testStyling, null, 2));

        const { data: updateResult, error: updateError } = await supabase
            .from('forms')
            .update({ styling: testStyling })
            .eq('id', testId)
            .select('styling');

        if (updateResult) {
            console.log('✅ [BYPASS TEST] Update successful:', JSON.stringify(updateResult[0]?.styling, null, 2));

            // Compare what we sent vs what was saved
            const saved = updateResult[0]?.styling;
            const comparison = {
                sent_primary: testStyling.primary_color,
                saved_primary: saved?.primary_color,
                sent_background: testStyling.background_color,
                saved_background: saved?.background_color,
                sent_bypass_test: testStyling.bypass_test,
                saved_bypass_test: saved?.bypass_test,
                matches_sent: JSON.stringify(testStyling) === JSON.stringify(saved)
            };

            console.log('\n📊 [COMPARISON] Sent vs Saved analysis:');
            console.table([comparison]);

            if (!comparison.matches_sent) {
                console.log('❌ [CRITICAL] DATABASE IS STILL CORRUPTING DATA EVEN WITH SERVICE ROLE');
                console.log('🔍 [ANALYSIS] This indicates a column DEFAULT constraint or trigger is active');
            } else {
                console.log('✅ [SUCCESS] Service role can update successfully - RLS policy issue');
            }
        } else {
            console.log('❌ [BYPASS TEST] Update failed:', updateError?.message);
        }

    } catch (error) {
        console.error('💥 [ERROR] Database diagnosis failed:', error.message);
    }
}

// Execute diagnosis
diagnoseDatabaseConstraints().catch(console.error);