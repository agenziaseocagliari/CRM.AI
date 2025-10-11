/**
 * Test diretto del database per verificare form esistenti
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODU3MjUwNywiZXhwIjoyMDQ0MTQ4NTA3fQ.NNLcJvw7SWxhRJaOCCL6lF1iKjqBaPJ7j8eXC3v5YaE';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPublicFormAccess() {
    console.log('🔍 Testing public form access...');

    try {
        // 1. Trova form esistenti
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('id, name, fields, styling, privacy_policy_url')
            .limit(3);

        if (formsError) {
            console.error('❌ Error fetching forms:', formsError);
            return false;
        }

        console.log(`✅ Found ${forms?.length || 0} forms in database`);

        if (forms && forms.length > 0) {
            const testForm = forms[0];
            console.log('📋 Test form ID:', testForm.id);
            console.log('📋 Test form name:', testForm.name);
            console.log('🎨 Test form styling:', testForm.styling);
            console.log('🔒 Test form privacy URL:', testForm.privacy_policy_url);

            // 2. Test accesso pubblico con anon key
            const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { data: publicForm, error: publicError } = await anonSupabase
                .from('forms')
                .select('id, name, fields, styling, privacy_policy_url')
                .eq('id', testForm.id)
                .single();

            if (publicError) {
                console.error('❌ Public access error:', publicError);
                return false;
            }

            console.log('✅ Public form access successful!');
            console.log('📋 Public form data received:', !!publicForm);

            // 3. Test URL pubblico
            const publicUrl = `http://localhost:5173/form/${testForm.id}`;
            console.log('🌐 Public form URL:', publicUrl);

            return true;
        } else {
            console.log('⚠️ No forms found in database to test');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

testPublicFormAccess().then(success => {
    console.log(`\n📋 Test Result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
});