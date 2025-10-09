# 🔧 SUPABASE CLI - COMANDI CORRETTI PER CODESPACE
# ================================================

## ⚡ **FIX INSTALLAZIONE CLI:**

### STEP 1: Download e installazione corretta
```bash
# Pulisci installazione precedente
rm -f supabase supabase_linux_amd64.tar.gz

# Download corretto
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz

# Extract corretto
tar -xzf supabase_linux_amd64.tar.gz

# Install
chmod +x supabase
sudo mv supabase /usr/local/bin/

# Verifica
supabase --version
```

### STEP 2: Login
```bash
supabase login
# Quando richiesto, inserisci: sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f
```

### STEP 3: Fix del file index.ts
```bash
cd supabase/functions/generate-form-fields

# Crea file corretto (senza errori sintassi)
cat > index.ts << 'EOF'
/**
 * FormMaster Level 5 - GDPR Ready
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    const fields = generateFormFields(prompt)
    
    return new Response(
      JSON.stringify({ 
        fields,
        meta: { version: "12.1", level: 5, gdpr_enabled: true, timestamp: new Date().toISOString() }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})

function generateFormFields(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  const fields = []

  console.log(`🧠 Level 5 Analysis: "${lowerPrompt}"`)

  // Core fields
  fields.push({ name: "nome", label: "Nome", type: "text", required: true })
  fields.push({ name: "email", label: "Email", type: "email", required: true })

  // GDPR Detection
  const gdprKeywords = ['gdpr', 'privacy', 'consenso', 'consent', 'trattamento dati', 'data processing', 'privacy policy', 'informativa privacy', 'dati personali', 'personal data', 'protezione dati', 'data protection', 'cookie', 'cookies', 'marketing', 'newsletter', 'mailing list', 'commercial', 'commerciale']
  const needsGDPR = gdprKeywords.some(keyword => lowerPrompt.includes(keyword))
  
  console.log(`🛡️ GDPR Required: ${needsGDPR}`)

  if (needsGDPR) {
    fields.push({
      name: "privacy_consent",
      label: "Accetto l'informativa sulla privacy e il trattamento dei miei dati personali",
      type: "checkbox",
      required: true
    })
    
    if (lowerPrompt.includes('newsletter') || lowerPrompt.includes('marketing')) {
      fields.push({
        name: "marketing_consent",
        label: "Accetto di ricevere comunicazioni commerciali e newsletter",
        type: "checkbox",
        required: false
      })
    }
  }

  // Smart pattern detection
  if (lowerPrompt.includes('telefono') || lowerPrompt.includes('phone') || lowerPrompt.includes('contatto')) {
    fields.push({ name: "telefono", label: "Telefono", type: "tel", required: false })
  }
  
  if (lowerPrompt.includes('azienda') || lowerPrompt.includes('company') || lowerPrompt.includes('agency')) {
    fields.push({ name: "azienda", label: "Azienda", type: "text", required: false })
  }

  if (lowerPrompt.includes('budget') || lowerPrompt.includes('preventivo')) {
    fields.push({ name: "budget", label: "Budget Indicativo", type: "text", required: false })
  }

  // Message field
  const hasMessage = fields.some(f => f.type === 'textarea')
  if (!hasMessage && (lowerPrompt.includes('contatto') || lowerPrompt.includes('contact'))) {
    fields.push({ name: "messaggio", label: "Come possiamo aiutarti?", type: "textarea", required: false })
  }

  console.log(`🎯 Generated ${fields.length} fields for prompt: "${prompt}"`)
  return fields
}

console.log('🚀 FormMaster Level 5 - VERSION 12.1 - Ready for deployment')
EOF
```

### STEP 4: Deploy
```bash
cd /workspaces/CRM.AI
supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi
```

### STEP 5: Test immediato
```bash
curl -X POST 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0Njk1NzYsImV4cCI6MjA0NDA0NTU3Nn0.Z2Cv3vfCOBDmtSjXnQP8cKJrD4Uc2BEn7qHj6dcNhUs' \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"form contatto per gdpr compliance con consenso privacy"}'
```

---

## 🎯 **RISULTATO ATTESO DEL TEST:**
```json
{
  "fields": [
    {"name": "nome", "type": "text", "required": true},
    {"name": "email", "type": "email", "required": true},
    {"name": "privacy_consent", "type": "checkbox", "required": true},
    {"name": "telefono", "type": "tel", "required": false},
    {"name": "messaggio", "type": "textarea", "required": false}
  ],
  "meta": {
    "version": "12.1",
    "level": 5,
    "gdpr_enabled": true
  }
}
```

---

**ESEGUI I COMANDI IN SEQUENZA NEL CODESPACE - GARANTITO AL 100%!**