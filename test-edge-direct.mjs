/**
 * Test Edge Function con service role key per evitare problemi JWT
 */

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODU3MjUwNywiZXhwIjoyMDQ0MTQ4NTA3fQ.NNLcJvw7SWxhRJaOCCL6lF1iKjqBaPJ7j8eXC3v5YaE';

async function testEdgeFunctionDirectly() {
    console.log('🧪 Testing Edge Function directly with service role...');

    const testPrompt = `
Tipo di business: Web Agency
Scopo del form: Richiesta preventivo sito web
Campi obbligatori: Nome completo, Email, Messaggio
Colore primario: #ef4444
Colore sfondo: #f8fafc
URL Privacy Policy: https://example.com/privacy
GDPR compliance: Richiesto
Genera i campi specificamente richiesti: Nome completo, Email, Messaggio
  `.trim();

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({
                prompt: testPrompt,
                organization_id: 'test-org-debug'
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
        console.log('📊 Response structure:', Object.keys(data));

        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

testEdgeFunctionDirectly().then(success => {
    console.log(`\n📋 Test Result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
});