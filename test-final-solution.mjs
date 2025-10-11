import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testFinalSolution() {
    console.log('🎯 TEST SOLUZIONE FINALE...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🌐 URL:', supabaseUrl);
    console.log('🔑 Key (primi 50):', anonKey?.substring(0, 50));

    const supabase = createClient(supabaseUrl, anonKey);

    try {
        console.log('🧪 TEST 1: Lista forms...');
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('id, name, title')
            .limit(3);

        if (formsError) {
            console.log('❌ Errore lista forms:', formsError.message);
        } else {
            console.log('✅ Lista forms funziona!');
            console.log('📊 Forms trovati:', forms?.length || 0);
            forms?.forEach((form, i) => {
                console.log(`  ${i + 1}. ${form.name} (ID: ${form.id})`);
            });
        }

        console.log('\n🧪 TEST 2: Caricamento form specifico...');
        const { data: specificForm, error: specificError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', '26e1ad32-7952-46d2-9777-51fe6ccee01d')
            .single();

        if (specificError) {
            console.log('❌ Errore form specifico:', specificError.message);
        } else {
            console.log('✅ Form specifico caricato!');
            console.log('  - Nome:', specificForm.name);
            console.log('  - Fields:', specificForm.fields?.length || 0);
            console.log('  - Styling:', !!specificForm.styling);
            console.log('  - Privacy URL:', specificForm.privacy_policy_url);

            if (specificForm.styling) {
                console.log('  - Primary Color:', specificForm.styling.primary_color);
                console.log('  - Background:', specificForm.styling.background_color);
            }
        }

        console.log('\n🧪 TEST 3: Simulazione caricamento PublicForm.tsx...');
        // Questo è esattamente quello che fa PublicForm.tsx
        const formId = '26e1ad32-7952-46d2-9777-51fe6ccee01d';
        const { data: publicForm, error: publicError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();

        if (publicError) {
            console.log('❌ PublicForm simulation failed:', publicError.message);
        } else {
            console.log('✅ PublicForm simulation SUCCESS!');

            // Verifica che abbia tutti i campi necessari
            const hasGdpr = publicForm.fields?.some(f => f.type === 'checkbox' && f.name === 'consenso_privacy');
            const hasServizi = publicForm.fields?.some(f => f.name === 'servizi_interesse' && f.options?.length > 0);

            console.log('  ✅ GDPR checkbox presente:', hasGdpr);
            console.log('  ✅ Servizi opzioni presente:', hasServizi);
            console.log('  ✅ Privacy URL presente:', !!publicForm.privacy_policy_url);
            console.log('  ✅ Styling presente:', !!publicForm.styling);
        }

        console.log('\n🎉 RISULTATO FINALE:');
        if (!formsError && !specificError && !publicError) {
            console.log('🎯 ✅ TUTTI I TEST PASSATI!');
            console.log('🎯 ✅ APPLICAZIONE PRONTA PER IL TEST!');

            console.log('\n🔗 URL PER TEST:');
            console.log('  📱 Dashboard: http://localhost:5173/');
            console.log('  🌐 Form pubblico: http://localhost:5173/form/26e1ad32-7952-46d2-9777-51fe6ccee01d');

            console.log('\n🧪 PROSSIMI PASSI:');
            console.log('  1. Apri il browser su http://localhost:5173/');
            console.log('  2. Crea un nuovo form e testa i colori');
            console.log('  3. Verifica che i modal si chiudano automaticamente');
            console.log('  4. Testa il form pubblico per vedere i colori applicati');

        } else {
            console.log('❌ ALCUNI TEST FALLITI - Controllare gli errori sopra');
        }

    } catch (error) {
        console.log('❌ Errore generale:', error.message);
    }
}

testFinalSolution();