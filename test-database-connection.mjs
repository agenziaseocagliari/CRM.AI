import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.V9O8kPhCuIZiZaOOE-lLKv_yfUqwM9uMnXZojXANkzk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 TEST DATABASE CONNECTION & FORMS');

async function testDatabase() {
    try {
        console.log('📊 Connessione al database...');

        // Test connessione base
        const { data: testData, error: testError } = await supabase
            .from('forms')
            .select('id, name, styling, privacy_policy_url, created_at')
            .order('created_at', { ascending: false })
            .limit(3);

        if (testError) {
            console.error('❌ Errore database:', testError);
            return;
        }

        console.log(`✅ Database connesso! ${testData.length} form trovati.\n`);

        // Analizza ultimi form
        testData.forEach((form, index) => {
            console.log(`📋 Form ${index + 1}:`);
            console.log(`   ID: ${form.id}`);
            console.log(`   Nome: ${form.name}`);
            console.log(`   Privacy URL: ${form.privacy_policy_url || 'NON PRESENTE'}`);

            if (form.styling) {
                const styling = typeof form.styling === 'string' ? JSON.parse(form.styling) : form.styling;
                console.log(`   Primary Color: ${styling.primary_color || 'NON PRESENTE'}`);
                console.log(`   Background Color: ${styling.background_color || 'NON PRESENTE'}`);

                const isDefault = styling.primary_color === '#6366f1';
                console.log(`   🎨 Colori Custom: ${isDefault ? '❌ NO (default)' : '✅ SÌ'}`);
            } else {
                console.log(`   🎨 Styling: ❌ NON PRESENTE`);
            }

            console.log(`   Creato: ${new Date(form.created_at).toLocaleString()}\n`);
        });

        // Statistiche generali
        const { count } = await supabase
            .from('forms')
            .select('*', { count: 'exact', head: true });

        console.log(`📈 STATISTICHE TOTALI:`);
        console.log(`   Total form nel database: ${count}`);

        // Test form con colori custom
        const { data: customColorForms } = await supabase
            .from('forms')
            .select('id, name, styling')
            .neq('styling->primary_color', '#6366f1')
            .not('styling', 'is', null);

        console.log(`   Form con colori custom: ${customColorForms?.length || 0}`);

        if (customColorForms && customColorForms.length > 0) {
            console.log('\n🎨 FORM CON COLORI CUSTOM:');
            customColorForms.slice(0, 3).forEach(form => {
                const styling = typeof form.styling === 'string' ? JSON.parse(form.styling) : form.styling;
                console.log(`   • ${form.name}: ${styling.primary_color}`);
            });
        }

    } catch (error) {
        console.error('💥 Errore generale:', error);
    }
}

testDatabase();