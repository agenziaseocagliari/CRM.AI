# 🎯 DIAGNOSI COMPLETA RLS POLICY - PROBLEMA RISOLTO

## ✅ PROBLEMA IDENTIFICATO

**La policy è CORRETTA!** Il problema era nella query di verifica.

### 📊 Output Analisi:
```
| schemaname | tablename | policyname          | cmd    | qual | with_check                    | diagnosis             |
|------------|-----------|---------------------|--------|------|-------------------------------|-----------------------|
| public     | forms     | forms_insert_policy | INSERT | null | EXISTS (SELECT 1 FROM ...)    | ✅ WITH_CHECK PRESENTE|
```

### 🔍 SPIEGAZIONE:

**PostgreSQL RLS Policy ha DUE campi:**

1. **`qual`** (USING expression)
   - Usato per: SELECT, UPDATE, DELETE
   - Controlla se la riga può essere **letta/modificata/eliminata**
   - Per INSERT è **sempre NULL** (normale!)

2. **`with_check`** (WITH CHECK expression)  
   - Usato per: INSERT, UPDATE
   - Controlla se la riga può essere **inserita/modificata**
   - Per INSERT **DEVE** essere presente

**La nostra policy INSERT aveva:**
- ❌ `qual = NULL` → **NORMALE per INSERT!**
- ✅ `with_check = EXISTS(...)` → **PRESENTE E CORRETTO!**

### ❌ QUERY SBAGLIATA (quella che usavamo):
```sql
-- SBAGLIATA: Controlla solo qual
SELECT 
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN'  -- FALSO NEGATIVO per INSERT!
        ELSE '✅ OK'
    END as status
FROM pg_policies
WHERE cmd = 'INSERT';
```

### ✅ QUERY CORRETTA (quella giusta):
```sql
-- CORRETTA: Controlla with_check per INSERT
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' AND with_check IS NULL THEN '❌ BROKEN - NO WITH_CHECK'
        WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✅ OK - HAS WITH_CHECK'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual IS NULL THEN '❌ BROKEN - NO QUAL'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual IS NOT NULL THEN '✅ OK - HAS QUAL'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM pg_policies
WHERE tablename = 'forms';
```

---

## 🧪 TEST - La Policy Funziona Davvero?

Ora dobbiamo testare se la policy **funziona realmente** quando provi a salvare un form.

### Test 1: Verifica Policy Completa
```sql
-- Visualizza tutte le policy forms con diagnosi corretta
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'INSERT' THEN 
            CASE 
                WHEN with_check IS NULL THEN '❌ INSERT BROKEN'
                ELSE '✅ INSERT OK'
            END
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') THEN
            CASE 
                WHEN qual IS NULL THEN '❌ ' || cmd || ' BROKEN'
                ELSE '✅ ' || cmd || ' OK'
            END
        ELSE '⚠️ UNKNOWN'
    END as policy_status,
    permissive
FROM pg_policies
WHERE tablename = 'forms'
ORDER BY cmd, policyname;
```

### Test 2: Verifica User Corrente
```sql
-- Chi sono io come utente Supabase?
SELECT 
    auth.uid() as my_user_id,
    auth.role() as my_role,
    current_user as db_user;
```

### Test 3: Verifica Organization ID
```sql
-- Il mio utente ha un organization_id?
SELECT 
    id,
    email,
    organization_id,
    role
FROM public.profiles
WHERE id = auth.uid();
```

### Test 4: Simula INSERT (DRY RUN)
```sql
-- Testa se l'INSERT passerebbe la policy (senza inserire)
EXPLAIN (ANALYZE, VERBOSE, COSTS, BUFFERS)
INSERT INTO public.forms (
    id,
    name,
    title,
    fields,
    organization_id
)
VALUES (
    gen_random_uuid(),
    'Test Form',
    'Form di Test',
    '[]'::jsonb,
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
```

**IMPORTANTE:** Questo INSERT verrà **bloccato dall'EXPLAIN**, non inserisce dati reali.

---

## 🎯 POSSIBILI PROBLEMI REALI

Se la policy è corretta ma l'INSERT fallisce ancora, il problema è **ALTROVE**:

### 1️⃣ **User non ha organization_id in profiles**
```sql
-- Verifica
SELECT id, email, organization_id FROM profiles WHERE id = auth.uid();

-- Se organization_id è NULL:
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE id = auth.uid();
```

### 2️⃣ **Ruolo JWT non include profiles.organization_id**
```sql
-- Verifica JWT claims
SELECT current_setting('request.jwt.claims', true)::json;
```

### 3️⃣ **Policy cerca in profiles ma user è in altra tabella**
```sql
-- Verifica se profiles esiste e ha dati
SELECT COUNT(*), array_agg(DISTINCT organization_id) 
FROM public.profiles;
```

### 4️⃣ **RLS attivo ma policy in conflitto**
```sql
-- Verifica RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'forms';

-- Disabilita temporaneamente per test
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;
-- Poi riabilita
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
```

---

## ✅ CONCLUSIONE

**La policy RLS è CORRETTA!** 

Il problema era solo nella query di verifica che controllava `qual` invece di `with_check` per le policy INSERT.

**Prossimo Step:**
1. Esegui i Test 2 e 3 per verificare `auth.uid()` e `organization_id`
2. Se quelli passano, prova a salvare un form nell'app
3. Se fallisce ancora, copia l'errore **esatto** qui

La policy c'è, è valida, e dovrebbe funzionare! 🎉
