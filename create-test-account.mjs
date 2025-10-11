import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('👤 CREAZIONE NUOVO ACCOUNT TEST');

async function createTestAccount() {
    try {
        const testEmail = 'test.forms@guardianai.it';
        const testPassword = 'TestForms123!';
        
        console.log('📧 Creando account test:', testEmail);
        
        // Elimina account esistente se esiste
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === testEmail);
        
        if (existingUser) {
            console.log('🗑️ Eliminando account esistente...');
            await supabase.auth.admin.deleteUser(existingUser.id);
        }
        
        // Crea nuovo account
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: {
                name: 'Test Forms User',
                role: 'admin'
            }
        });
        
        if (authError) {
            console.error('❌ Errore creazione account:', authError);
            return;
        }
        
        console.log('✅ Account creato:', authData.user.id);
        
        // Crea organization semplice
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: 'Test Organization',
                plan: 'pro',
                credits: 1000
            })
            .select()
            .single();
            
        if (orgError) {
            console.log('⚠️ Organization non creata (normale):', orgError.message);
        } else {
            console.log('✅ Organization creata:', orgData.id);
        }
        
        console.log('\n🎉 ACCOUNT TEST CREATO!');
        console.log('📧 Email: ' + testEmail);
        console.log('🔑 Password: ' + testPassword);
        console.log('');
        console.log('🎯 PROVA IL LOGIN CON QUESTE CREDENZIALI!');
        
    } catch (error) {
        console.error('💥 Errore:', error);
    }
}

createTestAccount();