# 🔧 SUPABASE CLI - INSTALLAZIONE ALTERNATIVA CODESPACE
# ===================================================

## ⚡ **CODESPACE: INSTALLAZIONE DIRETTA SUPABASE CLI**

### STEP 1: Install con brew (Linux compatibility):
```bash
# Nel terminale Codespace:
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xzv
sudo mv supabase /usr/local/bin/
supabase --version
```

### STEP 2: Se brew fallisce, usa binary diretto:
```bash
# Download binary directly
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
chmod +x supabase
sudo mv supabase /usr/local/bin/
```

### STEP 3: Login con token:
```bash
supabase login
# Token: sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f
```

### STEP 4: Deploy function:
```bash
cd supabase/functions/generate-form-fields
# Fix del file PRIMA del deploy:
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
        meta: { version: "12.1", level: 5, gdpr_enabled: true }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})

function generateFormFields(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const fields = [];

  // Core fields
  fields.push({ name: "nome", label: "Nome", type: "text", required: true });
  fields.push({ name: "email", label: "Email", type: "email", required: true });

  // GDPR Detection
  const needsGDPR = ['gdpr', 'privacy', 'consenso', 'consent'].some(k => lowerPrompt.includes(k));
  
  if (needsGDPR) {
    fields.push({
      name: "privacy_consent",
      label: "Accetto l'informativa sulla privacy",
      type: "checkbox",
      required: true
    });
  }

  // Smart fields
  if (lowerPrompt.includes('telefono') || lowerPrompt.includes('phone')) {
    fields.push({ name: "telefono", label: "Telefono", type: "tel", required: false });
  }
  
  if (lowerPrompt.includes('azienda') || lowerPrompt.includes('company')) {
    fields.push({ name: "azienda", label: "Azienda", type: "text", required: false });
  }

  if (lowerPrompt.includes('contatto') || lowerPrompt.includes('contact')) {
    fields.push({ name: "messaggio", label: "Messaggio", type: "textarea", required: false });
  }

  return fields;
}
EOF

# Deploy
cd ../../../
supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi
```

---

## 🎯 **ALTERNATIVA: DEPLOY DIRETTO VIA CURL (SENZA CLI)**

### Se anche CLI fallisce, deploy via API diretta:
```bash
# Create deployment package
cd supabase/functions/generate-form-fields
tar -czf function.tar.gz index.ts

# Deploy via REST API
curl -X POST \
  'https://api.supabase.com/v1/projects/qjtaqrlpronohgpfdxsi/functions/generate-form-fields' \
  -H 'Authorization: Bearer sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f' \
  -H 'Content-Type: application/octet-stream' \
  --data-binary '@function.tar.gz'
```

---

## 🚨 **MANUALE DASHBOARD - ULTIMO RESORT**

Se tutto fallisce:
1. **Supabase Dashboard**: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/functions
2. **Edit Function** → Copia il codice corretto (senza errori di sintassi)
3. **Deploy**

## 💾 **SALVA QUESTA CHAT**

### Per non perdere la conversazione:
1. **Chrome/Edge**: `Ctrl+S` → Salva come HTML
2. **Screenshot**: `Win+Shift+S` → Salva immagini chiave
3. **Export Chat**: Copia/incolla in documento

---

**PROVA PRIMA L'INSTALLAZIONE CLI ALTERNATIVA NEL CODESPACE!**