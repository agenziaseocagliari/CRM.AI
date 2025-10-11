import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🏢 CREAZIONE UTENTE ENTERPRISE');

async function createEnterpriseUser() {
    try {
        console.log('📧 Creando utente: webproseoid@gmail.com');
        
        // Crea l'utente con admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'webproseoid@gmail.com',
            password: 'WebProSEO@1980#',
            email_confirm: true, // Conferma automaticamente
            user_metadata: {
                name: 'Enterprise User',
                role: 'admin'
            }
        });
        
        if (authError) {
            console.error('❌ Errore creazione auth:', authError);
            return;
        }
        
        console.log('✅ Utente auth creato:', authData.user.id);
        
        // Crea organization enterprise
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: 'WebProSEO Enterprise',
                plan: 'enterprise',
                credits: 10000,
                max_users: 100,
                created_by: authData.user.id
            })
            .select()
            .single();
            
        if (orgError) {
            console.error('❌ Errore creazione organization:', orgError);
            return;
        }
        
        console.log('✅ Organization creata:', orgData.id);
        
        // Aggiungi user alla organization
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: orgData.id,
                user_id: authData.user.id,
                role: 'admin'
            });
            
        if (memberError) {
            console.error('❌ Errore aggiunta member:', memberError);
            return;
        }
        
        console.log('✅ User aggiunto come admin all\' organization');
        
        // Crea il profilo utente
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: 'webproseoid@gmail.com',
                name: 'Enterprise User',
                organization_id: orgData.id
            });
            
        if (profileError) {
            console.error('❌ Errore creazione profilo:', profileError);
            return;
        }
        
        console.log('✅ Profilo utente creato');
        
        console.log('\n🎉 UTENTE ENTERPRISE CREATO CON SUCCESSO!');
        console.log('📧 Email: webproseoid@gmail.com');
        console.log('🔑 Password: WebProSEO@1980#');
        console.log('🏢 Organization: WebProSEO Enterprise');
        console.log('👤 Role: Admin');
        console.log('💳 Credits: 10,000');
        
    } catch (error) {
        console.error('💥 Errore generale:', error);
    }
}

createEnterpriseUser();