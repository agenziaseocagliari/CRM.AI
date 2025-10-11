import { createClient } from '@supabase/supabase-js';

// Test diretto delle credenziali
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.V9O8kPhCuIZiZaOOE-lLKv_yfUqwM9uMnXZojXANkzk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 TEST DIRETTO CREDENZIALI SUPABASE');

async function testCredentials() {
    try {
        console.log('📧 Testando login: test.forms@guardianai.it');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'test.forms@guardianai.it',
            password: 'TestForms123!'
        });
        
        if (error) {
            console.error('❌ Errore login:', error);
            console.log('🔑 Testando anche webproseoid@gmail.com...');
            
            const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
                email: 'webproseoid@gmail.com', 
                password: 'WebProSEO@1980#'
            });
            
            if (error2) {
                console.error('❌ Errore anche con webproseoid:', error2);
                
                // Test connessione generale
                console.log('🔍 Test connessione database...');
                const { data: testData, error: dbError } = await supabase
                    .from('forms')
                    .select('id')
                    .limit(1);
                    
                if (dbError) {
                    console.error('❌ Database non accessibile:', dbError);
                } else {
                    console.log('✅ Database funziona, problema è solo auth');
                }
                
                return;
            }
            
            console.log('✅ Login funziona con webproseoid:', data2.user.email);
            return;
        }
        
        console.log('✅ Login funziona con test.forms:', data.user.email);
        
    } catch (err) {
        console.error('💥 Errore generale:', err);
    }
}

testCredentials();