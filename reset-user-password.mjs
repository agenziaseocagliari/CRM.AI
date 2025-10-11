import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔑 RESET PASSWORD UTENTE ENTERPRISE');

async function resetUserPassword() {
    try {
        console.log('📧 Cercando utente: webproseoid@gmail.com');
        
        // Prima trova l'utente
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
            console.error('❌ Errore ricerca utenti:', listError);
            return;
        }
        
        const user = users.users.find(u => u.email === 'webproseoid@gmail.com');
        
        if (!user) {
            console.log('❌ Utente non trovato. Creiamo un nuovo utente...');
            
            // Crea nuovo utente
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: 'webproseoid@gmail.com',
                password: 'WebProSEO@1980#',
                email_confirm: true,
                user_metadata: {
                    name: 'Enterprise User',
                    role: 'admin'
                }
            });
            
            if (authError) {
                console.error('❌ Errore creazione nuovo utente:', authError);
                return;
            }
            
            console.log('✅ Nuovo utente creato:', authData.user.id);
            return;
        }
        
        console.log('✅ Utente trovato:', user.id);
        
        // Reset password
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
                password: 'WebProSEO@1980#',
                email_confirm: true
            }
        );
        
        if (updateError) {
            console.error('❌ Errore reset password:', updateError);
            return;
        }
        
        console.log('✅ Password resettata con successo!');
        
        // Verifica se ha organization
        const { data: orgMember, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single();
            
        if (orgError || !orgMember) {
            console.log('🏢 Creando organization per l\'utente...');
            
            // Crea organization
            const { data: orgData, error: createOrgError } = await supabase
                .from('organizations')
                .insert({
                    name: 'WebProSEO Enterprise',
                    plan: 'enterprise',
                    credits: 10000,
                    max_users: 100,
                    created_by: user.id
                })
                .select()
                .single();
                
            if (createOrgError) {
                console.error('❌ Errore creazione organization:', createOrgError);
                return;
            }
            
            // Aggiungi come member
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: orgData.id,
                    user_id: user.id,
                    role: 'admin'
                });
                
            if (memberError) {
                console.error('❌ Errore aggiunta member:', memberError);
                return;
            }
            
            console.log('✅ Organization creata e utente aggiunto come admin');
        } else {
            console.log('✅ Utente già ha organization:', orgMember.organization_id);
        }
        
        console.log('\n🎉 SETUP COMPLETATO!');
        console.log('📧 Email: webproseoid@gmail.com');
        console.log('🔑 Password: WebProSEO@1980#');
        console.log('🏢 Plan: Enterprise');
        console.log('👤 Role: Admin');
        
    } catch (error) {
        console.error('💥 Errore generale:', error);
    }
}

resetUserPassword();