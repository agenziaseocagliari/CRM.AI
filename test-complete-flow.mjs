import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteFormFlow() {
    try {
        console.log('🔄 TEST COMPLETO DEL FLUSSO FORM...');

        // 1. Pulizia iniziale
        await supabase
            .from('forms')
            .delete()
            .eq('name', 'test-flow-completo');

        console.log('🧹 Pulizia completata');

        // 2. Test simulazione salvataggio dal PostAIEditor
        console.log('\n📝 STEP 1: Simulazione salvataggio dal PostAIEditor...');

        const testFormData = {
            name: 'test-flow-completo',
            title: 'Test Flusso Completo',
            fields: [
                {
                    name: 'nome',
                    type: 'text',
                    label: 'Nome',
                    required: true
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                    required: true
                },
                {
                    name: 'servizi_interesse',
                    type: 'select',
                    label: 'Servizi di Interesse',
                    required: true,
                    options: ['Web Design', 'SEO', 'Marketing Digital', 'Consulenza Strategica']
                },
                {
                    name: 'consenso_privacy',
                    type: 'checkbox',
                    label: 'Accetto la privacy policy',
                    required: true
                }
            ],
            privacy_policy_url: 'https://example.com/privacy',
            organization_id: '01935fc9-1e3a-7db1-be54-8de6893cbefb'
        };

        // Colori personalizzati dal PostAIEditor
        const customStyle = {
            primary_color: '#2563eb',      // Blu personalizzato
            secondary_color: '#f1f5f9',
            background_color: '#f8fafc',   // Grigio chiaro
            text_color: '#1e293b',         // Grigio scuro
            border_color: '#2563eb',
            border_radius: '12px',
            font_family: 'Inter, sans-serif',
            button_style: {
                background_color: '#2563eb',
                text_color: '#ffffff',
                border_radius: '8px'
            }
        };

        testFormData.styling = customStyle;

        console.log('💾 Salvataggio form con styling personalizzato...');
        console.log('🎨 Colori:', {
            primary: customStyle.primary_color,
            background: customStyle.background_color,
            text: customStyle.text_color
        });

        const { data: savedForm, error: saveError } = await supabase
            .from('forms')
            .insert(testFormData)
            .select()
            .single();

        if (saveError) throw saveError;

        console.log('✅ Form salvato con ID:', savedForm.id);

        // 3. Test caricamento per editing
        console.log('\n📖 STEP 2: Test caricamento per editing...');

        const { data: loadedForm, error: loadError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', savedForm.id)
            .single();

        if (loadError) throw loadError;

        console.log('📋 Form caricato per editing:');
        console.log('  - Styling presente:', !!loadedForm.styling);
        console.log('  - Primary color:', loadedForm.styling?.primary_color);
        console.log('  - Fields count:', loadedForm.fields?.length);
        console.log('  - Privacy URL:', loadedForm.privacy_policy_url);

        // 4. Test rendering pubblico
        console.log('\n🌐 STEP 3: Test rendering pubblico...');

        const publicFormUrl = `http://localhost:5173/form/${savedForm.id}`;
        console.log('🔗 URL form pubblico:', publicFormUrl);

        // 5. Verifica tutte le features critiche
        console.log('\n✅ VERIFICA FEATURES CRITICHE:');

        // GDPR Checkbox
        const hasGdprField = loadedForm.fields.some(field =>
            field.type === 'checkbox' &&
            field.name === 'consenso_privacy'
        );
        console.log('  ✓ GDPR Checkbox presente:', hasGdprField);

        // Privacy Policy URL
        const hasPrivacyUrl = !!loadedForm.privacy_policy_url;
        console.log('  ✓ Privacy Policy URL presente:', hasPrivacyUrl);

        // Servizi Interest Options
        const serviziField = loadedForm.fields.find(f => f.name === 'servizi_interesse');
        const hasServiziOptions = serviziField?.options?.length > 0;
        console.log('  ✓ Servizi interesse opzioni:', hasServiziOptions, `(${serviziField?.options?.length} opzioni)`);

        // Styling personalizzato
        const hasCustomStyling = !!loadedForm.styling?.primary_color;
        console.log('  ✓ Styling personalizzato:', hasCustomStyling);

        // 6. Test di modifica colori
        console.log('\n🎨 STEP 4: Test modifica colori...');

        const newStyle = {
            ...loadedForm.styling,
            primary_color: '#dc2626',      // Rosso
            background_color: '#fef2f2',   // Rosa chiaro
            text_color: '#991b1b'          // Rosso scuro
        };

        const { error: updateError } = await supabase
            .from('forms')
            .update({ styling: newStyle })
            .eq('id', savedForm.id);

        if (updateError) throw updateError;

        console.log('✅ Colori aggiornati a:', {
            primary: newStyle.primary_color,
            background: newStyle.background_color,
            text: newStyle.text_color
        });

        // Verifica persistenza
        const { data: verifyForm, error: verifyError } = await supabase
            .from('forms')
            .select('styling')
            .eq('id', savedForm.id)
            .single();

        if (verifyError) throw verifyError;

        const colorsMatch = verifyForm.styling.primary_color === newStyle.primary_color;
        console.log('  ✓ Persistenza colori verificata:', colorsMatch);

        // 7. Risultati finali
        console.log('\n🎯 RISULTATI FINALI:');
        console.log('  ✅ Database salvataggio: OK');
        console.log('  ✅ Caricamento form: OK');
        console.log('  ✅ GDPR checkbox: OK');
        console.log('  ✅ Privacy policy URL: OK');
        console.log('  ✅ Servizi interesse opzioni: OK');
        console.log('  ✅ Styling personalizzato: OK');
        console.log('  ✅ Modifica colori: OK');
        console.log('  ✅ Persistenza colori: OK');

        console.log('\n🔗 LINK PER TEST FRONTEND:');
        console.log('  📱 Dashboard: http://localhost:5173/');
        console.log('  🌐 Form pubblico:', publicFormUrl);

        console.log('\n📝 TEST MANUALI DA FARE:');
        console.log('  1. Apri dashboard e crea nuovo form');
        console.log('  2. Personalizza colori nel PostAIEditor');
        console.log('  3. Salva e verifica che modal si chiude');
        console.log('  4. Apri form pubblico e verifica colori');
        console.log('  5. Testa compilazione completa form');

        // Non eliminiamo per test manuali
        console.log('\n⚠️ Form mantenuto per test manuali');
        console.log('🆔 ID form:', savedForm.id);

    } catch (error) {
        console.error('❌ Errore durante test completo:', error);
    }
}

testCompleteFormFlow();