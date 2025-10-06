# 🚨 FORMMASTER ERROR - RISOLUZIONE COMPLETA

## 📋 PROBLEMA IDENTIFICATO
L'errore "Errore di rete nella verifica dei crediti: Edge Function returned a non-2xx status code" indica che l'Edge Function `consume-credits` sta fallendo.

## 🔧 CHECKLIST RISOLUZIONE

### ✅ STEP 1: Database RPC Function
La funzione `consume_credits_rpc` è stata creata e applicata con successo.

### 🔍 STEP 2: Verifica Environment Variables
**VAI IN SUPABASE DASHBOARD:**
1. Project Settings → Edge Functions → Environment Variables
2. Verifica che esistano:
   - `SUPABASE_URL` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ❓ (CRITICAL)
   - `GEMINI_API_KEY` ❓

### 🚨 STEP 3: Fix più probabile - SERVICE_ROLE_KEY
**Il problema più comune è che manca `SUPABASE_SERVICE_ROLE_KEY`:**

1. Vai in Supabase Dashboard → Project Settings → API
2. Copia la **service_role key** (secret)  
3. Vai in Project Settings → Edge Functions → Environment Variables
4. Aggiungi:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [la service_role key copiata]

### 🔄 STEP 4: Restart Edge Functions
Dopo aver aggiunto le environment variables:
1. Vai in Edge Functions dashboard
2. Redeploy o restart le functions `consume-credits` e `generate-form-fields`

### 🧪 STEP 5: Test SQL Diagnostico
Esegui in Supabase Studio → SQL Editor il contenuto di `FORMMASTER_DIAGNOSTIC_FIX.sql`

### 📊 STEP 6: Verifica Logs
Vai in Edge Functions → Logs per vedere gli errori dettagliati in real-time

## 🎯 SOLUZIONE RAPIDA
**95% dei casi è la SERVICE_ROLE_KEY mancante nelle Environment Variables delle Edge Functions.**

## 🔧 BACKUP PLAN
Se il problema persiste, posso creare una versione semplificata dell'Edge Function che bypassa temporaneamente il sistema crediti per il testing.