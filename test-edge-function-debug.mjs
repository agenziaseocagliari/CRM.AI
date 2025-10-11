/**
 * Test Edge Function con debug verboso colori - Commit 1130935
 * Verifica che l'estrazione colori funzioni con il debug aggiunto
 */

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NzI1MDcsImV4cCI6MjA0NDE0ODUwN30.bQo-4k-vGPH4_UwE4wGGAeKe_xkskhFCJY4BreSiMYQ';

async function testEdgeFunctionDebug() {
    console.log('🧪 Testing Edge Function with verbose color debugging...');

    // Test prompt con colori specifici (formato questionario)
    const testPrompt = `
Tipo di business: Web Agency
Scopo del form: Richiesta preventivo sito web
Campi obbligatori: Nome completo, Email, Messaggio
Colore primario: #ef4444
Colore sfondo: #f8fafc
URL Privacy Policy: https://example.com/privacy
GDPR compliance: Richiesto
Consenso marketing: Include opzione
Genera i campi specificamente richiesti: Nome completo, Email, Messaggio
  `.trim();

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                prompt: testPrompt,
                organization_id: 'test-org-debug',
                required_fields: ['Nome completo', 'Email', 'Messaggio'],
                style_customizations: {
                    primaryColor: '#ef4444',
                    backgroundColor: '#f8fafc'
                },
                privacy_policy_url: 'https://example.com/privacy'
            })
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Edge Function error:', error);
            return false;
        }

        const data = await response.json();

        console.log('✅ Edge Function response received');
        console.log('📊 Fields generated:', data.fields?.length || 0);
        console.log('🎨 Colors in meta:', data.meta?.colors);
        console.log('🎨 Style customizations in response:', data.style_customizations);
        console.log('🔒 Privacy URL in response:', data.privacy_policy_url);

        // Verifica che i colori siano stati estratti
        const hasColors = data.meta?.colors?.primary_color === '#ef4444' &&
            data.meta?.colors?.background_color === '#f8fafc';

        const hasStyleCustomizations = data.style_customizations?.primaryColor === '#ef4444' &&
            data.style_customizations?.backgroundColor === '#f8fafc';

        const hasPrivacyUrl = data.privacy_policy_url === 'https://example.com/privacy';

        console.log('\n🔍 VALIDATION RESULTS:');
        console.log('✅ Colors extracted from prompt:', hasColors ? 'YES' : 'NO');
        console.log('✅ Style customizations preserved:', hasStyleCustomizations ? 'YES' : 'NO');
        console.log('✅ Privacy URL preserved:', hasPrivacyUrl ? 'YES' : 'NO');

        if (hasColors && hasStyleCustomizations && hasPrivacyUrl) {
            console.log('\n🎉 SUCCESS: Edge Function debug verboso funziona correttamente!');
            return true;
        } else {
            console.log('\n⚠️ PARTIAL: Alcuni valori non sono stati estratti correttamente');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Run test
testEdgeFunctionDebug().then(success => {
    console.log(`\n📋 Test Result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
});