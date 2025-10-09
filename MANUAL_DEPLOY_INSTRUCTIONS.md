📋 **ISTRUZIONI DEPLOY MANUALE - EDGE FUNCTION CON GDPR COMPLIANCE**

## 🚀 STEP 1: Deploy Edge Function Updated

1. **Vai a Supabase Dashboard**: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
2. **Clicca su "Edge Functions"** nella sidebar sinistra
3. **Clicca su "generate-form-fields"** (funzione esistente)
4. **Clicca su "Edit Function"**
5. **Sostituisci tutto il codice** con il contenuto del file: `DEPLOY_MANUAL_GDPR_generate-form-fields.ts`
6. **Clicca "Deploy Function"**

## 🧪 STEP 2: Test GDPR Compliance

Dopo il deploy, testa con:
- **Prompt**: "form contatto per gdpr compliance con consenso privacy"
- **Risultato atteso**: Deve includere campi `privacy_consent` e `marketing_consent`

## 🛠️ STEP 3: Test Database (Opzionale)

1. **Vai a Supabase Studio > SQL Editor**
2. **Esegui questo SQL** per creare le tabelle:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    organization_id UUID NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
```

## ✅ RISULTATO ATTESO

Dopo il deploy, questi prompt dovrebbero generare campi GDPR:
- ✅ "form contatto per gdpr compliance"
- ✅ "contatto con privacy policy"
- ✅ "form con consenso marketing newsletter"
- ✅ "contatto dati personali privacy"

Campi GDPR generati:
- `privacy_consent` (checkbox, required): "Accetto l'informativa sulla privacy..."
- `marketing_consent` (checkbox, optional): "Accetto di ricevere comunicazioni commerciali..."

## 🎯 VERIFICA

Usa il file: `test-gdpr-real-fix.html` per testare che il GDPR compliance funzioni correttamente.